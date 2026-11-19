import React from 'react';
import {
  Bookmark, MessageSquare, Sparkles, Layers, Palette, Search
} from 'lucide-react';
import type { MovieWatchStatus } from '../../types';
import { STATUS_CONFIG } from '../TrackingStatusPicker';
import type { ProfileTab } from '../../hooks/useUserProfileState';

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onSelectTab: (tab: ProfileTab) => void;
  searchFilter: string;
  onSearchFilterChange: (q: string) => void;
  trackedCount: number;
  statusCounts: Record<MovieWatchStatus, number>;
  customListsCount: number;
  reviewsCount: number;
}

export const ProfileTabBar: React.FC<ProfileTabBarProps> = ({
  activeTab,
  onSelectTab,
  searchFilter,
  onSearchFilterChange,
  trackedCount,
  statusCounts,
  customListsCount,
  reviewsCount
}) => {
  return (
    <div className="border-b border-slate-800 pb-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Scrollable Tabs */}
        <div className="w-full max-w-full flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {/* All Tracked */}
          <button
            onClick={() => onSelectTab('all_tracked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'all_tracked'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>All Tracked</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
              {trackedCount}
            </span>
          </button>

          {/* Individual Status Tabs */}
          {(Object.keys(STATUS_CONFIG) as MovieWatchStatus[]).map((statusKey) => {
            const cfg = STATUS_CONFIG[statusKey];
            const count = statusCounts[statusKey];
            const isSelected = activeTab === statusKey;
            const IconComp = cfg.icon;

            return (
              <button
                key={statusKey}
                onClick={() => onSelectTab(statusKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? `${cfg.bgClass} ${cfg.colorClass} border border-current shadow-md`
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{cfg.shortLabel}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
                  {count}
                </span>
              </button>
            );
          })}

          {/* Recommendations Tab */}
          <button
            onClick={() => onSelectTab('recommendations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'recommendations'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recommended For You</span>
          </button>

          {/* Curated Lists Tab */}
          <button
            id="profile-tab-custom-lists"
            onClick={() => onSelectTab('custom_lists')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'custom_lists'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Collections</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
              {customListsCount}
            </span>
          </button>

          {/* Reviews Tab */}
          <button
            onClick={() => onSelectTab('reviews')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'reviews'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reviews</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
              {reviewsCount}
            </span>
          </button>

          {/* Theme & Settings Tab */}
          <button
            id="profile-tab-settings"
            onClick={() => onSelectTab('api_settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'api_settings'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Settings</span>
          </button>
        </div>

        {/* Search within Profile */}
        {activeTab !== 'api_settings' && (
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => onSearchFilterChange(e.target.value)}
              placeholder="Filter titles or genres..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
};
