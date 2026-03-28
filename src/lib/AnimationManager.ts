import type Sprite from "./objects/Sprite.js";

export type AnimationConfigT<T extends AnimationDriver> = {
  driver: T;
  frames: AnimationFrame<T>[];
  spritesheet: string;
  loop: boolean;
};

export type AnimationFrame<T extends AnimationDriver> =
  T extends AnimationDriver.Distance
    ? {
        dx: number; // sprite x movement before changing frame
        dy: number; // sprite y movement before changing frame
        spritesheetX: number;
        spritesheetY: number;
      }
    : T extends AnimationDriver.TimeMovementSync
      ? {
          dx: number; // How much sprite should move in x direction when updating
          dy: number; // How much sprite should move in y direction when updating
          spritesheetX: number;
          spritesheetY: number;
          duration: number; // ms after which frame updates
        }
      : {
          duration: number; // ms after which frame updates
          spritesheetX: number;
          spritesheetY: number;
        };

export enum AnimationDriver {
  Distance, // Animation updates to next frame when sprite has moved delta xy. // needs to keep track of sprite deltas
  TimeMovementSync, // Animation updates after frame rate ms and then movement is updated according to delta xy and animation frame is changed. // needs to keep track of accumulated delta
  Time, // Animation updates after frame rate ms. Movement is not updated.
}

type AnimationStateT<T extends AnimationDriver> =
  T extends AnimationDriver.Distance
    ? {
        startX: number;
        startY: number;
      }
    : T extends AnimationDriver.TimeMovementSync
      ? {
          elapsed: number; // ms
        }
      : {
          elapsed: number; // ms
        };

type PlayingAnimationT<T extends AnimationDriver> = {
  driver: T;
  key: string;
  config: AnimationConfigT<T>;
  state: AnimationStateT<T>;
  frameCount: number;
  loopCount: number;
  overlay?: {
    spritesheet: string;
    frames: { spritesheetX: number; spritesheetY: number }[];
  };
};

type PlayingAnimation =
  | PlayingAnimationT<AnimationDriver.Distance>
  | PlayingAnimationT<AnimationDriver.Time>
  | PlayingAnimationT<AnimationDriver.TimeMovementSync>;

type AnimationConfig =
  | AnimationConfigT<AnimationDriver.Distance>
  | AnimationConfigT<AnimationDriver.Time>
  | AnimationConfigT<AnimationDriver.TimeMovementSync>;

export default class AnimationManager {
  sprite: Sprite;
  animations: Map<string, AnimationConfig>;
  playingAnimation: PlayingAnimation | null;

  constructor(sprite: Sprite) {
    this.sprite = sprite;
    this.animations = new Map();
    this.playingAnimation = null;
  }

  create(key: string, config: AnimationConfig) {
    this.animations.set(key, config);
  }

  play(
    key: string,
    overlay?: {
      spritesheet: string;
      frames: { spritesheetX: number; spritesheetY: number }[];
    },
  ) {
    const animation = this.animations.get(key);

    if (!animation) throw new AnimationNotAddedError(key);

    switch (animation.driver) {
      case AnimationDriver.Distance:
        this.playingAnimation = {
          driver: animation.driver,
          key,
          config: animation,
          overlay,
          frameCount: 0,
          loopCount: 0,
          state: { startX: 0, startY: 0 },
        };
        break;
      case AnimationDriver.TimeMovementSync:
        this.playingAnimation = {
          driver: animation.driver,
          key,
          config: animation,
          overlay,
          frameCount: 0,
          loopCount: 0,
          state: { elapsed: 0 },
        };
        break;
      case AnimationDriver.Time:
        this.playingAnimation = {
          driver: animation.driver,
          key,
          config: animation,
          overlay,
          frameCount: 0,
          loopCount: 0,
          state: { elapsed: 0 },
        };
        break;
    }
  }

  stop(key: string) {
    if (this.playingAnimation && key === this.playingAnimation.key) {
      this.playingAnimation = null;
    }
  }

