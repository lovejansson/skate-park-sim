import type { Vec2 } from "./lib/types";

export function isSamePos(pos1: Vec2, pos2: Vec2) {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

export function posToCell(pos: Vec2, tileSize: number) {
  return { row: pos.y / tileSize, col: pos.x / tileSize };
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
