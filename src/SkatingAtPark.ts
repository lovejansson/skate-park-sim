import type Play from "./Play";
import type Skater from "./Skater";
import { randomEl, randomOdd } from "./utils";
import { Path } from "./Path";
import Timer, {
  FIVE_MINUTES,
  ONE_MINUTE,
  TEN_MINUTES,
  TEN_SECONDS,
} from "./Timer";
import Obstacle, {
  obsticles,
  obstacleTricks,
  obstacleTricksSets,
  tricks,
  type ObstacleType,
  type Trick,
  getRampSide,
  RampSide,
} from "./Obstacle";
import AnimationSequence, { TransitionType } from "./lib/AnimationSequence";

export default class SkatingAtPark implements Updatable {
  static tag: "skating-at-park" = "skating-at-park";
  readonly tag: "skating-at-park" = SkatingAtPark.tag;

  private skater: Skater;
  private tricks: Trick[];
  private obstacles: ObstacleType[];
  private currAction: Updatable | null;
  private currObstacle: Obstacle | null;
  private tileSize: number;

  constructor(skater: Skater) {
    this.skater = skater;
    this.tileSize = this.skater.tileSize;
    this.tricks = tricks.slice(0, skater.skill - 1);
    this.obstacles = obsticles.filter((o) =>
      obstacleTricks[o].some((t1) => this.tricks.includes(t1)),
    );

    this.currAction = null;
    this.currObstacle = null;
  }

  update(dt: number): void {
    if (this.currAction === null || this.currAction.isComplete()) {
      const obstacleType = "ramp";

      const obstacle = (this.skater.scene as Play).obsticles.find(
        (o) => o.type === obstacleType,
      );

      if (obstacle !== undefined && !obstacle.isTooCrowded()) {
        const idlePos = obstacle.arrive(this.skater.id);

        this.currObstacle = obstacle;

        if (this.currObstacle.type === "ramp") {
          // Set skater's position to be down below the idle position on the ramp.
          const rampSide = getRampSide(obstacle, this.tileSize, idlePos);
          const offsetY = 2 * this.tileSize; // PLace skater two tiles below ramp

          switch (rampSide) {
            case RampSide.TOP_LEFT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
            case RampSide.TOP_RIGHT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
            case RampSide.BOTTOM_RIGHT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
            case RampSide.BOTTOM_LEFT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
          }
        } else {
          this.skater.pos.x = idlePos.x;
          this.skater.pos.y = idlePos.y;
        }

        this.currAction = createAction(
          "ramp",
          this.skater,
          this.currObstacle,
          FIVE_MINUTES,
        );
      }
      // TODO: when more obsticles and actions is coming
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === "approach-obsticle") {
        this.currAction = createAction(
          (this.currAction as ApproachObsticle).obsticle.type,
          this.skater,
          (this.currAction as ApproachObsticle).obsticle,
        );
      } else {
        const obstacleType = randomEl(this.obstacles);

        const obstacle = randomEl(
          (this.skater.scene as Play).obsticles.filter(
            (o) => o.type === obstacleType,
          ),
        );

        if (obstacle === null)
          throw new Error("Obsticle is null, shouldn't happen");

        this.currObstacle = obstacle;

        this.currAction = createAction(
          "approach-obsticle",
          this.skater,
          this.currObstacle,
        );
      }
    }

    this.currAction!.update(dt);
  }

  isComplete(): boolean {
    return false;
  }
}

class RailObstacle implements Updatable {
  static tag: "rail" = "rail";
  readonly tag: "rail" = RailObstacle.tag;

  private skater: Skater;

