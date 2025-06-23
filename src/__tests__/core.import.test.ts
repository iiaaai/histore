import { describe, it, expect } from 'vitest';
import { HistoreCore } from '../core';

describe('HistoreCore Export and Import State', () => {
  it('should export full state and import it correctly', () => {
    const initial = { a: 1, nested: { b: 2 } };
    const core1 = new HistoreCore(initial);
    core1.set(
      (draft) => {
        draft.a = 10;
      },
      { name: 'update a' }
    );
    core1.beginTransaction({ name: 'txn1' });
    core1.set((draft) => {
      draft.nested.b = 20;
    });
    core1.set((draft) => {
      draft.a = 100;
    });
    core1.endTransaction();

    // Capture snapshot
    const snapshot = core1.exportState();
    // Validate snapshot structure
    expect(snapshot.present).toEqual({ a: 100, nested: { b: 20 } });
    expect(snapshot.history.undoStack.length).toBe(2);
    // First entry: update a, second: transaction
    expect(snapshot.history.undoStack[0].option.name).toBe('update a');
    expect(snapshot.history.undoStack[1].option.name).toBe('txn1');

    // Import into new core
    const core2 = new HistoreCore(initial);
    core2.importState(snapshot);
    // State and history should match
    expect(core2.exportState()).toEqual(snapshot);
    // Undo twice should restore original
    core2.undo(); // transaction undo
    core2.undo(); // single undo
    expect(core2.exportState().present).toEqual(initial);
  });

  it('should handle exporting and importing empty history', () => {
    const core = new HistoreCore({ x: 5 });

    const snapshot = core.exportState();
    expect(snapshot.history.undoStack).toHaveLength(0);
    expect(snapshot.history.redoStack).toHaveLength(0);

    const core2 = new HistoreCore({ x: 0 });
    core2.importState(snapshot);
    expect(core2.exportState().present).toEqual({ x: 5 });
    expect(core2.exportState().history.undoStack).toHaveLength(0);
  });
});
