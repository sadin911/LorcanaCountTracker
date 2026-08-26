import { useEffect, useState } from 'react';
import { CollectionTracker } from './components/collection/CollectionTracker';
import { AdminPage } from './components/admin/AdminPage';

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  const hasAdminQuery = searchParams.get('admin') === 'true' || searchParams.get('admin') === '1';
  const hasAdminHash = window.location.hash === '#/admin';
  return hasAdminQuery || hasAdminHash;
}

function App() {
  const [isAdminView, setIsAdminView] = useState(() => checkIsAdminRoute());

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(checkIsAdminRoute());
    };

    // Secret shortcut for owner: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminView((prev) => !prev);
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

  if (isAdminView) {
    return <AdminPage />;
  }

  return <CollectionTracker />;
}

export default App;
