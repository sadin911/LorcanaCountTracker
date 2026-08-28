import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression tests for the write path that caused binder data loss in PokeCountTracker.
 *
 * A signed-in session boots like this:
 *   1. onAuthStateChanged fires / session restores, resetToGuest() initially puts guest profile into store.
 *   2. Firebase restores session, auth.currentUser becomes truthy.
 *   3. loadUserFromCloud() starts fetching real binders over the network.
 *
 * Between 2 and 3 completing, the store holds an empty guest binder while the user looks signed in.
 * Any edit in that window used to schedule a whole-document write, replacing the cloud binder with empty state.
 *
 * The rule these tests verify: nothing may be written to a user's cloud binder until that user's
 * binders have actually been read into memory (cloudLoadedUid === auth.currentUser.uid).
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

const { useCollectionStore } = await import('./collectionStore');

const UID = 'test-lorcana-user-uid';

function bootAsSignedInWithEmptyStore() {
  authMock.currentUser = { uid: UID };
  useCollectionStore.getState().resetToGuest();
}

describe('Lorcana collectionStore cloud write guard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setDocMock.mockClear();
    getDocsMock.mockClear();
    installMemoryStorage();
    authMock.currentUser = null;
  });

  it('does not push an empty binder to the cloud before cloud has been read', async () => {
    bootAsSignedInWithEmptyStore();

    const activeId = useCollectionStore.getState().activeProfileId;
    expect(Object.keys(useCollectionStore.getState().profiles[activeId].cards)).toHaveLength(0);

    // User taps a card while loadUserFromCloud is still in flight
    useCollectionStore.getState().incrementFinish('lorcana-set1-001', 'normal');
    await vi.advanceTimersByTimeAsync(2000);

    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('syncProfileToCloud is a no-op until the cloud load completes', async () => {
    bootAsSignedInWithEmptyStore();

    await useCollectionStore.getState().syncProfileToCloud(
      useCollectionStore.getState().activeProfileId
    );

    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('writes normally once the cloud load has completed', async () => {
    authMock.currentUser = { uid: UID };

    // Cloud has no binders yet: loadUserFromCloud seeds default one and marks cloudLoadedUid
    await useCollectionStore.getState().loadUserFromCloud(UID);
    setDocMock.mockClear();

    useCollectionStore.getState().incrementFinish('lorcana-set1-001', 'normal');
    await vi.advanceTimersByTimeAsync(2000);

    expect(setDocMock).toHaveBeenCalled();
  });

  it('signing out closes the gate again, preventing early writes in subsequent sessions', async () => {
    authMock.currentUser = { uid: UID };
    await useCollectionStore.getState().loadUserFromCloud(UID);
    setDocMock.mockClear();

    // Sign out or transient auth blip
    useCollectionStore.getState().resetToGuest();
    authMock.currentUser = { uid: 'another-user-uid' };

    useCollectionStore.getState().incrementFinish('lorcana-set1-001', 'normal');
    await vi.advanceTimersByTimeAsync(2000);

    expect(setDocMock).not.toHaveBeenCalled();
  });
});
