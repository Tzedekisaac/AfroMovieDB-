import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getHttpStatusFromGeminiError(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('GEMINI_API_KEY')) return 500;
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) return 403;
  if (msg.includes('400') || msg.includes('API_KEY_INVALID') || msg.includes('INVALID_ARGUMENT')) return 400;
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) return 429;
  if (msg.includes('404') || msg.includes('NOT_FOUND')) return 404;
  return 500;
}

const MOVIE_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    nativeTitle: { type: Type.STRING },
    tagline: { type: Type.STRING },
    releaseYear: { type: Type.INTEGER },
    director: { type: Type.STRING },
    producer: { type: Type.STRING },
    leadCast: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          actor: { type: Type.STRING },
          role: { type: Type.STRING },
        },
        required: ['actor', 'role'],
      },
    },
    genres: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    languages: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    era: { type: Type.STRING },
    runtimeMinutes: { type: Type.INTEGER },
    rating: { type: Type.NUMBER },
    ratingCount: { type: Type.INTEGER },
    synopsis: { type: Type.STRING },
    culturalSignificance: { type: Type.STRING },
    streamingPlatforms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          badgeColor: { type: Type.STRING },
        },
        required: ['name', 'badgeColor'],
      },
    },
    trailerYoutubeId: { type: Type.STRING },
    boxOffice: { type: Type.STRING },
    originCountry: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    originalLanguage: { type: Type.STRING },
  },
  required: [
    'title',
    'releaseYear',
    'director',
    'genres',
    'languages',
    'synopsis',
    'culturalSignificance',
    'originCountry',
  ],
};

async function enrichTmdbArtworkIfAvailable(movie: Record<string, any>): Promise<Record<string, any>> {
  const tmdbKey = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
  if (!tmdbKey || !movie?.title) return movie;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const params = new URLSearchParams({
      api_key: tmdbKey,
      query: String(movie.title),
      include_adult: 'false',
    });
    if (movie.releaseYear) {
      params.set('year', String(movie.releaseYear));
    }

    const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return movie;
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const match = results.find((r: any) =>
      Array.isArray(r.origin_country) ? r.origin_country.includes('NG') : false
    ) || results[0];

    if (match) {
      return {
        ...movie,
        tmdbId: match.id ?? movie.tmdbId,
        posterUrl: match.poster_path
          ? `https://image.tmdb.org/t/p/w780${match.poster_path}`
          : movie.posterUrl,
        backdropUrl: match.backdrop_path
          ? `https://image.tmdb.org/t/p/original${match.backdrop_path}`
          : movie.backdropUrl,
      };
    }
  } catch {
    // Non-blocking artwork enrichment fallback
  }
  return movie;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // =========================================================================
  // SERVER-SIDE GEMINI API PROXY ROUTES (Admin Movie Discovery & Extraction)
  // =========================================================================
  app.post('/api/admin/discover-batch', async (req, res) => {
    try {
      const promptInput = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
      if (!promptInput) {
        return res.status(400).json({ error: 'Please provide an abstract category or discovery prompt.' });
      }

      const ai = getGeminiClient();
      const systemInstruction = `You are the chief Nollywood (Nigerian Cinema) film archivist and database curator.
Every film you return MUST be an authentic Nigerian Nollywood production. Strictly NO foreign, Hollywood, or Bollywood films.
Every item MUST set originCountry to ["NG"].
Provide realistic release years, renowned Nigerian directors (e.g., Kunle Afolayan, Kemi Adetiba, Funke Akindele, Genevieve Nnaji, Biyi Bandele, Jade Osiberu, Adebayo Tijani, Kayode Kasum, Femi Adebayo, Editi Effiong), real Nollywood lead actors, authentic genres, and insightful cultural significance.`;

      const userPrompt = `Generate an authentic, rich list of between 10 and 20 Nigerian Nollywood movies matching the category/prompt: "${promptInput}". Return a valid JSON array of structured movie objects.`;

      let responseText = '';
      let modelUsed = 'gemini-2.5-flash';

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: MOVIE_ITEM_SCHEMA,
            },
          },
        });
        responseText = response.text || '[]';
      } catch (primaryErr: unknown) {
        const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        // Only fall back to gemini-4-hydrogen if gemini-2.5-flash model alias is unavailable/404
        if (primaryMsg.includes('404') || primaryMsg.includes('NOT_FOUND')) {
          console.warn('gemini-2.5-flash unavailable, falling back to gemini-4-hydrogen:', primaryMsg);
          modelUsed = 'gemini-4-hydrogen';
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: MOVIE_ITEM_SCHEMA,
              },
            },
          });
          responseText = fallbackResponse.text || '[]';
        } else {
          throw primaryErr;
        }
      }

      const cleanJson = responseText
        .replace(/^```json/gim, '')
        .replace(/^```/gim, '')
        .trim();

      const parsedArray = JSON.parse(cleanJson);
      if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
        return res.status(502).json({ error: 'Gemini did not return a valid list of Nollywood movies.' });
      }

      const enrichedMovies = await Promise.all(
        parsedArray.map((item) => enrichTmdbArtworkIfAvailable(item))
      );

      return res.json({ movies: enrichedMovies, modelUsed });
    } catch (err: unknown) {
      console.error('Server /api/admin/discover-batch error:', err);
      const status = getHttpStatusFromGeminiError(err);
      const message = err instanceof Error ? err.message : 'Failed to discover Nollywood movie batch.';
      return res.status(status).json({ error: message });
    }
  });

  app.post('/api/admin/extract-movie', async (req, res) => {
    try {
      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const premise = typeof req.body?.premise === 'string' ? req.body.premise.trim() : '';
      const year = req.body?.year ? String(req.body.year).trim() : '';
      const director = typeof req.body?.director === 'string' ? req.body.director.trim() : '';

      if (!title) {
        return res.status(400).json({ error: 'Movie title is required.' });
      }

      const ai = getGeminiClient();
      const systemInstruction = `You are the chief archivist for Nollywood (Nigerian Cinema).
Extract and structure rich, authentic metadata for Nigerian cinema titles.
MUST be produced in Nigeria or an authentic Nollywood coproduction with originCountry ["NG"]. Do NOT generate foreign films.`;

      const userPrompt = `Extract structured metadata for the Nigerian movie "${title}".
Additional context:
- Premise: ${premise || 'N/A'}
- Approximate Release Year: ${year || 'N/A'}
- Director: ${director || 'N/A'}`;

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: MOVIE_ITEM_SCHEMA,
          },
        });
        responseText = response.text || '{}';
      } catch (primaryErr: unknown) {
        const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        if (primaryMsg.includes('404') || primaryMsg.includes('NOT_FOUND')) {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: MOVIE_ITEM_SCHEMA,
            },
          });
          responseText = fallbackResponse.text || '{}';
        } else {
          throw primaryErr;
        }
      }

      const cleanJson = responseText
        .replace(/^```json/gim, '')
        .replace(/^```/gim, '')
        .trim();

      const parsedMovie = JSON.parse(cleanJson);
      const enrichedMovie = await enrichTmdbArtworkIfAvailable(parsedMovie);
      return res.json({ movie: enrichedMovie });
    } catch (err: unknown) {
      console.error('Server /api/admin/extract-movie error:', err);
      const status = getHttpStatusFromGeminiError(err);
      const message = err instanceof Error ? err.message : 'Failed to extract Nollywood movie metadata.';
      return res.status(status).json({ error: message });
    }
  });

  // =========================================================================
  // VITE / STATIC SPA SERVING
  // =========================================================================
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NaijaReel server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
