import { Sprite } from "./lib";
import {
  AnimationDriver,
  type AnimationConfig,
  type AnimationConfigT,
  type AnimationFrame,
} from "./lib/AnimationManager";
import type { Vec2 } from "./lib/types";
import type Play from "./Play";
import type { Updatable } from "./SkatingAtPark";
import SkatingAtPark from "./SkatingAtPark";
import spritesheetJSON from "./skater-spritesheet.json";
import { type AsepriteJSON } from "./lib/index";

const spritesheet = spritesheetJSON as unknown as AsepriteJSON;

type Skill = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export default class Skater extends Sprite {
  skill: Skill;
  who: string;
  action: Updatable;
  tileSize: number;

  constructor(scene: Play, pos: Vec2, who: string, skill: Skill) {
    super(scene, pos, 16, 32, "s");

    this.tileSize = scene.art!.tileSize;

    this.who = who;
    this.skill = skill;

    const animations = createAnimationsFromAseprite(
      spritesheet,
      animationSettings,
    );

    for (const [name, anim] of Object.entries(animations)) {
      this.animations.create(name, anim as AnimationConfig);
    }

    this.action = new SkatingAtPark(this);
  }

  update(dt: number): void {
    this.animations.update(dt);
    this.action.update(dt);
  }
}

const animationSettings: Record<
  string,
  { driver: AnimationDriver; repeat: number | boolean }
> = {
  // Time-driven animations, repeating
  "walk-n": { driver: AnimationDriver.TimeMovementSync, repeat: true },
  "walk-s": { driver: AnimationDriver.TimeMovementSync, repeat: true },
  "idle-stand-n": { driver: AnimationDriver.Time, repeat: true },
  "idle-stand-s": { driver: AnimationDriver.Time, repeat: true },
  "idle-stand-w": { driver: AnimationDriver.Time, repeat: true },
  "idle-stand-e": { driver: AnimationDriver.Time, repeat: true },

  // Time-driven animations, no repeat
  "180-f": { driver: AnimationDriver.Time, repeat: false },
  "180-b": { driver: AnimationDriver.Time, repeat: false },
  "360-f": { driver: AnimationDriver.Time, repeat: false },
  "360-b": { driver: AnimationDriver.Time, repeat: false },
  "grab-f": { driver: AnimationDriver.Time, repeat: false },
  "grab-b": { driver: AnimationDriver.Time, repeat: false },

  // Distance-based (cruise-ramp)
  "cruise-ramp-f-e": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-f-w": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-b-e": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-b-w": { driver: AnimationDriver.Distance, repeat: false },

  "cruise-ramp-f-e-start": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-f-w-start": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-b-e-start": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-b-w-start": { driver: AnimationDriver.Distance, repeat: false },

  "cruise-ramp-f-e-mid": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-f-w-mid": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-b-e-mid": { driver: AnimationDriver.Distance, repeat: false },
  "cruise-ramp-b-w-mid": { driver: AnimationDriver.Distance, repeat: false },

  // Time + movement sync
  "climb-up": { driver: AnimationDriver.TimeMovementSync, repeat: true },
  "climb-down": { driver: AnimationDriver.TimeMovementSync, repeat: true },

  "ramp-land-w": { driver: AnimationDriver.Distance, repeat: false },
  "ramp-land-e": { driver: AnimationDriver.Distance, repeat: false },

  "board-carry-r": { driver: AnimationDriver.Distance, repeat: false },
  "board-carry-l": { driver: AnimationDriver.Distance, repeat: false },
};

function createAnimationsFromAseprite(
  asepriteData: AsepriteJSON,
  animationSettings: Record<
    string,
    { driver: AnimationDriver; repeat: number | boolean }
  >,
): Record<string, AnimationConfigT<AnimationDriver>> {
  const animations: Record<string, AnimationConfigT<AnimationDriver>> = {};

  for (const tag of asepriteData.meta.frameTags) {
    const settings = animationSettings[tag.name] || {
      driver: AnimationDriver.Time,
      repeat: true,
    };
    const frames: AnimationFrame[] = [];

    const isCruiseRamp = tag.name.startsWith("cruise-ramp");
    const isLandRamp = tag.name.startsWith("ramp-land");
    const xDirMultiplier = tag.name.includes("-w") ? -1 : 1;

    // Predefined motion deltas (without multiplier)
    const cruiseMotion = [
      { dx: 7, dy: 9 },
      { dx: 9, dy: 14 },
      { dx: 12, dy: 6 },
      { dx: 18, dy: 4 },
      { dx: 16, dy: 0 },
      { dx: 18, dy: -4 },
      { dx: 12, dy: -6 },
      { dx: 9, dy: -14 },
      { dx: 7, dy: -9 },
      { dx: 0, dy: 0 },
    ];

    for (let i = tag.from; i <= tag.to; i++) {
      // I need to have an equal sign in for loop condition to include tags with only one frame
      if (i === asepriteData.frames.length) continue;

      const frameData = asepriteData.frames[i].frame;
      const duration = asepriteData.frames[i].duration;

      if (settings.driver === AnimationDriver.Distance) {
        if (isCruiseRamp) {
          const delta = cruiseMotion[i - tag.from];
          frames.push({
            spritesheetX: frameData.x,
            spritesheetY: frameData.y,
            duration,
            dx: delta.dx * xDirMultiplier,
            dy: delta.dy,
          });
        } else if (isLandRamp) {
          for (const { dx, dy } of [{ dy: 0, dx: 0 * xDirMultiplier }]) {
            frames.push({
              spritesheetX: frameData.x,
              spritesheetY: frameData.y,
              duration: 500,
              dx,
              dy,
            });
          }
        }
      } else {
        frames.push({
          spritesheetX: frameData.x,
          spritesheetY: frameData.y,
          duration,
        });
      }
    }

    animations[tag.name] = {
      driver: settings.driver,
      repeat: settings.repeat,
      spritesheet: "skater",
      frames,
    };
  }

  return animations;
}
