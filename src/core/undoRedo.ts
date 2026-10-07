export interface UndoRedoHistory<T> {
  undo: T[];
  redo: T[];
}

export function pushUndo<T>(history: UndoRedoHistory<T>, current: T, limit = Number.POSITIVE_INFINITY): UndoRedoHistory<T> {
  return { undo: [...history.undo, current].slice(-limit), redo: [] };
}

export function undoValue<T>(history: UndoRedoHistory<T>, current: T): { history: UndoRedoHistory<T>; value: T } | null {
  const value = history.undo.at(-1);
  if (value === undefined) return null;
  return { history: { undo: history.undo.slice(0, -1), redo: [...history.redo, current] }, value };
}

export function redoValue<T>(history: UndoRedoHistory<T>, current: T): { history: UndoRedoHistory<T>; value: T } | null {
  const value = history.redo.at(-1);
  if (value === undefined) return null;
  return { history: { undo: [...history.undo, current], redo: history.redo.slice(0, -1) }, value };
}
