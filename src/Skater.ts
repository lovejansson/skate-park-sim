import { Sprite } from "./lib";
import {
  AnimationDriver,
  type AnimationConfig,
  type AnimationConfigT,
  type AnimationFrame,
  type AnimationOverlay,
} from "./lib/AnimationManager";
import type { Direction, Vec2 } from "./lib/types";
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
      AnimationSettings,
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

/**
 * Animation integration
 *
 * The exported Aseprite JSON file is used to create the animations. It contains a list of tag names which refers to an animation and contains references to which frames are used in that animation.
 *
 * - Each frame has data duration and spritesheet position x,y among other attributes.
 *
 * - The AnimationsSettings is a lookup record for the settings of each animation that are used by the AnimationManager. Each key maps to a tag name in the Aseprite JSON file.
 *
 * - Motions is another lookup record for motion series that is used by the animations with animation driver type Distance.
 *
 */

export function getBoardFlipOverlay(direction: Direction) {
  switch (direction) {
    case "n":
      return {
        name: "flip-board-n",
        drawOnTop: false,
        drawBehind: true,
        dy: 0,
        dx: 0,
      };
    case "e":
      return {
        name: "flip-board-e",
        drawOnTop: false,
        drawBehind: true,
        dy: 3,
        dx: 8,
      };
    case "s":
      return {
        name: "flip-board-s",
        drawOnTop: true,
        drawBehind: false,
        dy: 13,
        dx: 0,
      };
    case "w":
      return {
        name: "flip-board-w",
        drawOnTop: false,
        drawBehind: true,
        dy: 3,
        dx: -8,
      };
  }
}

export function getBoardCarryOverlay(direction: Direction, isIdle: boolean = false) {
  switch (direction) {
    case "n":
      return {
        name: `board-carry-${isIdle ? "idle-" : ""}r`,
        drawOnTop: false,
        drawBehind: true,
        dy: 5,
        dx: 1,
      };
    case "ne":
      break;
    case "e":
      return {
        name: `board-carry-${isIdle ? "idle-" : ""}c`,
        drawOnTop: true,
        drawBehind: false,
        dy: -1,
        dx: 0,
      };
    case "se":
    case "s":
      return {
        name: `board-carry-${isIdle ? "idle-" : ""}l`,
        drawOnTop: false,
        drawBehind: true,
        dy: 5,
        dx: -1,
      };
    case "sw":
    case "w":
      return {
        name: `board-carry-${isIdle ? "idle-" : ""}c`,
        drawOnTop: false,
        drawBehind: true,
        dy: -2,
        dx: 0,
      };
    case "nw":
  }
}

const AnimationSettings: Record<
  string,
  | { driver: AnimationDriver; repeat: number | boolean; isAnim: true }
  | { isAnim: false }
