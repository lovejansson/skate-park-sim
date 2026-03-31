import { Scene, StaticObject } from "./lib";
import type { Vec2 } from "./lib/types";

export type ObstacleType = "rail" | "bowl" | "flat" | "square" | "ramp";

export const obsticles: ObstacleType[] = [
  "rail",
  "bowl",
  "flat",
  "square",
  "ramp",
];

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
  bowl: ["180", "360", "grab", "50-50-grind", "5-0-grind", "nose-grind"],
  flat: ["ollie", "pop-shove-it", "kickflip", "360-shove-it"],
  square: [
    "ollie",
    "pop-shove-it",
    "kickflip",
    "50-50-grind",
    "5-0-grind",
    "nose-grind",
    "grab",
    "360-shove-it",
  ],
  ramp: ["180", "360", "grab"],
};

export const obstacleTricksSets: { [k in ObstacleType]: Trick[][] } = {
  rail: [["50-50-grind", "5-0-grind", "nose-grind"]],
  bowl: [["180", "360", "grab", "50-50-grind", "5-0-grind", "nose-grind"]],
  flat: [["ollie", "pop-shove-it", "kickflip", "360-shove-it"]],
  square: [
    [
      "ollie",
      "pop-shove-it",
      "kickflip",
      "50-50-grind",
      "5-0-grind",
      "nose-grind",
      "grab",
      "360-shove-it",
    ],
  ],
  ramp: [["180", "360", "grab"]],
};

export default class Obstacle extends StaticObject {
  readonly type: ObstacleType;

  private queue: number[];

  private isFree: boolean;

  private idlePositions: {
    pos: Vec2;
    meta: { [key: string]: any };
    isFree: boolean;
  }[];

  private skaters: { id: number; idlePosIdx: number }[];

  private currSkater: number | null;

  constructor(
    scene: Scene,
    type: ObstacleType,
    pos: Vec2,
    width: number,
    height: number,
    idleSpots: { pos: Vec2; meta: { [key: string]: any } }[],
  ) {
    super(scene, pos, width, height);
    this.type = type;
    this.queue = [];
    this.isFree = true;
    this.idlePositions = idleSpots.map((i) => ({ ...i, isFree: true }));
    this.currSkater = null;
    this.skaters = [];
  }

  isOccupiedByMe(id: number): boolean {
    return this.currSkater === id;
  }

  isMyTurn(id: number): boolean {
    if (!this.skaters.find((s) => s.id === id))
      throw new Error("Skater is not at obstacle.");
    return this.isFree && this.queue[0] === id;
  }

  isStandingInLine(id: number) {
    if (!this.skaters.find((s) => s.id === id))
      throw new Error("Skater is not at obstacle.");

    return this.queue.find((i) => i === id) !== undefined;
  }

  /**
   * Call this when skater should occupy the obsticle, it will remove the skater from the queue and set the obsticle to not free.
   */
  skate(id: number) {
    if (!this.skaters.find((s) => s.id === id))
      throw new Error("Skater is not at obstacle.");

    if (this.queue.find((i) => i === id) === undefined)
      throw new Error("You are not in the queue");

    if (!this.isMyTurn(id)) throw new Error("Wait for your turn mr");

    this.currSkater = this.queue.shift()!;

    this.isFree = false;
  }

  /**
   * When skater is done with their round of tricks they end the skate.
   * If they want to reenter the queue they have to do so manually.
   */
  endSkate(id: number) {
    if (!this.skaters.find((s) => s.id === id))
      throw new Error("Skater is not at obstacle.");

    if (this.currSkater !== id)
      throw new Error("Skater is not skating the obstacle.");
    this.currSkater = null;

    this.isFree = true;
  }

  leave(id: number) {
    const skaterIdx = this.skaters.findIndex((s) => s.id === id);

    if (skaterIdx === -1) throw new Error("Skater is not at obstacle.");

    this.idlePositions[this.skaters[skaterIdx].idlePosIdx].isFree = true;

    this.skaters.splice(skaterIdx, 1);

    const qi = this.queue.findIndex((i) => i === id);

    if (qi !== -1) this.queue.splice(qi, 1);
  }

  getMyIdlePos(id: number): Vec2 {
    const skater = this.skaters.find((s) => s.id === id);

    if (skater === undefined) throw new Error("Skater is not at obstacle.");

    const idlePos = this.idlePositions[skater.idlePosIdx];

    return idlePos.pos;
  }

  /**
   * When skater has arrived they can stand in line to go skate the obsticle.
   */
  standInLine(id: number): void {
    if (!this.skaters.find((s) => s.id === id))
      throw new Error("Skater is not at obstacle!");

    if (this.queue.find((i) => i === id))
      throw new Error("Skater is already in line");

    this.queue.push(id);

  }

  /**
   * Skater needs to arrive to get an idle position at the obsticle.
   */
  arrive(id: number): Vec2 {
    if (this.isTooCrowded()) throw new Error("Obstacle is too crowded");

    const idlePosIdx = this.idlePositions.findIndex((i) => i.isFree === true);

    if (idlePosIdx === -1)
      throw new Error("No idle spot is free, should not happen");

    this.idlePositions[idlePosIdx].isFree = false;

    this.skaters.push({ id, idlePosIdx });

    return this.idlePositions[idlePosIdx].pos;
  }

  isTooCrowded(): boolean {
    return this.skaters.length === this.idlePositions.length;
  }
}

export enum RampSide {
  TOP_LEFT = "top-left",
  TOP_RIGHT = "top-right",
  BOTTOM_RIGHT = "bottom-right",
  BOTTOM_LEFT = "bottom-left",
}

export function getRampSide(
  obstacle: Obstacle,
  tileSize: number,
  idlePos: Vec2,
): RampSide {
  if (obstacle.type !== "ramp") throw new Error("Obstacle is not a ramp");
  const left = obstacle.pos.x;
  const right = obstacle.pos.x + obstacle.width - tileSize;
  const top = obstacle.pos.y + tileSize;
  const bottom = obstacle.pos.y + obstacle.height - tileSize * 3;

  if (idlePos.x === left && idlePos.y === top) {
    return RampSide.TOP_LEFT;
  } else if (idlePos.x === right && idlePos.y === top) {
    return RampSide.TOP_RIGHT;
  } else if (idlePos.x === right && idlePos.y === bottom) {
    return RampSide.BOTTOM_RIGHT;
  } else if (idlePos.x === left && idlePos.y === bottom) {
    return RampSide.BOTTOM_LEFT;
  }

  throw Error("getRampSide is not written correctly");
}
