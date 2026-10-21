import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, 
  Timestamp, getDocFromServer, writeBatch 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Movie, UserReview, UserTrackedItem, MovieWatchStatus, UserApiSettings, AppTheme, CustomUserList } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Recursively strips all keys with `undefined` values from an object or array.
 * Converts any isolated `undefined` to `null` and omits undefined keys in objects.
 * Keeps special Firestore types (serverTimestamp FieldValues, Date, Timestamp) intact.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  // If it's a special object (Date, Timestamp, FieldValue with internal symbols/class)
  if (obj.constructor && obj.constructor.name !== 'Object' && !Array.isArray(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = stripUndefined(value);
    }
  }
  return result as T;
}

/**
 * Prepares movie data safely for Firestore by providing safe fallbacks for optional or missing fields
 * (like nativeTitle, directorAvatarUrl, trailerYoutubeId, boxOffice, quote, etc.) and stripping any undefined values.
 */
export function prepareMovieForFirestore(movie: Partial<Movie> & Record<string, any>): Record<string, any> {
  const safeData: Record<string, any> = {
    id: movie.id || '',
    title: movie.title || 'Untitled Nollywood Film',
    nativeTitle: movie.nativeTitle ? String(movie.nativeTitle).trim() : '',
    tagline: movie.tagline ? String(movie.tagline).trim() : '',
    releaseYear: Number(movie.releaseYear) || new Date().getFullYear(),
    director: movie.director || 'Nigerian Filmmaker Team',
    directorAvatarUrl: movie.directorAvatarUrl || '',
    directorTmdbId: movie.directorTmdbId !== undefined && movie.directorTmdbId !== null ? Number(movie.directorTmdbId) : null,
    producer: movie.producer || '',
    leadCast: Array.isArray(movie.leadCast)
      ? movie.leadCast.map((c) => ({
          actor: c?.actor || '',
          role: c?.role || 'Cast Member',
          avatarUrl: c?.avatarUrl || '',
          tmdbId: c?.tmdbId !== undefined && c?.tmdbId !== null ? Number(c.tmdbId) : null
        }))
      : [],
    genres: Array.isArray(movie.genres) && movie.genres.length > 0 ? movie.genres : ['Drama'],
    languages: Array.isArray(movie.languages) && movie.languages.length > 0 ? movie.languages : ['English'],
    era: movie.era || 'Modern Global Era (2019-Present)',
    runtimeMinutes: Number(movie.runtimeMinutes) || 105,
    rating: typeof movie.rating === 'number' && !isNaN(movie.rating) ? movie.rating : 8.0,
    ratingCount: Number(movie.ratingCount) || 1,
    boxOffice: movie.boxOffice || '',
    posterUrl: movie.posterUrl || '',
    backdropUrl: movie.backdropUrl || movie.posterUrl || '',
    synopsis: movie.synopsis || '',
    culturalSignificance: movie.culturalSignificance || '',
    streamingPlatforms: Array.isArray(movie.streamingPlatforms)
      ? movie.streamingPlatforms.map((p) => ({
          name: p?.name || 'Netflix',
          badgeColor: p?.badgeColor || 'bg-slate-700',
          url: p?.url || ''
        }))
      : [],
    trailerYoutubeId: movie.trailerYoutubeId || '',
    amvcaAwards: Array.isArray(movie.amvcaAwards) ? movie.amvcaAwards : [],
    quote: movie.quote
      ? {
          text: movie.quote.text || '',
          character: movie.quote.character || '',
          actor: movie.quote.actor || ''
        }
      : null,
    featured: Boolean(movie.featured),
    boxOfficeChampion: Boolean(movie.boxOfficeChampion),
    isUserAdded: true,
    source: movie.source || 'web_pulled',
    tmdbId: movie.tmdbId !== undefined && movie.tmdbId !== null ? Number(movie.tmdbId) : null,
    addedByUserId: movie.addedByUserId || null,
    lastEditedByUserId: movie.lastEditedByUserId || null
  };

  return stripUndefined(safeData);
}

// Test connection on boot per Firebase guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore offline check: Please verify network connection or Firebase config.");
    }
  }
}
testConnection();

/**
 * User Profile & Multi-Status Tracking Operations for a specific User
 * Stored under: users/{userId} (trackingList: UserTrackedItem[], watchlist: string[], customTmdbApiKey?: string)
 */
