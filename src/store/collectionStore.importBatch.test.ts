import { describe, it, expect, beforeEach } from 'vitest';
import { useCollectionStore } from './collectionStore';

describe('useCollectionStore importBatchCards', () => {
  beforeEach(() => {
    useCollectionStore.getState().resetToGuest();
  });

  it('imports batch cards in merge mode into active binder', () => {
    const list = [
      { cardId: '1-1', quantity: 2, finish: 'normal' as const },
      { cardId: '1-25', quantity: 3, finish: 'foil' as const },
      { cardId: '1-42', quantity: 1, finish: 'normal' as const },
    ];

    const result = useCollectionStore.getState().importBatchCards(list, { mode: 'merge' });
    expect(result.success).toBe(true);
    expect(result.cardsImportedCount).toBe(6);
    expect(result.distinctCardsCount).toBe(3);

    const activeProfile =
      useCollectionStore.getState().profiles[useCollectionStore.getState().activeProfileId];
    expect(activeProfile.cards['1-1']?.variants?.normal).toBe(2);
    expect(activeProfile.cards['1-25']?.variants?.foil).toBe(3);
    expect(activeProfile.cards['1-42']?.variants?.normal).toBe(1);

    // Merge more cards: 1-1 + 2 = 4
    const result2 = useCollectionStore.getState().importBatchCards(
      [{ cardId: '1-1', quantity: 2, finish: 'normal' as const }],
      { mode: 'merge' }
    );
    expect(result2.success).toBe(true);

    const updatedProfile =
      useCollectionStore.getState().profiles[useCollectionStore.getState().activeProfileId];
    expect(updatedProfile.cards['1-1']?.variants?.normal).toBe(4);
  });

  it('imports batch cards in replace mode', () => {
    useCollectionStore.getState().importBatchCards(
      [{ cardId: '1-1', quantity: 5, finish: 'normal' as const }],
      { mode: 'merge' }
    );

    const res = useCollectionStore.getState().importBatchCards(
      [{ cardId: '1-1', quantity: 1, finish: 'normal' as const }],
      { mode: 'replace' }
    );
    expect(res.success).toBe(true);

    const activeProfile =
      useCollectionStore.getState().profiles[useCollectionStore.getState().activeProfileId];
    expect(activeProfile.cards['1-1']?.variants?.normal).toBe(1);
  });

  it('returns failure if empty list is passed', () => {
    const res = useCollectionStore.getState().importBatchCards([]);
    expect(res.success).toBe(false);
  });
});
