import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import type { CollectionStats } from '../../types/collection';
import { isFirebaseConfigured } from '../../utils/firebase';
import { CollectionBackupModal } from './CollectionBackupModal';
import { ProfileManagerModal } from './ProfileManagerModal';
import { PWAInstallModal } from '../common/PWAInstallModal';
import { OTAUpdateButton } from '../common/OTAUpdateButton';

const SYNC_LABEL: Record<string, { text: string; className: string; dot: string }> = {
  idle: { text: 'Guest', className: 'bg-slate-800/80 text-slate-400 border-slate-700/60', dot: 'bg-slate-500' },
  syncing: { text: 'Syncing…', className: 'bg-sky-950/80 text-sky-300 border-sky-600/50', dot: 'bg-sky-400 animate-pulse' },
  synced: { text: 'Cloud Active', className: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50', dot: 'bg-emerald-400' },
  error: { text: 'Sync Error', className: 'bg-rose-950/80 text-rose-300 border-rose-600/50', dot: 'bg-rose-400' },
};

interface CollectionHeaderProps {
  stats: CollectionStats;
  onSwitchToDeck?: () => void;
}

export function CollectionHeader({ stats, onSwitchToDeck }: CollectionHeaderProps) {
  const [showProfiles, setShowProfiles] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { isInstalled, isIOS, canPromptDirectly, promptInstall } = usePWAInstall();

  const handleInstallClick = async () => {
    if (canPromptDirectly) {
      const outcome = await promptInstall();
      if (outcome === 'manual_instructions') {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

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

  const logoUrl = `${import.meta.env.BASE_URL}logo-br-2x-Sweb4xgr.png`;

  return (
    <header
      className="sticky top-0 z-40 border-b border-[#c8b07b]/20 bg-[#131627]/95 backdrop-blur-xl shadow-lg shadow-black/50"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Signature Disney Lorcana Gold Filigree Header Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c8b07b] to-transparent" />

      <div className="px-3 sm:px-6 py-2 sm:py-2.5 space-y-2 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-2.5">
          {/* Logo & Identity */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <img
              src={logoUrl}
              alt="Disney Lorcana TCG"
              className="h-6 sm:h-9 w-auto object-contain drop-shadow-[0_2px_10px_rgba(200,176,123,0.35)] shrink-0 select-none"
            />
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-[#dfc792] px-1.5 sm:px-2 py-0.5 rounded-lg bg-[#c8b07b]/15 border border-[#c8b07b]/30 shadow-sm">
                Tracker
              </span>
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${badge.className}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.text}
              </span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Switch to Deck Builder (Hidden on mobile as BottomNav has it) */}
            {onSwitchToDeck && (
              <button
                type="button"
                onClick={onSwitchToDeck}
                title="Open Deck Builder"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1b2038] to-[#252c4d] hover:from-[#252c4d] hover:to-[#313962] border border-[#c8b07b]/40 hover:border-[#c8b07b] active:scale-95 text-xs text-[#dfc792] hover:text-[#f3e5c8] transition-all shadow-sm min-h-[36px] font-bold group"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">🃏</span>
                <span>Decks</span>
              </button>
            )}

            {/* Profile Picker */}
            <button
              type="button"
              onClick={() => setShowProfiles(true)}
              title={`Active Binder: ${activeProfile?.name ?? 'Binder'}`}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs transition-all shadow-sm group hover:text-[#dfc792] min-h-[36px]"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">{activeProfile?.icon ?? '📘'}</span>
              <span className="hidden sm:inline max-w-[120px] truncate font-bold text-slate-200">
                {activeProfile?.name ?? 'Binder'}
              </span>
              <span className="text-amber-400/80 text-[10px]">▾</span>
            </button>

            {/* Backup / Export (Hidden on mobile to save space) */}
            <button
              type="button"
              onClick={() => setShowBackup(true)}
              title="Backup & restore collection"
              className="hidden sm:flex p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs text-slate-300 hover:text-[#dfc792] transition-all shadow-sm items-center gap-1.5 min-h-[36px]"
            >
              <span className="text-sm">💾</span>
              <span className="hidden md:inline font-bold">Backup</span>
            </button>

            {/* OTA Update Button */}
            <OTAUpdateButton variant="badge" />

            {/* Install PWA (Hidden on mobile to prevent clutter) */}
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                title="Install Lorcana Tracker App"
                className="hidden md:flex p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/40 hover:border-[#c8b07b] active:scale-95 text-xs text-[#dfc792] hover:text-[#f3e5c8] transition-all shadow-sm items-center gap-1.5 min-h-[36px] group"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">📲</span>
                <span className="font-bold">Install</span>
              </button>
            )}

            {/* Auth / Cloud Sync */}
            {!isFirebaseConfigured ? (
              <span
                title="Set VITE_FIREBASE_* in .env.local to enable cloud sync"
                className="px-2 py-1 rounded-xl bg-[#1b2038]/60 border border-[#c8b07b]/20 text-[10px] text-slate-400 font-medium flex items-center min-h-[36px]"
              >
                Offline
              </span>
            ) : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 transition-all min-h-[36px]"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full ring-1 ring-[#c8b07b]" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#dfc792] to-[#c8b07b] text-[#131627] text-xs font-extrabold flex items-center justify-center shadow">
                      {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-slate-400 text-[10px]">▾</span>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 z-50 w-60 rounded-2xl border border-[#c8b07b]/30 bg-[#1b2038]/95 backdrop-blur-xl shadow-2xl p-3 animate-fade-in space-y-2">
                      <div className="border-b border-slate-700/60 pb-2">
                        <p className="text-xs font-bold text-slate-100 truncate">{user.displayName || 'Illumite'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <p className="text-[10px] font-medium text-emerald-400">Cloud Sync Active</p>
                        </div>
                      </div>
                      
                      <div className="pt-1">
                        <OTAUpdateButton variant="menu" />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          void signOut();
                        }}
                        className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-xs font-semibold text-rose-300 transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#dfc792] via-[#c8b07b] to-[#b39552] hover:brightness-110 active:scale-95 text-[#131627] text-xs font-extrabold transition-all shadow-md shadow-[#c8b07b]/20 disabled:opacity-50 min-h-[40px] sm:min-h-[36px]"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#c8b07b]/15">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#1b2038]/90 border border-[#c8b07b]/20 text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#dfc792]" />
              <strong className="text-[#dfc792] font-bold">{stats.totalUniqueOwned.toLocaleString()}</strong> distinct
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#1b2038]/90 border border-[#c8b07b]/20 text-slate-300 flex items-center gap-1.5">
              <strong className="text-slate-100 font-bold">{stats.totalCardsCount.toLocaleString()}</strong> copies
            </span>
            {stats.duplicatesCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#1b2038]/90 border border-[#c8b07b]/20 text-slate-300 flex items-center gap-1.5">
                <strong className="text-amber-300 font-bold">{stats.duplicatesCount.toLocaleString()}</strong> dupes
              </span>
            )}
            {stats.wishlistCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#1b2038]/90 border border-[#c8b07b]/20 text-[#dfc792] flex items-center gap-1.5">
                ★ <strong>{stats.wishlistCount}</strong> wishlist
              </span>
            )}
          </div>

          {/* Collection Progress Glow */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-28 sm:w-36 h-2.5 bg-[#131627] rounded-full overflow-hidden border border-[#c8b07b]/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#b39552] via-[#c8b07b] to-[#dfc792] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(200,176,123,0.5)]"
                style={{ width: `${Math.min(100, Math.max(0, stats.overallPercentage))}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-[#dfc792] whitespace-nowrap">
              {stats.overallPercentage}% <span className="text-slate-400 font-normal">complete</span>
            </span>
          </div>
        </div>
      </div>

      {showProfiles && <ProfileManagerModal onClose={() => setShowProfiles(false)} />}
      {showBackup && <CollectionBackupModal onClose={() => setShowBackup(false)} />}
      {showInstallModal && (
        <PWAInstallModal
          onClose={() => setShowInstallModal(false)}
          onDirectInstall={async () => {
            await promptInstall();
            setShowInstallModal(false);
          }}
          canPromptDirectly={canPromptDirectly}
          isIOS={isIOS}
        />
      )}
    </header>
  );
}

