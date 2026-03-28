import type { Vec2 } from "./lib/types";
import type Play from "./Play";
import type Skater from "./Skater";
import { randomEl } from "./utils";
import { Path } from "./Path";
import Timer, { FIVE_MINUTES, ONE_MINUTE, TEN_MINUTES } from "./Timer";
import Obsticle, {
  obsticles,
  obsticleTricks,
  obsticleTricksSets,
  tricks,
  type ObsticleType,
  type Trick,
} from "./Obsticle";


export default class SkatingAtPark implements Updatable {
  static tag: "skating-at-park" = "skating-at-park";
  readonly tag: "skating-at-park" = SkatingAtPark.tag;

  private skater: Skater;
  private tricks: Trick[];
  private obsticles: ObsticleType[];
  private currAction: Updatable | null;
  private currObsticle: Obsticle | null;

  constructor(skater: Skater) {
    this.skater = skater;
    this.tricks = tricks.slice(0, skater.skill - 1);
    this.obsticles = obsticles.filter((o) =>
      obsticleTricks[o].some((t1) => this.tricks.includes(t1)),
    );

    this.currAction = null;
    this.currObsticle = null;
  }

  update(dt: number): void {
    // Just arrived to the park
    if (this.currAction === null || this.currAction.isComplete()) {
      const obsticleType = "ramp";

      const obsticle = (this.skater.scene as Play).obsticles.find(
        (o) => o.type === obsticleType,
      );

      // If obsticle is free for one more to go
      if (obsticle !== undefined && !obsticle.isTooCrowded()) {
        const idlePos = obsticle.arrive(this.skater.id);

        this.skater.pos.x = idlePos.x - 4;
        this.skater.pos.y = idlePos.y - this.skater.scene.art!.tileSize;

        this.currObsticle = obsticle;

        this.currAction = createAction(
          "ramp",
          this.skater,
          this.currObsticle,
          FIVE_MINUTES,
        );
      }
      // TODO: when more obsticles and actions is coming
    } else {
      if (this.currAction.isComplete()) {
        if (this.currAction.tag === "approach-obsticle") {
          this.currAction = createAction(
            (this.currAction as ApproachObsticle).obsticle.type,
            this.skater,
            (this.currAction as ApproachObsticle).obsticle,
          );
        } else {
          const obsticleType = randomEl(this.obsticles);

          const obsticle = randomEl(
            (this.skater.scene as Play).obsticles.filter(
              (o) => o.type === obsticleType,
            ),
          );

          if (obsticle === null)
            throw new Error("Obsticle is null, shouldn't happen");

          this.currObsticle = obsticle;

          this.currAction = createAction(
            "approach-obsticle",
            this.skater,
            this.currObsticle,
          );
        }
      } else {
        this.currAction.update(dt);
      }
    }
  }

  isComplete(): boolean {
    return false;
  }
}

class TrickOllie implements Updatable {
  static tag: "ollie" = "ollie";
  readonly tag: "ollie" = TrickOllie.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}

  isComplete(): boolean {
    return true;
  }
}

