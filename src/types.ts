export type Era = 
  | 'All' 
  | 'Golden Era (1992-2005)' 
  | 'New Nollywood (2006-2018)' 
  | 'Modern Global Era (2019-Present)';

export type Language = 
  | 'All' 
  | 'English' 
  | 'Nigerian Pidgin' 
  | 'Yoruba' 
  | 'Igbo' 
  | 'Hausa';

export type Genre = 
  | 'All' 
  | 'Epic & Folklore' 
  | 'Crime & Thriller' 
  | 'Comedy' 
  | 'Drama' 
  | 'Romantic Comedy' 
  | 'Action' 
  | 'Historical Drama';

export interface CastMember {
  actor: string;
  role: string;
  avatarUrl?: string;
  tmdbId?: number;
}

export interface StreamingPlatform {
  name: 'Netflix' | 'Prime Video' | 'YouTube' | 'Cinema' | 'IROKOtv' | 'Africa Magic';
  badgeColor: string;
  url?: string;
}

export interface Quote {
  text: string;
  character: string;
  actor: string;
}

export interface Movie {
  id: string;
  title: string;
  nativeTitle?: string;
  tagline: string;
  releaseYear: number;
  director: string;
  directorAvatarUrl?: string;
  directorTmdbId?: number;
  producer?: string;
  leadCast: CastMember[];
  genres: string[];
  languages: string[];
  era: 'Golden Era (1992-2005)' | 'New Nollywood (2006-2018)' | 'Modern Global Era (2019-Present)';
  runtimeMinutes: number;
  rating: number; // e.g. 8.7 / 10
  ratingCount: number;
  boxOffice?: string;
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
  culturalSignificance: string;
  streamingPlatforms: StreamingPlatform[];
  trailerYoutubeId: string;
  amvcaAwards?: string[];
  quote?: Quote;
  featured?: boolean;
  boxOfficeChampion?: boolean;
  isUserAdded?: boolean;
  source?: 'system' | 'web_pulled' | 'custom';
  addedByUserId?: string | null;
  lastEditedByUserId?: string | null;
  syncedAt?: any;
  tmdbId?: number;
}

export interface PersonProfileData {
  id?: number;
  name: string;
  biography?: string;
  birthday?: string;
  deathday?: string | null;
  placeOfBirth?: string;
  department?: string;
  avatarUrl?: string;
  imdbId?: string;
  knownFor?: Array<{
    id: number;
    title?: string;
    name?: string;
    posterPath?: string;
    releaseDate?: string;
    character?: string;
    mediaType?: string;
  }>;
}

export interface FilmographyItem {
  movie: Movie;
  roleType: 'Director' | 'Cast' | 'Producer';
  characterRole?: string;
}

export interface UserReview {
  id: string;
  movieId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  userLocation: string;
  userId?: string;
  userEmail?: string;
}

export type AppTheme = 'emerald' | 'gold' | 'obsidian';

export interface FilterState {
  searchQuery: string;
  selectedGenre: string;
  selectedLanguage: string;
  selectedEra: string;
  selectedPlatform: string;
  sortBy: 'rating' | 'year_desc' | 'year_asc' | 'title' | 'box_office' | 'runtime_desc' | 'runtime_asc' | 'rewatch_desc';
  watchlistOnly: boolean;
}

export type MovieWatchStatus = 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';

export interface UserTrackedItem {
  movieId: string;
  status: MovieWatchStatus;
  rewatchCount: number;
  updatedAt: string;
}

export interface RecommendationItem {
  movie: Movie;
  score: number;
  reason: string;
  matchingGenres: string[];
  matchingDirector?: string;
  matchingActors: string[];
}

export interface UserApiSettings {
  customTmdbApiKey?: string;
  theme?: AppTheme;
  updatedAt?: string;
}

export interface CustomUserList {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  movieIds: string[];
  isPublic: boolean;
  curatorNote?: string;
  theme?: AppTheme;
  createdAt: string;
  updatedAt: string;
}
