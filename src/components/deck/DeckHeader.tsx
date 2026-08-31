import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDeckStore } from '../../store/deckStore';
import { useCollectionStore } from '../../store/collectionStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { isFirebaseConfigured } from '../../utils/firebase';
import { APP_VERSION } from '../../constants/version';
import { ProfileManagerModal } from '../collection/ProfileManagerModal';
import { PWAInstallModal } from '../common/PWAInstallModal';
import { OTAUpdateButton } from '../common/OTAUpdateButton';

function getSyncBadge(status: string, hasUser: boolean) {
  const currentStatus = hasUser ? status : 'idle';
  switch (currentStatus) {
    case 'syncing':
      return { text: `Syncing… (v${APP_VERSION})`, className: 'bg-sky-950/80 text-sky-300 border-sky-600/50', dot: 'bg-sky-400 animate-pulse' };
    case 'synced':
      return { text: `Cloud Active (v${APP_VERSION})`, className: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50', dot: 'bg-emerald-400' };
    case 'error':
      return { text: `Sync Error (v${APP_VERSION})`, className: 'bg-rose-950/80 text-rose-300 border-rose-600/50', dot: 'bg-rose-400' };
    default:
      return { text: `v${APP_VERSION}`, className: 'bg-slate-800/80 text-slate-400 border-slate-700/60', dot: 'bg-slate-500' };
  }
}

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

  const syncStatus = useDeckStore((s) => s.syncStatus);
  const loadUserDecksFromCloud = useDeckStore((s) => s.loadUserDecksFromCloud);
  const profiles = useCollectionStore((s) => s.profiles);
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const activeProfile = profiles[activeProfileId];

  const badge = getSyncBadge(syncStatus, !!user);
  const logoUrl = `${import.meta.env.BASE_URL}logo.jpeg`;

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
        {/* MOBILE LAYOUT (2 Rows: Top Identity & Actions, Bottom Sync & Deck Status) */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Row 1: Left Logo/Back + Right Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {isEditing && onBackToDecks ? (
                <button
                  type="button"
                  onClick={onBackToDecks}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/40 hover:border-[#c8b07b] text-slate-200 hover:text-[#dfc792] transition-all font-bold text-xs active:scale-95 shadow-sm min-h-[36px] shrink-0"
                >
                  <span>‹</span>
                  <span>Decks</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <img
                    src={logoUrl}
                    alt="Disney Lorcana TCG"
                    className="h-7 w-auto object-contain drop-shadow-[0_2px_10px_rgba(200,176,123,0.35)] shrink-0 select-none"
                  />
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#dfc792] px-1.5 py-0.5 rounded-lg bg-[#c8b07b]/15 border border-[#c8b07b]/30 shadow-sm shrink-0">
                    Decks
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <OTAUpdateButton variant="badge" />

              {/* Install PWA Button (Mobile) */}
              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  title="Install Lorcana Tracker App"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/40 hover:border-[#c8b07b] active:scale-95 text-xs text-[#dfc792] hover:text-[#f3e5c8] transition-all shadow-sm min-h-[36px] font-bold shrink-0"
                >
                  <span className="text-sm">📲</span>
                  <span className="hidden xs:inline">Install</span>
                </button>
              )}

              {/* Import / Export */}
              <button
                type="button"
                onClick={onOpenImportExport}
                title="Import & Export deck"
                className="p-2 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs text-slate-300 hover:text-[#dfc792] transition-all shadow-sm flex items-center justify-center min-h-[36px]"
              >
                <span className="text-sm">📥</span>
              </button>

              {/* Active Binder Picker */}
              <button
                type="button"
                onClick={() => setShowProfiles(true)}
                title="Select binder to compare missing cards"
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs transition-all shadow-sm group hover:text-[#dfc792] min-h-[36px]"
              >
                <span className="text-sm">{activeProfile?.icon ?? '📘'}</span>
                <span className="text-amber-400/80 text-[10px]">▾</span>
              </button>

              {/* Auth Button */}
              {isFirebaseConfigured ? (
                user ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-1 p-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] text-xs transition-all min-h-[36px]"
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
                      <span className="text-slate-400 text-[10px]">▾</span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#131627] border border-[#c8b07b]/40 shadow-2xl p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2 py-1.5 border-b border-[#c8b07b]/15">
                          <div className="text-xs font-black text-[#dfc792] truncate">{user.displayName || 'Illumite'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-300">
                          <span>App Version:</span>
                          <span className="font-mono font-bold text-[#dfc792]">v{APP_VERSION}</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-300">
                          <span>Cloud Status:</span>
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (user?.uid) {
                              await loadUserDecksFromCloud(user.uid);
                            }
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-850 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 border border-slate-800"
                        >
                          <span>🔄</span>
                          <span>Sync Decks Now</span>
                        </button>
                        <div className="pt-1">
                          <OTAUpdateButton variant="menu" />
                        </div>
                        {!isInstalled && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              handleInstallClick();
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl bg-[#1b2038] hover:bg-[#252c4d] border border-[#c8b07b]/40 text-xs font-semibold text-[#dfc792] transition-colors flex items-center gap-2"
                          >
                            <span>📲</span>
                            <span>Install App</span>
                          </button>
                        )}
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
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 min-h-[36px]"
                  >
                    <span>☁️</span>
                    <span>{authLoading ? '...' : 'Sign In'}</span>
                  </button>
                )
              ) : null}
            </div>
          </div>

          {/* Row 2: Sync Badge & Active Deck/Binder Info */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${badge.className}`}
              title={`App Version: v${APP_VERSION} • Status: ${badge.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              <span>{badge.text}</span>
            </span>

            {isEditing && deckName ? (
              <span className="text-xs font-bold text-[#dfc792] truncate max-w-[180px]">
                {deckName}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 truncate max-w-[170px]">
                Compare: <strong className="text-[#dfc792]">{activeProfile?.name ?? 'Binder'}</strong>
              </span>
            )}
          </div>
        </div>

        {/* DESKTOP / TABLET LAYOUT (Single Row) */}
        <div className="hidden sm:flex items-center justify-between gap-2.5">
          {/* Left: Logo or Back Button */}
          <div className="flex items-center gap-3 min-w-0">
            {isEditing && onBackToDecks ? (
              <button
                type="button"
                onClick={onBackToDecks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/40 hover:border-[#c8b07b] text-slate-200 hover:text-[#dfc792] transition-all font-bold text-xs sm:text-sm active:scale-95 shadow-sm min-h-[36px]"
              >
                <span>‹</span>
                <span>Decks</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 shrink-0">
                <img
                  src={logoUrl}
                  alt="Disney Lorcana TCG"
                  className="h-9 w-auto object-contain drop-shadow-[0_2px_10px_rgba(200,176,123,0.35)] shrink-0 select-none"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#dfc792] px-2 py-0.5 rounded-lg bg-[#c8b07b]/15 border border-[#c8b07b]/30 shadow-sm">
                    Deck Builder
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${badge.className}`}
                    title={`App Version: v${APP_VERSION} • Status: ${badge.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{badge.text}</span>
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
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Switch to Collection */}
            {onSwitchToCollection && (
              <button
                type="button"
                onClick={onSwitchToCollection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2038]/80 hover:bg-[#1b2038] border border-slate-700 hover:border-[#c8b07b]/60 active:scale-95 text-xs text-slate-300 hover:text-[#dfc792] transition-all shadow-sm min-h-[36px]"
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs transition-all shadow-sm group hover:text-[#dfc792] min-h-[36px]"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">
                {activeProfile?.icon ?? '📘'}
              </span>
              <span className="max-w-[140px] truncate font-bold text-slate-200">
                {activeProfile?.name ?? 'Binder'}
              </span>
              <span className="text-amber-400/80 text-[10px]">▾</span>
            </button>

            {/* OTA Update Button */}
            <OTAUpdateButton variant="badge" />

            {/* Install PWA */}
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                title="Install Lorcana Tracker App"
                className="flex p-2 px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/40 hover:border-[#c8b07b] active:scale-95 text-xs text-[#dfc792] hover:text-[#f3e5c8] transition-all shadow-sm items-center gap-1.5 min-h-[36px] group"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">📲</span>
                <span className="font-bold">Install</span>
              </button>
            )}

            {/* Import / Export */}
            <button
              type="button"
              onClick={onOpenImportExport}
              title="Import & Export deck"
              className="p-2 px-3 py-1.5 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] active:scale-95 text-xs text-slate-300 hover:text-[#dfc792] transition-all shadow-sm flex items-center gap-1.5 min-h-[36px]"
            >
              <span className="text-sm">📥</span>
              <span className="font-bold">Import / Export</span>
            </button>

            {/* Auth / Cloud Sync */}
            {isFirebaseConfigured ? (
              user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1b2038] border border-[#c8b07b]/30 hover:border-[#c8b07b] text-xs transition-all min-h-[36px]"
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
                    <span className="font-bold max-w-[100px] truncate text-slate-200">
                      {user.displayName?.split(' ')[0] ?? 'Cloud'}
                    </span>
                    <span className="text-slate-400 text-[10px]">▾</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#131627] border border-[#c8b07b]/40 shadow-2xl p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1.5 border-b border-[#c8b07b]/15">
                        <div className="text-xs font-black text-[#dfc792] truncate">{user.displayName || 'Illumite'}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-300">
                        <span>App Version:</span>
                        <span className="font-mono font-bold text-[#dfc792]">v{APP_VERSION}</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-300">
                        <span>Cloud Status:</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (user?.uid) {
                            await loadUserDecksFromCloud(user.uid);
                          }
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-850 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 border border-slate-800"
                      >
                        <span>🔄</span>
                        <span>Sync Decks Now</span>
                      </button>
                      <div className="pt-1">
                        <OTAUpdateButton variant="menu" />
                      </div>
                      {!isInstalled && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            handleInstallClick();
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl bg-[#1b2038] hover:bg-[#252c4d] border border-[#c8b07b]/40 text-xs font-semibold text-[#dfc792] transition-colors flex items-center gap-2"
                        >
                          <span>📲</span>
                          <span>Install App</span>
                        </button>
                      )}
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
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 min-h-[36px]"
                >
                  <span>☁️</span>
                  <span>{authLoading ? '...' : 'Sign In'}</span>
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
