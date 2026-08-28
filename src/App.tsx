import { useEffect, useState } from 'react';
import { CollectionTracker } from './components/collection/CollectionTracker';
import { DeckManager } from './components/deck/DeckManager';
import { AdminPage } from './components/admin/AdminPage';
import { BottomNav, type AppMode } from './components/layout/BottomNav';
import { OTAUpdateBanner } from './components/common/OTAUpdateBanner';

function getModeFromURL(): AppMode {
  if (typeof window === 'undefined') return 'collection';
  const searchParams = new URLSearchParams(window.location.search);
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const modeParam = searchParams.get('mode')?.toLowerCase();

  if (
    searchParams.get('admin') === 'true' ||
    searchParams.get('admin') === '1' ||
    hash.includes('admin') ||
    modeParam === 'admin'
  ) {
    return 'admin';
  }
  if (
    path.includes('/deck') ||
    hash.includes('deck') ||
    modeParam === 'deck' ||
    searchParams.get('deck') === 'true'
  ) {
    return 'deck';
  }
  return 'collection';
}

function updateURLForMode(mode: AppMode) {
  const url = new URL(window.location.href);
  if (mode === 'admin') {
    url.searchParams.set('admin', 'true');
    url.searchParams.delete('mode');
  } else if (mode === 'deck') {
    url.searchParams.delete('admin');
    url.searchParams.set('mode', 'deck');
  } else {
    url.searchParams.delete('admin');
    url.searchParams.delete('mode');
  }
  window.history.pushState({ mode }, '', url.toString());
}

function App() {
  const [appMode, setAppMode] = useState<AppMode>(() => getModeFromURL());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => getModeFromURL() === 'admin');

  const handleSelectMode = (mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'admin') {
      setIsAdminUnlocked(true);
    }
    updateURLForMode(mode);
  };

  useEffect(() => {
    const handlePopState = () => {
      const current = getModeFromURL();
      setAppMode(current);
      if (current === 'admin') setIsAdminUnlocked(true);
    };

    // Secret shortcut for owner: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAppMode((prev) => {
          const next = prev === 'admin' ? 'collection' : 'admin';
          if (next === 'admin') setIsAdminUnlocked(true);
          updateURLForMode(next);
          return next;
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
      {/* Global OTA Update Notification Banner */}
      <OTAUpdateBanner />

      {/* View Content */}
      <div className="flex-1 pb-16">
        {appMode === 'admin' && <AdminPage />}
        {appMode === 'deck' && (
          <DeckManager onSwitchToCollection={() => handleSelectMode('collection')} />
        )}
        {appMode === 'collection' && (
          <CollectionTracker onSwitchToDeck={() => handleSelectMode('deck')} />
        )}
      </div>

      {/* Bottom Navigation */}
      {appMode !== 'admin' && (
        <BottomNav
          currentMode={appMode}
          onSelectMode={handleSelectMode}
          isAdmin={isAdminUnlocked}
        />
      )}
    </div>
  );
}

export default App;
