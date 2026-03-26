import type { Vec2 } from "./lib/types";

export function isSamePos(pos1: Vec2, pos2: Vec2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

export function posToCell(pos: Vec2, tileSize: number) {
    return {row: pos.y / tileSize, col: pos.x / tileSize};
}

export function randomEl<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];

}