import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDeckStore } from '../../store/deckStore';
import { useCollectionStore } from '../../store/collectionStore';
import { isFirebaseConfigured } from '../../utils/firebase';
import { ProfileManagerModal } from '../collection/ProfileManagerModal';
import { OTAUpdateButton } from '../common/OTAUpdateButton';

const SYNC_LABEL: Record<string, { text: string; className: string; dot: string }> = {
  idle: { text: 'Guest', className: 'bg-slate-800/80 text-slate-400 border-slate-700/60', dot: 'bg-slate-500' },
  syncing: { text: 'Syncing…', className: 'bg-sky-950/80 text-sky-300 border-sky-600/50', dot: 'bg-sky-400 animate-pulse' },
  synced: { text: 'Cloud Active', className: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50', dot: 'bg-emerald-400' },
  error: { text: 'Sync Error', className: 'bg-rose-950/80 text-rose-300 border-rose-600/50', dot: 'bg-rose-400' },
};

interface Props {
  isEditing: boolean;
  deckName?: string;
  onBackToDecks?: () => void;
  onOpenImportExport: () => void;
  onSwitchToCollection?: () => void;
}

export function DeckHeader({
  isEditing,
  deckName,
  onBackToDecks,
  onOpenImportExport,
  onSwitchToCollection,
}: Props) {
  const [showProfiles, setShowProfiles] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);
  const clearError = useAuthStore((s) => s.clearError);

  const syncStatus = useDeckStore((s) => s.syncStatus);
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
          {/* Left: Logo or Back Button */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {isEditing && onBackToDecks ? (
              <button
                type="button"
                onClick={onBackToDecks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/40 hover:border-[#c8b07b] text-slate-200 hover:text-[#dfc792] transition-all font-bold text-xs sm:text-sm active:scale-95 shadow-sm"
              >
                <span>‹</span>
                <span>Decks</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <img
                  src={logoUrl}
                  alt="Disney Lorcana TCG"
                  className="h-7 sm:h-9 w-auto object-contain drop-shadow-[0_2px_10px_rgba(200,176,123,0.35)] shrink-0 select-none"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-[#dfc792] px-2 py-0.5 rounded-lg bg-[#c8b07b]/15 border border-[#c8b07b]/30 shadow-sm">
                    Deck Builder
                  </span>
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${badge.className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.text}
                  </span>
                </div>
              </div>
            )}

            {isEditing && deckName && (
              <div className="hidden md:flex items-center gap-2 min-w-0 border-l border-slate-700 pl-3">
                <span className="text-xs text-[#c8b07b]/70 font-semibold uppercase tracking-wider">Editing Deck:</span>
                <span className="text-sm font-black text-[#dfc792] truncate max-w-xs">{deckName}</span>
              </div>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Switch to Collection */}
            {onSwitchToCollection && (
              <button
                type="button"
                onClick={onSwitchToCollection}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2038]/80 hover:bg-[#1b2038] border border-slate-700 hover:border-[#c8b07b]/60 active:scale-95 text-xs text-slate-300 hover:text-[#dfc792] transition-all shadow-sm"
              >
                <span>📖</span>
                <span className="font-semibold">Collection</span>
              </button>
            )}

            {/* Active Binder Selector (for missing cards calculation) */}
            <button
              type="button"
              onClick={() => setShowProfiles(true)}
              title="Select binder to compare missing cards"
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs transition-all shadow-sm group hover:text-[#dfc792] min-h-[40px] sm:min-h-[36px]"
            >
              <span className="text-base sm:text-sm group-hover:scale-110 transition-transform">
                {activeProfile?.icon ?? '📘'}
              </span>
              <span className="hidden lg:inline max-w-[110px] truncate font-bold text-slate-200">
                {activeProfile?.name ?? 'Binder'}
              </span>
              <span className="text-amber-400/80 text-[10px]">▾</span>
            </button>

            {/* OTA Update Button */}
            <OTAUpdateButton variant="badge" />

            {/* Import / Export */}
            <button
              type="button"
              onClick={onOpenImportExport}
              title="Import & Export deck"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs text-slate-300 hover:text-[#dfc792] transition-all shadow-sm flex items-center gap-1.5 min-h-[40px] sm:min-h-[36px]"
            >
              <span className="text-base sm:text-sm">📥</span>
              <span className="hidden md:inline font-bold">Import / Export</span>
            </button>

            {/* Auth / Cloud Sync */}
            {isFirebaseConfigured ? (
              user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] text-xs transition-all min-h-[40px] sm:min-h-[36px]"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName ?? 'User'}
                        className="w-6 h-6 rounded-full ring-1 ring-[#c8b07b]/50"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#c8b07b]/20 border border-[#c8b07b]/50 flex items-center justify-center text-[10px] text-[#dfc792] font-bold">
                        {user.displayName?.[0] ?? user.email?.[0] ?? 'U'}
                      </div>
                    )}
                    <span className="hidden sm:inline font-bold max-w-[100px] truncate text-slate-200">
                      {user.displayName?.split(' ')[0] ?? 'Cloud'}
                    </span>
                    <span className="text-amber-400/80 text-[10px]">▾</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#131627] border border-[#c8b07b]/40 shadow-2xl p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1.5 border-b border-[#c8b07b]/15">
                        <div className="text-xs font-black text-[#dfc792] truncate">{user.displayName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-300">
                        <span>Cloud Status:</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="pt-1">
                        <OTAUpdateButton variant="menu" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-transparent hover:border-rose-800/40 text-xs font-semibold transition-all flex items-center gap-2"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn()}
                  disabled={authLoading}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 min-h-[40px] sm:min-h-[36px]"
                >
                  <span>☁️</span>
                  <span>{authLoading ? 'Signing in…' : 'Sync Cloud'}</span>
                </button>
              )
            ) : null}
          </div>
        </div>

        {authError && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs">
            <span>{authError}</span>
            <button onClick={clearError} className="text-rose-400 hover:text-rose-100 font-bold px-1">
              ✕
            </button>
          </div>
        )}
      </div>

      {showProfiles && <ProfileManagerModal onClose={() => setShowProfiles(false)} />}
    </header>
  );
}
