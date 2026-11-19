import type { Movie, UserTrackedItem, RecommendationItem } from '../../types.ts';

/**
 * Personalized 'Recommended For You' Algorithm:
 * Analyzes shared genres, directors, and lead cast members from the user's tracking lists
 * (with weighted emphasis on Completed and Currently Watching films) and scores
 * untracked movies from the catalogue.
 */
export function getPersonalizedRecommendations(
  trackedItems: UserTrackedItem[],
  allMovies: Movie[]
): RecommendationItem[] {
  const trackedMovieIds = new Set(trackedItems.map(t => t.movieId));

  const trackedMoviesMap = new Map<string, { movie: Movie; item: UserTrackedItem }>();
  for (const item of trackedItems) {
    const m = allMovies.find(movie => movie.id === item.movieId);
    if (m) {
      trackedMoviesMap.set(item.movieId, { movie: m, item });
    }
  }

  const genreWeights: Record<string, number> = {};
  const directorWeights: Record<string, number> = {};
  const actorWeights: Record<string, number> = {};

  trackedMoviesMap.forEach(({ movie, item }) => {
    const multiplier =
      item.status === 'completed'
        ? 3 + Math.min(item.rewatchCount || 0, 3)
        : item.status === 'watching'
          ? 2.5
          : item.status === 'plan_to_watch'
            ? 1.5
            : 0.5;

    if (Array.isArray(movie.genres)) {
      movie.genres.forEach(g => {
        genreWeights[g] = (genreWeights[g] || 0) + 1 * multiplier;
      });
    }

    if (movie.director && movie.director !== 'Unknown Director') {
      directorWeights[movie.director] = (directorWeights[movie.director] || 0) + 2 * multiplier;
    }

    if (Array.isArray(movie.leadCast)) {
      movie.leadCast.slice(0, 3).forEach(c => {
        if (c.actor) {
          actorWeights[c.actor] = (actorWeights[c.actor] || 0) + 1.5 * multiplier;
        }
      });
    }
  });

  const untracked = allMovies.filter(m => !trackedMovieIds.has(m.id));

  if (trackedMoviesMap.size === 0) {
    return untracked
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8)
      .map(movie => ({
        movie,
        score: movie.rating * 10,
        reason: 'Critically acclaimed Nollywood essential with stellar community ratings',
        matchingGenres: movie.genres?.slice(0, 2) || [],
        matchingActors: movie.leadCast?.slice(0, 2).map(c => c.actor) || []
      }));
  }

  const scoredItems: RecommendationItem[] = [];

  for (const movie of untracked) {
    let score = 0;
    const matchingGenres: string[] = [];
    let matchingDirector: string | undefined = undefined;
    const matchingActors: string[] = [];

    if (Array.isArray(movie.genres)) {
      for (const g of movie.genres) {
        if (genreWeights[g]) {
          score += genreWeights[g] * 3.5;
          matchingGenres.push(g);
        }
      }
    }

    if (movie.director && directorWeights[movie.director]) {
      score += directorWeights[movie.director] * 6.0;
      matchingDirector = movie.director;
    }

    if (Array.isArray(movie.leadCast)) {
      for (const c of movie.leadCast) {
        if (c.actor && actorWeights[c.actor]) {
          score += actorWeights[c.actor] * 4.0;
          matchingActors.push(c.actor);
        }
      }
    }

    score += (movie.rating || 7.0) * 0.8;

    if (score > 4) {
      let reason = '';
      if (matchingDirector && matchingActors.length > 0) {
        reason = `Directed by ${matchingDirector} and starring ${matchingActors[0]}, matching your viewing preferences.`;
      } else if (matchingDirector) {
        reason = `Directed by ${matchingDirector}, who helmed films in your tracking list.`;
      } else if (matchingActors.length > 0 && matchingGenres.length > 0) {
        reason = `Features ${matchingActors.join(', ')} in a high-rated ${matchingGenres[0]} film.`;
      } else if (matchingActors.length > 0) {
        reason = `Starring ${matchingActors[0]}, an actor from your favorite Nollywood titles.`;
      } else if (matchingGenres.length > 0) {
        reason = `Matches your preference for ${matchingGenres.slice(0, 2).join(' & ')} African cinema.`;
      } else {
        reason = 'Popular Nollywood selection tailored for you.';
      }

      scoredItems.push({
        movie,
        score,
        reason,
        matchingGenres,
        matchingDirector,
        matchingActors
      });
    }
  }

  return scoredItems.sort((a, b) => b.score - a.score).slice(0, 10);
}
