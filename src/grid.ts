import type { Cell } from "./lib/types";

export function createGrid(
  rows: number,
  cols: number,
  defaultCellValue: any = null,
) {
  const grid = [];
  for (let r = 0; r < rows; ++r) {
    const row = [];
    for (let c = 0; c < cols; ++c) {
      const value = defaultCellValue;
      row.push(value);
    }

    grid.push(row);
  }

  return grid;
}

export function createPathBFS(from: Cell, to: Cell, grid: (0 | 1)[][]): Cell[] {
  const rows = grid.length;
  const cols = grid[0].length;

  const reconstructPath = (pathMap: (Cell | null)[][]) => {
    let curr: Cell = to;
    let path = [to];

    while (!(curr.row === from.row && curr.col === from.col)) {
      curr = pathMap[curr.row][curr.col]!;
      path.push(curr);
    }

    return path.reverse();
  };

  const visited: boolean[][] = createGrid(rows, cols, false);
  const path: (Cell | null)[][] = createGrid(rows, cols, null);
  const queue: Cell[] = [];

  let curr: Cell = { ...from };

  queue.push(from);

  path[from.row][from.col] = null;

  visited[from.row][from.col] = true;

  while (queue.length > 0) {
    curr = queue.shift()!; // I know it is not empty since while loop is only running when length > 0.

    for (const n of getNeighbours(curr, grid)) {
      if (n.row === to.row && n.col === to.col) {
        path[n.row][n.col] = curr;
        break;
      } else if (!visited[n.row][n.col]) {
        queue.push(n);
        path[n.row][n.col] = curr;
        visited[n.row][n.col] = true;
      }
    }
  }

  return reconstructPath(path);
}

export function getNeighbours(
  cell: Cell,
  grid: (0 | 1)[][],
  includeDiagonalNeighbours = false,
): Cell[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const neighbours: Cell[] = [];

  const neighbourDiffs = includeDiagonalNeighbours
    ? [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ]
    : [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ];

  for (const [r, c] of neighbourDiffs) {
    const n = { row: cell.row + r, col: cell.col + c };
    if (n.row !== -1 && n.col !== -1 && n.row !== rows && n.col !== cols)
      neighbours.push(n);
  }

  return neighbours;
}
