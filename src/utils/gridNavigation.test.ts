import { describe, expect, it } from 'vitest';
import { moveFocus } from './gridNavigation';

const size = { rowCount: 100, lastColIndex: 13, pageSize: 10 };
const at = (rowIndex: number, colIndex: number) => ({ rowIndex, colIndex });

describe('Keyboard focus movement', () => {
  it('moves one cell with the arrow keys', () => {
    expect(moveFocus('ArrowDown', false, at(5, 3), size)).toEqual(at(6, 3));
    expect(moveFocus('ArrowUp', false, at(5, 3), size)).toEqual(at(4, 3));
    expect(moveFocus('ArrowRight', false, at(5, 3), size)).toEqual(at(5, 4));
    expect(moveFocus('ArrowLeft', false, at(5, 3), size)).toEqual(at(5, 2));
  });

  it('stops at the edges', () => {
    expect(moveFocus('ArrowUp', false, at(0, 3), size)).toEqual(at(0, 3));
    expect(moveFocus('ArrowDown', false, at(99, 3), size)).toEqual(at(99, 3));
    expect(moveFocus('ArrowLeft', false, at(5, 0), size)).toEqual(at(5, 0));
    expect(moveFocus('ArrowRight', false, at(5, 13), size)).toEqual(at(5, 13));
  });

  it('jumps a page with PageUp / PageDown', () => {
    expect(moveFocus('PageDown', false, at(5, 3), size)).toEqual(at(15, 3));
    expect(moveFocus('PageDown', false, at(95, 3), size)).toEqual(at(99, 3));
    expect(moveFocus('PageUp', false, at(5, 3), size)).toEqual(at(0, 3));
  });

  it('goes to the row start / end with Home / End, and the grid corners with Ctrl', () => {
    expect(moveFocus('Home', false, at(5, 8), size)).toEqual(at(5, 1));
    expect(moveFocus('End', false, at(5, 8), size)).toEqual(at(5, 13));
    expect(moveFocus('Home', true, at(5, 8), size)).toEqual(at(0, 1));
    expect(moveFocus('End', true, at(5, 8), size)).toEqual(at(99, 13));
  });

  it('ignores other keys', () => {
    expect(moveFocus('a', false, at(5, 3), size)).toBeNull();
    expect(moveFocus('Enter', false, at(5, 3), size)).toBeNull();
  });
});
