import React from 'react';
import { Movie, MovieWatchStatus, UserTrackedItem, UserReview } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { MovieCard } from './MovieCard';

export interface MovieGridProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  watchlistIds?: string[];
  onToggleWatchlist?: (movieId: string) => void;
  trackingMap?: Map<string, UserTrackedItem>;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
  viewMode?: 'grid' | 'compact';
  currentUser?: FirebaseUser | null;
  onOpenEdit?: (movie: Movie) => void;
  onOpenAuth?: () => void;
  reviews?: UserReview[];
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  onSelectMovie,
  onOpenTrailer,
  watchlistIds = [],
  onToggleWatchlist = () => {},
  trackingMap,
  onUpdateStatus,
  viewMode = 'grid',
  currentUser,
  onOpenEdit,
  onOpenAuth,
  reviews = []
}) => {
  if (viewMode === 'compact') {
    return (
      <div 
        id="movies-list"
        className="w-full max-w-full space-y-3"
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={onSelectMovie}
            onOpenTrailer={onOpenTrailer}
            isWatchlisted={watchlistIds.includes(movie.id)}
            onToggleWatchlist={onToggleWatchlist}
            watchStatus={trackingMap?.get(movie.id)?.status || (watchlistIds.includes(movie.id) ? 'plan_to_watch' : null)}
            onUpdateStatus={onUpdateStatus}
            viewMode="compact"
            currentUser={currentUser}
            onOpenEdit={onOpenEdit}
            onOpenAuth={onOpenAuth}
            reviews={reviews}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      id="movies-grid"
      className="w-full max-w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-7"
    >
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onSelect={onSelectMovie}
          onOpenTrailer={onOpenTrailer}
          isWatchlisted={watchlistIds.includes(movie.id)}
          onToggleWatchlist={onToggleWatchlist}
          watchStatus={trackingMap?.get(movie.id)?.status || (watchlistIds.includes(movie.id) ? 'plan_to_watch' : null)}
          onUpdateStatus={onUpdateStatus}
          viewMode="grid"
          currentUser={currentUser}
          onOpenEdit={onOpenEdit}
          onOpenAuth={onOpenAuth}
          reviews={reviews}
        />
      ))}
    </div>
  );
};

export default MovieGrid;
