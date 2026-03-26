import type { Vec2 } from "./lib/types";
import type Play from "./Play";
import type Skater from "./Skater";
import { randomEl } from "./utils";
import { Path } from "./Path";
import Timer, { ONE_MINUTE, TEN_MINUTES } from "./Timer";
import Obsticle, {
  obsticles,
  obsticleTricks,
  tricks,
  type ObsticleType,
  type Trick,
} from "./Obsticle";

export default class SkatingAtPark implements Updatable {
  static tag: ActionTag = "skating-at-park";
  readonly tag: ActionTag = SkatingAtPark.tag;

  private skater: Skater;
  private tricks: Trick[];
  private obsticles: ObsticleType[];
  private currAction: Updatable;
  private currObsticle: Obsticle;

  constructor(skater: Skater) {
    this.skater = skater;
    this.tricks = tricks.slice(0, skater.skill - 1);
    this.obsticles = obsticles.filter((o) =>
      obsticleTricks[o].some((t1) => this.tricks.includes(t1)),
    );

    const obsticleType = randomEl(this.obsticles);

    this.currObsticle = randomEl(
      (this.skater.scene as Play).obsticles.filter(
        (o) => o.type === obsticleType,
      ),
    );

    this.currAction = createAction(
      obsticleType,
      this.skater,
      this.currObsticle,
    );
  }

  update(elapsed: number): void {
    /**
     * Antingen
     *
     * sitta vid kanten och vila
     *
     * Skata vid ett obsticle där obsticle avgör vilken obsticle action som görs
     *
     * Köpa en dricka vid vending machines och gå tillbaka och sätta sig
     *
     */

    this.currAction.update(elapsed);

    if (this.currAction.isComplete()) {
      if (this.currAction.tag === "approach-obsticle") {
        this.currAction = createAction(
          this.currObsticle.type,
          this.skater,
          this.currObsticle,
        );
      } else {
        const obsticleType = randomEl(this.obsticles);
        this.currObsticle = randomEl(
          (this.skater.scene as Play).obsticles.filter(
            (o) => o.type === obsticleType,
          ),
        );

        this.currAction = createAction(
          "approach-obsticle",
          this.skater,
          this.currObsticle.pos,
        );
      }
    }
  }

  isComplete(): boolean {
    return false;
  }
}

class TrickOllie implements Updatable {
  static tag: ActionTag = "ollie";
  readonly tag: ActionTag = TrickOllie.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}

  isComplete(): boolean {
    return true;
  }
}

class TrickPopShoveIt implements Updatable {
  static tag: ActionTag = "pop-shove-it";
  readonly tag: ActionTag = TrickPopShoveIt.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class TrickKickflip implements Updatable {
  static tag: ActionTag = "kickflip";
  readonly tag: ActionTag = TrickKickflip.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick5050Grind implements Updatable {
  static tag: ActionTag = "50-50-grind";
  readonly tag: ActionTag = Trick5050Grind.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick50Grind implements Updatable {
  static tag: ActionTag = "5-0-grind";
  readonly tag: ActionTag = Trick50Grind.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class TrickNoseGrind implements Updatable {
  static tag: ActionTag = "nose-grind";
  readonly tag: ActionTag = TrickNoseGrind.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class TrickGrab implements Updatable {
  static tag: ActionTag = "grab";
  readonly tag: ActionTag = TrickGrab.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick180 implements Updatable {
  static tag: ActionTag = "180";
  readonly tag: ActionTag = Trick180.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class Trick360 implements Updatable {
  tag: "360" = "360";
  skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(elapsed: number): void {
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
  static tag: ActionTag = "360-shove-it";
  readonly tag: ActionTag = Trick360ShoveIt.tag;

  private skater: Skater;

  constructor(skater: Skater) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class RailObstacle implements Updatable {
  static tag: ActionTag = "rail";
  readonly tag: ActionTag = RailObstacle.tag;

  private skater: Skater;

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class FlatObstacle implements Updatable {
  static tag: ActionTag = "flat";
  readonly tag: ActionTag = FlatObstacle.tag;
  private skater: Skater;

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class SquareObstacle implements Updatable {
  static tag: ActionTag = "square";
  readonly tag: ActionTag = SquareObstacle.tag;

  private skater: Skater;

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
  }

  update(deltaTime: number) {}
  isComplete(): boolean {
    return true;
  }
}

class RampObstacle implements Updatable {
  static tag: ActionTag = "ramp";
  readonly tag: ActionTag = RampObstacle.tag;

  private skater: Skater;

  constructor(skater: Skater, obsticle: Obsticle) {
    this.skater = skater;
  }

  update(elapsed: number): void {}

  isComplete(): boolean {
    return true;
  }
}

class BowlObstacle implements Updatable {
  static tag: ActionTag = "bowl";
  readonly tag: ActionTag = BowlObstacle.tag;

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

  update(elapsed: number): void {
    if (this.currAction.isComplete()) {
      if (this.currAction.tag === "idle") {
        this.currAction = new ApproachTrick(this.skater, this.obsticle.getFreeSpot());
      } else if (this.currAction.tag === "approach-trick") {
        const trick = randomEl(this.tricks);
        const action = createAction("360", this.skater);
      }
    }

    this.currAction.update(elapsed);
  }

  isComplete(): boolean {
    return this.timer.isStopped;
  }
}

class ApproachObsticle implements Updatable {
  static tag: ActionTag = "approach-obsticle";
  readonly tag: ActionTag = ApproachObsticle.tag;

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

class ApproachTrick implements Updatable {
  static tag: ActionTag = "approach-trick";
  readonly tag: ActionTag = ApproachTrick.tag;

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

class Idle implements Updatable {
  static tag: ActionTag = "idle";
  readonly tag: ActionTag = Idle.tag;
  skater: Skater;
  timer: Timer;

  constructor(skater: Skater, duration: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(duration);
  }

  update(elapsed: number): void {
    // Set skater idle animation
    this.skater.animations.update();
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
  | ObsticleType
  | Trick;

type ActionParams = {
  "skating-at-park": [skater: Skater];
  "approach-trick": [skater: Skater, goal: Vec2];
  "approach-obsticle": [skater: Skater, goal: Vec2];
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

  bowl: [skater: Skater, obsticle: Obsticle];
  rail: [skater: Skater, obsticle: Obsticle];
  flat: [skater: Skater, obsticle: Obsticle];
  square: [skater: Skater, obsticle: Obsticle];
  ramp: [skater: Skater, obsticle: Obsticle];
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
  update(elapsed: number): void;
  isComplete(): boolean;
}

function createAction<T extends ActionTag>(
  tag: T,
  ...args: ActionParams[T]
): Updatable {
  const ctor = ActionConstructors[tag];
  return new ctor(...args);
}
