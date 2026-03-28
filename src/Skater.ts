import { Sprite } from "./lib";
import { AnimationDriver } from "./lib/AnimationManager";
import type { Vec2 } from "./lib/types";
import type Play from "./Play";

type Skill = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export default class Skater extends Sprite {
  skill: Skill;
  who: string;

  constructor(scene: Play, pos: Vec2, who: string, skill: Skill) {
    super(scene, pos, 16, 32, "s");

    this.who = who;
    this.skill = skill;

    this.animations.create("cruise-ramp-e", {
      driver: AnimationDriver.Distance,
      loop: false,
      spritesheet: "cruise-ramp",
      frames: [
        { spritesheetX: 0, spritesheetY: 0, dx: 0, dy: 8 },
        { spritesheetX: 16, spritesheetY: 0, dx: 0, dy: 8 },
        { spritesheetX: 32, spritesheetY: 0, dx: 0, dy: 8 },
        { spritesheetX: 48, spritesheetY: 0, dx: 0, dy: 8 },
        { spritesheetX: 64, spritesheetY: 0, dx: 0, dy: -8 },
        { spritesheetX: 80, spritesheetY: 0, dx: 0, dy: -8 },
        { spritesheetX: 96, spritesheetY: 0, dx: 0, dy: -8 },
        { spritesheetX: 112, spritesheetY: 0, dx: 0, dy: -8 },
      ],
    });

    this.animations.create("cruise-ramp-w", {
      driver: AnimationDriver.Distance,
      loop: false,
      spritesheet: "cruise-ramp",
      frames: [
        { spritesheetX: 0, spritesheetY: 0, dx: 0, dy: -8 },
        { spritesheetX: 16, spritesheetY: 0, dx: 0, dy: -8 },
        { spritesheetX: 32, spritesheetY: 0, dx: 0, dy: -8 },
        { spritesheetX: 48, spritesheetY: 0, dx: 0, dy: -8 },
        { spritesheetX: 64, spritesheetY: 0, dx: 0, dy: 8 },
        { spritesheetX: 80, spritesheetY: 0, dx: 0, dy: 8 },
        { spritesheetX: 96, spritesheetY: 0, dx: 0, dy: 8 },
        { spritesheetX: 112, spritesheetY: 0, dx: 0, dy: 8 },
      ],
    });

    this.animations.create("idle-stand-w", {
      driver: AnimationDriver.Time,
      loop: true,
      spritesheet: "idle-standing",
      frames: [
        { spritesheetX: 0, spritesheetY: 0, duration: 300 },
        { spritesheetX: 16, spritesheetY: 0, duration: 300 },
        { spritesheetX: 32, spritesheetY: 0, duration: 300 },
        { spritesheetX: 48, spritesheetY: 0, duration: 300 },
      ],
    });

    this.animations.create("idle-stand-w", {
      driver: AnimationDriver.Time,
      loop: true,
      spritesheet: "idle-standing",
      frames: [
        { spritesheetX: 0, spritesheetY: 0, duration: 300 },
        { spritesheetX: 16, spritesheetY: 0, duration: 300 },
        { spritesheetX: 32, spritesheetY: 0, duration: 300 },
        { spritesheetX: 48, spritesheetY: 0, duration: 300 },
      ],
    });

    this.animations.create("idle-stand-e", {
      driver: AnimationDriver.Time,
      loop: true,
      spritesheet: "idle-stand",
      frames: [
        { spritesheetX: 64, spritesheetY: 0, duration: 300 },
        { spritesheetX: 80, spritesheetY: 0, duration: 300 },
        { spritesheetX: 96, spritesheetY: 0, duration: 300 },
        { spritesheetX: 112, spritesheetY: 0, duration: 300 },
      ],
    });

    this.animations.create("climb", {
      driver: AnimationDriver.TimeMovementSync,
      loop: true,
      spritesheet: "climb",
      frames: [
        { spritesheetX: 0, spritesheetY: 0, duration: 250, dx: 0, dy: 4 },
        { spritesheetX: 16, spritesheetY: 0, duration: 250, dx: 0, dy: 4 },
        { spritesheetX: 32, spritesheetY: 0, duration: 250, dx: 0, dy: 4 },
        { spritesheetX: 48, spritesheetY: 0, duration: 250, dx: 0, dy: 4 },
      ],
    });
  }

  update(): void {
    throw new Error("Method not implemented.");
  }
}
