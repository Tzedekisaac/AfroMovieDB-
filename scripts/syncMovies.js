/**
 * NaijaReel - Automated Nollywood Movie Sync Script
 * 
 * Fetches recent Nigerian movies from TMDb, checks for duplicates against the
 * Firestore 'custom_movies' collection, enriches full cast & video credits,
 * and batch-writes new titles directly to Firestore using Firebase Admin SDK.
 * 
 * Usage:
 *   node scripts/syncMovies.js
 * 
 * Required Environment Variables:
 *   TMDB_API_KEY: Your TMDb API v3 key
 *   FIREBASE_SERVICE_ACCOUNT: Service account JSON string (or file via GOOGLE_APPLICATION_CREDENTIALS)
 *   FIREBASE_PROJECT_ID: (Optional, defaults to 'naijareel-77079')
 */

import admin from 'firebase-admin';

// Configuration
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || 'naijareel-77079';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop';
const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop';

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime & Thriller',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'Historical Drama',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romantic Comedy',
  878: 'Sci-Fi',
  53: 'Crime & Thriller',
  10752: 'War',
  37: 'Western'
};

const KNOWN_FOREIGN_TITLES_LOWER = new Set([
  'wallace & gromit',
  'wallace and gromit',
  '29th street',
  'baby steps',
  'winnie the pooh',
  'while you were sleeping',
  'outrageous',
  'captains outrageous',
  'outrageous fortune',
  'blade runner',
  'nowhere to run',
  '22 vs. earth',
  '12 dates of christmas',
  '12 days of christmas',
  '12 gifts of christmas'
]);

function determineEra(year) {
  const y = Number(year) || new Date().getFullYear();
  if (y >= 2019) return 'Modern Global Era (2019-Present)';
  if (y >= 2006) return 'New Nollywood (2006-2018)';
  return 'Golden Era (1992-2005)';
}

function normalizeTitle(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractOriginCountries(item) {
  if (!item || typeof item !== 'object') return [];
  const sources = [
    item.origin_country,
    item.originCountry,
    item.production_countries,
    item.productionCountries,
    item.country
  ].filter(Boolean);

  const countries = new Set();
  for (const src of sources) {
    if (Array.isArray(src)) {
      for (const c of src) {
        if (typeof c === 'string' && c.trim()) {
          countries.add(c.trim().toUpperCase());
        } else if (c && typeof c === 'object' && c.iso_3166_1) {
          countries.add(String(c.iso_3166_1).trim().toUpperCase());
        }
      }
    } else if (typeof src === 'string') {
      src.split(/[,\s|]+/).forEach((code) => {
        if (code.trim()) countries.add(code.trim().toUpperCase());
      });
    }
  }
  return Array.from(countries);
}

function parseSpokenLanguages(item) {
  if (!item || typeof item !== 'object') return ['English'];
  const langs = new Set();
  const langSources = [item.spoken_languages, item.spokenLanguages, item.languages];
  for (const src of langSources) {
    if (Array.isArray(src)) {
      for (const l of src) {
        if (typeof l === 'string' && l.trim()) langs.add(l.trim());
        else if (l && typeof l === 'object' && l.english_name) langs.add(l.english_name.trim());
        else if (l && typeof l === 'object' && l.name) langs.add(l.name.trim());
      }
    }
  }
  const origLang = String(item.original_language || item.originalLanguage || '').toLowerCase().trim();
  if (origLang === 'yo') langs.add('Yoruba');
  else if (origLang === 'ig') langs.add('Igbo');
  else if (origLang === 'ha') langs.add('Hausa');
  else if (origLang === 'pcm') langs.add('Nigerian Pidgin');
  else if (origLang === 'en') langs.add('English');

  return langs.size > 0 ? Array.from(langs) : ['English'];
}

function isNigerianMovie(item) {
  if (!item || typeof item !== 'object') return false;
  const title = String(item.title || item.original_title || '').trim();
  if (!title) return false;
  const lowerTitle = title.toLowerCase();

  for (const blocked of KNOWN_FOREIGN_TITLES_LOWER) {
    if (lowerTitle === blocked || lowerTitle.startsWith(blocked + ' ')) {
      return false;
    }
  }

  const countries = extractOriginCountries(item);
  if (countries.includes('NG')) {
    return true;
  }

  const origLang = String(item.original_language || item.originalLanguage || '').toLowerCase().trim();
  if (['yo', 'ig', 'ha', 'pcm'].includes(origLang)) {
    return true;
  }

  const parsedLangs = parseSpokenLanguages(item);
  return parsedLangs.some((l) => ['Yoruba', 'Igbo', 'Hausa', 'Nigerian Pidgin'].includes(l));
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  const serviceAccountRaw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_CREDENTIALS;

  if (serviceAccountRaw) {
    try {
      let parsed;
      if (serviceAccountRaw.trim().startsWith('{')) {
        parsed = JSON.parse(serviceAccountRaw);
      } else {
        const decoded = Buffer.from(serviceAccountRaw, 'base64').toString('utf-8');
        parsed = JSON.parse(decoded);
      }
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: parsed.project_id || PROJECT_ID
      });
      console.log(`[Firebase Admin] Authenticated with Service Account cert for project: ${parsed.project_id || PROJECT_ID}`);
      return admin.firestore();
    } catch (err) {
      console.warn(`[Firebase Admin] Warning: could not parse service account JSON: ${err.message}`);
    }
  }

  // Fallback to application default credentials
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID
  });
  console.log(`[Firebase Admin] Authenticated with Application Default Credentials for project: ${PROJECT_ID}`);
  return admin.firestore();
}

