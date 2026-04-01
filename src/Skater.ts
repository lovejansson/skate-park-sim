import { Sprite } from "./lib";
import {
  AnimationDriver,
  type AnimationConfig,
  type AnimationConfigT,
  type AnimationFrame,
  type AnimationOverlay,
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

    const { animations, overlays } = createAnimationsFromAseprite(
      spritesheet,
      animationSettings,
    );

    for (const [name, anim] of Object.entries(animations)) {
      this.animations.createAnim(name, anim as AnimationConfig);
    }

    for (const [name, overlay] of Object.entries(overlays)) {
      this.animations.createOverlay(name, overlay);
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
  | { driver: AnimationDriver; repeat: number | boolean; isAnim: true }
  | { isAnim: false }
> = {
  // Time-driven animations, repeating
  "walk-n": {
    driver: AnimationDriver.TimeMovementSync,
    repeat: true,
    isAnim: true,
  },
  "walk-s": {
    driver: AnimationDriver.TimeMovementSync,
    repeat: true,
    isAnim: true,
  },
  "walk-board-n": {
    driver: AnimationDriver.TimeMovementSync,
    repeat: true,
    isAnim: true,
  },
  "walk-board-s": {
    driver: AnimationDriver.TimeMovementSync,
    repeat: true,
    isAnim: true,
  },
  "idle-stand-n": { driver: AnimationDriver.Time, repeat: true, isAnim: true },
  "idle-stand-s": { driver: AnimationDriver.Time, repeat: true, isAnim: true },
  "idle-stand-w": { driver: AnimationDriver.Time, repeat: true, isAnim: true },
  "idle-stand-e": { driver: AnimationDriver.Time, repeat: true, isAnim: true },

  // Time-driven animations, no repeat
  "180-f": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "180-b": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "360-f": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "360-b": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "grab-f": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "grab-b": { driver: AnimationDriver.Time, repeat: false, isAnim: true },

  // Distance-based (cruise-ramp),
  "cruise-ramp-f-e": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-f-w": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-e": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-w": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },

  "cruise-ramp-f-e-start": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-f-w-start": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-e-start": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-w-start": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },

  "cruise-ramp-f-e-mid": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-f-w-mid": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-e-mid": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-w-mid": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },

  "ramp-land-w": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },
  "ramp-land-e": {
    driver: AnimationDriver.Distance,
    repeat: false,
    isAnim: true,
  },

  // Time + movement sync
  "climb-up": {
    driver: AnimationDriver.TimeMovementSync,
    repeat: true,
    isAnim: true,
  },
  "climb-down": {
    driver: AnimationDriver.TimeMovementSync,
    repeat: true,
    isAnim: true,
  },

  // Overlays

  "board-carry-r": { isAnim: false },
  "board-carry-l": { isAnim: false },
  "board-carry-c": { isAnim: false },
};

function createAnimationsFromAseprite(
  asepriteData: AsepriteJSON,
  animationSettings: Record<
    string,
    | { driver: AnimationDriver; repeat: number | boolean; isAnim: true }
    | { isAnim: false }
  >,
): {
  animations: Record<string, AnimationConfigT<AnimationDriver>>;
  overlays: Record<string, AnimationOverlay>;
} {
  const animations: Record<string, AnimationConfigT<AnimationDriver>> = {};
  const overlays: Record<string, AnimationOverlay> = {};

  for (const tag of asepriteData.meta.frameTags) {
    const settings = animationSettings[tag.name] || {
      driver: AnimationDriver.Time,
      repeat: true,
    };

    if (settings.isAnim) {
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
    } else {
      const frames: { spritesheetX: number; spritesheetY: number }[] = [];

      for (let i = tag.from; i <= tag.to; i++) {
        // I need to have an equal sign in for loop condition to include tags with only one frame
        if (i === asepriteData.frames.length) continue;
        const frameData = asepriteData.frames[i].frame;
        frames.push({
          spritesheetX: frameData.x,
          spritesheetY: frameData.y,
        });
      }

      console.log("frames", frames);

      overlays[tag.name] = {
        spritesheet: "skater",
        frames,
      };
    }
  }

  return { animations, overlays };
}