class TrickPopShoveIt implements Updatable {
  static tag: "pop-shove-it" = "pop-shove-it";
  readonly tag: "pop-shove-it" = TrickPopShoveIt.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class TrickKickflip implements Updatable {
  static tag: "kickflip" = "kickflip";
  readonly tag: "kickflip" = TrickKickflip.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick5050Grind implements Updatable {
  static tag: "50-50-grind" = "50-50-grind";
  readonly tag: "50-50-grind" = Trick5050Grind.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick50Grind implements Updatable {
  static tag: "5-0-grind" = "5-0-grind";
  readonly tag: "5-0-grind" = Trick50Grind.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class TrickNoseGrind implements Updatable {
  static tag: "nose-grind" = "nose-grind";
  readonly tag: "nose-grind" = TrickNoseGrind.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class TrickGrab implements Updatable {
  static tag: "grab" = "grab";
  readonly tag: "grab" = TrickGrab.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick180 implements Updatable {
  static tag: "180" = "180";
  readonly tag: "180" = Trick180.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick360 implements Updatable {
  static tag: "360" = "360";
  readonly tag: "360" = Trick360.tag;
  skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number): void {
    /**
     * General idea
     *
     * Where is the sprite
     * Where is the goal or where does the trick start
     * Create path to trick and start going there
     * Is the sprite at trick start -> do trick
     *
     * is trick done -> go back
     *
     *
     */
  }

  isComplete(): boolean {
    return false;
  }
}

class Trick360ShoveIt implements Updatable {
  static tag: "360-shove-it" = "360-shove-it";
  readonly tag: "360-shove-it" = Trick360ShoveIt.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class RailObstacle implements Updatable {
  static tag: "rail" = "rail";
  readonly tag: "rail" = RailObstacle.tag;

  private skater: Skater;

  constructor(skater: Skater, obsticle: Obsticle) {
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

  constructor(skater: Skater, obsticle: Obsticle) {
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

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

class ClimbRampObsticle implements Updatable {
  static tag: "climb-ramp" = "climb-ramp";
  readonly tag: "climb-ramp" = ClimbRampObsticle.tag;

  private skater: Skater;
  private idlePos: Vec2;

  constructor(skater: Skater, idlePos: Vec2) {
    //TODO:  Add check for skater standing at the correct pos.

    this.idlePos = idlePos;
    this.skater = skater;
  }

  update(_: number): void {
    // 1. start animation if not started
    // 2. if animation is finnished they are up
    // 3. move y upwards each update with 1
    // en animering som kommer loopa per ms enligt ett sheet, men också en rörelse som kommer att ske
  }
  isComplete(): boolean {
    return this.skater.pos.y === this.idlePos.y;
  }
}

class RampObstacle implements Updatable {
  static tag: "ramp" = "ramp";
  readonly tag: "ramp" = RampObstacle.tag;
  private skater: Skater;
  private timer: Timer;
  private currAction: null | Updatable;
  private obsticle: Obsticle;

  constructor(skater: Skater, obsticle: Obsticle, ms: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(ms);
    this.currAction = null;
    this.obsticle = obsticle;
  }

  update(_: number): void {
    if (this.currAction === null) {
      this.currAction = createAction(
        ClimbRampObsticle.tag,
        this.skater,
        this.obsticle.getMyIdlePos(this.skater.id),
      );
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === ClimbRampObsticle.tag) {
        this.obsticle.standInLine(this.skater.id);
        this.currAction = new WaitingMyTurn(this.skater, this.obsticle);
      } else if (this.currAction.tag === WaitingMyTurn.tag) {
        this.currAction = createAction(
          RampObsticleTricks.tag,
          this.skater,
          this.obsticle,
        );
      } else if (this.currAction.tag === RampObsticleTricks.tag) {
        this.obsticle.endSkate(this.skater.id);
        this.obsticle.standInLine(this.skater.id);

        this.currAction = new WaitingMyTurn(this.skater, this.obsticle);
      }
    }
  }

  isComplete(): boolean {
    return (
      this.timer.isStopped &&
      this.currAction !== null &&
      this.currAction.isComplete()
    );
  }
}

class RampCruise implements Updatable {
  static tag: "ramp-cruise" = "ramp-cruise";
  readonly tag: "ramp-cruise" = RampCruise.tag;

  private skater: Skater;

  private currRound: number;
  private rounds: number;

  constructor(skater: Skater, obsticle: Obsticle, rounds: number) {
    this.skater = skater;
    this.currRound = 0;
    this.rounds = rounds;
  }

  update(dt: number): void {
    if (
      !this.skater.animations.isPlaying("ramp-cruise-" + this.skater.direction)
    ) {
      this.skater.animations.play("ramp-cruise-" + this.skater.direction);
    }

    this.skater.animations.update(dt);
  }

  isComplete(): boolean {
    return !this.skater.animations.isPlaying("ramp-cruise-" + this.skater.direction);
  }
}

class RampObsticleTricks implements Updatable {
  static tag: "ramp-obsticle-tricks" = "ramp-obsticle-tricks";
  readonly tag: "ramp-obsticle-tricks" = RampObsticleTricks.tag;
  obsticle: Obsticle;
  skater: Skater;
  currAction: Updatable | null;
  tricks: Trick[];
  currTrickIdx: number;

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
    this.obsticle = obsticle;
    this.currAction = null;
    this.currTrickIdx = 0;
    this.tricks = tricks;
    this.tricks = randomEl(obsticleTricksSets["ramp"])!;
  }

  update(_: number): void {
    if (this.currAction === null) {
      this.currAction = createAction(
        RampCruise.tag,
        this.skater,
        this.obsticle,
        2,
      );
      // ta ett nytt trick eller göra laps in between
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === RampCruise.tag) {
        this.currAction = createAction(
          this.tricks[this.currTrickIdx],
          this.skater,
        );

        this.currTrickIdx++;
      } else {
        // Pick the correct amount of cruise rounds so that the skater is on the same side as the idle pos

        if (this.currTrickIdx === this.tricks.length - 2) {
          this.currAction = createAction(
            RampCruise.tag,
            this.skater,
            this.obsticle,
            2,
          );
        } else {
          this.currAction = createAction(
            RampCruise.tag,
            this.skater,
            this.obsticle,
            2,
          );
        }
      }
    }
  }

  isComplete(): boolean {
    return (
      this.currTrickIdx === this.tricks.length - 1 &&
      (this.currAction?.isComplete() ?? false)
    );
  }
}

class BowlObstacle implements Updatable {
  static tag: "bowl" = "bowl";
  readonly tag: "bowl" = BowlObstacle.tag;

  skater: Skater;
  tricks: Trick[];
  timer: Timer;
  currAction: Updatable;
  obsticle: Obsticle;

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
    this.tricks = obsticleTricks["bowl"];
    this.timer = new Timer();
    this.timer.start(TEN_MINUTES);
    this.currAction = new Idle(this.skater, ONE_MINUTE);
    this.obsticle = obsticle;
  }

  update(dt: number): void {
    if (this.currAction.isComplete()) {
      if (this.currAction.tag === "idle") {
        // this.currAction = new ApproachTrick(
        //   this.skater,
        //   this.obsticle.getFreeSpot(),
        // );
      } else if (this.currAction.tag === "approach-trick") {
        const trick = randomEl(this.tricks);
        const action = createAction("360", this.skater);
      }
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
  obsticle: Obsticle;
  path: Path;

  constructor(skater: Skater, obsticle: Obsticle) {
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

class ApproachTrick implements Updatable {
  static tag: "approach-trick" = "approach-trick";
  readonly tag: "approach-trick" = ApproachTrick.tag;

  skater: Skater;
  goal: Vec2;
  path: Path;

  constructor(skater: Skater, goal: Vec2) {
    this.skater = skater;
    this.goal = goal;
    this.path = new Path(this.skater, goal, (skater.scene as Play).parkGrid);
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
  private obsticle: Obsticle;

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
    this.obsticle = obsticle;
  }

  update(dt: number): void {
    // Set skater idle animation

    // 1. start idle anim
    // 2. update anim
    // 3. wait for the skater to be next in line
    this.skater.animations.update(dt);

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

  update(dt: number): void {
    // Set skater idle animation
    this.skater.animations.update(dt);
  }

  isComplete(): boolean {
    return this.timer.isStopped;
  }
}

type ActionTag =
  | "skating-at-park"
  | "idle"
  | "approach-trick"
  | "approach-obsticle"
  | "climb-ramp"
  | "waiting-my-turn"
  | "ramp-cruise"
  | "ramp-obsticle-tricks"
  | ObsticleType
  | Trick;

type ActionParams = {
  "skating-at-park": [skater: Skater];
  "approach-trick": [skater: Skater, goal: Vec2];
  "approach-obsticle": [skater: Skater, obsticle: Obsticle];
  idle: [skater: Skater, duration: number];

  ollie: [skater: Skater];
  "pop-shove-it": [skater: Skater];
  kickflip: [skater: Skater];
  "50-50-grind": [skater: Skater];
  "5-0-grind": [skater: Skater];
  "nose-grind": [skater: Skater];
  grab: [skater: Skater];
  "180": [skater: Skater];
  "360-shove-it": [skater: Skater];
  "360": [skater: Skater];

  "ramp-cruise": [skater: Skater, obsticle: Obsticle, rounds: number];
  "climb-ramp": [skater: Skater, idlePos: Vec2];
  "ramp-obsticle-tricks": [skater: Skater, obsticle: Obsticle];
  "waiting-my-turn": [skater: Skater, obsticle: Obsticle];

  bowl: [skater: Skater, obsticle: Obsticle];
  rail: [skater: Skater, obsticle: Obsticle];
  flat: [skater: Skater, obsticle: Obsticle];
  square: [skater: Skater, obsticle: Obsticle];
  ramp: [skater: Skater, obsticle: Obsticle, ms: number];
};

const ActionConstructors: { [T in ActionTag]: UpdatableConstructor<T> } = {
  "skating-at-park": SkatingAtPark,
  idle: Idle,
  "approach-trick": ApproachTrick,
  "approach-obsticle": ApproachObsticle,
  ollie: TrickOllie,
  "pop-shove-it": TrickPopShoveIt,
  kickflip: TrickKickflip,
  "50-50-grind": Trick5050Grind,
  "5-0-grind": Trick50Grind,
  "nose-grind": TrickNoseGrind,
  grab: TrickGrab,
  "180": Trick180,
  "360-shove-it": Trick360ShoveIt,
  "360": Trick360,
  "ramp-cruise": RampCruise,
  "climb-ramp": ClimbRampObsticle,
  "waiting-my-turn": WaitingMyTurn,
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

interface Updatable {
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
