import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import type { CollectionStats } from '../../types/collection';
import { isFirebaseConfigured } from '../../utils/firebase';
import { CollectionBackupModal } from './CollectionBackupModal';
import { ProfileManagerModal } from './ProfileManagerModal';

const SYNC_LABEL: Record<string, { text: string; className: string }> = {
  idle: { text: 'Guest', className: 'bg-slate-800 text-slate-400 border-slate-700' },
  syncing: { text: 'Syncing…', className: 'bg-sky-950/60 text-sky-300 border-sky-800' },
  synced: { text: 'Cloud', className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' },
  error: { text: 'Sync error', className: 'bg-rose-950/60 text-rose-300 border-rose-800' },
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
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="px-3 sm:px-4 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">🪄</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 whitespace-nowrap">
              Lorcana <span className="text-sky-400">Collection</span>
            </h1>
            <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${badge.className}`}>
              {badge.text}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowProfiles(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-600 text-xs"
            >
              <span>{activeProfile?.icon ?? '📘'}</span>
              <span className="hidden sm:inline max-w-[140px] truncate font-semibold text-slate-200">
                {activeProfile?.name ?? 'Binder'}
              </span>
              <span className="text-slate-500">▾</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBackup(true)}
              title="Backup & restore"
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-600 text-xs text-slate-300"
            >
              💾<span className="hidden md:inline ml-1">Backup</span>
            </button>

            {!isFirebaseConfigured ? (
              <span
                title="Set VITE_FIREBASE_* in .env.local to enable cloud sync"
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-500"
              >
                Local only
              </span>
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-600"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-sky-700 text-white text-[10px] font-bold flex items-center justify-center">
                      {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-slate-500 text-xs">▾</span>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-1 z-20 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-2 animate-fade-in">
                      <p className="px-2 text-xs font-bold text-slate-100 truncate">{user.displayName}</p>
                      <p className="px-2 text-[10px] text-slate-500 truncate">{user.email}</p>
                      <p className="px-2 mt-1 text-[10px] text-emerald-400">Cloud sync is on</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          void signOut();
                        }}
                        className="mt-2 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-xs font-bold text-slate-200"
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-slate-200 disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84a10.13 10.13 0 0 1-4.4 6.65v5.52h7.11c4.16-3.83 6.57-9.47 6.57-16.18z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 46c5.94 0 10.93-1.97 14.57-5.32l-7.11-5.52c-1.97 1.32-4.49 2.1-7.46 2.1-5.74 0-10.6-3.87-12.34-9.08H4.34v5.7A22 22 0 0 0 24 46z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M11.66 28.18a13.2 13.2 0 0 1 0-8.36v-5.7H4.34a22 22 0 0 0 0 19.76l7.32-5.7z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.98 29.93 1 24 1A22 22 0 0 0 4.34 13.12l7.32 5.7C13.4 13.37 18.26 9.5 24 9.5z"
                  />
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div className="flex items-start justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-rose-950/50 border border-rose-800 animate-fade-in">
            <p className="text-[11px] text-rose-200">
              Sign-in failed: {authError}
              {/* Easily the most common cause, and invisible without saying so. */}
              {authError.includes('popup-blocked') && ' — allow pop-ups for this site and try again.'}
            </p>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss"
              className="shrink-0 text-rose-300 hover:text-rose-100 text-xs leading-none"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <strong className="text-sky-300">{stats.totalUniqueOwned.toLocaleString()}</strong> distinct
          </span>
          <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <strong className="text-cyan-300">{stats.totalCardsCount.toLocaleString()}</strong> copies
          </span>
          <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <strong className="text-emerald-300">{stats.overallPercentage}%</strong> complete
          </span>
          {stats.duplicatesCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <strong className="text-purple-300">{stats.duplicatesCount.toLocaleString()}</strong> duplicates
            </span>
          )}
          {stats.wishlistCount > 0 && (
            <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <strong className="text-amber-300">{stats.wishlistCount}</strong> wishlisted
            </span>
          )}
        </div>
      </div>

      {showProfiles && <ProfileManagerModal onClose={() => setShowProfiles(false)} />}
      {showBackup && <CollectionBackupModal onClose={() => setShowBackup(false)} />}
    </header>
  );
}
