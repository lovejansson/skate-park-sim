import type { Cell, Vec2 } from "./lib/types";

export function isSamePos(pos1: Vec2, pos2: Vec2) {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

export function posToCell(pos: Vec2, tileSize: number) {
  return {
    row: Math.round(pos.y / tileSize),
    col: Math.round(pos.x / tileSize),
  };
}

export function cellToPos(cell: Cell, tileSize: number) {
  return {
    y: Math.round(cell.row * tileSize),
    x: Math.round(cell.col * tileSize),
  };
}

export function randomEl<T>(arr: T[]): T | null {
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

export function randomIndex<T>(arr: T[]): number {
  if (arr.length === 0) return -1;

  return Math.floor(arr.length * Math.random());
}

export function randomInt(max: number) {
  return Math.round(Math.random() * max);
}

export function randomOdd(max: number) {
  let num = Math.round(Math.random() * max);

  if (num % 2 === 0) {
    if (num === 0) num++;
    else num--;
  }

  return num;
}

export function getPosDiff(pos1: Vec2, pos2: Vec2): Vec2 {
  return { x: pos1.x - pos2.x, y: pos1.y - pos2.y };
}

export function randomBool() {
  return Math.random() > 0.5;
}
