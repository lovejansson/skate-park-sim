import { Scene, StaticImage } from "./lib";
import type { Direction, Vec2 } from "./lib/types";
import { cellToPos, dist, manhattan, posToCell, randomEl } from "./utils";

export type ObstacleType = "rail" | "bowl" | "flat" | "ramp";

export const obstacles: ObstacleType[] = ["rail", "bowl", "flat", "ramp"];

export const tricks: Trick[] = [
  "ollie",
  "pop-shove-it",
  "kickflip",
  "50-50-grind",
  "5-0-grind",
  "nose-grind",
  "grab",
  "180",
  "360-shove-it",
  "360",
];

export type Trick =
  | "ollie"
  | "pop-shove-it"
  | "kickflip"
  | "50-50-grind"
  | "5-0-grind"
  | "nose-grind"
  | "grab"
  | "180"
  | "360-shove-it"
  | "360";

export const obstacleTricks: { [k in ObstacleType]: Trick[] } = {
  rail: ["50-50-grind", "5-0-grind", "nose-grind"],
  bowl: ["180", "360", "grab"],
  flat: ["ollie", "pop-shove-it", "kickflip", "360-shove-it"],
  ramp: ["180", "360", "grab"],
};

export default class Obstacle extends StaticImage {
  readonly type: ObstacleType;

  private queue: number[];

  private isFree: boolean;

  private numSkatersLimit: number;

  protected skaters: number[];

  private currSkater: number | null;

  protected tileSize: number;

  constructor(
    scene: Scene,
    type: ObstacleType,
    pos: Vec2,
    width: number,
    height: number,
    image: string,
    numSkatersLimit: number,
  ) {
    super(scene, pos, width, height, image);
    this.type = type;
    this.queue = [];
    this.isFree = true;
    this.currSkater = null;
    this.skaters = [];
    this.numSkatersLimit = numSkatersLimit;
    this.tileSize = this.scene.art!.tileSize;
  }

  getArrivePos(_: Vec2,): Vec2 {
    return {x: this.pos.x - this.tileSize, y: this.pos.y - this.tileSize};
  }

  isOccupiedByMe(id: number): boolean {
    return this.currSkater === id;
  }

  isMyTurn(id: number): boolean {
    return this.isFree && this.queue[0] === id;
  }

  isStandingInLine(id: number) {
    return this.queue.find((i) => i === id) !== undefined;
  }

  /**
   * Call this when skater should occupy the obsticle, it will remove the skater from the queue and set the obsticle to not free.
   */
  skate(id: number) {
    if (!this.isMyTurn(id)) throw new Error("Wait for your turn mr");

    this.currSkater = this.queue.shift()!;

    this.isFree = false;
  }

  /**
   * When skater is done with their round of tricks they end the skate.
   * If they want to reenter the queue they have to do so manually.
   */
  endSkate(id: number) {
    if (this.currSkater !== id)
      throw new Error("Skater is not skating the obstacle.");

    this.currSkater = null;

    this.isFree = true;
  }

  leave(id: number) {
    const skaterIdx = this.skaters.findIndex((s) => s === id);

    if (skaterIdx === -1) throw new Error("Skater is not at obstacle.");

    this.skaters.splice(skaterIdx, 1);

    const qi = this.queue.findIndex((i) => i === id);

    if (qi !== -1) this.queue.splice(qi, 1);
  }

  /**
   * When skater has arrived they can stand in line to go skate the obsticle.
   */
  standInLine(id: number): void {
    this.assertSkaterIsAtObstacle(id);

    if (this.queue.find((i) => i === id))
      throw new Error("Skater is already in line");

    this.queue.push(id);
  }

  /**
   * Skater needs to arrive to get an idle position at the obsticle.
   */
  arrive(id: number): void {
    if (this.isTooCrowded()) throw new Error("Obstacle is too crowded");
    this.skaters.push(id);
  }

  isTooCrowded(): boolean {
    return this.skaters.length === this.numSkatersLimit;
  }

  protected assertSkaterIsAtObstacle(id: number): number {
    const skater = this.skaters.find((s) => s === id);

    if (skater === undefined) throw new Error("Skater is not at obstacle.");

    return skater;
  }
}

export class Rail extends Obstacle {
  private startPositions: { pos: Vec2; railSide: RailSide }[];

  constructor(scene: Scene, pos: Vec2, width: number, height: number) {
    super(scene, "rail", pos, width, height, "rail", 4);
    this.startPositions = [
      {
        pos: { x: this.pos.x - 4 * scene.art!.tileSize, y: this.pos.y },
        railSide: RailSide.LEFT,
      },
      {
        pos: {
          x: this.pos.x + this.width + 3 * scene.art!.tileSize,
          y: this.pos.y,
        },
        railSide: RailSide.RIGHT,
      },
    ];
  }

