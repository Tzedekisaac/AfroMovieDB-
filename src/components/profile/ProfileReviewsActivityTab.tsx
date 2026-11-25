import React from 'react';
import { MessageSquare, Star, Trash2, Film } from 'lucide-react';
import type { Movie, UserReview } from '../../types';

interface ProfileReviewsTabProps {
  visibleReviews: UserReview[];
  moviesList: Movie[];
  deletingReviewId: string | null;
  onSelectMovie: (movie: Movie) => void;
  onDeleteReview: (reviewId: string) => void;
}

export const ProfileReviewsTab: React.FC<ProfileReviewsTabProps> = ({
  visibleReviews,
  moviesList,
  deletingReviewId,
  onSelectMovie,
  onDeleteReview
}) => {
  return (
    <div className="space-y-4">
      {visibleReviews.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No reviews found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Explore any movie card and post your first critique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleReviews.map((r: UserReview) => {
            const movie = moviesList.find(m => m.id === r.movieId);
            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{movie?.title || r.movieId}</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-amber-400 text-xs font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{r.rating}/10</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{r.comment}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Posted {r.createdAt}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {movie && (
                    <button
                      onClick={() => onSelectMovie(movie)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                    >
                      View Film
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteReview(r.id)}
                    disabled={deletingReviewId === r.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ProfileContributionsTabProps {
  visibleContributions: Movie[];
  onOpenAddMovie: () => void;
  onSelectMovie: (movie: Movie) => void;
}

export const ProfileContributionsTab: React.FC<ProfileContributionsTabProps> = ({
  visibleContributions,
  onOpenAddMovie,
  onSelectMovie
}) => {
  return (
    <div className="space-y-4">
      {visibleContributions.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No film contributions yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add unindexed Nigerian movies or VHS classics to the NaijaReel catalog.
          </p>
          <button
            onClick={onOpenAddMovie}
            className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all"
          >
            Contribute a Film
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleContributions.map((movie) => (
            <div
              key={movie.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <h4
                  onClick={() => onSelectMovie(movie)}
                  className="text-sm font-bold text-white hover:text-teal-400 transition-colors cursor-pointer truncate"
                >
                  {movie.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {movie.releaseYear} • Dir. {movie.director}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => onSelectMovie(movie)}
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
