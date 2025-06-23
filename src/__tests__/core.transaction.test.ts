import { describe, it, expect } from 'vitest';
import { HistoreCore } from '../core';

describe('HistoreCore Transactions', () => {
  it('should buffer sets within a transaction and commit as one entry', () => {
    const core = new HistoreCore({ count: 0 });
    core.beginTransaction({ name: 'txn' });
    core.set((draft) => {
      draft.count += 1;
    });
    core.set((draft) => {
      draft.count += 2;
    });
    // before commit, history is empty
    expect(core.exportState().history.undoStack.length).toBe(0);
    // commit
    core.endTransaction();
    // after commit, one history entry
    expect(core.exportState().history.undoStack.length).toBe(1);
    // present state should be 3
    expect(core.exportState().present.count).toBe(3);

    // undo
    core.undo();
    expect(core.exportState().present.count).toBe(0);
  });

  it('should rollback transaction', () => {
    const core = new HistoreCore({ value: '' });
    core.beginTransaction();
    core.set((draft) => {
      draft.value = 'a';
    });
    core.set((draft) => {
      draft.value = 'b';
    });
    // rollback
    core.rollbackTransaction();
    // present should remain initial
    expect(core.exportState().present.value).toBe('');
    // history still empty
    expect(core.exportState().history.undoStack.length).toBe(0);
  });
});
