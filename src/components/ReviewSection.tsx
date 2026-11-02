import React, { useState, useEffect, useMemo } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserReview, Movie } from '../types';
import { 
  subscribeToMovieReviews, 
  addFirestoreReview, 
  calculateMovieRatingBreakdown,
  MovieRatingBreakdown 
} from '../lib/firestoreService';

export interface ReviewSectionProps {
  movieId: string;
  movie?: Movie | null;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
  onReviewsCountChange?: (count: number) => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  movieId,
  movie,
  currentUser,
  onOpenAuth,
  onReviewsCountChange
}) => {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('');
  const [userRating, setUserRating] = useState<number>(10);
  const [userLocation, setUserLocation] = useState<string>('Lagos, Nigeria');
  const [userComment, setUserComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto-fill user name if logged in
  useEffect(() => {
    if (currentUser && !userName) {
      setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
    }
  }, [currentUser]);

  // Dynamic real-time subscription strictly filtered by current movieId == currentMovieId
  useEffect(() => {
    if (!movieId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check localStorage for offline / optimistic reviews for this movie only
    let matchingLocal: UserReview[] = [];
    try {
      const saved = localStorage.getItem('afromoviedb_user_reviews_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          matchingLocal = parsed.filter((r: UserReview) => r.movieId === movieId);
        }
      }
    } catch {}

    setReviews(matchingLocal);

    // Subscribe to Firestore dynamic query for this specific movie
    const unsubscribe = subscribeToMovieReviews(movieId, (cloudReviews) => {
      // Strictly enforce movie ID match
      const verifiedReviews = cloudReviews.filter(r => r.movieId === movieId);

      const reviewMap = new Map<string, UserReview>();
      // First add matching cloud reviews
      verifiedReviews.forEach(r => reviewMap.set(r.id, r));
      // Overlay matching local reviews
      matchingLocal.forEach(r => {
        if (!reviewMap.has(r.id)) reviewMap.set(r.id, r);
      });

      const combined = Array.from(reviewMap.values());
      // Sort latest first
      combined.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      setReviews(combined);
      setLoading(false);
      if (onReviewsCountChange) {
        onReviewsCountChange(combined.length);
      }
    }, (err) => {
      console.warn(`Reviews subscription error for movie ${movieId}:`, err);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [movieId]);

  // Aggregate rating counts and 5-star to 1-star horizontal distribution breakdown
  const ratingBreakdown: MovieRatingBreakdown = useMemo(() => {
    return calculateMovieRatingBreakdown(reviews, {
      rating: movie?.rating,
      ratingCount: movie?.ratingCount
    });
  }, [reviews, movie?.rating, movie?.ratingCount]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!movieId) return;
    if (!userName.trim() || !userComment.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const newRevPayload = {
      movieId,
      userName: userName.trim(),
      rating: userRating,
      comment: userComment.trim(),
      userLocation: userLocation.trim() || 'Nigeria',
      userId: currentUser.uid,
      userEmail: currentUser.email || undefined
    };

    // Optimistic local review
    const optimisticReview: UserReview = {
      ...newRevPayload,
      id: 'usr-rev-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReviews(prev => [optimisticReview, ...prev.filter(r => r.id !== optimisticReview.id)]);

    // Save locally
    try {
      const saved = localStorage.getItem('afromoviedb_user_reviews_v1');
      const allLocal = saved ? JSON.parse(saved) : [];
      localStorage.setItem('afromoviedb_user_reviews_v1', JSON.stringify([optimisticReview, ...allLocal]));
    } catch {}

    try {
      await addFirestoreReview(newRevPayload);
      setUserComment('');
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 4500);
    } catch (err: any) {
      console.error('Failed to submit review to Firestore:', err);
      setSubmitError('Review saved locally, will sync when online.');
      setTimeout(() => setSubmitError(null), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-slate-800 pt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Naija Film Fan Reviews & Discussions
          </h3>
          <p className="text-xs text-slate-400">
            Join the cultural conversation — rate this Nollywood masterpiece.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
          {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* User Ratings Distribution (5 Stars down to 1 Star Horizontal Bar Chart) */}
      <div 
        id="movie-ratings-distribution-chart"
        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Left Column: Overall Score & Star Summary */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-xs">
            <div className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight flex items-baseline justify-center gap-1 font-mono">
              <span>{ratingBreakdown.average5}</span>
              <span className="text-sm font-normal text-slate-400">/ 5</span>
            </div>

            {/* 5-Star Visual Icons */}
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const ratingVal = parseFloat(ratingBreakdown.average5);
                const isFull = ratingVal >= star;
                const isHalf = !isFull && ratingVal >= star - 0.5;
                return (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      isFull 
                        ? 'text-amber-400 fill-amber-400' 
                        : isHalf 
                          ? 'text-amber-400 fill-amber-400/50' 
                          : 'text-slate-700'
                    }`} 
                  />
                );
              })}
            </div>

            <div className="text-xs text-slate-300 font-medium">
              {ratingBreakdown.average10} / 10 Nollywood Score
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Based on {ratingBreakdown.total.toLocaleString()} {ratingBreakdown.total === 1 ? 'rating' : 'ratings'}
            </div>
          </div>

          {/* Right Column: Horizontal Bar Chart Breakdown (5 Stars down to 1 Star) */}
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-medium">
              <span>Rating Distribution</span>
              <span className="text-[11px] text-slate-500">{ratingBreakdown.source}</span>
            </div>

            {ratingBreakdown.stars.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3 text-xs">
                {/* Star label */}
                <div className="flex items-center gap-1 w-12 text-slate-300 font-semibold shrink-0">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>

                {/* Horizontal Progress Track & Fill Bar */}
                <div className="flex-1 h-3 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden relative shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      star === 5
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : star === 4
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                          : star === 3
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                            : star === 2
                              ? 'bg-gradient-to-r from-amber-600 to-orange-500'
                              : 'bg-gradient-to-r from-rose-500 to-rose-400'
                    }`}
                    style={{ width: `${percent}%` }}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    title={`${count} ratings (${percent}%)`}
                  />
                </div>

                {/* Percentage & Count display */}
                <div className="w-20 text-right font-mono text-[11px] text-slate-400 shrink-0">
                  <span className="text-slate-200 font-semibold">{percent}%</span>
                  <span className="text-slate-500 text-[10px] ml-1">({count})</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Write a Review Box */}
      <form onSubmit={handleSubmitReview} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Leave Your Review
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Tunde Balogun"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Your City / State</label>
            <input
              type="text"
              placeholder="e.g. Lagos, Abuja, London, Atlanta"
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Rating (1 to 10)</label>
            <select
              value={userRating}
              onChange={(e) => setUserRating(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                <option key={num} value={num}>
                  {num} / 10 {num >= 9 ? '🌟 (Classic Masterpiece)' : num >= 7 ? '👍 (Great Watch)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Your Thoughts on the Film</label>
          <textarea
            required
            rows={3}
            placeholder="What made this movie memorable? Acting, direction, plot twists, soundtrack..."
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {reviewSubmitted ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Review submitted successfully! Thank you for supporting Nollywood cinema.
            </span>
          ) : submitError ? (
            <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Your review helps others discover authentic Nigerian stories.
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
          </button>
        </div>
      </form>

      {/* Reviews List strictly filtered for this movie */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Loading reviews for this title...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-1">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-200">No reviews yet</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Be the first to share your thoughts, critique the acting, and rate this movie!
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                    {rev.userName ? rev.userName[0] : 'N'}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white">{rev.userName}</span>
                    <span className="text-[11px] text-slate-400 ml-2">from {rev.userLocation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded text-amber-400 text-xs font-bold border border-slate-800">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{rev.rating}/10</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                "{rev.comment}"
              </p>
              <span className="text-[10px] text-slate-500 block">
                {rev.createdAt}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
