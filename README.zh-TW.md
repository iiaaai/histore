# @iiaaai/histore

一個為 [Zustand](https://github.com/pmndrs/zustand) 設計的、輕量級的 Undo/Redo 及歷史管理中介軟體，基於 [Immer](https://github.com/immerjs/immer) 打造。

`@iiaaai/histore` 為您的 JavaScript 應用提供一個簡單而強大的狀態歷史管理方案。它以 Zustand 中介軟體的形式提供，帶來開箱即用的復原、重做、交易管理與狀態持久化功能。`histore` 利用 Immer 來確保高效且不可變的狀態更新。

## 功能特性

- **復原/重做 (Undo/Redo)**: 在狀態變更之間輕鬆地來回穿梭。
- **交易系統 (Transaction System)**: 將多個狀態更新捆綁成一個單一、不可分割的歷史紀錄。
- **交易命名 (Named Transactions)**: 為交易指定名稱，以利於偵錯和 UI 反饋 (例如："復原 '建立牆壁'")。
- **狀態持久化 (State Persistence)**: 匯出包含完整歷史的整個狀態，並能將其匯入，以實現工作階段的儲存與恢復。
- **TypeScript 優先**: 提供完整的型別定義，確保安全且可預測的開發體驗。
- **輕量且由 Immer 驅動**: 基於 Immer 構建，實現高效的不可變狀態更新。

## 為何選擇 Zustand 與 Immer？

- **Zustand**: 一個小巧、快速且可擴展的狀態管理解決方案。`histore` 作為中介軟體與之整合，讓您能輕易地為現有的 Zustand store 加上歷史管理功能。
- **Immer**: 簡化了不可變資料結構的操作。`histore` 在底層使用 Immer，讓您能撰寫更簡潔、更易讀的狀態更新邏輯。

## 安裝

```bash
npm install @iiaaai/histore zustand immer
# 或
yarn add @iiaaai/histore zustand immer
```

## 基本用法

將您的 Zustand store creator 函數用 `histore` 中介軟體包裹起來。它會為您的 store 增加一個名為 `temporal` 的屬性，其中包含了所有歷史管理的 API。

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
      <h1>計數: {count}</h1>
      <button onClick={increment}>增加</button>
      <button onClick={decrement}>減少</button>
      <hr />
      <button onClick={temporal.undo} disabled={!temporal.undoStack.length}>
        復原
      </button>
      <button onClick={temporal.redo} disabled={!temporal.redoStack.length}>
        重做
      </button>
    </div>
  );
}
```

## 使用交易 (Using Transactions)

當您希望將多個狀態變更組合成單一的復原/重做步驟時，交易就非常有用。例如，如果使用者執行了一個涉及數個狀態更新的複雜操作，您可以將它們包裝在一個交易中，這樣一次「復原」就能回復所有這些變更。

```typescript
function DrawingCanvas() {
  const { temporal, ...state } = useStore();

  const handleDrawComplexShape = () => {
    // 開始一個交易，並可選擇性地為操作命名
    temporal.beginTransaction({ name: '繪製複雜圖形' });

    try {
      // 多個狀態更新
      state.addShape('circle');
      state.setPosition({ x: 10, y: 20 });
      state.setColor('blue');

      // 所有更新成功後，提交交易
      temporal.endTransaction();
    } catch (error) {
      // 如果任何更新失敗，則回復整個交易
      console.error('繪製圖形失敗:', error);
      temporal.rollbackTransaction();
    }
  };

  return (
    <div>
      <button onClick={handleDrawComplexShape}>繪製複雜圖形</button>
      <button onClick={temporal.undo}>復原</button>
    </div>
  );
}
```

## API 參考

`histore` 中介軟體會為您的 store 注入一個 `temporal` 物件，其 API 如下：

- `temporal.undo()`: 回復到歷史紀錄中的上一個狀態。
- `temporal.redo()`: 重新應用一個已被復原的狀態變更。
- `temporal.beginTransaction(option?: any)`: 開始一個交易。後續所有狀態變更將被捆綁成單一歷史紀錄，直到 `endTransaction()` 被呼叫。`option` 參數可用於傳遞有關交易的任何詳細資訊，例如名稱。
- `temporal.endTransaction()`: 提交進行中的交易。
- `temporal.rollbackTransaction()`: 拋棄當前交易期間的所有變更，並回復到交易開始前的狀態。
- `temporal.clearHistory()`: 清除 undo 和 redo 的歷史堆疊。
- `temporal.exportState()`: 回傳一個可序列化的物件，包含當前狀態與完整的歷史堆疊。
- `temporal.importState(state)`: 使用提供的狀態物件，完全覆寫當前的 store 狀態與歷史。
- `temporal.undoStack`: 一個唯讀陣列，包含過去的歷史紀錄。
- `temporal.redoStack`: 一個唯讀陣列，包含未來 (已復原) 的歷史紀錄。

## 授權條款

MIT
