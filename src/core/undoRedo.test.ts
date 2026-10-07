import {describe,it,expect} from 'vitest';
import {pushUndo,redoValue,undoValue,type UndoRedoHistory} from './undoRedo';

describe('undo/redo history',()=>{
  it('reverses and reapplies a sequence of selection snapshots',()=>{
    let history:UndoRedoHistory<number[]>={undo:[],redo:[]};
    history=pushUndo(history,[1]);
    const undone=undoValue(history,[1,2]);
    expect(undone?.value).toEqual([1]);
    const redone=redoValue(undone!.history,[1]);
    expect(redone?.value).toEqual([1,2]);
  });
  it('drops the redo branch after a new edit and caps history',()=>{
    const branched=pushUndo({undo:[[1]],redo:[[1,2]]},[1,3]);
    expect(branched.redo).toEqual([]);
    const capped=pushUndo({undo:Array.from({length:101},(_,i)=>i),redo:[]},102,100);
    expect(capped.undo).toHaveLength(100);
    expect(capped.undo[0]).toBe(2);
  });
});
