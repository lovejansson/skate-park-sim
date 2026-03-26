import { Scene, StaticObject } from "./lib";
import type { Vec2 } from "./lib/types";

export type ObsticleType = "rail" | "bowl" | "flat" | "square" | "ramp";

export const obsticles: ObsticleType[] = ["rail", "bowl", "flat", "square", "ramp"];

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

export const obsticleTricks: { [k in ObsticleType]: Trick[] } = {
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

export default class Obsticle extends StaticObject {
  readonly type: ObsticleType;

  constructor(
    scene: Scene,
    type: ObsticleType,
    pos: Vec2,
    width: number,
    height: number,
  ) {
    super(scene, pos, width, height);

    this.type = type;
  }


  getFreeSpot() {
    return {x: this.pos.x + this.width, y: this.pos.y + this.halfHeight};
  }
}