/**
 * Main Sync Pipeline
 */
async function main() {
  const apiKey = (process.env.TMDB_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[Error] TMDB_API_KEY environment variable is not defined.');
    console.error('Please configure your TMDb API key in GitHub Secrets as TMDB_API_KEY or export TMDB_API_KEY=...');
    process.exit(1);
  }

  const db = initializeFirebase();
  console.log('[Sync] Beginning hourly Nigerian movie sync from TMDb to Firestore...');

  // 1. Fetch existing movies from Firestore 'custom_movies' collection
  const existingSnapshot = await db.collection('custom_movies').get();
  const existingIds = new Set();
  const existingTmdbIds = new Set();
  const existingNormalizedTitles = new Set();

  existingSnapshot.forEach((docSnap) => {
    existingIds.add(docSnap.id);
    const data = docSnap.data();
    if (data.tmdbId) {
      existingTmdbIds.add(Number(data.tmdbId));
    }
    if (data.title) {
      existingNormalizedTitles.add(normalizeTitle(data.title));
    }
  });

  console.log(`[Sync] Loaded ${existingSnapshot.size} existing movie records from Firestore.`);

  // 2. Discover recent Nigerian movies from TMDb (sort_by=release_date.desc)
  const candidateMap = new Map();
  const discoveryEndpoints = [
    `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=release_date.desc&include_adult=false&page=1`,
    `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=release_date.desc&include_adult=false&page=2`,
    `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&with_original_language=yo|ig|ha|pcm&sort_by=release_date.desc&include_adult=false&page=1`
  ];

  for (const url of discoveryEndpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          for (const item of data.results) {
            if (item && item.id && !candidateMap.has(item.id)) {
              candidateMap.set(item.id, item);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Sync] Discovery endpoint query failed: ${err.message}`);
    }
  }

  console.log(`[Sync] Discovered ${candidateMap.size} potential candidate titles from TMDb.`);

  // 3. Deduplicate against existing Firestore entries
  const newCandidates = [];
  for (const cand of candidateMap.values()) {
    if (existingTmdbIds.has(Number(cand.id))) continue;
    const norm = normalizeTitle(cand.title);
    if (existingNormalizedTitles.has(norm)) continue;
    newCandidates.push(cand);
  }

  console.log(`[Sync] Identified ${newCandidates.length} new candidates to inspect and ingest.`);
  if (newCandidates.length === 0) {
    console.log('[Sync] Catalogue is fully up to date. No new titles to write.');
    process.exit(0);
  }

  // 4. Enrich metadata, credits, and videos for new candidates (up to 30 per run)
  const moviesToWrite = [];
  const limit = Math.min(newCandidates.length, 30);

  for (let i = 0; i < limit; i++) {
    const cand = newCandidates[i];
    try {
      const detailUrl = `${TMDB_BASE_URL}/movie/${cand.id}?api_key=${apiKey}&with_origin_country=NG&append_to_response=credits,videos`;
      const res = await fetch(detailUrl);
      if (!res.ok) continue;

      const details = await res.json();
      if (!isNigerianMovie(details) && !isNigerianMovie(cand)) {
        continue;
      }

      // Director
      let director = 'Unknown Director';
      let directorAvatarUrl = '';
      let directorTmdbId = null;
      const leadCast = [];

      if (details.credits && Array.isArray(details.credits.crew)) {
        const dObj = details.credits.crew.find(
          (c) => c && (c.job === 'Director' || c.department === 'Directing')
        );
        if (dObj) {
          director = dObj.name || director;
          directorTmdbId = dObj.id ? Number(dObj.id) : null;
          if (dObj.profile_path) {
            directorAvatarUrl = `${TMDB_IMAGE_BASE}/w185${dObj.profile_path}`;
          }
        }
      }

      // Cast
      if (details.credits && Array.isArray(details.credits.cast)) {
        for (const actor of details.credits.cast.slice(0, 6)) {
          if (!actor || !actor.name) continue;
          leadCast.push({
            actor: actor.name.trim(),
            role: (actor.character || 'Main Cast').trim(),
            avatarUrl: actor.profile_path ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}` : '',
            tmdbId: actor.id ? Number(actor.id) : null
          });
        }
      }

      if (leadCast.length === 0) {
        leadCast.push({ actor: 'Nollywood Cast Ensemble', role: 'Main Cast', avatarUrl: '' });
      }

      // Genres
      let genres = [];
      if (Array.isArray(details.genres)) {
        genres = details.genres.map((g) => g && g.name).filter(Boolean);
      }
      if (genres.length === 0 && Array.isArray(cand.genre_ids)) {
        genres = cand.genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean);
      }
      if (genres.length === 0) {
        genres = ['Drama'];
      }

      // Year & Era
      let releaseYear = new Date().getFullYear();
      const rawDate = details.release_date || cand.release_date || '';
      if (rawDate) {
        const y = parseInt(rawDate.split('-')[0], 10);
        if (!isNaN(y) && y >= 1950) releaseYear = y;
      }
      const era = determineEra(releaseYear);

      // Artwork
      const posterUrl = details.poster_path
        ? `${TMDB_IMAGE_BASE}/w780${details.poster_path}`
        : cand.poster_path
        ? `${TMDB_IMAGE_BASE}/w780${cand.poster_path}`
        : FALLBACK_POSTER;

      const backdropUrl = details.backdrop_path
        ? `${TMDB_IMAGE_BASE}/original${details.backdrop_path}`
        : posterUrl || FALLBACK_BACKDROP;

      // Trailer
      let trailerYoutubeId = '';
      if (details.videos && Array.isArray(details.videos.results)) {
        const trailerObj = details.videos.results.find(
          (v) => v && v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (trailerObj && trailerObj.key) {
          trailerYoutubeId = trailerObj.key;
        }
      }

      // Streaming heuristics
      const platforms = [];
      if (releaseYear >= 2021) {
        platforms.push({ name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' });
        platforms.push({ name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' });
      } else if (releaseYear >= 2010) {
        platforms.push({ name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' });
        platforms.push({ name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' });
      } else {
        platforms.push({ name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' });
        platforms.push({ name: 'Africa Magic', badgeColor: 'bg-purple-600', url: 'https://www.dstv.com' });
      }

      const title = details.title || cand.title || 'Untitled Nollywood Film';
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const cleanId = `${slug || 'nollywood'}-${details.id || cand.id}`;

      if (existingIds.has(cleanId)) continue;

      const movieDoc = {
        id: cleanId,
        title,
        nativeTitle: details.original_title && details.original_title !== title ? details.original_title : '',
        tagline: details.tagline || 'A compelling Nigerian cinematic story.',
        releaseYear,
        director,
        directorAvatarUrl,
        directorTmdbId,
        producer: '',
        leadCast,
        genres: Array.from(new Set(genres)).slice(0, 4),
        languages: parseSpokenLanguages(details),
        era,
        runtimeMinutes: Number(details.runtime) || 105,
        rating: details.vote_average ? Math.min(10, Math.round(details.vote_average * 10) / 10) : 7.8,
        ratingCount: Number(details.vote_count) || 10,
        boxOffice: details.revenue ? `$${details.revenue.toLocaleString()}` : '',
        posterUrl,
        backdropUrl,
        synopsis: details.overview || cand.overview || 'A captivating Nollywood cinematic story celebrating Nigerian film culture.',
        culturalSignificance: `Discovered from TMDb Nollywood Archive. Key cultural representation of ${era}.`,
        streamingPlatforms: platforms,
        collections: ['All Nigerian Titles'],
        originCountry: ['NG'],
        originalLanguage: String(details.original_language || cand.original_language || 'en').toLowerCase(),
        trailerYoutubeId,
        amvcaAwards: ['Nollywood Cinema Selection'],
        quote: null,
        featured: false,
        boxOfficeChampion: false,
        isUserAdded: true,
        source: 'github_actions_sync',
        tmdbId: Number(details.id || cand.id),
        addedByUserId: 'github-actions-sync',
        lastEditedByUserId: 'github-actions-sync',
        syncedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      moviesToWrite.push(movieDoc);
      existingIds.add(cleanId);
    } catch (err) {
      console.warn(`[Sync] Failed processing candidate ${cand.id}: ${err.message}`);
    }
  }

  // 5. Batch-write new movies to Firestore
  if (moviesToWrite.length > 0) {
    const chunkSize = 350;
    for (let i = 0; i < moviesToWrite.length; i += chunkSize) {
      const chunk = moviesToWrite.slice(i, i + chunkSize);
      const batch = db.batch();
      for (const m of chunk) {
        const ref = db.collection('custom_movies').doc(m.id);
        batch.set(ref, m, { merge: true });
      }
      await batch.commit();
    }
    console.log(`[Sync] Successfully saved ${moviesToWrite.length} new Nollywood movies to Firestore!`);
  } else {
    console.log('[Sync] No new verified movies to write.');
  }

  // 6. Record sync audit marker
  await db.collection('system_meta').doc('sync_status').set(
    {
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      newMoviesAdded: moviesToWrite.length,
      status: 'success',
      totalCatalogSize: existingSnapshot.size + moviesToWrite.length,
      source: 'github_actions'
    },
    { merge: true }
  );

  console.log('[Sync] Hourly background sync completed successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Sync] Fatal error running sync:', err);
  process.exit(1);
});
