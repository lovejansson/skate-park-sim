import { createPathBFS } from "./grid.ts";
import type { Sprite } from "./lib/index.ts";
import type { Cell, Direction, Vec2 } from "./lib/types.ts";
import { posToCell } from "./utils.ts";

// Get direction diff for x and why and use that as index to get label for direction. directionLables[y + 1][x + 1]
const directionLables = [
  ["nw", "n", "ne"],
  ["w", "curr", "e"],
  ["sw", "s", "se"],
];

/**
 * A path that a sprite can move on. Handles creation of path on the grid and updating of position (x,y).
 * You need to create a new instance whenever a sprite should walk on a path.
 * Supports 8 directional walks.
 */
export class Path {
  hasReachedGoal: boolean;
  cellCount: number;

  private currPos: Vec2;
  private currPixelDiff: number;
  private path: Cell[];
  private currPathIdx;
  private goalCell;

  private sprite: Sprite;

  constructor(sprite: Sprite, goal: Vec2, grid: (0 | 1)[][]) {
    this.sprite = sprite;
    this.goalCell = posToCell(goal, sprite.scene.art!.tileSize);

    this.path = createPathBFS(
      posToCell(this.sprite.pos, this.sprite.scene.art!.tileSize),
      this.goalCell,
      grid,
    );

    this.currPos = this.sprite.pos;
    this.currPixelDiff = 0;
    this.currPathIdx = 0;
    this.hasReachedGoal = false;
    this.cellCount = 0;
  }

  update() {
    if (!this.hasReachedGoal) {
      this.updatePosition();

      if (this.currPixelDiff === this.sprite.scene.art!.tileSize) {
        this.next();
      }
    }
  }

  getPos() {
    return this.currPos;
  }

  private next() {
    this.currPathIdx++;
    this.currPixelDiff = 0;
    this.cellCount++;

    if (this.currPathIdx === this.path.length - 1) {
      this.hasReachedGoal = true;
    }
  }

  /**
   * Calcualtes the xy diff to use when updating the sprite's position by comparing
   * the placement of the current cell and the next or previous cell.
   */
  private calculateXYUpdateDiff(): Vec2 {
    const currCell = this.path[this.currPathIdx];

    if (this.currPathIdx === this.path.length - 1) {
      const prev = this.path[this.currPathIdx - 1];
      return { y: currCell.row - prev.row, x: currCell.col - prev.col };
    } else {
      const next = this.path[this.currPathIdx + 1];
      return { x: next.col - currCell.col, y: next.row - currCell.row };
    }
  }

  private updatePosition(): void {
    const diff = this.calculateXYUpdateDiff();
    this.currPos = { x: this.currPos.x + diff.x, y: this.currPos.y + diff.y };
    this.currPixelDiff++;
    this.sprite.direction = directionLables[diff.y + 1][
      diff.x + 1
    ] as Direction;
  }
}