  constructor(skater: Skater, obsticle: Obstacle) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class FlatObstacle implements Updatable {
  static tag: "flat" = "flat";
  readonly tag: "flat" = FlatObstacle.tag;
  private skater: Skater;

  constructor(skater: Skater, obsticle: Obstacle) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class SquareObstacle implements Updatable {
  static tag: "square" = "square";
  readonly tag: "square" = SquareObstacle.tag;

  private skater: Skater;

  constructor(skater: Skater, obsticle: Obstacle) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

/**
 * Skater has already arrived at the correct position at the ramp obsticle here, so this
 * class simply moves the skater up the ramp!
 */
class ClimbRampObsticle implements Updatable {
  static tag: "climb-ramp" = "climb-ramp";
  readonly tag: "climb-ramp" = ClimbRampObsticle.tag;

  private skater: Skater;
  private obstacle: Obstacle;
  private animationSequence: AnimationSequence;
  private tileSize: number;
  private rampSide: RampSide;

  constructor(skater: Skater, obstacle: Obstacle, rampSide: RampSide) {
    this.skater = skater;
    this.obstacle = obstacle;
    this.tileSize = this.skater.tileSize;
    this.rampSide = rampSide;

    this.skater.direction = (() => {
      switch (this.rampSide) {
        case RampSide.TOP_LEFT:
        case RampSide.TOP_RIGHT:
          return "s";
        case RampSide.BOTTOM_RIGHT:
        case RampSide.BOTTOM_LEFT:
          return "n";
      }
    })();

    this.skater.vel.y = (() => {
      switch (this.rampSide) {
        case RampSide.TOP_LEFT:
        case RampSide.TOP_RIGHT:
          return 1;
        case RampSide.BOTTOM_RIGHT:
        case RampSide.BOTTOM_LEFT:
          return -1;
      }
    })();

    this.animationSequence = new AnimationSequence(this.skater, [
      AnimationSequence.createAnim({
        type: TransitionType.Distance,
        anim: `walk-${this.skater.direction}`,
        transition: { dx: 0, dy: this.tileSize * this.skater.vel.y },
      }),

      AnimationSequence.createAnim({
        type: TransitionType.Distance,
        anim: "climb-up",
        transition: { dx: 0, dy: this.tileSize * 2 * this.skater.vel.y },
      }),

      AnimationSequence.createAnim({
        type: TransitionType.Distance,
        anim: `walk-${this.skater.direction}`,
        transition: {
          dx: 0,
          dy: this.tileSize * this.skater.vel.y * 0.5,
        },
      }),
    ]);
  }

  update(dt: number): void {
    if (this.animationSequence.isFinished) {
      this.skater.direction = (() => {
        switch (this.rampSide) {
          case RampSide.TOP_LEFT:
          case RampSide.BOTTOM_LEFT:
            return "e";
          case RampSide.BOTTOM_RIGHT:
          case RampSide.TOP_RIGHT:
            return "w";
        }
      })();
      if (
        !this.skater.animations.isPlaying(`idle-stand-${this.skater.direction}`)
      ) {
        this.skater.animations.play(`idle-stand-${this.skater.direction}`);
      }
    }

    this.animationSequence.update(dt);
  }

  isComplete(): boolean {
    return this.skater.animations.isPlaying(
      `idle-stand-${this.skater.direction}`,
    );
  }
}

class RampObstacle implements Updatable {
  static tag: "ramp" = "ramp";
  readonly tag: "ramp" = RampObstacle.tag;
  private skater: Skater;
  private timer: Timer;
  private currAction: null | Updatable;
  private obstacle: Obstacle;

  constructor(skater: Skater, obstacle: Obstacle, ms: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(ms);
    this.currAction = null;
    this.obstacle = obstacle;
  }

  update(dt: number): void {
    const idlePos = this.obstacle.getMyIdlePos(this.skater.id);
    const rampSide = getRampSide(this.obstacle, this.skater.tileSize, idlePos);

    if (this.currAction === null) {
      // Initially just place three skaters on the ramp and let one of them climb!

      const rampSide = getRampSide(
        this.obstacle,
        this.skater.tileSize,
        idlePos,
      );
      switch (rampSide) {
        case RampSide.TOP_LEFT:
          this.obstacle.standInLine(this.skater.id);

          this.currAction = new WaitingMyTurn(
            this.skater,
            this.obstacle,
            rampSide,
          );
          break;
        case RampSide.TOP_RIGHT:
          this.obstacle.standInLine(this.skater.id);
          this.currAction = new WaitingMyTurn(
            this.skater,
            this.obstacle,
            rampSide,
          );
          break;
        case RampSide.BOTTOM_RIGHT:
          this.currAction = createAction(
            ClimbRampObsticle.tag,
            this.skater,
            this.obstacle,
            rampSide,
          );
          break;
        case RampSide.BOTTOM_LEFT:
          this.obstacle.standInLine(this.skater.id);
          this.currAction = new WaitingMyTurn(
            this.skater,
            this.obstacle,
            rampSide,
          );
          break;
      }
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === ClimbRampObsticle.tag) {
        this.obstacle.standInLine(this.skater.id);
        this.currAction = new WaitingMyTurn(
          this.skater,
          this.obstacle,
          rampSide,
        );
      } else if (this.currAction.tag === WaitingMyTurn.tag) {
        this.currAction = createAction(
          RampObsticleTricks.tag,
          this.skater,
          this.obstacle,
          rampSide,
        );
      } else if (this.currAction.tag === RampObsticleTricks.tag) {
        this.obstacle.endSkate(this.skater.id);
        this.obstacle.standInLine(this.skater.id);

        this.currAction = new WaitingMyTurn(
          this.skater,
          this.obstacle,
          rampSide,
        );
      }
    }

    this.currAction.update(dt);
  }

  isComplete(): boolean {
    return (
      this.timer.isStopped &&
      this.currAction !== null &&
      this.currAction.isComplete()
    );
  }
}

class RampObsticleTricks implements Updatable {
  static tag: "ramp-obsticle-tricks" = "ramp-obsticle-tricks";
  readonly tag: "ramp-obsticle-tricks" = RampObsticleTricks.tag;
  obstacle: Obstacle;
  skater: Skater;
  rampSide: RampSide;
  currAction: Updatable | null;
  tricks: Trick[];
  currTrickIdx: number;
  animationSequence: AnimationSequence;
  tileSize: number;

  constructor(skater: Skater, obstacle: Obstacle, rampSide: RampSide) {
    this.skater = skater;
    this.tileSize = this.skater.tileSize;
    this.obstacle = obstacle;
    this.rampSide = rampSide;
    this.skater.pos.x += (() => {
      switch (this.rampSide) {
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return 1;
        case RampSide.BOTTOM_RIGHT:
        case RampSide.TOP_RIGHT:
          return -1;
      }
    })();
    this.currAction = null;
    this.currTrickIdx = 0;
    this.tricks = tricks;
    this.tricks = randomEl(obstacleTricksSets["ramp"])!;

    const trickSet = RampObsticleTricks.TrickSet(this.rampSide, randomOdd(10));

    this.animationSequence = new AnimationSequence(this.skater, [
      AnimationSequence.createAnim({
        anim: `walk-${(() => {
          switch (this.rampSide) {
            case RampSide.TOP_LEFT:
            case RampSide.TOP_RIGHT:
              return "s";
            case RampSide.BOTTOM_RIGHT:
            case RampSide.BOTTOM_LEFT:
              return "n";
          }
        })()}`,
        type: TransitionType.Distance,
        transition: {
          dy:
            this.tileSize *
            1.5 *
            (() => {
              switch (this.rampSide) {
                case RampSide.TOP_LEFT:
                case RampSide.TOP_RIGHT:
                  return 1;
                case RampSide.BOTTOM_RIGHT:
                case RampSide.BOTTOM_LEFT:
                  return -1;
              }
            })(),
          dx: 0,
        },
      }),
      ...trickSet.map((t) =>
        AnimationSequence.createAnim({
          anim: t,
          type: TransitionType.Finished,
          transition: null,
        }),
      ),
      AnimationSequence.createAnim({
        anim: `walk-${(() => {
          switch (this.rampSide) {
            case RampSide.TOP_LEFT:
            case RampSide.TOP_RIGHT:
              return "n";
            case RampSide.BOTTOM_RIGHT:
            case RampSide.BOTTOM_LEFT:
              return "s";
          }
        })()}`,
        type: TransitionType.Distance,
        transition: {
          dy:
            this.tileSize *
            1.5 *
            (() => {
              switch (this.rampSide) {
                case RampSide.TOP_LEFT:
                case RampSide.TOP_RIGHT:
                  return -1;
                case RampSide.BOTTOM_RIGHT:
                case RampSide.BOTTOM_LEFT:
                  return 1;
              }
            })(),
          dx: 0,
        },
      }),
    ]);
  }

  update(dt: number): void {
    if (this.animationSequence.getCurrentAnimation().name === "walk-n") {
      this.skater.vel.y = -1;
    } else if (this.animationSequence.getCurrentAnimation().name === "walk-s") {
      this.skater.vel.y = 1;
    } else if (
      this.animationSequence.getCurrentAnimation().name.startsWith("trick")
    ) {
      this.skater.pos.y =
        this.obstacle.pos.y + this.obstacle.halfHeight - this.tileSize;
    }

    this.animationSequence.update(dt);
  }

  isComplete(): boolean {
    return this.animationSequence.isFinished;
  }

  static TrickSet(startSide: RampSide, numTricks: number) {
    type Direction = "e" | "w";
    type Stance = "f" | "b";

    const set: string[] = [];

    const startDirection: Direction = (() => {
      switch (startSide) {
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return "e";
        case RampSide.TOP_RIGHT:
        case RampSide.BOTTOM_RIGHT:
          return "w";
      }
    })();

    let direction: Direction = startDirection;

    let stance: Stance = "f";

    set.push(`cruise-ramp-${stance}-${direction}`);

    for (let i = 0; i < numTricks; ++i) {
      const trick = randomEl(obstacleTricks.ramp)!;

      if (trick === "180") {
        set.push(`180-${stance}`);
        stance = stance === "f" ? "b" : "f";
      } else if (trick === "360") {
        set.push(`360-${stance}`);
      } else if (trick === "grab") {
        set.push(`grab-${stance}`);
      }

      direction = direction === "e" ? "w" : "e";
      set.push(`cruise-ramp-${stance}-${direction}`);
    }

    set.push(`ramp-land-${direction}`);

    return set;
  }
}

class BowlObstacle implements Updatable {
  static tag: "bowl" = "bowl";
  readonly tag: "bowl" = BowlObstacle.tag;

  skater: Skater;
  tricks: Trick[];
  timer: Timer;
  currAction: Updatable;
  obsticle: Obstacle;

  constructor(skater: Skater, obsticle: Obstacle) {
    this.skater = skater;
    this.tricks = obstacleTricks["bowl"];
    this.timer = new Timer();
    this.timer.start(TEN_MINUTES);
    this.currAction = new Idle(this.skater, ONE_MINUTE);
    this.obsticle = obsticle;
  }

  update(dt: number): void {
    if (this.currAction.isComplete()) {
    }
    this.currAction.update(dt);
  }

  isComplete(): boolean {
    return this.timer.isStopped;
  }
}

class ApproachObsticle implements Updatable {
  static tag: "approach-obsticle" = "approach-obsticle";
  readonly tag: "approach-obsticle" = ApproachObsticle.tag;

  skater: Skater;
  obsticle: Obstacle;
  path: Path;

  constructor(skater: Skater, obsticle: Obstacle) {
    this.skater = skater;
    this.obsticle = obsticle;
    this.path = new Path(
      this.skater,
      this.obsticle.pos,
      (skater.scene as Play).parkGrid,
    );
  }

  update(_: number): void {
    this.path.update();
  }

  isComplete(): boolean {
    return this.path.hasReachedGoal;
  }
}

class WaitingMyTurn implements Updatable {
  static tag: "waiting-my-turn" = "waiting-my-turn";
  readonly tag: "waiting-my-turn" = WaitingMyTurn.tag;
  private skater: Skater;
  private obsticle: Obstacle;
  private timer: Timer;
  private rampSide: RampSide;

  constructor(skater: Skater, obsticle: Obstacle, rampSide: RampSide) {
    this.skater = skater;
    this.obsticle = obsticle;
    this.timer = new Timer();
    this.timer.start(TEN_SECONDS);
    const idlePos = this.obsticle.getMyIdlePos(this.skater.id);
    this.rampSide = rampSide;

    this.skater.direction = (() => {
      switch (this.rampSide) {
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return "e";
        case RampSide.BOTTOM_RIGHT:
        case RampSide.TOP_RIGHT:
          return "w";
      }
    })();

    const fenceDiffX = (() => {
      switch (this.rampSide) {
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return 1;
        case RampSide.BOTTOM_RIGHT:
        case RampSide.TOP_RIGHT:
          return -1;
      }
    })();

    this.skater.pos.x = idlePos.x + fenceDiffX;
    this.skater.pos.y = idlePos.y - this.skater.tileSize * 1.5;
  }

  update(_: number): void {
    if (
      !this.skater.animations.isPlaying(`idle-stand-${this.skater.direction}`)
    ) {
      this.skater.animations.play(`idle-stand-${this.skater.direction}`);
    }

    if (this.obsticle.isMyTurn(this.skater.id)) {
      this.obsticle.skate(this.skater.id);
    }
  }

  isComplete(): boolean {
    return this.obsticle.isOccupiedByMe(this.skater.id);
  }
}

class Idle implements Updatable {
  static tag: "idle" = "idle";
  readonly tag: "idle" = Idle.tag;
  skater: Skater;
  timer: Timer;

  constructor(skater: Skater, duration: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(duration);
  }

  update(_: number): void {
    // Set skater idle animation
    if (!this.skater.animations.isPlaying(`idle-${this.skater.direction}`)) {
      this.skater.animations.play(`ìdle-${this.skater.direction}`);
    }
  }

  isComplete(): boolean {
    return this.timer.isStopped;
  }
}

type ActionTag =
  | "skating-at-park"
  | "idle"
  | "approach-obsticle"
  | "climb-ramp"
  | "waiting-my-turn"
  | "ramp-obsticle-tricks"
  | ObstacleType;

type ActionParams = {
  "skating-at-park": [skater: Skater];
  "approach-obsticle": [skater: Skater, obsticle: Obstacle];
  idle: [skater: Skater, duration: number];

  "climb-ramp": [skater: Skater, obsticle: Obstacle, rampSide: RampSide];
  "ramp-obsticle-tricks": [
    skater: Skater,
    obsticle: Obstacle,
    rampSide: RampSide,
  ];
  "waiting-my-turn": [skater: Skater, obsticle: Obstacle, rampSide: RampSide];

  bowl: [skater: Skater, obsticle: Obstacle];
  rail: [skater: Skater, obsticle: Obstacle];
  flat: [skater: Skater, obsticle: Obstacle];
  square: [skater: Skater, obsticle: Obstacle];
  ramp: [skater: Skater, obsticle: Obstacle, ms: number];
};

const ActionConstructors: { [T in ActionTag]: UpdatableConstructor<T> } = {
  "skating-at-park": SkatingAtPark,
  idle: Idle,
  "approach-obsticle": ApproachObsticle,

  "waiting-my-turn": WaitingMyTurn,
  "climb-ramp": ClimbRampObsticle,
  "ramp-obsticle-tricks": RampObsticleTricks,
  rail: RailObstacle,
  bowl: BowlObstacle,
  flat: FlatObstacle,
  square: SquareObstacle,
  ramp: RampObstacle,
};

interface UpdatableConstructor<T extends ActionTag> {
  new (...args: ActionParams[T]): Updatable;
}

export interface Updatable {
  readonly tag: ActionTag;
  update(dt: number): void;
  isComplete(): boolean;
}

function createAction<T extends ActionTag>(
  tag: T,
  ...args: ActionParams[T]
): Updatable {
  const ctor = ActionConstructors[tag];
  return new ctor(...args);
}
