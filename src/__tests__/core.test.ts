import { describe, it, expect } from 'vitest';
import { HistoreCore } from '../core';

describe('HistoreCore', () => {
  it('should perform set, undo, and redo operations', () => {
    const core = new HistoreCore({ count: 0 });
    core.set(
      (draft) => {
        draft.count += 1;
      },
      { name: 'increment' }
    );
    expect(core.exportState().present.count).toBe(1);

    core.undo();
    expect(core.exportState().present.count).toBe(0);

    core.redo();
    expect(core.exportState().present.count).toBe(1);
  });

  it('should clear history', () => {
    const core = new HistoreCore({ items: [] as number[] });
    core.set(
      (draft) => {
        draft.items.push(1);
      },
      { name: 'add item' }
    );
    expect(core.exportState().history.undoStack.length).toBe(1);

    core.clearHistory();
    expect(core.exportState().history.undoStack.length).toBe(0);
    expect(core.exportState().history.redoStack.length).toBe(0);
  });

  it('should export and import state with history', () => {
    const core1 = new HistoreCore({ value: 'a' });
    core1.set(
      (draft) => {
        draft.value = 'b';
      },
      { name: 'change to b' }
    );
    const snapshot = core1.exportState();

    const core2 = new HistoreCore({ value: 'a' });
    core2.importState(snapshot);
    expect(core2.exportState().present.value).toBe('b');
    expect(core2.exportState().history.undoStack.length).toBe(1);
  });
});