export function subscribeToUserWatchlist(userId: string, callback: (watchlistIds: string[]) => void) {
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(userDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.trackingList) && data.trackingList.length > 0) {
        callback(data.trackingList.map((t: any) => t.movieId));
      } else if (Array.isArray(data.watchlist)) {
        callback(data.watchlist);
      } else {
        callback([]);
      }
    } else {
      callback([]);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    console.warn('Watchlist listener warning:', err);
  });
}

export function subscribeToUserData(
  userId: string, 
  callback: (data: { trackingList: UserTrackedItem[]; watchlist: string[]; customTmdbApiKey?: string; theme?: AppTheme }) => void
) {
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(userDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      let trackingList: UserTrackedItem[] = [];

      if (Array.isArray(data.trackingList) && data.trackingList.length > 0) {
        trackingList = data.trackingList.map((item: any) => ({
          movieId: String(item.movieId || ''),
          status: (item.status as MovieWatchStatus) || 'plan_to_watch',
          rewatchCount: typeof item.rewatchCount === 'number' ? item.rewatchCount : 0,
          updatedAt: item.updatedAt ? String(item.updatedAt) : new Date().toISOString()
        })).filter((item: UserTrackedItem) => item.movieId.length > 0);
      } else if (Array.isArray(data.watchlist)) {
        // Migrate legacy watchlist to trackingList as 'plan_to_watch'
        trackingList = data.watchlist.map((id: string) => ({
          movieId: String(id),
          status: 'plan_to_watch' as MovieWatchStatus,
          rewatchCount: 0,
          updatedAt: new Date().toISOString()
        }));
      }

      const watchlist = trackingList.map(t => t.movieId);
      callback({
        trackingList,
        watchlist,
        customTmdbApiKey: data.customTmdbApiKey ? String(data.customTmdbApiKey).trim() : undefined,
        theme: data.theme as AppTheme | undefined
      });
    } else {
      callback({ trackingList: [], watchlist: [] });
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    console.warn('User data listener warning:', err);
  });
}

