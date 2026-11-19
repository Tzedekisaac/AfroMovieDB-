import React from 'react';
import { Bookmark, LogIn } from 'lucide-react';

interface ProfileGuestViewProps {
  onOpenAuth: () => void;
  onBackToCatalogue: () => void;
}

export const ProfileGuestView: React.FC<ProfileGuestViewProps> = ({
  onOpenAuth,
  onBackToCatalogue
}) => {
  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center space-y-6">
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Bookmark className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Track Your Nollywood Journey
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            Sign in with Firebase to organize films into multi-status categories (*Plan to Watch*, *Watching*, *Completed*), record rewatches, and get personalized recommendations.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="profile-guest-signin-btn"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Sign In or Create Account</span>
            </button>
            <button
              onClick={onBackToCatalogue}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-colors border border-slate-700"
            >
              Browse as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