  loopCount(): number {
    return this.playingAnimation?.loopCount ?? 0;
  }

  isPlaying(key: string): boolean {
    return this.playingAnimation?.key === key;
  }

  update(dt: number): void {
    if (!this.playingAnimation) return;

    if (this.sprite.scene.art === null)
      throw new Error("art is not set on sprite's scene object");

    if (
      this.playingAnimation.frameCount >=
      this.playingAnimation.config.frames.length
    ) {
      if (!this.playingAnimation.config.loop) {
        this.playingAnimation = null;
        return;
      } else {
        this.playingAnimation.frameCount = 0;
        this.playingAnimation.loopCount++;
      }

      return;
    }

    switch (this.playingAnimation.driver) {
      case AnimationDriver.Distance: {
        const frame =
          this.playingAnimation.config.frames[
            this.playingAnimation.frameCount - 1
          ];
        const dx = this.sprite.pos.x - this.playingAnimation.state.startX;
        const dy = this.sprite.pos.y - this.playingAnimation.state.startY;

        // If sprite moved equal or more than dx and dy for frame. A delta of 0 means that the delta wasn't necessary in that direction
        if (
          ((frame.dx < 0 && dx <= frame.dx) ||
            (frame.dx > 0 && dx >= frame.dx) ||
            frame.dx === 0) &&
          ((frame.dy < 0 && dy <= frame.dy) ||
            (frame.dy > 0 && dy >= frame.dy) ||
            frame.dy === 0)
        ) {
          this.playingAnimation.frameCount++;
          this.playingAnimation.state.startX = this.sprite.pos.x;
          this.playingAnimation.state.startY = this.sprite.pos.y;
        }

        break;
      }
      case AnimationDriver.TimeMovementSync: {
        const frame =
          this.playingAnimation.config.frames[
            this.playingAnimation.frameCount - 1
          ];

        this.playingAnimation.state.elapsed += dt;

        if (this.playingAnimation.state.elapsed >= frame.duration) {
          this.playingAnimation.frameCount++;

          this.sprite.pos.x += frame.dx;
          this.sprite.pos.y += frame.dy;
        }

        break;
      }
      case AnimationDriver.Time: {
        const frame =
          this.playingAnimation.config.frames[
            this.playingAnimation.frameCount - 1
          ];

        this.playingAnimation.state.elapsed += dt;

        if (this.playingAnimation.state.elapsed >= frame.duration) {
          this.playingAnimation.frameCount++;
        }

        break;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.playingAnimation) return;

    if (this.sprite.scene.art === null)
      throw new Error("art instance is not set on scene object");

    const image = this.sprite.scene.art.images.get(
      this.playingAnimation.config.spritesheet,
    );
    if (!image)
      throw new SpriteSheetNotAddedError(
        this.playingAnimation.config.spritesheet,
      );

    const frame =
      this.playingAnimation.config.frames[this.playingAnimation.frameCount - 1];

    ctx.drawImage(
      image,
      frame.spritesheetX,
      frame.spritesheetY,
      this.sprite.width,
      this.sprite.height,
      this.sprite.pos.x,
      this.sprite.pos.y,
      this.sprite.width,
      this.sprite.height,
    );

    if (this.playingAnimation.overlay) {
      const overlayImage = this.sprite.scene.art.images.get(
        this.playingAnimation.overlay.spritesheet,
      );
      if (!overlayImage) return;

      const frame =
        this.playingAnimation.overlay.frames[
          this.playingAnimation.frameCount - 1
        ];

      ctx.drawImage(
        image,
        frame.spritesheetX,
        frame.spritesheetY,
        this.sprite.width,
        this.sprite.height,
        this.sprite.pos.x,
        this.sprite.pos.y,
        this.sprite.width,
        this.sprite.height,
      );
    }
  }
}

class SpriteSheetNotAddedError extends Error {
  constructor(key: string) {
    super(`Animation: ${key} not added.`);
  }
}

class AnimationNotAddedError extends Error {
  constructor(key: string) {
    super(`Animation: ${key} not added.`);
  }
}
