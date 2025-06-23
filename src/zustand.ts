import { StateCreator } from 'zustand';
import { HistoreCore, HistoryEntry, FullHistoreState } from './core';

export interface HistoreApi<T extends object> {
  undo: () => void;
  redo: () => void;
  beginTransaction: (option?: any) => void;
  endTransaction: () => void;
  rollbackTransaction: () => void;
  clearHistory: () => void;
  exportState: () => FullHistoreState<T>;
  importState: (fullState: FullHistoreState<T>) => void;
  readonly undoStack: Readonly<HistoryEntry[]>;
  readonly redoStack: Readonly<HistoryEntry[]>;
}

export function histore<T extends object>(
  config: StateCreator<T, [], []>
): StateCreator<T & { temporal: HistoreApi<T> }, [], []> {
  return (set, get, api) => {
    const core = new HistoreCore<T>({} as T);

    const wrappedSet = (fn: (draft: T) => void, option?: any) => {
      core.set(fn, option);
      set(core.exportState().present);
    };

    const userSlice = config(wrappedSet as any, get, api);

    core.importState({
      present: userSlice,
      history: { undoStack: [], redoStack: [] },
    });

    api.setState = (partial, replace) => {
      const producer =
        typeof partial === 'function'
          ? partial
          : (state: T) => ({ ...state, ...partial });
      wrappedSet(producer as (draft: T) => void);
    };

    const temporalApi: HistoreApi<T> = {
      undo: () => {
        core.undo();
        set(core.exportState().present);
      },
      redo: () => {
        core.redo();
        set(core.exportState().present);
      },
      beginTransaction: (option?: any) => core.beginTransaction(option),
      endTransaction: () => {
        core.endTransaction();
        set(core.exportState().present);
      },
      rollbackTransaction: () => {
        core.rollbackTransaction();
        set(core.exportState().present);
      },
      clearHistory: () => core.clearHistory(),
      exportState: () => core.exportState(),
      importState: (fullState: FullHistoreState<T>) => {
        core.importState(fullState);
        set(core.exportState().present);
      },
      get undoStack() {
        return core.exportState().history.undoStack;
      },
      get redoStack() {
        return core.exportState().history.redoStack;
      },
    };

    return {
      ...userSlice,
      temporal: temporalApi,
    };
  };
}
