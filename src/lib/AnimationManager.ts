import type Sprite from "./objects/Sprite.js";

export type AnimationConfigT<T extends AnimationDriver> = {
  driver: T;
  frames: AnimationFrameT<T>[];
  spritesheet: string;
  repeat: number | boolean; // repeat number of times or true for infinite or false for no
};

export type AnimationFrameT<T extends AnimationDriver> =
  T extends AnimationDriver.Distance
    ? {
        dx: number;
        dy: number;
        duration: number;
        spritesheetX: number;
        spritesheetY: number;
      }
    : T extends AnimationDriver.TimeMovementSync
      ? {
          spritesheetX: number;
          spritesheetY: number;
          duration: number;
        }
      : {
          duration: number;
          spritesheetX: number;
          spritesheetY: number;
        };
export type AnimationFrame =
  | AnimationFrameT<AnimationDriver.Distance>
  | AnimationFrameT<AnimationDriver.Time>
  | AnimationFrameT<AnimationDriver.TimeMovementSync>;

export enum AnimationDriver {
  Distance, // Animation updates to next frame after duration ms. Sprite's position is also updated according to dx and dy.
  TimeMovementSync, // Animation updates to next frame after duration ms. Sprite's position is also updated according to sprite's velocity.
  Time, // Animation updates after frame rate ms. Movement is not updated at all.
}

type AnimationStateT<T extends AnimationDriver> =
  T extends AnimationDriver.Distance
    ? {
        startX: number;
        startY: number;
        elapsed: number;
      }
    : T extends AnimationDriver.TimeMovementSync
      ? {
          elapsed: number;
        }
      : {
          elapsed: number;
        };

export type AnimationOverlay = {
  spritesheet: string;
  frames: { spritesheetX: number; spritesheetY: number }[];
};
type PlayingAnimationT<T extends AnimationDriver> = {
  driver: T;
  key: string;
  config: AnimationConfigT<T>;
  state: AnimationStateT<T>;
  frameCount: number;
  loopCount: number;
  overlay?: AnimationOverlay & { dx?: number; dy?: number, drawBehind?: boolean, drawOnTop?: boolean, name: string };
};

type PlayingAnimation =
  | PlayingAnimationT<AnimationDriver.Distance>
  | PlayingAnimationT<AnimationDriver.Time>
  | PlayingAnimationT<AnimationDriver.TimeMovementSync>;

export type AnimationConfig =
  | AnimationConfigT<AnimationDriver.Distance>
  | AnimationConfigT<AnimationDriver.Time>
  | AnimationConfigT<AnimationDriver.TimeMovementSync>;

export default class AnimationManager {
  sprite: Sprite;
  animations: Map<string, AnimationConfig>;
  overlays: Map<string, AnimationOverlay>;
  playingAnimation: PlayingAnimation | null;

  constructor(sprite: Sprite) {
    this.sprite = sprite;
    this.animations = new Map();
    this.overlays = new Map();
    this.playingAnimation = null;
  }

  createAnim(name: string, config: AnimationConfig) {
    this.animations.set(name, config);
  }

  createOverlay(name: string, overlay: AnimationOverlay) {
    this.overlays.set(name, overlay);
  }

  play(
    name: string,
    overlay?: { name: string; dx?: number; dy?: number; drawBehind?: boolean },
  ) {
    const anim = this.animations.get(name);

    const animationOverlay =
      overlay !== undefined ? this.overlays.get(overlay.name) : undefined;

    if (!anim) throw new AnimationNotAddedError(name);

    switch (anim.driver) {
      case AnimationDriver.Distance:
        this.playingAnimation = {
          driver: anim.driver,
          key: name,
          config: anim,
          overlay:
            animationOverlay && overlay
              ? { ...animationOverlay, ...overlay }
              : undefined,
          frameCount: 0,
          loopCount: 0,
          state: { startX: 0, startY: 0, elapsed: 0 },
        };
        break;
      case AnimationDriver.TimeMovementSync:
        this.playingAnimation = {
          driver: anim.driver,
          key: name,
          config: anim,
          overlay:
            animationOverlay && overlay
              ? { ...animationOverlay, ...overlay }
              : undefined,
          frameCount: 0,
          loopCount: 0,
          state: { elapsed: 0 },
        };
        break;
      case AnimationDriver.Time:
        this.playingAnimation = {
          driver: anim.driver,
          key: name,
          config: anim,
          overlay:
            animationOverlay && overlay
              ? { ...animationOverlay, ...overlay }
              : undefined,
          frameCount: 0,
          loopCount: 0,
          state: { elapsed: 0 },
        };
        break;
    }
  }

