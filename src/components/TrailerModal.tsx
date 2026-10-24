import React from 'react';
import { Movie } from '../types';
import { X, ExternalLink, Film, Star } from 'lucide-react';

interface TrailerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ movie, onClose }) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="trailer-modal-container"
        className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <Film className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="font-cinema text-sm sm:text-base font-bold text-white truncate">
              {movie.title} ({movie.releaseYear}) — Official Trailer / Clip
            </h3>
          </div>
          <button
            id="close-trailer-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {movie.trailerYoutubeId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <Film className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium">Trailer preview currently being archived.</p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' Nigerian movie official trailer')}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
              >
                <span>Search Trailer on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Directed by <strong className="text-slate-200">{movie.director}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Nollywood Rating: <strong className="text-amber-400">{movie.rating}/10</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 hidden sm:inline">Stream now:</span>
            {movie.streamingPlatforms.map(p => (
              <a
                key={p.name}
                href={p.url || '#'}
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-medium text-[11px] transition-colors"
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
