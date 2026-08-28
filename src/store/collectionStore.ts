import { create } from 'zustand';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import type { FinishKey } from '../types/card';
import type {
  CardCondition,
  CollectionCardEntry,
  CollectionFilters,
  CollectionProfile,
  FinishCount,
  SyncStatus,
} from '../types/collection';
import { totalCopies } from '../types/collection';

const DEFAULT_PROFILE_ID = 'default-main-binder';
const GUEST_STORAGE_KEY = 'lorcana_guest_profiles_v1';
const USER_CACHE_KEY_PREFIX = 'lorcana_user_cache_';
const FILTERS_STORAGE_KEY = 'lorcana_collection_filters_v1';
const BACKUP_VERSION = '1.0.0';
const SAVE_DEBOUNCE_MS = 600;

export const DEFAULT_COLLECTION_FILTERS: CollectionFilters = {
  selectedSet: 'ALL',
  selectedStory: 'ALL',
  selectedCharacter: 'ALL',
  statusFilter: 'all',
  search: '',
  selectedInk: 'ALL',
  selectedCost: 'ALL',
  selectedInkwell: 'ALL',
  selectedType: 'ALL',
  selectedRarity: 'ALL',
  selectedClassification: 'ALL',
  sortBy: 'number',
  sortOrder: 'asc',
  showFullColor: true,
  cardZoom: 'normal',
  customColumns: 6,
};

function createDefaultProfile(): CollectionProfile {
  const now = Date.now();
  return {
    id: DEFAULT_PROFILE_ID,
    name: 'My Main Binder',
    icon: '📘',
    cards: {},
    createdAt: now,
    updatedAt: now,
  };
}

function loadInitialFilters(): CollectionFilters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) {
      // Defaults underneath the parsed value, so adding a filter field later
      // stays backward-compatible with saved state.
      return { ...DEFAULT_COLLECTION_FILTERS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_COLLECTION_FILTERS };
}

function loadGuestState(): { profiles: Record<string, CollectionProfile>; activeProfileId: string } {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.profiles && Object.keys(parsed.profiles).length) {
        return {
          profiles: parsed.profiles,
          activeProfileId: parsed.activeProfileId ?? Object.keys(parsed.profiles)[0],
        };
      }
    }
  } catch {}
  const fresh = createDefaultProfile();
  return { profiles: { [fresh.id]: fresh }, activeProfileId: fresh.id };
}

interface CollectionState {
  profiles: Record<string, CollectionProfile>;
  activeProfileId: string;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;

  filters: CollectionFilters;
  setFilters: (filters: Partial<CollectionFilters>) => void;
  resetFilters: () => void;

  createProfile: (name: string, icon?: string) => string;
  switchProfile: (profileId: string) => void;
  renameProfile: (profileId: string, name: string) => void;
  deleteProfile: (profileId: string) => Promise<void>;

  setFinishCount: (cardId: string, finish: FinishKey, count: number) => void;
  incrementFinish: (cardId: string, finish: FinishKey) => void;
  decrementFinish: (cardId: string, finish: FinishKey) => void;
  toggleWishlist: (cardId: string) => void;
  setCardDetails: (cardId: string, details: { condition?: CardCondition; note?: string }) => void;
  clearCard: (cardId: string) => void;

  loadUserFromCloud: (uid: string) => Promise<boolean>;
  syncProfileToCloud: (profileId: string) => Promise<void>;
  uploadLocalProfilesToCloud: (uid: string) => Promise<void>;
  resetToGuest: () => void;

  exportCollectionJSON: () => string;
  importCollectionJSON: (jsonString: string) => { success: boolean; message: string };
}

// One debounce timer PER BINDER. A single shared timer (as in the Pokemon app)
// drops the earlier binder's cloud write when you edit two binders in quick
// succession.
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Persist after every mutation. Signed-in users get an instant localStorage
 * cache plus a debounced Firestore write; guests get localStorage only.
 */
function triggerSave(get: () => CollectionState, profileId: string) {
  const state = get();
  const user = auth?.currentUser;
  const payload = JSON.stringify({ profiles: state.profiles, activeProfileId: state.activeProfileId });

  try {
    localStorage.setItem(user ? `${USER_CACHE_KEY_PREFIX}${user.uid}` : GUEST_STORAGE_KEY, payload);
  } catch {}

  if (!user) return;

  const existing = saveTimers.get(profileId);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    profileId,
    setTimeout(() => {
      saveTimers.delete(profileId);
      get().syncProfileToCloud(profileId);
    }, SAVE_DEBOUNCE_MS)
  );
}