  stop(name: string) {
    if (this.playingAnimation && name === this.playingAnimation.key) {
      this.playingAnimation = null;
    }
  }

  loopCount(): number {
    return this.playingAnimation?.loopCount ?? 0;
  }

  isPlaying(name: string): boolean {
    return this.playingAnimation?.key === name;
  }

  update(dt: number): void {
    if (this.sprite.scene.art === null)
      throw new Error("art is not set on sprite's scene object");

    if (this.playingAnimation === null) return;

    switch (this.playingAnimation.driver) {
      case AnimationDriver.Distance: {
        const frame =
          this.playingAnimation.config.frames[this.playingAnimation.frameCount];

        this.playingAnimation.state.elapsed += dt;

        if (this.playingAnimation.state.elapsed >= frame.duration) {
          this.playingAnimation.frameCount++;
          this.sprite.pos.x += frame.dx;
          this.sprite.pos.y += frame.dy;

          this.playingAnimation.state.elapsed = 0;
        }

        break;
      }
      case AnimationDriver.TimeMovementSync: {
        const frame =
          this.playingAnimation.config.frames[this.playingAnimation.frameCount];

        this.playingAnimation.state.elapsed += dt;

        if (this.playingAnimation.state.elapsed >= frame.duration) {
          this.playingAnimation.frameCount++;

          this.sprite.pos.x += this.sprite.vel.x;
          this.sprite.pos.y += this.sprite.vel.y;

          this.playingAnimation.state.elapsed = 0;
        }

        break;
      }
      case AnimationDriver.Time: {
        const frame =
          this.playingAnimation.config.frames[this.playingAnimation.frameCount];

        this.playingAnimation.state.elapsed += dt;

        if (this.playingAnimation.state.elapsed >= frame.duration) {
          this.playingAnimation.frameCount++;
          this.playingAnimation.state.elapsed = 0;
        }

        break;
      }
    }

    if (
      this.playingAnimation.frameCount ===
      this.playingAnimation.config.frames.length
    ) {
      if (this.playingAnimation.config.repeat === false) {
        this.playingAnimation = null;
      } else if (typeof this.playingAnimation.config.repeat === "number") {
        if (
          this.playingAnimation.config.repeat ===
          this.playingAnimation.loopCount
        ) {
          this.playingAnimation = null;
        } else {
          this.playingAnimation.frameCount = 0;
          this.playingAnimation.loopCount++;
        }
      } else {
        this.playingAnimation.frameCount = 0;
        this.playingAnimation.loopCount++;
      }

      return;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.playingAnimation === null) return;

    if (this.sprite.scene.art === null)
      throw new Error("art instance is not set on scene object");

    const image = this.sprite.scene.art.images.get(
      this.playingAnimation.config.spritesheet,
    );
    if (!image)
      throw new SpriteSheetNotAddedError(
        this.playingAnimation.config.spritesheet,
      );

    if (this.playingAnimation.overlay && this.playingAnimation.overlay.drawBehind) {
      const overlaySpritesheet = this.sprite.scene.art.images.get(
        this.playingAnimation.overlay.spritesheet,
      );
      if (!overlaySpritesheet) return;

      const frame = this.playingAnimation.overlay.frames[0];

      ctx.drawImage(
        image,
        frame.spritesheetX,
        frame.spritesheetY,
        this.sprite.width,
        this.sprite.height,
        this.sprite.pos.x + (this.playingAnimation.overlay.dx ?? 0),
        this.sprite.pos.y + (this.playingAnimation.overlay.dy ?? 0),
        this.sprite.width,
        this.sprite.height,
      );
    }

    const frame =
      this.playingAnimation.config.frames[this.playingAnimation.frameCount];

    // console.log(frame, this.playingAnimation.frameCount,this.playingAnimation.config.frames);
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

    if (this.playingAnimation.overlay && this.playingAnimation.overlay.drawOnTop) {
      const overlaySpritesheet = this.sprite.scene.art.images.get(
        this.playingAnimation.overlay.spritesheet,
      );
      if (!overlaySpritesheet) return;

      const frame = this.playingAnimation.overlay.frames[0];

      ctx.drawImage(
        image,
        frame.spritesheetX,
        frame.spritesheetY,
        this.sprite.width,
        this.sprite.height,
        this.sprite.pos.x + (this.playingAnimation.overlay.dx ?? 0),
        this.sprite.pos.y + (this.playingAnimation.overlay.dy ?? 0),
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
