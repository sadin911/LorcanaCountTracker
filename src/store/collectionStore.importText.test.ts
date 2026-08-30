import { describe, it, expect, beforeEach } from 'vitest';
import { useCollectionStore } from './collectionStore';

describe('useCollectionStore importCollectionText', () => {
  beforeEach(() => {
    useCollectionStore.getState().resetToGuest();
  });

  it('imports cards in merge mode into active binder', () => {
    const input = `
Set13
1,3
20,5
21
`;
    const result = useCollectionStore.getState().importCollectionText(input, { mode: 'merge' });

    expect(result.success).toBe(true);
    expect(result.cardsImportedCount).toBe(9);
    expect(result.distinctCardsCount).toBe(3);
    expect(result.setsFound).toEqual(['13']);

    const activeProfile =
      useCollectionStore.getState().profiles[useCollectionStore.getState().activeProfileId];
    expect(activeProfile.cards['13-1']?.variants?.normal).toBe(3);
    expect(activeProfile.cards['13-20']?.variants?.normal).toBe(5);
    expect(activeProfile.cards['13-21']?.variants?.normal).toBe(1);

    // Import again in merge mode: Woody (13-1) + 2 copies = 5 total
    const result2 = useCollectionStore.getState().importCollectionText('Set13\n1,2', { mode: 'merge' });
    expect(result2.success).toBe(true);

    const updatedProfile =
      useCollectionStore.getState().profiles[useCollectionStore.getState().activeProfileId];
    expect(updatedProfile.cards['13-1']?.variants?.normal).toBe(5);
  });

  it('imports cards in replace mode', () => {
    const input = `
Set13
1,3
`;
    useCollectionStore.getState().importCollectionText(input, { mode: 'merge' });

    // Now replace count with 1
    const replaceResult = useCollectionStore
      .getState()
      .importCollectionText('Set13\n1,1', { mode: 'replace' });
    expect(replaceResult.success).toBe(true);

    const activeProfile =
      useCollectionStore.getState().profiles[useCollectionStore.getState().activeProfileId];
    expect(activeProfile.cards['13-1']?.variants?.normal).toBe(1);
  });

  it('supports foil finish import', () => {
    const input = `
Set13
1,4
`;
    const result = useCollectionStore
      .getState()
      .importCollectionText(input, { finish: 'foil' });
    expect(result.success).toBe(true);

    const activeProfile =
      useCollectionStore.getState().profiles[useCollectionStore.getState().activeProfileId];
    expect(activeProfile.cards['13-1']?.variants?.foil).toBe(4);
    expect(activeProfile.cards['13-1']?.variants?.normal).toBeUndefined();
  });
});
