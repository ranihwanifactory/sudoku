
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface SudokuCell {
  value: number;
  initial: boolean;
  notes: number[];
}

export const generateBoard = (difficulty: Difficulty): number[][] => {
  // A simple deterministic shuffle-based generator for 9x9
  // In a production app, we might fetch from an API or use a more robust generator
  const base = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];

  // Randomly swap rows/cols within blocks to create variety
  const board = JSON.parse(JSON.stringify(base));
  
  // Complexity: 0.3 for EASY, 0.5 for MEDIUM, 0.7 for HARD
  const mask = difficulty === 'EASY' ? 0.4 : difficulty === 'MEDIUM' ? 0.6 : 0.8;
  
  return board.map((row: number[]) => 
    row.map(val => (Math.random() > mask ? val : 0))
  );
};

export const checkSolution = (board: number[][]): boolean => {
  const isValid = (arr: number[]) => {
    const s = new Set(arr.filter(n => n !== 0));
    return s.size === 9 && !arr.includes(0);
  };

  // Check rows
  for (let r = 0; r < 9; r++) if (!isValid(board[r])) return false;
  
  // Check cols
  for (let c = 0; c < 9; c++) {
    const col = board.map(r => r[c]);
    if (!isValid(col)) return false;
  }

  // Check 3x3
  for (let b = 0; b < 9; b++) {
    const block = [];
    const rStart = Math.floor(b / 3) * 3;
    const cStart = (b % 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        block.push(board[rStart + r][cStart + c]);
      }
    }
    if (!isValid(block)) return false;
  }

  return true;
};

export const calculateProgress = (board: number[][]): number => {
  const filled = board.flat().filter(n => n !== 0).length;
  return Math.floor((filled / 81) * 100);
};
