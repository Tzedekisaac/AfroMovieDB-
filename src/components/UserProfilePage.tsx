import React from 'react';
import type { User } from 'firebase/auth';
import type {
  Movie,
  UserReview,
  MovieWatchStatus,
  UserTrackedItem,
  AppTheme,
  CustomUserList
} from '../types';
import {
  useUserProfileState,
  TRACKING_TABS,
  type ProfileTab
} from '../hooks/useUserProfileState';
import { ProfileGuestView } from './profile/ProfileGuestView';
import { ProfileHeaderStats } from './profile/ProfileHeaderStats';
import { ProfileTabBar } from './profile/ProfileTabBar';
import { ProfileTrackedTab } from './profile/ProfileTrackedTab';
import { ProfileRecommendationsTab } from './profile/ProfileRecommendationsTab';
import { ProfileCustomListsTab } from './profile/ProfileCustomListsTab';
import {
  ProfileReviewsTab,
  ProfileContributionsTab
} from './profile/ProfileReviewsActivityTab';
import { ProfileSettingsTab } from './profile/ProfileSettingsTab';

export type { ProfileTab };

interface UserProfilePageProps {
  currentUser: User | null;
  moviesList: Movie[];
  watchlist: string[];
  trackingList?: UserTrackedItem[];
  customTmdbApiKey?: string;
  reviews?: UserReview[];
  activeTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  userCustomLists?: CustomUserList[];
  onOpenCreateList?: () => void;
  onOpenEditList?: (list: CustomUserList) => void;
  onDeleteCustomList?: (listId: string) => void;
  onViewStandaloneList?: (list: CustomUserList) => void;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
  onUpdateRewatchCount?: (movieId: string, count: number) => void;
  onSaveApiKey?: (apiKey: string) => Promise<void> | void;
  onRemoveApiKey?: () => Promise<void> | void;
  onToggleWatchlist: (movieId: string) => void;
  onClearWatchlist?: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  onDeleteReview: (reviewId: string) => Promise<void> | void;
  onOpenAddMovie: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onBackToCatalogue: () => void;
  onOpenEdit?: (movie: Movie) => void;
  onNavigateAdmin?: () => void;
  isAdmin?: boolean;
  userRole?: string;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  currentUser,
  moviesList,
  watchlist,
  trackingList = [],
  customTmdbApiKey,
  reviews = [],
  activeTheme = 'emerald',
  onSelectTheme,
  userCustomLists = [],
  onOpenCreateList,
  onOpenEditList,
  onDeleteCustomList,
  onViewStandaloneList,
  onUpdateStatus,
  onUpdateRewatchCount,
  onSaveApiKey,
  onRemoveApiKey,
  onSelectMovie,
  onOpenTrailer,
  onDeleteReview,
  onOpenAddMovie,
  onOpenAuth,
  onSignOut,
  onBackToCatalogue,
  onNavigateAdmin,
  isAdmin,
  userRole
}) => {
  const state = useUserProfileState({
    currentUser,
    moviesList,
    watchlist,
    trackingList,
    customTmdbApiKey,
    reviews,
    isAdmin,
    userRole,
    onSaveApiKey,
    onRemoveApiKey,
    onDeleteReview
  });

  if (!currentUser) {
    return (
      <ProfileGuestView
        onOpenAuth={onOpenAuth}
        onBackToCatalogue={onBackToCatalogue}
      />
    );
  }

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <ProfileHeaderStats
        currentUser={currentUser}
        hasAdminAccess={state.hasAdminAccess}
        isOwner={state.isOwner}
        customTmdbApiKey={customTmdbApiKey}
        copiedUid={state.copiedUid}
        activeTab={state.activeTab}
        trackedCount={state.effectiveTrackingList.length}
        statusCounts={state.statusCounts}
        watchTimeHours={state.watchTimeHours}
        reviewsCount={state.userReviews.length}
        avgUserRating={state.avgUserRating}
        onBackToCatalogue={onBackToCatalogue}
        onNavigateAdmin={onNavigateAdmin}
        onOpenAddMovie={onOpenAddMovie}
        onSignOut={onSignOut}
        onCopyUid={state.handleCopyUid}
        onSelectTab={state.setActiveTab}
      />

      <ProfileTabBar
        activeTab={state.activeTab}
        onSelectTab={state.selectTab}
        searchFilter={state.searchFilter}
        onSearchFilterChange={state.setSearchFilter}
        trackedCount={state.effectiveTrackingList.length}
        statusCounts={state.statusCounts}
        customListsCount={userCustomLists.length}
        reviewsCount={state.userReviews.length}
      />

      {TRACKING_TABS.includes(state.activeTab) && (
        <ProfileTrackedTab
          visibleTracked={state.visibleTracked}
          totalFilteredCount={state.filteredTracked.length}
          hasMoreTracked={state.hasMoreTracked}
          searchFilter={state.searchFilter}
          onLoadMore={state.loadMoreTracked}
          onBackToCatalogue={onBackToCatalogue}
          onSelectMovie={onSelectMovie}
          onOpenTrailer={onOpenTrailer}
          onUpdateStatus={onUpdateStatus}
          onUpdateRewatchCount={onUpdateRewatchCount}
        />
      )}

      {state.activeTab === 'recommendations' && (
        <ProfileRecommendationsTab
          recommendations={state.personalizedRecommendations}
          onBackToCatalogue={onBackToCatalogue}
          onSelectMovie={onSelectMovie}
          onOpenTrailer={onOpenTrailer}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {state.activeTab === 'custom_lists' && (
        <ProfileCustomListsTab
          userCustomLists={userCustomLists}
          moviesList={moviesList}
          onOpenCreateList={onOpenCreateList}
          onOpenEditList={onOpenEditList}
          onDeleteCustomList={onDeleteCustomList}
          onViewStandaloneList={onViewStandaloneList}
          onNotifyShareLink={state.notifyCopiedShareLink}
        />
      )}

      {state.activeTab === 'api_settings' && (
        <ProfileSettingsTab
          currentUserUid={currentUser.uid}
          activeTheme={activeTheme}
          onSelectTheme={onSelectTheme}
          customTmdbApiKey={customTmdbApiKey}
          inputApiKey={state.inputApiKey}
          onInputApiKeyChange={state.setInputApiKey}
          showApiKey={state.showApiKey}
          onToggleShowApiKey={() => state.setShowApiKey(!state.showApiKey)}
          isTestingKey={state.isTestingKey}
          testResult={state.testResult}
          isSavingKey={state.isSavingKey}
          keyNotice={state.keyNotice}
          onTestKey={state.handleTestKey}
          onSaveApiKey={state.handleSaveApiKey}
          onRemoveApiKey={state.handleRemoveApiKey}
        />
      )}

      {state.activeTab === 'reviews' && (
        <ProfileReviewsTab
          visibleReviews={state.visibleReviews}
          moviesList={moviesList}
          deletingReviewId={state.deletingReviewId}
          onSelectMovie={onSelectMovie}
          onDeleteReview={state.handleDeleteReviewClick}
        />
      )}

      {state.activeTab === 'contributions' && (
        <ProfileContributionsTab
          visibleContributions={state.visibleContributions}
          onOpenAddMovie={onOpenAddMovie}
          onSelectMovie={onSelectMovie}
        />
      )}
    </div>
  );
};