> = {
  // Time-driven animations, repeating
  "walk-n": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "walk-s": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },

  "walk-e": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "walk-w": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "walk-board-n": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "walk-board-s": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "walk-board-e": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "walk-board-w": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "idle-stand-n": { driver: AnimationDriver.Time, repeat: true, isAnim: true },
  "idle-stand-s": { driver: AnimationDriver.Time, repeat: true, isAnim: true },
  "idle-stand-w": { driver: AnimationDriver.Time, repeat: true, isAnim: true },
  "idle-stand-e": { driver: AnimationDriver.Time, repeat: true, isAnim: true },

  "flip-n": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "flip-s": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "flip-w": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "flip-e": { driver: AnimationDriver.Time, repeat: false, isAnim: true },

  // Time-driven animations, no repeat
  "180-f": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "180-b": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "360-f": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "360-b": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "grab-f": { driver: AnimationDriver.Time, repeat: false, isAnim: true },
  "kickflip-f": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: false,
    isAnim: true,
  },
  "kickflip-b": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: false,
    isAnim: true,
  },
  "shove-it-f": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: false,
    isAnim: true,
  },
  "shove-it-b": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: false,
    isAnim: true,
  },
  "nose-grind-f-w": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "nose-grind-b-w": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "nose-grind-f-e": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "nose-grind-b-e": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },

  "cruise-f-e": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "cruise-f-w": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "cruise-b-e": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "cruise-b-w": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },

  // Distance-based (cruise-ramp for example),
  "cruise-ramp-f-e": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-f-w": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-e": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },
  "cruise-ramp-b-w": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-up-f-w": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-up-b-w": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-up-f-e": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-up-b-e": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-down-f-w": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-down-b-w": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-down-f-e": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "jump-down-b-e": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  "ramp-land-w": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },
  "ramp-land-e": {
    driver: AnimationDriver.TimePosDeltaSync,
    repeat: false,
    isAnim: true,
  },

  // Time + movement sync
  "climb-up": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },
  "climb-down": {
    driver: AnimationDriver.TimePosVelSync,
    repeat: true,
    isAnim: true,
  },

  // Overlays, overlays follow their parent animation's settings

  "board-carry-r": { isAnim: false },
  "board-carry-l": { isAnim: false },
  "board-carry-c": { isAnim: false },

  "board-carry-idle-r": { isAnim: false },
  "board-carry-idle-l": { isAnim: false },
  "board-carry-idle-c": { isAnim: false },

  "flip-board-n": { isAnim: false },
  "flip-board-e": { isAnim: false },
  "flip-board-s": { isAnim: false },
  "flip-board-w": { isAnim: false },
};

const Motions: Record<string, { dx: number; dy: number }[]> = {
  cruise: [
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
  ],

  "jump-flat": [
    { dx: 0, dy: 4 },
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
    { dx: 0, dy: -4 },
  ],
  "jump-up-e": [{ dx: 4, dy: -8 }],
  "jump-down-e": [{ dx: 8, dy: 8 }],
  "jump-up-w": [{ dx: -4, dy: -8 }],
  "jump-down-w": [{ dx: -8, dy: 8 }],
  "jump-rail-down": [{ dx: -4, dy: 8 }],
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

      const direction = tag.name.includes("-w")
        ? "w"
        : tag.name.includes("-e")
          ? "e"
          : tag.name.includes("s")
            ? "s"
            : "n";

      const stance = tag.name.includes("-b")
        ? "b"
        : tag.name.includes("-f")
          ? "f"
          : null;

      const xDirMultiplier = tag.name.includes("-w") ? -1 : 1;

      for (let i = tag.from; i <= tag.to; i++) {
        const frame = asepriteData.frames[`${tag.name}-${i - tag.from}`];

        if (!frame) throw new Error("Missing frame data for tag frame");

        const frameData = frame.frame;
        const duration = frame.duration;

        if (settings.driver === AnimationDriver.TimePosDeltaSync) {
          const isCruiseRamp = tag.name.startsWith("cruise-ramp");
          const isLandRamp = tag.name.startsWith("ramp-land");
          const isJump = tag.name.startsWith("jump");

          if (isCruiseRamp) {
            const delta = Motions["cruise"][i - tag.from];
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
          } else if (isJump) {
            const upDown = tag.name.includes("up") ? "up" : "down";
            const motion = Motions[`jump-${upDown}-${direction}`];

            for (const d of motion) {
              frames.push({
                spritesheetX: frameData.x,
                spritesheetY: frameData.y,
                duration,
                dx: d.dx,
                dy: d.dy,
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
        const frame = asepriteData.frames[`${tag.name}-${i - tag.from}`];
        if (!frame) throw new Error("Missing frame data for tag frame");
        const frameData = frame.frame;
        frames.push({
          spritesheetX: frameData.x,
          spritesheetY: frameData.y,
        });
      }

      overlays[tag.name] = {
        spritesheet: "skater",
        frames,
      };
    }
  }

  return { animations, overlays };
}
