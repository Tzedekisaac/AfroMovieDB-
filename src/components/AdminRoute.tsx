import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { ShieldAlert, Lock, ArrowLeft, LogIn, Loader2, Sparkles } from 'lucide-react';
import { 
  isUserOwner, 
  isUserAdminOrOwner, 
  isUserModeratorOrHigher, 
  subscribeToUserProfile,
  PRIMARY_OWNER_UID,
  PRIMARY_OWNER_EMAIL
} from '../lib/firestoreService';
import { AppUserProfile, UserRole } from '../types';

export { PRIMARY_OWNER_UID, PRIMARY_OWNER_EMAIL };

interface AdminRouteProps {
  currentUser: User | null;
  onNavigateHome: () => void;
  onOpenAuth?: () => void;
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  currentUser,
  onNavigateHome,
  onOpenAuth,
  allowedRoles = ['owner', 'admin'],
  children
}) => {
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Realtime subscription to the current user's profile and roles in Firestore
    const unsubscribe = subscribeToUserProfile(currentUser.uid, (p) => {
      setProfile(p);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Check authorization
  const isOwner = isUserOwner(currentUser);
  const userRole: UserRole = isOwner ? 'owner' : (profile?.role || (profile?.isAdmin ? 'admin' : 'user'));
  const isAuthorized = isOwner || allowedRoles.includes(userRole) || (allowedRoles.includes('admin') && profile?.isAdmin === true);

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-950/30">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-cinema font-bold text-white mb-2">
            Administrator Authentication Required
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The NaijaReel Admin Command Center is restricted to authenticated portal administrators and system curators.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Continue</span>
              </button>
            )}
            <button
              onClick={onNavigateHome}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium tracking-wide">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-slate-900/95 border border-rose-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-950/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-cinema font-bold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your current account does not have permission to view this administrative area. This section requires an <span className="text-amber-400 font-semibold">Admin</span> or <span className="text-emerald-400 font-semibold">Owner</span> security role.
          </p>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 text-left text-xs font-mono text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Authenticated User:</span>
              <span className="text-slate-300 truncate max-w-[200px]">{currentUser.email || currentUser.displayName || 'Anonymous'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Firebase UID:</span>
              <span className="text-slate-400 truncate max-w-[200px]">{currentUser.uid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Role:</span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {userRole}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Catalogue</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
};