  getArrivePos(from: Vec2): Vec2 {
    let min = Infinity;

    let pos: Vec2 = {
      x: this.pos.x - this.tileSize,
      y: this.pos.y - this.tileSize,
    };

    let startCell = posToCell(this.pos, this.tileSize);

    for (
      let c = startCell.col - 3;
      c < 3 + this.width / this.tileSize + 3;
      ++c
    ) {
      const dist1 = manhattan(posToCell(from, this.tileSize), {
        col: c,
        row: startCell.row - 1,
      });

      if (dist1 < min) {
        min = dist1;
        pos = cellToPos({ col: c, row: startCell.row - 1 }, this.tileSize);
      }

      const dist2 = manhattan(posToCell(from, this.tileSize), {
        col: c,
        row: startCell.row + 1,
      });

      if (dist2 < min) {
        min = dist2;
        pos = cellToPos({ col: c, row: startCell.row + 1 }, this.tileSize);
      }
    }

    return pos;
  }

  getClosestTrickStartPos(from: Vec2): { pos: Vec2; railSide: RailSide } {
    let min = Infinity;
    let pos: { pos: Vec2; railSide: RailSide } = this.startPositions[0];

    for (const p of this.startPositions) {
      const dist = manhattan(
        posToCell(from, this.tileSize),
        posToCell(p.pos, this.tileSize),
      );

      if (dist < min) {
        min = dist;
        pos = p;
      }
    }

    return pos;
  }
}

export enum RailSide {
  LEFT = "left",
  RIGHT = "right",
}

export class Ramp extends Obstacle {
  private idlePositions: {
    pos: Vec2;
    isFree: boolean;
  }[];

  private skaterIdlePositions: Map<number, number>;

  constructor(scene: Scene, pos: Vec2, width: number, height: number) {
    super(scene, "ramp", pos, width, height, "ramp", 4);
    this.idlePositions = [
      { pos: { x: this.pos.x, y: this.pos.y + this.tileSize }, isFree: true },
      {
        pos: { x: this.pos.x, y: this.pos.y + this.height - this.tileSize * 3 },
        isFree: true,
      },
      {
        pos: {
          x: this.pos.x + this.width - this.tileSize,
          y: this.pos.y + this.tileSize,
        },
        isFree: true,
      },
      {
        pos: {
          x: this.pos.x + this.width - this.tileSize,
          y: +this.height - this.tileSize * 3,
        },
        isFree: true,
      },
    ];
    this.skaterIdlePositions = new Map();
  }

  skate(id: number): void {
    super.skate(id);

    this.returnIdlePos(id);

    this.getNewIdlePos(id);
  }

  arrive(id: number): Vec2 {
    super.arrive(id);

    const idlePosIdx = this.getNewIdlePos(id);

    return this.idlePositions[idlePosIdx].pos;
  }

  leave(id: number): void {
    super.leave(id);

    this.returnIdlePos(id);
  }

  getMyIdlePos(id: number): Vec2 {
    const skater = this.skaters.find((s) => s === id);

    if (skater === undefined) throw new Error("Skater is not at obstacle.");

    const idlePosIdx = this.skaterIdlePositions.get(id);

    if (idlePosIdx === undefined)
      throw new Error("Skater has no idle pos idx assigned to them.");

    const idlePos = this.idlePositions.at(idlePosIdx);

    if (idlePos === undefined) throw new Error("Idle position not found.");

    return idlePos.pos;
  }

  getIdlePosSide(id: number): RampSide {
    const idlePos = this.getMyIdlePos(id);
    const centerX = this.pos.x + this.halfWidth;
    const centerY = this.pos.y + this.halfHeight;

    if (idlePos.x < centerX && idlePos.y < centerY) {
      return RampSide.TOP_LEFT;
    } else if (idlePos.x < centerX && idlePos.y > centerY) {
      return RampSide.BOTTOM_LEFT;
    } else if (idlePos.x > centerX && idlePos.y < centerY) {
      return RampSide.BOTTOM_RIGHT;
    } else if (idlePos.x > centerX && idlePos.y > centerY) {
      return RampSide.TOP_RIGHT;
    }

    throw new Error("internal error");
  }

  private returnIdlePos(id: number): void {
    super.assertSkaterIsAtObstacle(id);

    const idlePosIdx = this.skaterIdlePositions.get(id);

    if (idlePosIdx === undefined)
      throw new Error("Skater has no idle pos idx assigned to them.");

    this.idlePositions[idlePosIdx].isFree = true;
  }

