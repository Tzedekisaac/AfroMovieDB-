import React from 'react';
import { Layers, Plus, ExternalLink, Share2, Pencil, Trash2 } from 'lucide-react';
import type { Movie, CustomUserList } from '../../types';

interface ProfileCustomListsTabProps {
  userCustomLists: CustomUserList[];
  moviesList: Movie[];
  onOpenCreateList?: () => void;
  onOpenEditList?: (list: CustomUserList) => void;
  onDeleteCustomList?: (listId: string) => void;
  onViewStandaloneList?: (list: CustomUserList) => void;
  onNotifyShareLink: (listTitle: string) => void;
}

export const ProfileCustomListsTab: React.FC<ProfileCustomListsTabProps> = ({
  userCustomLists,
  moviesList,
  onOpenCreateList,
  onOpenEditList,
  onDeleteCustomList,
  onViewStandaloneList,
  onNotifyShareLink
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>My Curated Film Collections</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Create themed movie collections (e.g., 'Top 10 Epic Costumes', 'Best of Funke Akindele'). Each collection gets a public shareable deep link and dedicated standalone web page view.
          </p>
        </div>

        {onOpenCreateList && (
          <button
            id="btn-create-new-collection"
            onClick={onOpenCreateList}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Curate New Collection</span>
          </button>
        )}
      </div>

      {userCustomLists.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No custom collections created yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Group Nollywood films into shareable lists with custom descriptions, notes, and standalone presentation views.
          </p>
          {onOpenCreateList && (
            <button
              onClick={onOpenCreateList}
              className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Create Your First Collection
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {userCustomLists.map((list) => {
            const listMovies = list.movieIds
              .map(id => moviesList.find(m => m.id === id))
              .filter((m): m is Movie => Boolean(m));

            const shareUrl = `${window.location.origin}${window.location.pathname}?list=${encodeURIComponent(list.id)}`;

            return (
              <div
                key={list.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          list.isPublic
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {list.isPublic ? 'Public Web Page' : 'Private Draft'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 capitalize">
                        Theme: {list.theme || 'emerald'}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {list.movieIds.length} Films
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white hover:text-purple-300 transition-colors">
                    {list.title}
                  </h4>

                  {list.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {list.description}
                    </p>
                  )}

                  {/* Movie poster thumbnails preview */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                    {listMovies.slice(0, 5).map(m => (
                      <img
                        key={m.id}
                        src={m.posterUrl}
                        alt={m.title}
                        title={m.title}
                        className="w-10 h-14 object-cover rounded bg-slate-800 border border-slate-700/60 shrink-0"
                      />
                    ))}
                    {listMovies.length > 5 && (
                      <div className="w-10 h-14 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                        +{listMovies.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onViewStandaloneList && (
                      <button
                        onClick={() => onViewStandaloneList(list)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                        title="Open clean standalone public web page view"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Standalone View</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        onNotifyShareLink(list.title);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Copy shareable link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Link</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenEditList && (
                      <button
                        onClick={() => onOpenEditList(list)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit collection"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteCustomList && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete collection "${list.title}"?`)) {
                            onDeleteCustomList(list.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                        title="Delete collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
