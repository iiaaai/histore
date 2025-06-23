import { enablePatches, Patch, applyPatches, produceWithPatches } from 'immer';

// Enable Immer patches plugin
enablePatches();

export interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
  option?: any;
}

export interface FullHistoreState<T extends object> {
  present: T;
  history: {
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
  };
}

/**
 * HistoreCore manages state history for undo/redo operations.
 */
export class HistoreCore<T extends object> {
  private present: T;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private isTransactionInProgress = false;
  private transactionPatches: Patch[] = [];
  private transactionInversePatches: Patch[] = [];
  private transactionOption?: any;

  constructor(initialState: T) {
    this.present = initialState;
  }

  set(producer: (draft: T) => void, option?: any): void {
    const [nextState, patches, inversePatches] = produceWithPatches(
      this.present,
      producer
    );
    if (this.isTransactionInProgress) {
      // accumulate patches
      this.transactionPatches.push(...patches);
      this.transactionInversePatches.unshift(...inversePatches);
      if (option) this.transactionOption = option;
    } else {
      this.undoStack.push({ patches, inversePatches, option });
      this.redoStack = [];
    }
    this.present = nextState;
  }

  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;
    this.redoStack.push(entry);
    this.present = applyPatches(this.present, entry.inversePatches);
  }

  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;
    this.undoStack.push(entry);
    this.present = applyPatches(this.present, entry.patches);
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
  /**
   * Start a transaction. All subsequent set calls are buffered.
   */
  beginTransaction(option?: any): void {
    if (this.isTransactionInProgress) return;
    this.isTransactionInProgress = true;
    this.transactionPatches = [];
    this.transactionInversePatches = [];
    this.transactionOption = option;
  }
  /**
   * Commit transaction as single history entry.
   */
  endTransaction(): void {
    if (!this.isTransactionInProgress) return;
    if (this.transactionPatches.length) {
      this.undoStack.push({
        patches: this.transactionPatches,
        inversePatches: this.transactionInversePatches,
        option: this.transactionOption,
      });
      this.redoStack = [];
    }
    this.isTransactionInProgress = false;
    this.transactionPatches = [];
    this.transactionInversePatches = [];
    this.transactionOption = undefined;
  }
  /**
   * Rollback buffered transaction changes.
   */
  rollbackTransaction(): void {
    if (!this.isTransactionInProgress) return;
    // apply inverse patches to revert
    this.present = applyPatches(this.present, this.transactionInversePatches);
    this.isTransactionInProgress = false;
    this.transactionPatches = [];
    this.transactionInversePatches = [];
    this.transactionOption = undefined;
  }

  exportState(): FullHistoreState<T> {
    return {
      present: this.present,
      history: {
        undoStack: this.undoStack.slice(),
        redoStack: this.redoStack.slice(),
      },
    };
  }

  importState(state: FullHistoreState<T>): void {
    this.present = state.present;
    this.undoStack = state.history.undoStack.slice();
    this.redoStack = state.history.redoStack.slice();
  }
}
