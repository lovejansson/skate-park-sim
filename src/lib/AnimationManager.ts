import type Sprite from "./objects/Sprite.js";
import type { Vec2 } from "./types.js";

export type AnimationConfigT<T extends PositionUpdateType> = {
  driver: T;
  frames: AnimationFrameT<T>[];
  spritesheet: string;
  repeat: number | boolean;
};

export type AnimationFrameT<T extends PositionUpdateType> =
  T extends PositionUpdateType.Delta
    ? {
        dx: number;
        dy: number;
        duration: number;
        spritesheetX: number;
        spritesheetY: number;
      }
    : {
        spritesheetX: number;
        spritesheetY: number;
        duration: number;
      };

export type AnimationFrame =
  | AnimationFrameT<PositionUpdateType.Delta>
  | AnimationFrameT<PositionUpdateType.Vel>;

export enum PositionUpdateType {
  Delta, // Animation updates to next frame after duration ms. Sprite's position is also updated according to dx and dy.
  Vel, // Animation updates to next frame after duration ms. Sprite's position is also updated according to sprite's velocity.
}

type AnimationStateT<T extends PositionUpdateType> =
  T extends PositionUpdateType.Delta
    ? {
        startX: number;
        startY: number;
        elapsed: number;
      }
    : T extends PositionUpdateType.Vel
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
type PlayingAnimationT<T extends PositionUpdateType> = {
  driver: T;
  key: string;
  config: AnimationConfigT<T>;
  state: AnimationStateT<T>;
  frameCount: number;
  loopCount: number;
  overlay?: AnimationOverlay & {
    dx?: number;
    dy?: number;
    drawBehind?: boolean;
    drawOnTop?: boolean;
    name: string;
  };
};

type PlayingAnimation =
  | PlayingAnimationT<PositionUpdateType.Delta>
  | PlayingAnimationT<PositionUpdateType.Vel>;

export type AnimationConfig =
  | AnimationConfigT<PositionUpdateType.Delta>
  | AnimationConfigT<PositionUpdateType.Vel>;

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

  getEstimatedDistanceForAnim(name: string, vel?: Vec2): Vec2 {
    const anim = this.animations.get(name);

    if (!anim) throw new AnimationNotAddedError(name);

    const dist = { x: 0, y: 0 };

    switch (anim.driver) {
      case PositionUpdateType.Delta:
        if (anim.repeat === false) {
          for (const f of anim.frames) {
            dist.x += f.dx;
            dist.y += f.dy;
          }
        } else if (typeof anim.repeat === "number") {
          for (let i = 0; i < anim.repeat; ++i) {
            for (const f of anim.frames) {
              dist.x += f.dx;
              dist.y += f.dy;
            }
          }
        } else {
          dist.x = Infinity;
          dist.y = Infinity;

          for (const f of anim.frames) {
            dist.x += f.dx;
            dist.y += f.dy;
          }

          if (dist.x !== 0) {
            dist.x = Infinity * Math.sign(dist.x);
          }

          if (dist.y !== 0) {
            dist.y = Infinity * Math.sign(dist.y);
          }
        }

        break;
      case PositionUpdateType.Vel:
        for (let i = 0; i < anim.frames.length; ++i) {
          dist.x += vel?.x ?? 0;
          dist.y += vel?.y ?? 0;
        }
        break;
    }

    return dist;
  }

  play(
    name: string,
    overlay?: {
      name: string;
      dx?: number;
      dy?: number;
      drawBehind?: boolean;
      drawOnTop?: boolean;
    },
  ) {
    const anim = this.animations.get(name);

    if (!anim) throw new AnimationNotAddedError(name);

    const animationOverlay =
      overlay !== undefined ? this.overlays.get(overlay.name) : undefined;

    switch (anim.driver) {
      case PositionUpdateType.Delta:
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
      case PositionUpdateType.Vel:
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

  isLastFrame(): boolean {
    return (
      this.playingAnimation?.frameCount ===
      this.playingAnimation?.config.frames.length
    );
  }

  getPlaying(): string | null {
    return this.playingAnimation?.key ?? null;
  }

  update(dt: number): void {
    //  console.dir(this.playingAnimation?.key);

    if (this.sprite.scene.art === null)
      throw new Error("art is not set on sprite's scene object");

    if (this.playingAnimation === null) return;

    switch (this.playingAnimation.driver) {
      case PositionUpdateType.Delta: {
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
      case PositionUpdateType.Vel: {
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
    }

    const numFrames = this.playingAnimation.config.frames.length;

    if (this.playingAnimation.frameCount === numFrames) {
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

    if (
      this.playingAnimation.overlay &&
      this.playingAnimation.overlay.drawBehind
    ) {
      const overlaySpritesheet = this.sprite.scene.art.images.get(
        this.playingAnimation.overlay.spritesheet,
      );
      if (!overlaySpritesheet) return;

      const frame =
        this.playingAnimation.overlay.frames[
          this.playingAnimation.frameCount
        ] || this.playingAnimation.overlay.frames[0];

      ctx.drawImage(
        image,
        frame.spritesheetX,
        frame.spritesheetY,
        this.sprite.width,
        this.sprite.height,
        this.sprite.pos.x + (this.playingAnimation.overlay.dx ?? 0),
        this.sprite.pos.y +
          (this.playingAnimation.overlay.dy ?? 0) -
          this.sprite.scene.art!.tileSize,
        this.sprite.width,
        this.sprite.height,
      );
    }

    const frame =
      this.playingAnimation.config.frames[this.playingAnimation.frameCount];

    ctx.drawImage(
      image,
      frame.spritesheetX,
      frame.spritesheetY,
      this.sprite.width,
      this.sprite.height,
      this.sprite.pos.x,
      this.sprite.pos.y - this.sprite.scene.art!.tileSize,
      this.sprite.width,
      this.sprite.height,
    );

    if (
      this.playingAnimation.overlay &&
      this.playingAnimation.overlay.drawOnTop
    ) {
      const overlaySpritesheet = this.sprite.scene.art.images.get(
        this.playingAnimation.overlay.spritesheet,
      );
      if (!overlaySpritesheet) return;

      const frame =
        this.playingAnimation.overlay.frames[
          this.playingAnimation.frameCount
        ] || this.playingAnimation.overlay.frames[0];

      ctx.drawImage(
        image,
        frame.spritesheetX,
        frame.spritesheetY,
        this.sprite.width,
        this.sprite.height,
        this.sprite.pos.x + (this.playingAnimation.overlay.dx ?? 0),
        this.sprite.pos.y +
          (this.playingAnimation.overlay.dy ?? 0) -
          this.sprite.scene.art!.tileSize,
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
