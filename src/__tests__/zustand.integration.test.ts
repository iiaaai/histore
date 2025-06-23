import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { histore } from '../zustand';

describe('Zustand histore integration', () => {
  it('should record state changes and support undo/redo via temporal', () => {
    const useStore = create<any>()(histore((set: any) => ({ count: 0 })));

    expect(useStore.getState().count).toBe(0);

    useStore.setState({ count: 5 });
    expect(useStore.getState().count).toBe(5);

    useStore.getState().temporal.undo();
    expect(useStore.getState().count).toBe(0);

    useStore.getState().temporal.redo();
    expect(useStore.getState().count).toBe(5);
  });

  it('should support transaction APIs', () => {
    const useStore = create<any>()(histore((set: any) => ({ count: 0 })));

    useStore.setState({ count: 1 });
    expect(useStore.getState().count).toBe(1);

    const { temporal } = useStore.getState();
    temporal.beginTransaction({ name: 'txn1' });
    useStore.setState({ count: 3 });
    useStore.setState({ count: 6 });
    expect(useStore.getState().count).toBe(6);

    temporal.endTransaction();
    expect(useStore.getState().count).toBe(6);

    temporal.undo();
    expect(useStore.getState().count).toBe(1);

    temporal.redo();
    expect(useStore.getState().count).toBe(6);
  });
});
