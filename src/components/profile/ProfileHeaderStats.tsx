import React from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowLeft, Bookmark, Star, Film, MessageSquare, Cloud, Clock,
  ShieldCheck, LogOut, Copy, Check, CheckCircle2, Key, Plus, Shield
} from 'lucide-react';
import type { MovieWatchStatus } from '../../types';
import type { ProfileTab } from '../../hooks/useUserProfileState';

interface ProfileHeaderStatsProps {
  currentUser: User;
  hasAdminAccess: boolean;
  isOwner: boolean;
  customTmdbApiKey?: string;
  copiedUid: boolean;
  activeTab: ProfileTab;
  trackedCount: number;
  statusCounts: Record<MovieWatchStatus, number>;
  watchTimeHours: string;
  reviewsCount: number;
  avgUserRating: string;
  onBackToCatalogue: () => void;
  onNavigateAdmin?: () => void;
  onOpenAddMovie: () => void;
  onSignOut: () => void;
  onCopyUid: () => void;
  onSelectTab: (tab: ProfileTab) => void;
}

export const ProfileHeaderStats: React.FC<ProfileHeaderStatsProps> = ({
  currentUser,
  hasAdminAccess,
  isOwner,
  customTmdbApiKey,
  copiedUid,
  activeTab,
  trackedCount,
  statusCounts,
  watchTimeHours,
  reviewsCount,
  avgUserRating,
  onBackToCatalogue,
  onNavigateAdmin,
  onOpenAddMovie,
  onSignOut,
  onCopyUid,
  onSelectTab
}) => {
  return (
    <>
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <button
            id="profile-nav-back-btn"
            onClick={onBackToCatalogue}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>NaijaReel Catalogue</span>
          </button>
          <span>/</span>
          <span className="text-white font-medium">User Profile & Activity</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Admin Dashboard Shortcut Button */}
          {hasAdminAccess && (
            <button
              id="profile-admin-dashboard-btn"
              onClick={() => {
                if (onNavigateAdmin) {
                  onNavigateAdmin();
                } else {
                  window.history.pushState(null, '', '/admin');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-950/40 border border-purple-400/40 transition-all cursor-pointer ring-1 ring-purple-400/30"
              title="Access the NaijaReel Admin Command Center"
            >
              <Shield className="w-3.5 h-3.5 text-purple-200" />
              <span>Admin Dashboard</span>
            </button>
          )}

          <button
            id="profile-add-film-shortcut"
            onClick={onOpenAddMovie}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Contribute Film</span>
          </button>

          <button
            id="profile-signout-btn"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-800/40 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* User Header Profile Card */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar and Main Info */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-500 p-1 shadow-lg shadow-emerald-950/40">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Profile'}
                    className="w-full h-full rounded-xl object-cover bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    {(currentUser.displayName || currentUser.email || 'N')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-slate-950"
                title="Active Firebase Session"
              >
                <Cloud className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {currentUser.displayName || 'Nollywood Patron'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Firebase Verified</span>
                </span>
                {hasAdminAccess && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[11px] font-bold">
                    <Shield className="w-3 h-3 text-purple-400" />
                    <span>{isOwner ? 'System Owner' : 'Administrator'}</span>
                  </span>
                )}
                {customTmdbApiKey && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>Custom API Key Active</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                {currentUser.email}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>NaijaReel Cinephile Member</span>
                </span>
                <span>•</span>
                <button
                  onClick={onCopyUid}
                  className="flex items-center gap-1 hover:text-slate-300 transition-colors font-mono text-[11px]"
                  title="Copy User UID"
                >
                  <span>UID: {currentUser.uid.slice(0, 8)}...</span>
                  {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick sync status pill */}
          <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex md:flex-col items-center md:items-end justify-between gap-2 text-right">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cloud Sync Active</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Firestore DB Connected
            </span>
          </div>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked Metric */}
        <div
          onClick={() => onSelectTab('all_tracked')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all_tracked'
              ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-950/20'
              : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tracked Movies
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {trackedCount}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{statusCounts.completed} Completed</span>
            <span>•</span>
            <span className="text-sky-400 font-semibold">{statusCounts.watching} Watching</span>
          </div>
        </div>

        {/* Watch Time Metric */}
        <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nigerian Cinema Watch Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            ~{watchTimeHours} <span className="text-sm font-normal text-slate-400">Hrs</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Includes logged film rewatches</span>
          </div>
        </div>

        {/* Reviews Metric */}
        <div
          onClick={() => onSelectTab('reviews')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Reviews
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {reviewsCount}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Star className="w-3.5 h-3.5 text-emerald-400/80 fill-emerald-400/80" />
            <span>{reviewsCount > 0 ? `Avg. ${avgUserRating} / 10 rating given` : 'No reviews posted yet'}</span>
          </div>
        </div>

        {/* API Settings Metric */}
        <div
          onClick={() => onSelectTab('api_settings')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'api_settings'
              ? 'bg-slate-900 border-teal-500/50 shadow-lg shadow-teal-950/20'
              : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              API Quota & Keys
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 mt-1">
            {customTmdbApiKey ? (
              <span className="text-emerald-400 flex items-center gap-1 text-sm font-semibold">
                <Check className="w-4 h-4 stroke-[3]" /> Personal Key
              </span>
            ) : (
              <span className="text-slate-300 text-sm font-semibold">Shared Default</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Configure external TMDb key</span>
          </div>
        </div>
      </div>
    </>
  );
};