export async function saveUserTheme(userId: string, theme: AppTheme) {
  const userDocRef = doc(db, 'users', userId);
  try {
    const payload = stripUndefined({
      theme,
      updatedAt: serverTimestamp()
    });
    await setDoc(userDocRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    throw err;
  }
}

export async function saveUserWatchlist(userId: string, watchlistIds: string[]) {
  const userDocRef = doc(db, 'users', userId);
  try {
    const payload = stripUndefined({
      watchlist: Array.isArray(watchlistIds) ? watchlistIds : [],
      updatedAt: serverTimestamp()
    });
    await setDoc(userDocRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    throw err;
  }
}

export async function saveUserTrackingList(userId: string, trackingList: UserTrackedItem[]) {
  const userDocRef = doc(db, 'users', userId);
  try {
    const sanitizedList = trackingList.map(t => ({
      movieId: String(t.movieId),
      status: t.status,
      rewatchCount: typeof t.rewatchCount === 'number' ? Math.max(0, t.rewatchCount) : 0,
      updatedAt: t.updatedAt || new Date().toISOString()
    }));

    const payload = stripUndefined({
      trackingList: sanitizedList,
      watchlist: sanitizedList.map(t => t.movieId),
      updatedAt: serverTimestamp()
    });
    await setDoc(userDocRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    throw err;
  }
}

export async function saveUserApiKey(userId: string, apiKey: string) {
  const userDocRef = doc(db, 'users', userId);
  try {
    const payload = stripUndefined({
      customTmdbApiKey: apiKey.trim(),
      updatedAt: serverTimestamp()
    });
    await setDoc(userDocRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    throw err;
  }
}

export async function removeUserApiKey(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  try {
    const payload = stripUndefined({
      customTmdbApiKey: null,
      updatedAt: serverTimestamp()
    });
    await setDoc(userDocRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    throw err;
  }
}

/**
 * Reviews Operations
 * Stored in collection 'reviews'
 */
export function subscribeToReviews(callback: (reviews: UserReview[]) => void) {
  const reviewsCol = collection(db, 'reviews');
  return onSnapshot(reviewsCol, (snap) => {
    const list: UserReview[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        movieId: d.movieId || '',
        userName: d.userName || 'Anonymous',
        rating: typeof d.rating === 'number' ? d.rating : 10,
        comment: d.comment || '',
        createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate().toISOString().split('T')[0] : String(d.createdAt)) : new Date().toISOString().split('T')[0],
        userLocation: d.userLocation || 'Nigeria',
        userId: d.userId || undefined,
        userEmail: d.userEmail || undefined
      });
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'reviews');
    console.warn('Reviews snapshot warning:', err);
  });
}

export async function addFirestoreReview(review: Omit<UserReview, 'id' | 'createdAt'> & { userId?: string; userEmail?: string }) {
  const reviewsCol = collection(db, 'reviews');
  const newDocRef = doc(reviewsCol);
  try {
    const payload = stripUndefined({
      movieId: review.movieId || '',
      userName: review.userName || 'Anonymous',
      rating: typeof review.rating === 'number' ? review.rating : 10,
      comment: review.comment || '',
      userLocation: review.userLocation || 'Nigeria',
      userId: review.userId || null,
      userEmail: review.userEmail || null,
      createdAt: serverTimestamp()
    });
    await setDoc(newDocRef, payload);
    return newDocRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reviews/${newDocRef.id}`);
    throw err;
  }
}

export async function deleteFirestoreReview(reviewId: string) {
  const reviewRef = doc(db, 'reviews', reviewId);
  try {
    await deleteDoc(reviewRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    throw err;
  }
}

/**
 * Custom / User-Added / Edited Movies Operations
 * Stored in collection 'custom_movies'
 */
export function subscribeToCustomMovies(callback: (movies: Movie[]) => void) {
  const col = collection(db, 'custom_movies');
  return onSnapshot(col, (snap) => {
    const list: Movie[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data() as any;
      list.push({
        ...d,
        id: docSnap.id
      });
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'custom_movies');
    console.warn('Custom movies listener warning:', err);
  });
}

/**
 * Save new or modified movie directly to Firebase Firestore
 */
export async function saveFirestoreCustomMovie(movie: Movie, userId?: string) {
  const movieRef = doc(db, 'custom_movies', movie.id);
  try {
    const preparedPayload = prepareMovieForFirestore({
      ...movie,
      addedByUserId: movie.addedByUserId || userId || null,
      lastEditedByUserId: userId || null
    });
    // Add server timestamp after cleaning
    preparedPayload.syncedAt = serverTimestamp();

    await setDoc(movieRef, preparedPayload, { merge: true });
    return movie;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `custom_movies/${movie.id}`);
    throw err;
  }
}

/**
 * Save multiple movies directly to Firebase Firestore in chunks
 * Handles batching and provides graceful fallback to ensure imports are always written to Cloud Firestore
 */
export async function saveMultipleFirestoreMovies(movies: Movie[], userId?: string): Promise<number> {
  if (!movies || movies.length === 0) return 0;
  let savedCount = 0;

  // Process in batches of 350 to stay safely under Firestore's 500 operation batch limit
  const chunkSize = 350;
  for (let i = 0; i < movies.length; i += chunkSize) {
    const chunk = movies.slice(i, i + chunkSize);
    try {
      const batch = writeBatch(db);
      for (const movie of chunk) {
        const movieRef = doc(db, 'custom_movies', movie.id);
        const preparedPayload = prepareMovieForFirestore({
          ...movie,
          addedByUserId: movie.addedByUserId || userId || null,
          lastEditedByUserId: userId || null
        });
        preparedPayload.syncedAt = serverTimestamp();
        batch.set(movieRef, preparedPayload, { merge: true });
      }
      await batch.commit();
      savedCount += chunk.length;
    } catch (batchErr) {
      console.warn('Batch write failed, falling back to sequential writes:', batchErr);
      for (const movie of chunk) {
        try {
          await saveFirestoreCustomMovie(movie, userId);
          savedCount++;
        } catch (singleErr) {
          console.warn(`Failed to save movie ${movie.id} in fallback:`, singleErr);
        }
      }
    }
  }

  return savedCount;
}

/**
 * Update an existing movie directly in Firebase Firestore with user identity & timestamp
 */
export async function updateFirestoreMovie(movie: Movie, userId?: string): Promise<Movie> {
  const movieRef = doc(db, 'custom_movies', movie.id);
  try {
    const preparedPayload = prepareMovieForFirestore({
      ...movie,
      lastEditedByUserId: userId || null,
      isUserAdded: true // Ensure movie is preserved across catalog sessions
    });
    // Add server timestamp
    preparedPayload.syncedAt = serverTimestamp();

    await setDoc(movieRef, preparedPayload, { merge: true });
    return { ...movie, ...preparedPayload };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `custom_movies/${movie.id}`);
    throw err;
  }
}

export async function deleteFirestoreCustomMovie(movieId: string) {
  const movieRef = doc(db, 'custom_movies', movieId);
  try {
    await deleteDoc(movieRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `custom_movies/${movieId}`);
    throw err;
  }
}

/**
 * Custom Themed User Lists Operations
 * Stored in collection 'custom_lists'
 */
export function subscribeToPublicCustomLists(callback: (lists: CustomUserList[]) => void) {
  const listsCol = collection(db, 'custom_lists');
  const q = query(listsCol, where('isPublic', '==', true));
  return onSnapshot(q, (snap) => {
    const lists: CustomUserList[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      lists.push({
        id: docSnap.id,
        title: d.title || 'Untitled Collection',
        description: d.description || '',
        creatorId: d.creatorId || '',
        creatorName: d.creatorName || 'Anonymous Nollywood Curator',
        creatorAvatar: d.creatorAvatar || undefined,
        movieIds: Array.isArray(d.movieIds) ? d.movieIds : [],
        isPublic: Boolean(d.isPublic),
        curatorNote: d.curatorNote || undefined,
        theme: d.theme || 'emerald',
        createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()) : new Date().toISOString(),
        updatedAt: d.updatedAt ? (typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString()) : new Date().toISOString()
      });
    });
    callback(lists);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'custom_lists');
    console.warn('Public lists listener warning:', err);
  });
}

export function subscribeToUserCustomLists(userId: string, callback: (lists: CustomUserList[]) => void) {
  const listsCol = collection(db, 'custom_lists');
  const q = query(listsCol, where('creatorId', '==', userId));
  return onSnapshot(q, (snap) => {
    const lists: CustomUserList[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      lists.push({
        id: docSnap.id,
        title: d.title || 'Untitled Collection',
        description: d.description || '',
        creatorId: d.creatorId || userId,
        creatorName: d.creatorName || 'Anonymous Nollywood Curator',
        creatorAvatar: d.creatorAvatar || undefined,
        movieIds: Array.isArray(d.movieIds) ? d.movieIds : [],
        isPublic: Boolean(d.isPublic),
        curatorNote: d.curatorNote || undefined,
        theme: d.theme || 'emerald',
        createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()) : new Date().toISOString(),
        updatedAt: d.updatedAt ? (typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString()) : new Date().toISOString()
      });
    });
    callback(lists);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'custom_lists');
    console.warn('User custom lists listener warning:', err);
  });
}

export async function getCustomListById(listId: string): Promise<CustomUserList | null> {
  const docRef = doc(db, 'custom_lists', listId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      title: d.title || 'Untitled Collection',
      description: d.description || '',
      creatorId: d.creatorId || '',
      creatorName: d.creatorName || 'Anonymous Nollywood Curator',
      creatorAvatar: d.creatorAvatar || undefined,
      movieIds: Array.isArray(d.movieIds) ? d.movieIds : [],
      isPublic: Boolean(d.isPublic),
      curatorNote: d.curatorNote || undefined,
      theme: d.theme || 'emerald',
      createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()) : new Date().toISOString(),
      updatedAt: d.updatedAt ? (typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString()) : new Date().toISOString()
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `custom_lists/${listId}`);
    return null;
  }
}

export async function saveCustomList(list: CustomUserList, userId: string): Promise<void> {
  const docRef = doc(db, 'custom_lists', list.id);
  try {
    const payload = stripUndefined({
      id: list.id,
      title: list.title.trim(),
      description: list.description?.trim() || '',
      creatorId: userId,
      creatorName: list.creatorName || 'Anonymous Curator',
      creatorAvatar: list.creatorAvatar || null,
      movieIds: Array.isArray(list.movieIds) ? list.movieIds : [],
      isPublic: Boolean(list.isPublic),
      curatorNote: list.curatorNote?.trim() || null,
      theme: list.theme || 'emerald',
      createdAt: list.createdAt || new Date().toISOString(),
      updatedAt: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `custom_lists/${list.id}`);
    throw err;
  }
}

export async function deleteCustomList(listId: string): Promise<void> {
  const docRef = doc(db, 'custom_lists', listId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `custom_lists/${listId}`);
    throw err;
  }
}

