import React from 'react';
import { Sparkles, Star, Bookmark, Play } from 'lucide-react';
import type { Movie, MovieWatchStatus, RecommendationItem } from '../../types';

interface ProfileRecommendationsTabProps {
  recommendations: RecommendationItem[];
  onBackToCatalogue: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
}

export const ProfileRecommendationsTab: React.FC<ProfileRecommendationsTabProps> = ({
  recommendations,
  onBackToCatalogue,
  onSelectMovie,
  onOpenTrailer,
  onUpdateStatus
}) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Personalized Nollywood Recommendations</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Our algorithm analyzed the genres, directors, and lead actors from your tracking list to find untracked gems you'll love.
          </p>
        </div>
        <button
          onClick={onBackToCatalogue}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0"
        >
          Explore Full Archive
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
        {recommendations.map(({ movie, reason }) => (
          <div
            key={`rec-${movie.id}`}
            className="group flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 overflow-hidden shadow-lg transition-all"
          >
            {/* Poster */}
            <div
              className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer"
              onClick={() => onSelectMovie(movie)}
            >
              <img
                src={movie.backdropUrl || movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-slate-950 shadow-md">
                  Top Match
                </span>
              </div>

              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 text-xs font-bold border border-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{movie.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Body & Affinity Explanation */}
            <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
              <div>
                <h4
                  onClick={() => onSelectMovie(movie)}
                  className="text-base font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                >
                  {movie.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {movie.releaseYear} • Dir. {movie.director}
                </p>

                {/* Affinity Reason Badge */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-tight flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                {onUpdateStatus && (
                  <button
                    onClick={() => onUpdateStatus(movie.id, 'plan_to_watch')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-semibold transition-all border border-amber-500/40"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>+ Plan to Watch</span>
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenTrailer(movie)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Watch Trailer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => onSelectMovie(movie)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
