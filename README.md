# @iiaaai/histore

Lightweight undo/redo and history management middleware for [Zustand](https://github.com/pmndrs/zustand), built with [Immer](https://github.com/immerjs/immer).

`@iiaaai/histore` provides a simple, yet powerful, solution for managing state history in your JavaScript applications. It's delivered as a Zustand middleware, offering out-of-the-box undo, redo, transaction management, and state persistence capabilities. It leverages Immer to ensure efficient and immutable state updates.

## Features

- **Undo/Redo**: Effortlessly travel back and forth through state changes.
- **Transaction System**: Group multiple state updates into a single, atomic history entry.
- **Named Transactions**: Assign names to transactions for better debugging and UI feedback (e.g., "Undo 'Create Wall'").
- **State Persistence**: Export the entire state, including history, and import it back to save and restore sessions.
- **TypeScript First**: Fully typed for a safe and predictable development experience.
- **Lightweight & Immer-Powered**: Built on top of Immer for efficient and immutable state updates.

## Why Zustand and Immer?

- **Zustand**: A small, fast, and scalable state-management solution. `histore` integrates as middleware, making it easy to add history capabilities to your existing Zustand stores.
- **Immer**: Simplifies handling immutable data structures. `histore` uses Immer under the hood to let you write simpler, more readable state update logic.

## Installation

```bash
npm install @iiaaai/histore zustand immer
# or
yarn add @iiaaai/histore zustand immer
```

## Basic Usage

Wrap your Zustand store's creator function with the `histore` middleware. It will add a `temporal` property to your store, which contains all the history management APIs.

```typescript
import { create } from 'zustand';
import { histore } from '@iiaaai/histore';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useStore = create<MyState>()(
  histore((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
  }))
);

function App() {
  const { count, increment, decrement, temporal } = useStore();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <hr />
      <button onClick={temporal.undo} disabled={!temporal.undoStack.length}>
        Undo
      </button>
      <button onClick={temporal.redo} disabled={!temporal.redoStack.length}>
        Redo
      </button>
    </div>
  );
}
```

## Using Transactions

Transactions are useful when you want to group multiple state changes into a single undo/redo step. For example, if a user performs a complex action that involves several state updates, you can wrap them in a transaction so that a single "Undo" reverts all of those changes.

```typescript
function DrawingCanvas() {
  const { temporal, ...state } = useStore();

  const handleDrawComplexShape = () => {
    // Start a transaction with an optional name for the action
    temporal.beginTransaction({ name: 'Draw Complex Shape' });

    try {
      // Multiple state updates
      state.addShape('circle');
      state.setPosition({ x: 10, y: 20 });
      state.setColor('blue');

      // Commit the transaction once all updates are successful
      temporal.endTransaction();
    } catch (error) {
      // If any update fails, roll back the entire transaction
      console.error('Failed to draw shape:', error);
      temporal.rollbackTransaction();
    }
  };

  return (
    <div>
      <button onClick={handleDrawComplexShape}>Draw Complex Shape</button>
      <button onClick={temporal.undo}>Undo</button>
    </div>
  );
}
```

## API Reference

The `histore` middleware injects a `temporal` object into your store with the following API:

- `temporal.undo()`: Reverts to the previous state in the history.
- `temporal.redo()`: Re-applies a state change that was undone.
- `temporal.beginTransaction(option?: any)`: Starts a transaction. All subsequent state changes will be bundled into one history entry until `endTransaction()` is called. The `option` parameter can be used to pass any details about the transaction, such as a name.
- `temporal.endTransaction()`: Commits the ongoing transaction.
- `temporal.rollbackTransaction()`: Discards all changes made during the current transaction and reverts to the state before it began.
- `temporal.clearHistory()`: Clears both the undo and redo stacks.
- `temporal.exportState()`: Returns a serializable object containing the present state and the full history stack.
- `temporal.importState(state)`: Overwrites the current store state and history with the provided state object.
- `temporal.undoStack`: A read-only array of past history entries.
- `temporal.redoStack`: A read-only array of future (undone) history entries.

## License

MIT