/** Blank entry for a card not yet in the binder. */
function emptyEntry(cardId: string): CollectionCardEntry {
  return { cardId, variants: {}, updatedAt: Date.now() };
}

/**
 * Write an entry back into a profile's card map, deleting it outright when it
 * carries no information. Keeps documents small and, because we now write full
 * documents rather than merges, actually removes cleared cards from Firestore.
 */
function putEntry(
  cards: Record<string, CollectionCardEntry>,
  cardId: string,
  entry: CollectionCardEntry
): Record<string, CollectionCardEntry> {
  const next = { ...cards };
  const isEmpty = totalCopies(entry.variants) === 0 && !entry.isWishlist && !entry.note;
  if (isEmpty) delete next[cardId];
  else next[cardId] = { ...entry, updatedAt: Date.now() };
  return next;
}

/** Drop zero-valued finishes so they never reach Firestore. */
function pruneVariants(variants: FinishCount): FinishCount {
  const out: FinishCount = {};
  for (const [k, v] of Object.entries(variants)) {
    const n = Number(v) || 0;
    if (n > 0) out[k as FinishKey] = n;
  }
  return out;
}

const initialGuest = loadGuestState();

export const useCollectionStore = create<CollectionState>((set, get) => ({
  profiles: initialGuest.profiles,
  activeProfileId: initialGuest.activeProfileId,
  syncStatus: 'idle',
  lastSyncedAt: null,

  filters: loadInitialFilters(),

  setFilters: (patch) => {
    const next = { ...get().filters, ...patch };
    set({ filters: next });
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  },

  resetFilters: () => {
    const next = { ...DEFAULT_COLLECTION_FILTERS };
    set({ filters: next });
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  },

  createProfile: (name, icon) => {
    const id = `binder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const profile: CollectionProfile = {
      id,
      name: name.trim() || 'New Binder',
      icon: icon || '📁',
      cards: {},
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ profiles: { ...s.profiles, [id]: profile }, activeProfileId: id }));
    triggerSave(get, id);
    return id;
  },

  switchProfile: (profileId) => {
    if (!get().profiles[profileId]) return;
    set({ activeProfileId: profileId });
    triggerSave(get, profileId);
  },

  renameProfile: (profileId, name) => {
    const profile = get().profiles[profileId];
    if (!profile) return;
    set((s) => ({
      profiles: { ...s.profiles, [profileId]: { ...profile, name: name.trim() || profile.name, updatedAt: Date.now() } },
    }));
    triggerSave(get, profileId);
  },

  deleteProfile: async (profileId) => {
    const state = get();
    const ids = Object.keys(state.profiles);
    // Guard BEFORE any remote delete. The Pokemon app deletes the Firestore doc
    // first and only then refuses, which silently wipes your last binder from
    // the cloud while keeping it locally.
    if (ids.length <= 1 || !state.profiles[profileId]) return;

    const remaining = { ...state.profiles };
    delete remaining[profileId];
    const nextActive =
      state.activeProfileId === profileId ? Object.keys(remaining)[0] : state.activeProfileId;

    set({ profiles: remaining, activeProfileId: nextActive });
    triggerSave(get, nextActive);

    const user = auth?.currentUser;
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'binders', profileId));
      } catch (err) {
        console.warn('Failed to delete binder from cloud:', err);
      }
    }
  },

  setFinishCount: (cardId, finish, count) => {
    const { profiles, activeProfileId } = get();
    const profile = profiles[activeProfileId];
    if (!profile) return;

    const entry = profile.cards[cardId] ?? emptyEntry(cardId);
    const variants = pruneVariants({ ...entry.variants, [finish]: Math.max(0, Math.floor(count)) });
    const cards = putEntry(profile.cards, cardId, { ...entry, variants });

    set({ profiles: { ...profiles, [activeProfileId]: { ...profile, cards, updatedAt: Date.now() } } });
    triggerSave(get, activeProfileId);
  },

  incrementFinish: (cardId, finish) => {
    const profile = get().profiles[get().activeProfileId];
    const current = profile?.cards[cardId]?.variants?.[finish] ?? 0;
    get().setFinishCount(cardId, finish, current + 1);
  },

  decrementFinish: (cardId, finish) => {
    const profile = get().profiles[get().activeProfileId];
    const current = profile?.cards[cardId]?.variants?.[finish] ?? 0;
    get().setFinishCount(cardId, finish, Math.max(0, current - 1));
  },

  toggleWishlist: (cardId) => {
    const { profiles, activeProfileId } = get();
    const profile = profiles[activeProfileId];
    if (!profile) return;

    const entry = profile.cards[cardId] ?? emptyEntry(cardId);
    const cards = putEntry(profile.cards, cardId, { ...entry, isWishlist: !entry.isWishlist });

    set({ profiles: { ...profiles, [activeProfileId]: { ...profile, cards, updatedAt: Date.now() } } });
    triggerSave(get, activeProfileId);
  },

  setCardDetails: (cardId, details) => {
    const { profiles, activeProfileId } = get();
    const profile = profiles[activeProfileId];
    if (!profile) return;

    const entry = profile.cards[cardId] ?? emptyEntry(cardId);
    const next: CollectionCardEntry = { ...entry };
    if (details.condition !== undefined) next.condition = details.condition;
    if (details.note !== undefined) {
      const note = details.note.trim();
      if (note) next.note = note;
      else delete next.note;
    }
    // putEntry prunes: clearing a note on an unowned card removes the entry
    // instead of leaving an all-zero record in Firestore forever.
    const cards = putEntry(profile.cards, cardId, next);

    set({ profiles: { ...profiles, [activeProfileId]: { ...profile, cards, updatedAt: Date.now() } } });
    triggerSave(get, activeProfileId);
  },

  clearCard: (cardId) => {
    const { profiles, activeProfileId } = get();
    const profile = profiles[activeProfileId];
    if (!profile?.cards[cardId]) return;

    const cards = { ...profile.cards };
    delete cards[cardId];
    set({ profiles: { ...profiles, [activeProfileId]: { ...profile, cards, updatedAt: Date.now() } } });
    triggerSave(get, activeProfileId);
  },

  loadUserFromCloud: async (uid) => {
    if (!db) return false;
    set({ syncStatus: 'syncing' });

    // Show the per-user cache immediately, then reconcile with Firestore.
    let cachedActiveId: string | null = null;
    try {
      const cached = localStorage.getItem(`${USER_CACHE_KEY_PREFIX}${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.profiles && Object.keys(parsed.profiles).length) {
          cachedActiveId = parsed.activeProfileId ?? null;
          set({
            profiles: parsed.profiles,
            activeProfileId: parsed.activeProfileId ?? Object.keys(parsed.profiles)[0],
          });
        }
      }
    } catch {}

    try {
      const snap = await getDocs(collection(db, 'users', uid, 'binders'));

      if (!snap.empty) {
        const cloudProfiles: Record<string, CollectionProfile> = {};
        snap.forEach((d) => {
          if (d.id === 'lorcana_decks_vault' || d.id === '__lorcana_decks__') return;
          const data = d.data() as CollectionProfile;
          if (data?.id) cloudProfiles[data.id] = { ...data, cards: data.cards ?? {} };
        });

        // Keep the binder the user was last looking at, rather than whichever
        // document Firestore happened to return first.
        const activeProfileId =
          cachedActiveId && cloudProfiles[cachedActiveId] ? cachedActiveId : Object.keys(cloudProfiles)[0];

        set({ profiles: cloudProfiles, activeProfileId, syncStatus: 'synced', lastSyncedAt: Date.now() });
        try {
          localStorage.setItem(
            `${USER_CACHE_KEY_PREFIX}${uid}`,
            JSON.stringify({ profiles: cloudProfiles, activeProfileId })
          );
        } catch {}
        return true;
      }

      // Cloud is empty: migrate whatever the user built as a guest, else seed.
      const hasCards = Object.values(get().profiles).some((p) => Object.keys(p.cards || {}).length > 0);
      if (hasCards) {
        await get().uploadLocalProfilesToCloud(uid);
      } else {
        const fresh = createDefaultProfile();
        set({ profiles: { [fresh.id]: fresh }, activeProfileId: fresh.id });
        await setDoc(doc(db, 'users', uid, 'binders', fresh.id), fresh);
      }
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });
      return true;
    } catch (err) {
      console.error('Cloud load failed:', err);
      set({ syncStatus: 'error' });
      return false;
    }
  },

  syncProfileToCloud: async (profileId) => {
    const user = auth?.currentUser;
    const profile = get().profiles[profileId];
    if (!user || !db || !profile) return;

    set({ syncStatus: 'syncing' });
    try {
      // Full-document write, NOT { merge: true }: a merge never removes cards
      // deleted from the map, so cleared cards would linger in the cloud
      // forever. Trade-off: concurrent edits are last-write-wins per binder.
      await setDoc(doc(db, 'users', user.uid, 'binders', profileId), profile);
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });
    } catch (err) {
      console.error('Cloud sync failed:', err);
      set({ syncStatus: 'error' });
    }
  },

  uploadLocalProfilesToCloud: async (uid) => {
    if (!db) return;
    set({ syncStatus: 'syncing' });
    try {
      await Promise.all(
        Object.values(get().profiles).map((p) => setDoc(doc(db!, 'users', uid, 'binders', p.id), p))
      );
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });
    } catch (err) {
      console.error('Cloud upload failed:', err);
      set({ syncStatus: 'error' });
    }
  },

  resetToGuest: () => {
    for (const t of saveTimers.values()) clearTimeout(t);
    saveTimers.clear();
    const guest = loadGuestState();
    set({ ...guest, syncStatus: 'idle', lastSyncedAt: null });
  },

  exportCollectionJSON: () => {
    const state = get();
    return JSON.stringify(
      {
        version: BACKUP_VERSION,
        game: 'lorcana',
        exportedAt: new Date().toISOString(),
        activeProfileId: state.activeProfileId,
        profiles: state.profiles,
      },
      null,
      2
    );
  },

  importCollectionJSON: (jsonString) => {
    let data: any;
    try {
      data = JSON.parse(jsonString);
    } catch {
      return { success: false, message: 'That is not valid JSON.' };
    }

    if (!data?.profiles || typeof data.profiles !== 'object') {
      return { success: false, message: 'No "profiles" found — this does not look like a backup file.' };
    }
    // Checked now, while there is only one format to check against.
    if (data.version && data.version !== BACKUP_VERSION) {
      return {
        success: false,
        message: `Backup format ${data.version} is not supported (expected ${BACKUP_VERSION}).`,
      };
    }

    const profiles: Record<string, CollectionProfile> = {};
    for (const [id, raw] of Object.entries<any>(data.profiles)) {
      if (!raw?.name) continue;
      const cards: Record<string, CollectionCardEntry> = {};
      for (const [cardId, entry] of Object.entries<any>(raw.cards ?? {})) {
        const variants = pruneVariants(entry?.variants ?? {});
        if (totalCopies(variants) === 0 && !entry?.isWishlist && !entry?.note) continue;
        cards[cardId] = {
          cardId,
          variants,
          isWishlist: !!entry?.isWishlist,
          condition: entry?.condition,
          note: entry?.note,
          updatedAt: entry?.updatedAt ?? Date.now(),
        };
      }
      profiles[id] = {
        id,
        name: String(raw.name),
        description: raw.description,
        icon: raw.icon || '📘',
        cards,
        createdAt: raw.createdAt ?? Date.now(),
        updatedAt: raw.updatedAt ?? Date.now(),
      };
    }

    const ids = Object.keys(profiles);
    if (!ids.length) return { success: false, message: 'The backup contains no usable binders.' };

    const activeProfileId = profiles[data.activeProfileId] ? data.activeProfileId : ids[0];
    set({ profiles, activeProfileId });

    // Push every restored binder, not just the active one.
    const user = auth?.currentUser;
    if (user) {
      void get().uploadLocalProfilesToCloud(user.uid);
    } else {
      triggerSave(get, activeProfileId);
    }

    const cardTotal = ids.reduce((n, id) => n + Object.keys(profiles[id].cards).length, 0);
    return {
      success: true,
      message: `Restored ${ids.length} binder${ids.length === 1 ? '' : 's'} with ${cardTotal} card${cardTotal === 1 ? '' : 's'}.`,
    };
  },
}));
