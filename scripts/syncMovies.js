/**
 * NaijaReel - Automated Nollywood Movie Sync Script
 * 
 * Fetches recent Nigerian movies from TMDb, checks for duplicates against the
 * Firestore 'custom_movies' collection, enriches full cast & video credits,
 * and batch-writes new titles directly to Firestore using Firebase Admin SDK.
 * 
 * Shared validation logic is imported directly from src/utils/nigerianMovieValidator.ts.
 * 
 * Usage:
 *   node scripts/syncMovies.js
 * 
 * Required Environment Variables (set via GitHub Secrets):
 *   TMDB_API_KEY: Your TMDb API v3 key
 *   FIREBASE_SERVICE_ACCOUNT: Service account JSON string (or base64 encoded)
 *   FIREBASE_PROJECT_ID: (Optional, defaults to 'naijareel-77079')
 */

import admin from 'firebase-admin';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { 
  ValidationStatus, 
  validateNigerianMovie, 
  isNigerianMovie, 
  isDiscoveryCandidateEligible,
  extractOriginCountries, 
  parseSpokenLanguages, 
  determineEra, 
  normalizeTitle,
  GENRE_MAP,
  FALLBACK_POSTER,
  FALLBACK_BACKDROP,
  KNOWN_FOREIGN_TITLES_LOWER,
  KNOWN_FOREIGN_CREW_LOWER,
  hasRecognizedNollywoodIndicators
} from '../src/utils/nigerianMovieValidator.ts';

// Ensure admin and admin.credential are fully populated in ES module environments
if (admin) {
  if (!admin.credential) {
    admin.credential = {
      cert: (serviceAccount) => {
        if (typeof cert === 'function') {
          return cert(serviceAccount);
        }
        throw new Error("Unable to locate Firebase Admin 'cert' credential factory.");
      },
      applicationDefault: () => {
        if (typeof applicationDefault === 'function') {
          return applicationDefault();
        }
        throw new Error("Unable to locate Firebase Admin 'applicationDefault' credential factory.");
      }
    };
  }
  if (!admin.initializeApp) {
    admin.initializeApp = (options, name) => initializeApp(options, name);
  }
  if (!admin.firestore) {
    const firestoreFn = (app) => (app ? getFirestore(app) : getFirestore());
    firestoreFn.FieldValue = FieldValue;
    admin.firestore = firestoreFn;
  }
}

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || 'naijareel-77079';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch helper with bounded retries and exponential backoff.
 * Handles 401/403 (fails fast), 429 (rate limits), and 5xx (transient server errors).
 */
async function fetchWithRetry(url, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      
      // Fast-fail on authentication or permission issues
      if (res.status === 401 || res.status === 403) {
        throw new Error(`TMDb authentication failed (HTTP ${res.status}): Please verify the TMDB_API_KEY secret.`);
      }

      // Handle rate limits with exponential backoff
      if (res.status === 429) {
        if (attempt < maxRetries) {
          const backoff = Math.min(3000, 500 * Math.pow(2, attempt));
          console.warn(`[TMDb] Rate limit encountered (429). Retrying in ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }
        throw new Error('TMDb API rate limit exceeded (HTTP 429).');
      }

      // Handle transient 5xx server errors
      if (res.status >= 500) {
        if (attempt < maxRetries) {
          const backoff = 800 * (attempt + 1);
          console.warn(`[TMDb] Server error (${res.status}). Retrying in ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }
        throw new Error(`TMDb server error (HTTP ${res.status}) on endpoint: ${url.split('?')[0]}`);
      }

      // 404 Not Found (e.g. movie id deleted on TMDb)
      if (res.status === 404) {
        return null;
      }

      return res;
    } catch (err) {
      if (err.message.includes('TMDb authentication failed') || attempt === maxRetries) {
        throw err;
      }
      await sleep(400 * (attempt + 1));
    }
  }
  return null;
}

/**
 * Initialize Firebase Admin SDK.
 * Throws actionable errors if credentials are missing or invalid (never silently exits with 0).
 */