  private getNewIdlePos(id: number): number {
    super.assertSkaterIsAtObstacle(id);

    const idlePosIdx = (() => {
      const indices: number[] = [];

      for (let i = 0; i < this.idlePositions.length; ++i) {
        if (this.idlePositions[i].isFree) {
          indices.push(i);
        }
      }

      return randomEl(indices);
    })();

    if (idlePosIdx === null) throw new Error("No free idle positions found");

    this.idlePositions[idlePosIdx].isFree = false;

    this.skaterIdlePositions.set(id, idlePosIdx);

    return idlePosIdx;
  }
}

export enum RampSide {
  TOP_LEFT = "top-left",
  TOP_RIGHT = "top-right",
  BOTTOM_RIGHT = "bottom-right",
  BOTTOM_LEFT = "bottom-left",
}

export class Bowl extends Obstacle {
  private startPositions: { pos: Vec2; bowlSide: BowlSide }[];

  constructor(scene: Scene, pos: Vec2, width: number, height: number) {
    super(scene, "bowl", pos, width, height, "bowl", 4);

    this.startPositions = [
      {
        pos: {
          x: this.pos.x + Math.floor(this.halfWidth) - this.tileSize,
          y: this.pos.y - this.tileSize,
        },
        bowlSide: BowlSide.TOP,
      },
      {
        pos: {
          x: this.pos.x + Math.ceil(this.halfWidth),
          y: this.pos.y + this.height,
        },
        bowlSide: BowlSide.BOTTOM,
      },
      {
        pos: {
          x: this.pos.x - this.tileSize,
          y: this.pos.y + Math.floor(this.halfHeight) - this.tileSize,
        },
        bowlSide: BowlSide.LEFT,
      },
      {
        pos: {
          x: this.pos.x + this.width,
          y: this.pos.y + Math.ceil(this.halfHeight) - this.tileSize,
        },
        bowlSide: BowlSide.RIGHT,
      },
    ];
  }

  getArrivePos(from: Vec2): Vec2 {
    let min = Infinity;

    let pos: Vec2 = {
      x: this.pos.x - this.tileSize,
      y: this.pos.y - this.tileSize,
    };

    let startCell = posToCell(this.pos, this.tileSize);

    // Search around the bowl for a position that has the min distance to 'from'

    for (let c = startCell.col; c < this.width / this.tileSize; ++c) {
      const dist1 = manhattan(posToCell(from, this.tileSize), {
        col: c,
        row: startCell.row - 2,
      });

      if (dist1 < min) {
        min = dist1;
        pos = cellToPos({ col: c, row: startCell.row - 1 }, this.tileSize);
      }

      const dist2 = manhattan(posToCell(from, this.tileSize), {
        col: c,
        row: startCell.row + 1,
      });

      if (dist2 < min) {
        min = dist2;
        pos = cellToPos({ col: c, row: startCell.row + 1 }, this.tileSize);
      }
    }

    for (let r = startCell.row; r < this.height / this.tileSize; ++r) {
      const dist1 = manhattan(posToCell(from, this.tileSize), {
        col: startCell.col - 1,
        row: r,
      });

      if (dist1 < min) {
        min = dist1;
        pos = cellToPos(
          {
            col: startCell.col - 1,
            row: r,
          },
          this.tileSize,
        );
      }

      const dist2 = manhattan(posToCell(from, this.tileSize), {
        col: startCell.col + this.width + 1,
        row: r,
      });

      if (dist2 < min) {
        min = dist2;
        pos = cellToPos(
          { col: startCell.col + this.width + 1, row: r },
          this.tileSize,
        );
      }
    }

    return pos;
  }

  getClosestTrickStartPos(from: Vec2): { pos: Vec2; bowlSide: BowlSide } {
    let min = Infinity;
    let pos: { pos: Vec2; bowlSide: BowlSide } = this.startPositions[0];

    for (const p of this.startPositions) {
      const dist = manhattan(
        posToCell(from, this.tileSize),
        posToCell(p.pos, this.tileSize),
      );

      if (dist < min) {
        min = dist;
        pos = p;
      }
    }

    return pos;
  }
}

export enum BowlSide {
  TOP = "top",
  RIGHT = "right",
  BOTTOM = "bottom",
  LEFT = "left",
}

export const bowlSideToStartDir: Map<BowlSide, Direction> = new Map([
  [BowlSide.TOP, "s"],
  [BowlSide.RIGHT, "w"],
  [BowlSide.BOTTOM, "n"],
  [BowlSide.LEFT, "e"],
]);

export const bowlSideToEndDir: Map<BowlSide, Direction> = new Map([
  [BowlSide.TOP, "n"],
  [BowlSide.RIGHT, "e"],
  [BowlSide.BOTTOM, "s"],
  [BowlSide.LEFT, "w"],
]);
