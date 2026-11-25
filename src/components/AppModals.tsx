import React from 'react';
import type { User } from 'firebase/auth';
import { MovieDetailModal } from './MovieDetailModal';
import { EditMovieModal } from './EditMovieModal';
import { TrailerModal } from './TrailerModal';
import { WatchlistModal } from './WatchlistModal';
import { HeritageModal } from './HeritageModal';
import { AddMovieModal } from './AddMovieModal';
import { AuthModal } from './AuthModal';
import { CustomListModal } from './CustomListModal';
import { SiteInfoModal } from './SiteInfoModal';
import type { UseModalRouterResult } from '../hooks/useModalRouter';
import type {
  AppUserProfile,
  CustomUserList,
  Movie,
  MovieWatchStatus,
  UserReview,
  UserTrackedItem,
} from '../types';

export interface AppModalsProps {
  modalRouter: UseModalRouterResult;
  movies: Movie[];
  watchlistIds: string[];
  watchlistMovies: Movie[];
  trackingMap: Map<string, UserTrackedItem>;
  reviews: UserReview[];
  currentUser: User | null;
  userProfile?: AppUserProfile | null;
  onToggleWatchlist: (movieId: string) => void;
  onClearWatchlist: () => void;
  onUpdateTrackingStatus: (movieId: string, status: MovieWatchStatus | null) => Promise<void>;
  onUpdateRewatchCount: (movieId: string, count: number) => Promise<void>;
  onAddReview: (newRev: Omit<UserReview, 'id' | 'createdAt'>) => Promise<void>;
  onMoviePulled: (newMovie: Movie) => Promise<void>;
  onUpdateMovie: (updatedMovie: Movie) => Promise<void>;
  onSaveCustomList: (list: CustomUserList) => Promise<void>;
  onSignOut: () => Promise<void>;
  onOpenProfile: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  modalRouter,
  movies,
  watchlistIds,
  watchlistMovies,
  trackingMap,
  reviews,
  currentUser,
  userProfile,
  onToggleWatchlist,
  onClearWatchlist,
  onUpdateTrackingStatus,
  onUpdateRewatchCount,
  onAddReview,
  onMoviePulled,
  onUpdateMovie,
  onSaveCustomList,
  onSignOut,
  onOpenProfile,
}) => {
  const {
    selectedMovie,
    openMovie,
    closeMovie,
    trailerMovie,
    openTrailer,
    closeTrailer,
    editingMovie,
    openEditMovie,
    closeEditMovie,
    isWatchlistOpen,
    closeWatchlist,
    isHeritageOpen,
    closeHeritage,
    isAutoPullOpen,
    openAddMovie,
    closeAddMovie,
    isAuthOpen,
    openAuth,
    closeAuth,
    isCustomListModalOpen,
    editingCustomList,
    closeCustomList,
    activeSiteInfoPage,
    closeSiteInfo,
  } = modalRouter;

  return (
    <>
      {/* Footer information overlays */}
      <SiteInfoModal
        page={activeSiteInfoPage}
        onClose={closeSiteInfo}
        onOpenAddFilm={() => {
          closeSiteInfo();
          if (!currentUser) {
            openAuth();
          } else {
            openAddMovie();
          }
        }}
      />

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={closeMovie}
          onOpenTrailer={openTrailer}
          isWatchlisted={watchlistIds.includes(selectedMovie.id)}
          onToggleWatchlist={onToggleWatchlist}
          watchStatus={
            trackingMap.get(selectedMovie.id)?.status ||
            (watchlistIds.includes(selectedMovie.id) ? 'plan_to_watch' : null)
          }
          onUpdateStatus={onUpdateTrackingStatus}
          rewatchCount={trackingMap.get(selectedMovie.id)?.rewatchCount || 0}
          onUpdateRewatchCount={onUpdateRewatchCount}
          allMovies={movies}
          onSelectMovie={openMovie}
          reviews={reviews}
          onAddReview={onAddReview}
          currentUser={currentUser}
          userProfile={userProfile}
          onOpenEdit={openEditMovie}
          onUpdateMovie={onUpdateMovie}
          onOpenAuth={openAuth}
        />
      )}

      {/* Dedicated Edit Movie Modal (Exclusively for Authenticated Firebase Users) */}
      <EditMovieModal
        isOpen={Boolean(editingMovie)}
        movie={editingMovie}
        onClose={closeEditMovie}
        onSaveMovie={onUpdateMovie}
        currentUser={currentUser}
      />

      {/* Video Trailer Modal */}
      <TrailerModal movie={trailerMovie} onClose={closeTrailer} />

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={closeWatchlist}
        watchlistMovies={watchlistMovies}
        onRemoveFromWatchlist={onToggleWatchlist}
        onClearWatchlist={onClearWatchlist}
        onSelectMovie={openMovie}
        onOpenTrailer={openTrailer}
      />

      {/* Nollywood Heritage Modal */}
      <HeritageModal isOpen={isHeritageOpen} onClose={closeHeritage} />

      {/* Add Movie & Auto-Pull Modal */}
      <AddMovieModal
        isOpen={isAutoPullOpen}
        onClose={closeAddMovie}
        onAddMovie={onMoviePulled}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={closeAuth}
        currentUser={currentUser}
        onSignOut={onSignOut}
        onOpenProfile={onOpenProfile}
      />

      {/* Custom Curated Collection Modal */}
      <CustomListModal
        isOpen={isCustomListModalOpen}
        onClose={closeCustomList}
        onSaveList={onSaveCustomList}
        allMovies={movies}
        currentUser={currentUser}
        editingList={editingCustomList}
      />
    </>
  );
};
