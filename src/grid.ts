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

export function findClosestFreeCell(
  from: Cell,
  grid: (0 | 1)[][],
  walkableTileValues: number[] = [0],
) {
  const rows = grid.length;
  const cols = grid[0].length;

  const visited: boolean[][] = createGrid(rows, cols, false);
  const queue: Cell[] = [];

  let curr: Cell = { ...from };

  queue.push(from);

  visited[from.row][from.col] = true;

  while (queue.length > 0) {
    curr = queue.shift()!; // I know it is not empty since while loop is only running when length > 0.

    for (const n of getNeighbours(curr, grid)) {
      if (walkableTileValues.includes(grid[n.row][n.col])) {
        return n;
      } else if (!visited[n.row][n.col]) {
        queue.push(n);
        visited[n.row][n.col] = true;
      }
    }
  }

  return null;
}

export function createPathAStar(
  from: Cell,
  to: Cell,
  grid: (0 | 1)[][],
  walkableTileValues: number[] = [0],
): Cell[] {
  // if (!cellIsWithinBounds(from, grid))
  //   throw new Error("'from' cell is out of bounds");
  // if (!cellIsWithinBounds(to, grid))
  //   throw new Error("'to' cell is out of bounds");

  const rows = grid.length;
  const cols = grid[0].length;

  const manhattan = (a: Cell, b: Cell) =>
    Math.abs(b.row - a.row) + Math.abs(b.col - a.col);

  const heuristic = manhattan;

  const reconstructPath = (pathMap: (Cell | null)[][]): Cell[] => {
    let curr: Cell | null = to;
    const path: Cell[] = [to];

    while (curr) {
      curr = pathMap[curr.row][curr.col];
      if (curr) path.push(curr);
    }

    return path.reverse();
  };

  const openList: Cell[] = [from];
  const closeList: Cell[] = [];

  const pathMap = createGrid(rows, cols, null);
  const scoresMap = createGrid(rows, cols, Infinity);

  scoresMap[from.row][from.col] = 0;

  while (openList.length > 0) {
    // Find lowest score
    const curr = openList.reduce((best, c) =>
      scoresMap[c.row][c.col] < scoresMap[best.row][best.col] ? c : best,
    );

    if (curr.row === to.row && curr.col === to.col) break;

    const neighbours = getNeighbours(curr, grid);
    const g = scoresMap[curr.row][curr.col] + 1;

    for (const n of neighbours) {
      // Skip non-walkable
      if (!walkableTileValues.includes(grid[n.row][n.col])) continue;

      const h = heuristic(n, to);
      const f = g + h;

      const inClosed = closeList.find(
        (c) => c.row === n.row && c.col === n.col,
      );
      const inOpen = openList.find((c) => c.row === n.row && c.col === n.col);

      if (inOpen && scoresMap[inOpen.row][inOpen.col] < f) continue;
      if (inClosed && scoresMap[inClosed.row][inClosed.col] < f) continue;

      if (!inOpen) openList.push(n);

      scoresMap[n.row][n.col] = g;
      pathMap[n.row][n.col] = curr;
    }

    // remove curr from openList
    const index = openList.findIndex(
      (c) => c.row === curr.row && c.col === curr.col,
    );
    if (index !== -1) openList.splice(index, 1);

    closeList.push(curr);
  }

  if (!pathMap[to.row][to.col]) {
    throw new Error("No path found!");
  }

  return reconstructPath(pathMap);
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
