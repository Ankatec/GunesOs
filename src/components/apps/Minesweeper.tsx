import React, { useState, useCallback } from "react";

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

const ROWS = 9;
const COLS = 9;
const MINES = 10;

const createBoard = (): CellState[][] => {
  const board: CellState[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      placed++;
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
            count++;
          }
        }
      }
      board[r][c].adjacentMines = count;
    }
  }

  return board;
};

const numberColors: Record<number, string> = {
  1: "#0000ff",
  2: "#008000",
  3: "#ff0000",
  4: "#000080",
  5: "#800000",
  6: "#008080",
  7: "#000000",
  8: "#808080",
};

const Minesweeper: React.FC = () => {
  const [board, setBoard] = useState<CellState[][]>(createBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagCount, setFlagCount] = useState(0);

  const reveal = useCallback((board: CellState[][], r: number, c: number) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (board[r][c].isRevealed || board[r][c].isFlagged) return;

    board[r][c].isRevealed = true;

    if (board[r][c].adjacentMines === 0 && !board[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          reveal(board, r + dr, c + dc);
        }
      }
    }
  }, []);

  const checkWin = (board: CellState[][]): boolean => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].isMine && !board[r][c].isRevealed) return false;
      }
    }
    return true;
  };

  const handleClick = (r: number, c: number) => {
    if (gameOver || won) return;
    if (board[r][c].isFlagged || board[r][c].isRevealed) return;

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

    if (newBoard[r][c].isMine) {
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          if (newBoard[i][j].isMine) newBoard[i][j].isRevealed = true;
        }
      }
      setBoard(newBoard);
      setGameOver(true);
      return;
    }

    reveal(newBoard, r, c);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setWon(true);
    }
  };

  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won) return;
    if (board[r][c].isRevealed) return;

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
    setBoard(newBoard);
    setFlagCount((prev) => prev + (newBoard[r][c].isFlagged ? 1 : -1));
  };

  const reset = () => {
    setBoard(createBoard());
    setGameOver(false);
    setWon(false);
    setFlagCount(0);
  };

  const getCellContent = (cell: CellState) => {
    if (!cell.isRevealed) {
      return cell.isFlagged ? "🚩" : "";
    }
    if (cell.isMine) return "💣";
    if (cell.adjacentMines === 0) return "";
    return cell.adjacentMines.toString();
  };

  return (
    <div className="w-full h-full bg-[#c0c0c0] flex flex-col items-center p-3 overflow-auto">
      <div className="flex items-center gap-4 mb-3 bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2">
        <div className="bg-black text-red-500 font-mono text-xl font-bold px-2 py-1 min-w-[50px] text-center">
          {String(MINES - flagCount).padStart(3, "0")}
        </div>
        <button
          onClick={reset}
          className="w-8 h-8 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-lg"
        >
          {gameOver ? "😵" : won ? "😎" : "🙂"}
        </button>
        <div className="bg-black text-red-500 font-mono text-xl font-bold px-2 py-1 min-w-[50px] text-center">
          000
        </div>
      </div>

      <div className="border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                className={`w-7 h-7 flex items-center justify-center text-xs font-bold border ${
                  cell.isRevealed
                    ? "bg-[#c0c0c0] border-[#808080]"
                    : "bg-[#c0c0c0] border-t-white border-l-white border-b-[#808080] border-r-[#808080] border-2 hover:bg-[#d0d0d0]"
                }`}
                style={{
                  color:
                    cell.isRevealed && !cell.isMine
                      ? numberColors[cell.adjacentMines] || "black"
                      : undefined,
                }}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
              >
                {getCellContent(cell)}
              </button>
            ))}
          </div>
        ))}
      </div>

      {(gameOver || won) && (
        <div className="mt-3 text-sm font-bold text-center text-black">
          {gameOver ? "💥 Oyun Bitti! Mayına bastınız." : "🎉 Tebrikler! Kazandınız!"}
        </div>
      )}
    </div>
  );
};

export default Minesweeper;