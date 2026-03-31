import type Sprite from "./objects/Sprite";

export enum TransitionType {
  Distance, // Animation changes when sprite has moved enough distance
  Time, // Animation changes when enough time ms as passed
  Finished, // Animation changes when the current animation is done (works for non repeated animations)
}

type TransitionCondition<T extends TransitionType> =
  T extends TransitionType.Distance
    ? { dx: number; dy: number }
    : T extends TransitionType.Time
      ? { duration: number }
      : null;

type SequenceAnimation<T extends TransitionType> = {
  type: T;
  anim: string;
  transition: TransitionCondition<T>;
};

type PlayingAnimation<T extends TransitionType> =
  T extends TransitionType.Distance
    ? { type: T; anim: SequenceAnimation<T> } & { x: number; y: number }
    : T extends TransitionType.Time
      ? { type: T; anim: SequenceAnimation<T> } & { duration: number }
      : { type: T; anim: SequenceAnimation<T> };

export default class AnimationSequence {
  private sequence: (
    | SequenceAnimation<TransitionType.Distance>
    | SequenceAnimation<TransitionType.Time>
    | SequenceAnimation<TransitionType.Finished>
  )[];

  private currIdx;
  private sprite: Sprite;
  private playingAnim:
    | PlayingAnimation<TransitionType.Distance>
    | PlayingAnimation<TransitionType.Time>
    | PlayingAnimation<TransitionType.Finished>
    | null;

  isFinished: boolean;

  constructor(
    sprite: Sprite,
    sequence: (
      | SequenceAnimation<TransitionType.Distance>
      | SequenceAnimation<TransitionType.Time>
      | SequenceAnimation<TransitionType.Finished>
    )[],
  ) {
    this.sprite = sprite;
    this.sequence = sequence;
    this.currIdx = 0;
    this.playingAnim = null;
    this.isFinished = false;
    this.initPlayingAnimation();
  }

  static createAnim<T extends TransitionType>(config: {
    anim: string;
    type: T;
    transition: TransitionCondition<T>;
  }): SequenceAnimation<T> {
    return {
      type: config.type,
      anim: config.anim,
      transition: config.transition,
    };
  }

  getCurrentAnimation() {
    return { name: this.sequence[this.currIdx]?.anim, index: this.currIdx };
  }

  update(dt: number): void {
    if (this.isFinished) return;

    if (this.playingAnim === null) {
      this.initPlayingAnimation();
    }

    const playingAnim = this.playingAnim!;

    switch (playingAnim.type) {
      case TransitionType.Distance: {
        const targetDx = playingAnim.anim.transition.dx;
        const targetDy = playingAnim.anim.transition.dy;
        const spriteDx = this.sprite.pos.x - playingAnim.x;
        const spriteDy = this.sprite.pos.y - playingAnim.y;

        const hasReached =
          (targetDx === 0 ||
            (Math.sign(targetDx) === Math.sign(spriteDx) &&
              Math.abs(spriteDx) >= Math.abs(targetDx))) &&
          (targetDy === 0 ||
            (Math.sign(targetDy) === Math.sign(spriteDy) &&
              Math.abs(spriteDy) >= Math.abs(targetDy)));

        if (hasReached) {
          this.currIdx++;
          if (this.currIdx === this.sequence.length) {
            this.isFinished = true;
          } else {
            this.initPlayingAnimation();
          }
        }
        break;
      }
      case TransitionType.Time:
        playingAnim.duration += dt;

        if (playingAnim.duration >= playingAnim.anim.transition.duration) {
          this.currIdx++;
          if (this.currIdx === this.sequence.length) {
            this.isFinished = true;
          } else {
            this.initPlayingAnimation();
          }
        }
        break;
      case TransitionType.Finished:
        if (!this.sprite.animations.isPlaying(playingAnim.anim.anim)) {
          this.currIdx++;
          if (this.currIdx === this.sequence.length) {
            this.isFinished = true;
          } else {
            this.initPlayingAnimation();
          }
        }
        break;
    }
  }

  private initPlayingAnimation() {

    const anim = this.sequence[this.currIdx];

    switch (anim.type) {
      case TransitionType.Distance:
        this.playingAnim = {
          type: TransitionType.Distance,
          anim,
          x: this.sprite.pos.x,
          y: this.sprite.pos.y,
        };

        break;
      case TransitionType.Time:
        this.playingAnim = { type: TransitionType.Time, anim, duration: 0 };
        break;
      case TransitionType.Finished:
        this.playingAnim = { type: TransitionType.Finished, anim };
        break;
    }

    this.sprite.animations.play(anim.anim);
  }
}
