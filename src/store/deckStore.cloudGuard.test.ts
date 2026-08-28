import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression tests for deckStore cloud-write guards.
 *
 * Ensures decks are never overwritten by empty guest decks during auth initialization
 * before loadUserDecksFromCloud has completed.
 */

const setDocMock = vi.hoisted(() => vi.fn(async () => undefined));
const getDocsMock = vi.hoisted(() => vi.fn(async () => ({ empty: true, forEach: () => {} })));
const authMock = vi.hoisted(() => ({ currentUser: null as { uid: string } | null }));

vi.mock('firebase/firestore', () => ({
  doc: (...segments: unknown[]) => ({ path: segments.slice(1).join('/') }),
  collection: (...segments: unknown[]) => ({ path: segments.slice(1).join('/') }),
  setDoc: setDocMock,
  getDocs: getDocsMock,
  deleteDoc: vi.fn(async () => undefined),
}));

vi.mock('../utils/firebase', () => ({
  db: {},
  auth: authMock,
}));

function installMemoryStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  });
}

installMemoryStorage();

const { useDeckStore } = await import('./deckStore');

const UID = 'test-lorcana-deck-user-uid';

function bootAsSignedInWithEmptyDeckStore() {
  authMock.currentUser = { uid: UID };
  useDeckStore.getState().resetToGuestDecks();
}

describe('Lorcana deckStore cloud write guard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setDocMock.mockClear();
    getDocsMock.mockClear();
    installMemoryStorage();
    authMock.currentUser = null;
  });

  it('does not push guest decks to cloud before user decks have been loaded', async () => {
    bootAsSignedInWithEmptyDeckStore();

    const activeDeckId = useDeckStore.getState().activeDeckId;
    if (activeDeckId) {
      useDeckStore.getState().addCardToDeck(activeDeckId, 'lorcana-card-1', 4);
    }
    await vi.advanceTimersByTimeAsync(2000);

    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('syncDeckToCloud is a no-op before cloud load completes', async () => {
    bootAsSignedInWithEmptyDeckStore();

    const activeDeckId = useDeckStore.getState().activeDeckId;
    if (activeDeckId) {
      await useDeckStore.getState().syncDeckToCloud(activeDeckId);
    }

    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('writes normally once user decks have loaded from cloud', async () => {
    authMock.currentUser = { uid: UID };

    await useDeckStore.getState().loadUserDecksFromCloud(UID);
    setDocMock.mockClear();

    const activeDeckId = useDeckStore.getState().activeDeckId;
    if (activeDeckId) {
      useDeckStore.getState().addCardToDeck(activeDeckId, 'lorcana-card-1', 4);
    }
    await vi.advanceTimersByTimeAsync(2000);

    expect(setDocMock).toHaveBeenCalled();
  });

  it('signing out closes the gate again in deckStore', async () => {
    authMock.currentUser = { uid: UID };
    await useDeckStore.getState().loadUserDecksFromCloud(UID);
    setDocMock.mockClear();

    useDeckStore.getState().resetToGuestDecks();
    authMock.currentUser = { uid: 'another-user-uid' };

    const activeDeckId = useDeckStore.getState().activeDeckId;
    if (activeDeckId) {
      useDeckStore.getState().addCardToDeck(activeDeckId, 'lorcana-card-1', 4);
    }
    await vi.advanceTimersByTimeAsync(2000);

    expect(setDocMock).not.toHaveBeenCalled();
  });
});
