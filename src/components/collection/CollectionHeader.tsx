import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import type { CollectionStats } from '../../types/collection';
import { isFirebaseConfigured } from '../../utils/firebase';
import { CollectionBackupModal } from './CollectionBackupModal';
import { ProfileManagerModal } from './ProfileManagerModal';

const SYNC_LABEL: Record<string, { text: string; className: string; dot: string }> = {
  idle: { text: 'Guest', className: 'bg-slate-800/80 text-slate-400 border-slate-700/60', dot: 'bg-slate-500' },
  syncing: { text: 'Syncing…', className: 'bg-sky-950/80 text-sky-300 border-sky-600/50', dot: 'bg-sky-400 animate-pulse' },
  synced: { text: 'Cloud Active', className: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50', dot: 'bg-emerald-400' },
  error: { text: 'Sync Error', className: 'bg-rose-950/80 text-rose-300 border-rose-600/50', dot: 'bg-rose-400' },
};

export function CollectionHeader({ stats }: { stats: CollectionStats }) {
  const [showProfiles, setShowProfiles] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);
  const clearError = useAuthStore((s) => s.clearError);

  const syncStatus = useCollectionStore((s) => s.syncStatus);
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const activeProfile = profiles[activeProfileId];

  const badge = SYNC_LABEL[user ? syncStatus : 'idle'] ?? SYNC_LABEL.idle;

  return (
    <header className="sticky top-0 z-30 border-b border-amber-500/10 bg-[#080c16]/85 backdrop-blur-xl shadow-lg shadow-black/40">
      {/* Subtle top magical starlight line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/40 via-purple-500/50 to-sky-500/40" />

      <div className="px-3 sm:px-6 py-2.5 space-y-2.5 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 via-purple-500/20 to-sky-500/20 border border-amber-400/30 flex items-center justify-center shadow-inner text-base shrink-0">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-100 to-sky-200 bg-clip-text text-transparent whitespace-nowrap">
                  Disney Lorcana
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Tracker
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badge.className}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.text}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Profile Picker */}
            <button
              type="button"
              onClick={() => setShowProfiles(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/70 hover:border-amber-400/50 hover:bg-slate-800 text-xs transition-all shadow-sm group"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">{activeProfile?.icon ?? '📘'}</span>
              <span className="hidden sm:inline max-w-[130px] truncate font-medium text-slate-200">
                {activeProfile?.name ?? 'Binder'}
              </span>
              <span className="text-slate-500 text-[10px]">▾</span>
            </button>

            {/* Backup / Export */}
            <button
              type="button"
              onClick={() => setShowBackup(true)}
              title="Backup & restore collection"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/70 hover:border-sky-400/50 hover:bg-slate-800 text-xs text-slate-300 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>💾</span>
              <span className="hidden md:inline font-medium">Backup</span>
            </button>

            {/* Auth / Cloud Sync */}
            {!isFirebaseConfigured ? (
              <span
                title="Set VITE_FIREBASE_* in .env.local to enable cloud sync"
                className="px-2 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[10px] text-slate-500 font-medium"
              >
                Offline
              </span>
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-900/80 border border-slate-700/70 hover:border-amber-400/50 transition-all"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full ring-1 ring-amber-400/40" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-sky-500 text-slate-950 text-[11px] font-extrabold flex items-center justify-center shadow">
                      {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-slate-500 text-[10px]">▾</span>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 z-20 w-60 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-3 animate-fade-in space-y-2">
                      <div className="border-b border-slate-800 pb-2">
                        <p className="text-xs font-bold text-slate-100 truncate">{user.displayName || 'Illumite'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <p className="text-[10px] font-medium text-emerald-400">Cloud Sync Active</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          void signOut();
                        }}
                        className="w-full py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-xs font-semibold text-rose-300 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={authLoading}
                onClick={() => void signIn()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <span>☁️</span>
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-200 animate-fade-in">
            <p className="text-[11px]">
              Sign-in notice: {authError}
              {authError.includes('popup-blocked') && ' — please allow pop-ups for this site and try again.'}
            </p>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss"
              className="text-rose-400 hover:text-rose-200 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Collection Stats Bar with Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/50">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <strong className="text-sky-300 font-bold">{stats.totalUniqueOwned.toLocaleString()}</strong> distinct
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <strong className="text-cyan-300 font-bold">{stats.totalCardsCount.toLocaleString()}</strong> copies
            </span>
            {stats.duplicatesCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <strong className="text-purple-300 font-bold">{stats.duplicatesCount.toLocaleString()}</strong> duplicates
              </span>
            )}
            {stats.wishlistCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1">
                <span className="text-amber-400 text-[10px]">★</span>
                <strong className="text-amber-300 font-bold">{stats.wishlistCount}</strong> wishlist
              </span>
            )}
          </div>

          {/* Collection Progress Glow */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-28 sm:w-36 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 rounded-full transition-all duration-500 shadow-sm shadow-emerald-400/40"
                style={{ width: `${Math.min(100, Math.max(0, stats.overallPercentage))}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 whitespace-nowrap">
              {stats.overallPercentage}% <span className="text-slate-500 font-normal">complete</span>
            </span>
          </div>
        </div>
      </div>

      {showProfiles && <ProfileManagerModal onClose={() => setShowProfiles(false)} />}
      {showBackup && <CollectionBackupModal onClose={() => setShowBackup(false)} />}
    </header>
  );
}

