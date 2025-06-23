import { describe, it, expect } from 'vitest';
import { HistoreCore } from '../core';

describe('HistoreCore Nested Structures and Order Preservation', () => {
  it('should handle nested object updates with undo/redo', () => {
    const core = new HistoreCore({
      user: { name: 'Alice', address: { city: 'NY', zip: '10001' } },
    });
    core.set((draft) => {
      draft.user.address.city = 'LA';
    });
    expect(core.exportState().present.user.address.city).toBe('LA');

    core.undo();
    expect(core.exportState().present.user.address.city).toBe('NY');

    core.redo();
    expect(core.exportState().present.user.address.city).toBe('LA');
  });

  it('should preserve array order when reversed and undone/redone', () => {
    const core = new HistoreCore({ list: [1, 2, 3, 4] });
    core.set((draft) => {
      draft.list.reverse();
    });
    expect(core.exportState().present.list).toEqual([4, 3, 2, 1]);

    core.undo();
    expect(core.exportState().present.list).toEqual([1, 2, 3, 4]);

    core.redo();
    expect(core.exportState().present.list).toEqual([4, 3, 2, 1]);
  });

  it('should batch multiple nested operations in a transaction and undo/redo correctly', () => {
    const initial = { nested: { arr: [1, 2], obj: { x: 1 } } };
    const core = new HistoreCore(initial);

    core.beginTransaction('batch nested ops');
    core.set((draft) => {
      draft.nested.arr.push(3);
    });
    core.set((draft) => {
      draft.nested.obj.x = 42;
    });
    core.set((draft) => {
      draft.nested.arr.splice(0, 1);
    });

    // Before commit, no history recorded but present updated
    expect(core.exportState().history.undoStack.length).toBe(0);
    expect(core.exportState().present.nested.arr).toEqual([2, 3]);
    expect(core.exportState().present.nested.obj.x).toBe(42);

    core.endTransaction();
    expect(core.exportState().history.undoStack.length).toBe(1);

    // Undo should revert to initial
    core.undo();
    expect(core.exportState().present).toEqual(initial);

    // Redo should apply batched changes
    core.redo();
    expect(core.exportState().present.nested.arr).toEqual([2, 3]);
    expect(core.exportState().present.nested.obj.x).toBe(42);
  });
});