export function initializeFirebase() {
  const existingApps = (typeof getApps === 'function' ? getApps() : (admin?.apps || []));
  if (Array.isArray(existingApps) && existingApps.length > 0) {
    return typeof getFirestore === 'function' ? getFirestore(existingApps[0]) : admin.firestore();
  }

  const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0;

  // Safe credential factory resolution ensuring admin.credential.cert is valid and available
  const getCert = (sa) => {
    if (admin && admin.credential && typeof admin.credential.cert === 'function') {
      return admin.credential.cert(sa);
    }
    if (typeof cert === 'function') {
      return cert(sa);
    }
    throw new Error("Firebase Admin SDK credential 'cert' factory is unavailable.");
  };

  const getAppDefault = () => {
    if (admin && admin.credential && typeof admin.credential.applicationDefault === 'function') {
      return admin.credential.applicationDefault();
    }
    if (typeof applicationDefault === 'function') {
      return applicationDefault();
    }
    throw new Error("Firebase Admin SDK credential 'applicationDefault' factory is unavailable.");
  };

  // 1. Check for complete service account credentials (raw JSON or base64 encoded)
  const serviceAccountRaw = [
    process.env.FIREBASE_SERVICE_ACCOUNT,
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    process.env.FIREBASE_CONFIG,
    process.env.GOOGLE_CREDENTIALS
  ].find(isNonEmptyString);

  if (serviceAccountRaw) {
    let parsed;
    const trimmed = serviceAccountRaw.trim();
    try {
      if (trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      } else {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
        parsed = JSON.parse(decoded);
      }
    } catch (err) {
      throw new Error(`Failed to parse Firebase service account JSON from environment: ${err.message}. Verify that the FIREBASE_SERVICE_ACCOUNT secret contains valid JSON or base64-encoded JSON.`);
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.project_id || !parsed.private_key) {
      throw new Error('Firebase service account JSON is missing required fields (project_id or private_key).');
    }

    try {
      const credential = getCert(parsed);
      const app = (admin && typeof admin.initializeApp === 'function')
        ? admin.initializeApp({ credential, projectId: parsed.project_id || PROJECT_ID })
        : initializeApp({ credential, projectId: parsed.project_id || PROJECT_ID });

      console.log(`[Firebase Admin] Authenticated with Service Account cert for project: ${parsed.project_id || PROJECT_ID}`);
      return typeof getFirestore === 'function' ? getFirestore(app) : admin.firestore();
    } catch (err) {
      throw new Error(`Firebase Admin SDK initialization failed with provided service account: ${err.message}`);
    }
  }

  // 2. Check for individual credential variables (client email, private key, project ID)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
  if (isNonEmptyString(privateKey) && isNonEmptyString(clientEmail)) {
    try {
      const formattedPrivateKey = privateKey.trim().replace(/\\n/g, '\n');
      const resolvedProjectId = (isNonEmptyString(process.env.FIREBASE_PROJECT_ID) ? process.env.FIREBASE_PROJECT_ID.trim() : PROJECT_ID);
      const credential = getCert({
        projectId: resolvedProjectId,
        clientEmail: clientEmail.trim(),
        privateKey: formattedPrivateKey
      });
      const app = (admin && typeof admin.initializeApp === 'function')
        ? admin.initializeApp({ credential, projectId: resolvedProjectId })
        : initializeApp({ credential, projectId: resolvedProjectId });

      console.log(`[Firebase Admin] Authenticated with individual credential variables for project: ${resolvedProjectId}`);
      return typeof getFirestore === 'function' ? getFirestore(app) : admin.firestore();
    } catch (err) {
      throw new Error(`Firebase Admin SDK initialization failed with private key: ${err.message}`);
    }
  }

  // 3. Check for GOOGLE_APPLICATION_CREDENTIALS file path
  if (isNonEmptyString(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    try {
      const credential = getAppDefault();
      const app = (admin && typeof admin.initializeApp === 'function')
        ? admin.initializeApp({ credential, projectId: PROJECT_ID })
        : initializeApp({ credential, projectId: PROJECT_ID });

      console.log(`[Firebase Admin] Authenticated with Application Default Credentials for project: ${PROJECT_ID}`);
      return typeof getFirestore === 'function' ? getFirestore(app) : admin.firestore();
    } catch (err) {
      throw new Error(`Firebase Admin SDK application default credentials failed: ${err.message}`);
    }
  }

  // If no credentials were provided, throw an actionable error so CI/Actions halts with non-zero exit code
  throw new Error('Missing Firebase credentials: FIREBASE_SERVICE_ACCOUNT secret is not configured in the environment.');
}

/**
 * Main Sync Pipeline
 */
export async function runMovieSync() {
  const apiKey = (process.env.TMDB_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Missing TMDb credentials: TMDB_API_KEY environment variable is not defined.');
  }

  const db = initializeFirebase();
  console.log('[Sync] Beginning hourly Nigerian movie sync from TMDb to Firestore...');

  const existingIds = new Set();
  const existingTmdbIds = new Set();
  const existingNormalizedTitles = new Set();
  let totalExistingCount = 0;

  // 1. Paginate through existing custom_movies using lastVisible cursor until Firestore is completely exhausted
  try {
    let lastVisibleDoc = null;
    let hasMoreExisting = true;
    while (hasMoreExisting) {
      let query = db.collection('custom_movies').orderBy('__name__').limit(500);
      if (lastVisibleDoc) {
        query = query.startAfter(lastVisibleDoc);
      }
      const snap = await query.get();
      if (snap.empty) {
        hasMoreExisting = false;
        break;
      }
      snap.forEach((docSnap) => {
        existingIds.add(docSnap.id);
        const data = docSnap.data();
        if (data.tmdbId) {
          existingTmdbIds.add(Number(data.tmdbId));
        }
        if (data.title) {
          existingNormalizedTitles.add(normalizeTitle(data.title));
        }
        totalExistingCount++;
      });
      lastVisibleDoc = snap.docs[snap.docs.length - 1];
      if (snap.size < 500) {
        hasMoreExisting = false;
      }
    }
  } catch (err) {
    throw new Error(`Failed to query Firestore 'custom_movies' collection: ${err.message}`);
  }

  console.log(`[Sync] Loaded ${totalExistingCount} existing movie records from Firestore across all paginated pages.`);

  // 2. Discover Nigerian movies from TMDb using complete page++ pagination loops until source database is completely exhausted
  const candidateMap = new Map();
  const discoveryQueries = [
    'with_origin_country=NG&sort_by=release_date.desc&include_adult=false',
    'with_origin_country=NG&sort_by=primary_release_date.asc&include_adult=false',
    'with_origin_country=NG&with_original_language=yo|ig|ha|pcm&sort_by=release_date.desc&include_adult=false',
    'with_origin_country=NG&with_keywords=207317|263548&sort_by=release_date.desc&include_adult=false'
  ];

  for (const queryParams of discoveryQueries) {
    let page = 1;
    let totalPages = 1;

    console.log(`[Sync] Starting exhaustive pagination for query: ${queryParams}`);
    while (page <= totalPages) {
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&${queryParams}&page=${page}`;
      const res = await fetchWithRetry(url);
      if (!res || !res.ok) {
        console.warn(`[Sync] Request failed on page ${page} (${res ? res.status : 'no response'}). Halting this query loop.`);
        break;
      }

      const data = await res.json();
      if (typeof data.total_pages === 'number' && data.total_pages > 0) {
        totalPages = data.total_pages;
      }

      if (!Array.isArray(data.results) || data.results.length === 0) {
        break;
      }

      for (const item of data.results) {
        if (item && item.id && !candidateMap.has(item.id)) {
          if (isDiscoveryCandidateEligible(item)) {
            candidateMap.set(item.id, item);
          }
        }
      }

      page++;
      await sleep(50);
    }
    console.log(`[Sync] Finished query pagination (${candidateMap.size} total candidates discovered so far).`);
  }

  console.log(`[Sync] Discovered ${candidateMap.size} total eligible candidate titles from TMDb.`);

  // 3. Deduplicate against existing Firestore entries
  const newCandidates = [];
  for (const cand of candidateMap.values()) {
    if (existingTmdbIds.has(Number(cand.id))) continue;
    const norm = normalizeTitle(cand.title);
    if (existingNormalizedTitles.has(norm)) continue;
    newCandidates.push(cand);
  }

  console.log(`[Sync] Identified ${newCandidates.length} new candidates to inspect, enrich, and ingest.`);

  // 4. Handle zero new candidates without bypassing status audit logging
  if (newCandidates.length === 0) {
    console.log('[Sync] Catalogue is fully up to date. Zero new titles to write.');
    await db.collection('system_meta').doc('sync_status').set(
      {
        lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success',
        moviesDiscovered: candidateMap.size,
        moviesEligible: 0,
        moviesVerified: 0,
        moviesRejected: 0,
        newMoviesAdded: 0,
        totalCatalogSize: totalExistingCount,
        source: 'github_actions',
        completedAt: new Date().toISOString()
      },
      { merge: true }
    );
    console.log('[Sync] Status audit log updated: 0 new titles (success).');
    return { addedCount: 0, totalExisting: totalExistingCount };
  }

  // 5. Enrich metadata, credits, and videos for ALL new candidates without hardcoded limits or array length caps
  const moviesToWrite = [];
  let rejectedCount = 0;

  for (let i = 0; i < newCandidates.length; i++) {
    const cand = newCandidates[i];
    try {
      const detailUrl = `${TMDB_BASE_URL}/movie/${cand.id}?api_key=${apiKey}&append_to_response=credits,videos`;
      const res = await fetchWithRetry(detailUrl);
      if (!res || !res.ok) continue;

      const details = await res.json();
      
      // Authoritative validation on full enriched movie details
      const validation = validateNigerianMovie(details, { isDetailEnriched: true });
      if (!validation.isValid) {
        console.info(`[Validation] Skipped "${details.title || cand.title}": ${validation.reason}`);
        rejectedCount++;
        continue;
      }

      // Enforce strict regional filtering: Reject any candidate film that isn't produced in Nigeria (must include 'NG')
      const originCountries = extractOriginCountries(details);
      if (!originCountries.includes('NG')) {
        console.info(`[Validation] Skipped "${details.title || cand.title}": Not produced in Nigeria (missing authoritative NG origin tag)`);
        rejectedCount++;
        continue;
      }

      // Enforce Nollywood cast/crew/cultural keywords: Reject any candidate film that doesn't explicitly feature recognized Nollywood cast/crew keywords
      const hasNollywood = hasRecognizedNollywoodIndicators(details);
      if (!hasNollywood) {
        console.info(`[Validation] Skipped "${details.title || cand.title}": Lacks recognized Nollywood cast/crew keywords or authentic Nigerian provenance`);
        rejectedCount++;
        continue;
      }

      // Director & Crew
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

      // Artwork: strictly enforce dynamic asset mapping, eliminating hardcoded placeholders
      const posterUrl = details.poster_path
        ? `${TMDB_IMAGE_BASE}/w780${details.poster_path}`
        : cand.poster_path
        ? `${TMDB_IMAGE_BASE}/w780${cand.poster_path}`
        : '';

      const backdropUrl = details.backdrop_path
        ? `${TMDB_IMAGE_BASE}/original${details.backdrop_path}`
        : posterUrl || '';

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

  // 5. Batch-write verified new movies to Firestore
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
      status: 'success',
      moviesDiscovered: candidateMap.size,
      moviesEligible: newCandidates.length,
      moviesVerified: moviesToWrite.length,
      moviesRejected: rejectedCount,
      newMoviesAdded: moviesToWrite.length,
      totalCatalogSize: totalExistingCount + moviesToWrite.length,
      source: 'github_actions',
      completedAt: new Date().toISOString()
    },
    { merge: true }
  );

  console.log('[Sync] Hourly background sync completed successfully.');
  return { addedCount: moviesToWrite.length, totalExisting: totalExistingCount + moviesToWrite.length };
}

// Top-level CLI entry point
if (process.argv[1] && process.argv[1].endsWith('syncMovies.js')) {
  runMovieSync()
    .then(() => {
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(`[Sync Fatal Error] ${err.message}`);
      
      // Attempt to record failure status in Firestore if admin app was initialized
      try {
        if (admin && admin.apps && admin.apps.length > 0) {
          const db = admin.firestore();
          await db.collection('system_meta').doc('sync_status').set(
            {
              lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'failed',
              error: err.message,
              source: 'github_actions',
              failedAt: new Date().toISOString()
            },
            { merge: true }
          );
        }
      } catch (logErr) {
        console.warn(`[Sync] Could not write failure audit log: ${logErr.message}`);
      }

      // Explicit non-zero exit code to fail GitHub Actions workflow run
      process.exit(1);
    });
}
