import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured, logOut, signInWithGoogle } from '../utils/firebase';
import { useCollectionStore } from './collectionStore';
import { useDeckStore } from './deckStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // No Firebase means no auth callback will ever arrive, so don't spin forever.
  user: null,
  loading: isFirebaseConfigured,
  error: null,

  signIn: async () => {
    set({ error: null });
    try {
      const user = await signInWithGoogle();
      set({ user });
      return user;
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        set({ error: err?.message ?? 'Sign-in failed' });
      }
      return null;
    }
  },

  signOut: async () => {
    await logOut();
    set({ user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

let initialized = false;

/**
 * Registered explicitly from main.tsx rather than inside the store initializer.
 * Doing it at module-import time (as the Pokemon app does) races the collection
 * store's own load on a fast sign-out/sign-in.
 */
export function initAuth() {
  if (initialized || !auth) return;
  initialized = true;

  onAuthStateChanged(auth, (user) => {
    const previous = useAuthStore.getState().user;
    useAuthStore.setState({ user, loading: false, error: null });

    if (user) {
      void useCollectionStore.getState().loadUserFromCloud(user.uid);
      void useDeckStore.getState().loadUserDecksFromCloud(user.uid);
    } else if (previous) {
      // Only reset on an actual sign-out, not on the initial "no user" callback,
      // which would otherwise discard guest state loaded a moment earlier.
      useCollectionStore.getState().resetToGuest();
      useDeckStore.getState().resetToGuestDecks();
    }
  });
}

