import React, { useState, useEffect } from 'react';
import { CustomUserList, Movie, AppTheme } from '../types';
import { User } from 'firebase/auth';
import { X, Plus, Trash2, Search, Sparkles, Globe, Lock, Film, Check, Palette } from 'lucide-react';

interface CustomListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveList: (list: CustomUserList) => Promise<void> | void;
  allMovies: Movie[];
  currentUser: User | null;
  editingList?: CustomUserList | null;
}

export const CustomListModal: React.FC<CustomListModalProps> = ({
  isOpen,
  onClose,
  onSaveList,
  allMovies,
  currentUser,
  editingList
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [curatorNote, setCuratorNote] = useState('');
  const [theme, setTheme] = useState<AppTheme>('emerald');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingList) {
      setTitle(editingList.title);
      setDescription(editingList.description || '');
      setCuratorNote(editingList.curatorNote || '');
      setTheme(editingList.theme || 'emerald');
      setIsPublic(editingList.isPublic ?? true);
      setSelectedMovieIds(editingList.movieIds || []);
    } else {
      setTitle('');
      setDescription('');
      setCuratorNote('');
      setTheme('emerald');
      setIsPublic(true);
      setSelectedMovieIds([]);
    }
    setError(null);
  }, [editingList, isOpen]);

  if (!isOpen) return null;

  const filteredCandidates = allMovies.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  }).slice(0, 15);

  const handleToggleMovie = (movieId: string) => {
    setSelectedMovieIds(prev => 
      prev.includes(movieId) 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleRemoveSelectedMovie = (movieId: string) => {
    setSelectedMovieIds(prev => prev.filter(id => id !== movieId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your collection.');
      return;
    }
    if (selectedMovieIds.length === 0) {
      setError('Please select at least 1 film to include in your collection.');
      return;
    }
    if (!currentUser) {
      setError('You must be signed in to curate and publish collections.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const listId = editingList?.id || `list-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const payload: CustomUserList = {
        id: listId,
        title: title.trim(),
        description: description.trim(),
        curatorNote: curatorNote.trim() || undefined,
        theme,
        isPublic,
        movieIds: selectedMovieIds,
        creatorId: currentUser.uid,
        creatorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Nollywood Film Curator',
        creatorAvatar: currentUser.photoURL || undefined,
        createdAt: editingList?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveList(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f141f] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingList ? 'Edit Curated Collection' : 'Curate Custom Movie Collection'}
              </h3>
              <p className="text-xs text-slate-400">
                Create a themed Nigerian cinema list with a unique shareable standalone page.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Collection Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">
              Collection Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Top 10 Epic Nollywood Costumes, Best of Kunle Afolayan..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">
              Summary / Overview
            </label>
            <textarea
              rows={2}
              placeholder="Why this collection matters, cultural background, or themes explored..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Curator Note */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">
              Curator's Personal Take / Editorial Note
            </label>
            <input
              type="text"
              placeholder="e.g. 'Must-watch for anyone passionate about rich Yoruba folklore and cinema lighting.'"
              value={curatorNote}
              onChange={(e) => setCuratorNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Theme Accent & Visibility Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Theme Picker */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>Presentation Accent Tone</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
                  { id: 'gold', label: 'Gold', bg: 'bg-amber-500' },
                  { id: 'obsidian', label: 'Obsidian', bg: 'bg-purple-500' }
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id as AppTheme)}
                    className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold ${
                      theme === th.id
                        ? 'border-white bg-slate-800 text-white shadow-md'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${th.bg}`} />
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-300">
                Public Sharing Access
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold ${
                    isPublic
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold ${
                    !isPublic
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selected Movies List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selected Films ({selectedMovieIds.length})</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Minimum 1 film required
              </span>
            </div>

            {selectedMovieIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                {selectedMovieIds.map(id => {
                  const movie = allMovies.find(m => m.id === id);
                  return (
                    <span 
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium"
                    >
                      <span className="truncate max-w-[140px]">{movie?.title || id}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedMovie(id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
                No films selected yet. Use the search bar below to add movies from the catalogue.
              </p>
            )}
          </div>

          {/* Movie Picker Search */}
          <div className="space-y-2 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Nollywood films to add to list..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 border border-slate-800/80 rounded-xl p-1.5 bg-slate-900/40">
              {filteredCandidates.map(movie => {
                const isSelected = selectedMovieIds.includes(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => handleToggleMovie(movie.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={movie.posterUrl} 
                        alt="" 
                        className="w-7 h-10 object-cover rounded bg-slate-800 shrink-0" 
                      />
                      <div className="truncate">
                        <div className="font-semibold text-white truncate text-xs">{movie.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {movie.releaseYear} • Dir. {movie.director}
                        </div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                      isSelected 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (editingList ? 'Update Collection' : 'Publish Collection')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
