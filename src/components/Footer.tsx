import React from 'react';
import { Film, Heart, Sparkles, Globe, Award } from 'lucide-react';
import { FilterState } from '../types';

interface FooterProps {
  onQuickFilter: (key: keyof FilterState, val: string) => void;
  onOpenHeritage: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onQuickFilter, onOpenHeritage }) => {
  return (
    <footer className="w-full max-w-full bg-[#070a10] border-t border-slate-800 text-slate-400 text-xs py-10 sm:py-12 mt-12 sm:mt-16">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="font-cinema text-lg font-bold text-white tracking-wider">
                AFRO<span className="text-emerald-400">MOVIEDB</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated solely to archiving, celebrating, and exploring the richness of Nigerian cinema — from 1990s VHS pioneers to modern billion-naira global streaming triumphs.
            </p>
            <div className="pt-1">
              <button
                onClick={onOpenHeritage}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Explore Nollywood History Timeline</span>
              </button>
            </div>
          </div>

          {/* Quick Genres */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Signature Genres
            </h4>
            <ul className="space-y-2">
              {['Epic & Folklore', 'Crime & Thriller', 'Comedy', 'Drama', 'Romantic Comedy', 'Historical Drama'].map(genre => (
                <li key={genre}>
                  <button
                    onClick={() => {
                      onQuickFilter('selectedGenre', genre);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {genre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages & Traditions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Languages & Regional Cinema
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Yoruba Folklore & Epics', val: 'Yoruba' },
                { label: 'Igbo Cinema & Dramas', val: 'Igbo' },
                { label: 'Hausa Cinema (Kannywood)', val: 'Hausa' },
                { label: 'Nigerian Pidgin & English', val: 'Nigerian Pidgin' }
              ].map(item => (
                <li key={item.val}>
                  <button
                    onClick={() => {
                      onQuickFilter('selectedLanguage', item.val);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Eras */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Nollywood Eras
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Golden VHS Era (1992-2005)', val: 'Golden Era (1992-2005)' },
                { label: 'New Nollywood (2006-2018)', val: 'New Nollywood (2006-2018)' },
                { label: 'Modern Global Era (2019-Present)', val: 'Modern Global Era (2019-Present)' }
              ].map(era => (
                <li key={era.val}>
                  <button
                    onClick={() => {
                      onQuickFilter('selectedEra', era.val);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {era.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} AfroMovieDB. Built to celebrate Nigerian Storytellers, Actors & Directors.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Powered by the vibrant spirit of Nollywood</span>
            <span className="inline-block w-2.5 h-2 bg-emerald-600 rounded-sm mx-1" title="Nigeria" />
          </div>
        </div>

      </div>
    </footer>
  );
};
