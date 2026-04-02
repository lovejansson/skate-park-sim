import type Play from "./Play";
import type Skater from "./Skater";
import { randomBool, randomEl, randomInt, cellToPos, posToCell } from "./utils";
import { Path } from "./Path";
import Timer, {
  FIVE_MINUTES,
  ONE_MINUTE,
  TEN_MINUTES,
  TEN_SECONDS,
} from "./Timer";
import Obstacle, {
  obstacles,
  obstacleTricks,
  tricks,
  type ObstacleType,
  type Trick,
  ObsticleSide,
} from "./Obstacle";
import AnimationSequence, {
  TransitionType,
  type SequenceAnimation,
} from "./lib/AnimationSequence";
import type { Vec2 } from "./lib";
import { findClosestFreeCell } from "./grid";

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
    this.obstacles = obstacles.filter((o) =>
      obstacleTricks[o].some((t1) => this.tricks.includes(t1)),
    );

    this.currAction = null;
    this.currObstacle = null;
  }

  update(dt: number): void {
    if (this.currAction === null || this.currAction.isComplete()) {
      const obstacleType = "rail";

      const obstacle = (this.skater.scene as Play).obstacles.find(
        (o) => o.type === obstacleType,
      );

      if (obstacle !== undefined && !obstacle.isTooCrowded()) {
        const idlePos = obstacle.arrive(this.skater.id);

        this.currObstacle = obstacle;

        if (this.currObstacle.type === "ramp") {
          // Set skater's position to be down below the idle position on the ramp.
          const rampSide = obstacle.getIdlePosSide(this.skater.id);
          const offsetY = 2 * this.tileSize; // PLace skater two tiles below ramp

          switch (rampSide) {
            case ObsticleSide.TOP_LEFT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
            case ObsticleSide.TOP_RIGHT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
            case ObsticleSide.BOTTOM_RIGHT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
            case ObsticleSide.BOTTOM_LEFT:
              this.skater.pos.x = idlePos.x;
              this.skater.pos.y = idlePos.y + offsetY;
              break;
          }
          this.currAction = createAction(
            "ramp",
            this.skater,
            this.currObstacle,
            FIVE_MINUTES,
          );
        } else if (this.currObstacle.type === "rail") {
          this.skater.pos.x = idlePos.x;
          this.skater.pos.y = idlePos.y;

          this.currAction = createAction(
            "rail",
            this.skater,
            this.currObstacle,
            FIVE_MINUTES,
          );
        } else {
          this.skater.pos.x = idlePos.x;
          this.skater.pos.y = idlePos.y;
        }
      }
      // TODO: when more obstacles and actions is coming
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === "approach-obstacle") {
        this.currAction = createAction(
          (this.currAction as ApproachObstacle).obstacle.type,
          this.skater,
          (this.currAction as ApproachObstacle).obstacle,
        );
      } else {
        const obstacleType = randomEl(this.obstacles);

        const obstacle = randomEl(
          (this.skater.scene as Play).obstacles.filter(
            (o) => o.type === obstacleType,
          ),
        );

        if (obstacle === null)
          throw new Error("Obstacle is null, shouldn't happen");

        this.currObstacle = obstacle;

        this.currAction = createAction(
          "approach-obstacle",
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
  private timer: Timer;
  private currAction: null | Updatable;
  private obstacle: Obstacle;
  private start: { pos: Vec2; railSide: ObsticleSide };
  private end: { pos: Vec2; railSide: ObsticleSide };

  constructor(skater: Skater, obstacle: Obstacle, ms: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(ms);
    this.currAction = null;
    this.obstacle = obstacle;

    const idlePos = this.obstacle.getMyIdlePos(this.skater.id);
    const railSide = this.obstacle.getIdlePosSide(this.skater.id);

    this.start = { pos: idlePos, railSide };
    this.end = { pos: idlePos, railSide };
  }

  update(dt: number): void {
    if (this.currAction === null) {
      this.setSkaterPosBeforeWaitMyTurn();
      this.obstacle.standInLine(this.skater.id);
      this.currAction = new WaitingMyTurn(this.skater, this.obstacle);
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === WaitingMyTurn.tag) {
        const idlePos = this.obstacle.getMyIdlePos(this.skater.id);
        const railSide = this.obstacle.getIdlePosSide(this.skater.id);

        this.end = { pos: idlePos, railSide };
        this.currAction = createAction(
          RailObstacleTricks.TAG,
          this.skater,
          this.obstacle,
          this.start,
          this.end,
        );
      } else if (this.currAction.tag === RailObstacleTricks.TAG) {
        this.obstacle.endSkate(this.skater.id);
        this.obstacle.standInLine(this.skater.id);
        this.start = { ...this.end };

        this.currAction = new WaitingMyTurn(this.skater, this.obstacle);
      }
    }

    this.currAction.update(dt);
  }

  private setSkaterPosBeforeWaitMyTurn() {
    this.skater.pos.x = this.start.pos.x;
    this.skater.pos.y = this.start.pos.y - this.skater.tileSize;

    this.skater.direction = "s";
  }

  isComplete(): boolean {
    return (
      this.timer.isStopped &&
      this.currAction !== null &&
      this.currAction.isComplete()
    );
  }
}

class FlatObstacle implements Updatable {
  static tag: "flat" = "flat";
  readonly tag: "flat" = FlatObstacle.tag;
  private skater: Skater;

  constructor(skater: Skater, obstacle: Obstacle) {
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

  constructor(skater: Skater, obstacle: Obstacle) {
    this.skater = skater;
  }

  update(_: number) {}
  isComplete(): boolean {
    return true;
  }
}

/**
 * Skater has already arrived at the correct position at the ramp obstacle here, so this
 * class simply moves the skater up the ramp!
 */
class ClimbRampObstacle implements Updatable {
  static tag: "climb-ramp" = "climb-ramp";
  readonly tag: "climb-ramp" = ClimbRampObstacle.tag;

  private skater: Skater;
  private obstacle: Obstacle;
  private animationSequence: AnimationSequence;
  private tileSize: number;
  private rampSide: ObsticleSide;

  constructor(skater: Skater, obstacle: Obstacle, rampSide: ObsticleSide) {
    this.skater = skater;
    this.obstacle = obstacle;
    this.tileSize = this.skater.tileSize;
    this.rampSide = rampSide;

    this.skater.direction = (() => {
      switch (this.rampSide) {
        case ObsticleSide.TOP_LEFT:
        case ObsticleSide.TOP_RIGHT:
          return "s";
        case ObsticleSide.BOTTOM_RIGHT:
        case ObsticleSide.BOTTOM_LEFT:
          return "n";
      }
    })();

    this.skater.vel.y = (() => {
      switch (this.rampSide) {
        case ObsticleSide.TOP_LEFT:
        case ObsticleSide.TOP_RIGHT:
          return 1;
        case ObsticleSide.BOTTOM_RIGHT:
        case ObsticleSide.BOTTOM_LEFT:
          return -1;
      }
    })();

    this.animationSequence = new AnimationSequence(this.skater, [
      AnimationSequence.createAnim({
        type: TransitionType.Distance,
        anim: `walk-board-${this.skater.direction}`,
        overlay: { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 },
        transition: { dx: 0, dy: this.tileSize * this.skater.vel.y },
      }),

      AnimationSequence.createAnim({
        type: TransitionType.Distance,
        anim: "climb-up",
        overlay: { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 },
        transition: { dx: 0, dy: this.tileSize * 2 * this.skater.vel.y },
      }),

      AnimationSequence.createAnim({
        type: TransitionType.Distance,
        anim: `walk-board-${this.skater.direction}`,
        overlay: { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 },
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
          case ObsticleSide.TOP_LEFT:
          case ObsticleSide.BOTTOM_LEFT:
            return "e";
          case ObsticleSide.BOTTOM_RIGHT:
          case ObsticleSide.TOP_RIGHT:
            return "w";
        }
      })();
      if (
        !this.skater.animations.isPlaying(`idle-stand-${this.skater.direction}`)
      ) {
        const overlay = (() => {
          switch (this.rampSide) {
            case ObsticleSide.TOP_LEFT:
              return { name: "board-carry-c", drawOnTop: true, dy: 6, dx: 2 };
            case ObsticleSide.BOTTOM_LEFT:
              return { name: "board-carry-c", drawOnTop: true, dy: 6, dx: 2 };
            case ObsticleSide.BOTTOM_RIGHT:
              return {
                name: "board-carry-c",
                drawBehind: true,
                dy: -1,
                dx: -2,
              };
            case ObsticleSide.TOP_RIGHT:
              return {
                name: "board-carry-c",
                drawBehind: true,
                dy: -1,
                dx: -2,
              };
          }
        })();
        this.skater.animations.play(
          `idle-stand-${this.skater.direction}`,
          overlay,
        );
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
  private start: { pos: Vec2; rampSide: ObsticleSide };
  private end: { pos: Vec2; rampSide: ObsticleSide };

  constructor(skater: Skater, obstacle: Obstacle, ms: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(ms);
    this.currAction = null;
    this.obstacle = obstacle;

    const idlePos = this.obstacle.getMyIdlePos(this.skater.id);
    const rampSide = this.obstacle.getIdlePosSide(this.skater.id);

    this.start = { pos: idlePos, rampSide };
    this.end = { pos: idlePos, rampSide };
  }

  update(dt: number): void {
    if (this.currAction === null) {
      // Initially just place three skaters on the ramp and let one of them climb!

      const rampSide = this.obstacle.getIdlePosSide(this.skater.id);

      switch (rampSide) {
        case ObsticleSide.TOP_LEFT:
          this.obstacle.standInLine(this.skater.id);
          this.setSkaterPosBeforeWaitMyTurn();

          this.currAction = createAction(
            WaitingMyTurn.tag,
            this.skater,
            this.obstacle,
          );

          break;
        case ObsticleSide.TOP_RIGHT:
          this.obstacle.standInLine(this.skater.id);
          this.setSkaterPosBeforeWaitMyTurn();
          this.currAction = createAction(
            WaitingMyTurn.tag,
            this.skater,
            this.obstacle,
          );
          break;
        case ObsticleSide.BOTTOM_RIGHT:
          this.currAction = createAction(
            ClimbRampObstacle.tag,
            this.skater,
            this.obstacle,
            this.start.rampSide,
          );
          break;
        case ObsticleSide.BOTTOM_LEFT:
          this.obstacle.standInLine(this.skater.id);
          this.setSkaterPosBeforeWaitMyTurn();
          this.currAction = createAction(
            WaitingMyTurn.tag,
            this.skater,
            this.obstacle,
          );
          break;
      }
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === ClimbRampObstacle.tag) {
        this.obstacle.standInLine(this.skater.id);
        this.setSkaterPosBeforeWaitMyTurn();
        this.currAction = createAction(
          WaitingMyTurn.tag,
          this.skater,
          this.obstacle,
        );
      } else if (this.currAction.tag === WaitingMyTurn.tag) {
        // After WaitingMyTurn we got a new idle position assigned to the skater where they should end the round

        const idlePos = this.obstacle.getMyIdlePos(this.skater.id);
        const rampSide = this.obstacle.getIdlePosSide(this.skater.id);

        this.end = { pos: idlePos, rampSide };

        this.currAction = createAction(
          RampObstacleTricks.tag,
          this.skater,
          this.obstacle,
          this.start,
          this.end,
        );
      } else if (this.currAction.tag === RampObstacleTricks.tag) {
        this.obstacle.endSkate(this.skater.id);
        this.obstacle.standInLine(this.skater.id);

        // After skater is done, the "end" side is now the new start side.
        this.start = { ...this.end };

        this.setSkaterPosBeforeWaitMyTurn();
        this.currAction = createAction(
          WaitingMyTurn.tag,
          this.skater,
          this.obstacle,
        );
      }
    }

    this.currAction.update(dt);
  }

  private setSkaterPosBeforeWaitMyTurn() {
    this.skater.direction = (() => {
      switch (this.start.rampSide) {
        case ObsticleSide.TOP_LEFT:
        case ObsticleSide.BOTTOM_LEFT:
          return "e";
        case ObsticleSide.BOTTOM_RIGHT:
        case ObsticleSide.TOP_RIGHT:
          return "w";
      }
    })();

    const fenceDiffX = (() => {
      switch (this.start.rampSide) {
        case ObsticleSide.TOP_LEFT:
        case ObsticleSide.BOTTOM_LEFT:
          return 1;
        case ObsticleSide.BOTTOM_RIGHT:
        case ObsticleSide.TOP_RIGHT:
          return -1;
      }
    })();

    this.skater.pos.x = this.start.pos.x + fenceDiffX;
    this.skater.pos.y = this.start.pos.y - this.skater.tileSize * 1.5;
  }

  isComplete(): boolean {
    return (
      this.timer.isStopped &&
      this.currAction !== null &&
      this.currAction.isComplete()
    );
  }
}

class RailObstacleTricks implements Updatable {
  static TAG: "rail-obstacle-tricks" = "rail-obstacle-tricks";
  readonly tag: "rail-obstacle-tricks" = RailObstacleTricks.TAG;

  static CRUISE_SPEED = 6;
  static GRIND_SPEED = 4;
  static WALK_SPEED = 1;

  private obstacle: Obstacle;
  private skater: Skater;
  private animationSequence: AnimationSequence;
  private tileSize: number;
  private start: { pos: Vec2; railSide: ObsticleSide }; // Start idle pos
  private end: { pos: Vec2; railSide: ObsticleSide }; // end idle pos
  private path: Path | null;

  private step: "start" | "rail" | "return";

  constructor(
    skater: Skater,
    obstacle: Obstacle,
    start: { pos: Vec2; railSide: ObsticleSide },
    end: { pos: Vec2; railSide: ObsticleSide },
  ) {
    this.skater = skater;
    this.tileSize = this.skater.tileSize;
    this.obstacle = obstacle;
    this.start = start;
    this.end = end;

    this.step = "start";

    this.path = null;

    const trickOne = randomBool() ? randomEl(["shove-it", "kickflip"]) : null;
    const trickTwo = randomBool() ? randomEl(["shove-it", "kickflip"]) : null;

    const sequence = RailObstacleTricks.CreateAnimationSequence({
      startSide: this.start.railSide,
      tilesAfterRail: 2,
      tilesGrind: 3,
      tileSize: this.tileSize,
      tilesToRail: 2.5,
      trickOne,
      trickTwo,
    });

    this.animationSequence = new AnimationSequence(this.skater, sequence);
  }

  update(dt: number): void {
    switch (this.step) {
      case "start":
        // Go to start position
        if (this.path === null) {
          console.log(this.start.pos, this.skater.pos);
          this.path = new Path(
            this.skater,
            this.start.pos,
            (this.skater.scene as Play).parkGrid,
          );

          this.skater.animations.play(`walk-board-${this.skater.direction}`, {
            name: `board-carry-${this.skater.direction === "n" ? "l" : "r"}`,
            drawOnTop: this.skater.direction === "n",
            drawBehind: this.skater.direction !== "n",
            dy: 3,
            dx: -2,
          });
        }

        this.path.update(dt);

        if (
          !this.skater.animations
            .getPlaying()
            ?.includes("-" + this.skater.direction)
        ) {
          if (this.skater.direction === "w") {
            this.skater.animations.play(`cruise-f-${this.skater.direction}`);
          } else if (this.skater.direction === "e") {
            this.skater.animations.play(`cruise-b-${this.skater.direction}`);
          } else {
            this.skater.animations.play(`walk-board-${this.skater.direction}`, {
              name: `board-carry-${this.skater.direction === "n" ? "l" : "r"}`,
              drawOnTop: this.skater.direction === "n",
              drawBehind: this.skater.direction !== "n",
              dy: 3,
              dx: -2,
            });
          }
        }

        if (this.skater.animations.getPlaying()?.includes("cruise")) {
          this.skater.vel.x *= 4;
        }

        if (this.path.hasReachedGoal) {
          this.step = "rail";
          this.path = null;
        }
        break;
      case "rail":
        if (!this.animationSequence.hasStarted()) {
          this.animationSequence.start();
        }

        this.animationSequence.update(dt);

        const anim = this.animationSequence.getCurrentAnimation().name;

        if (anim === "walk-board-n") {
          this.skater.vel.y = -RailObstacleTricks.WALK_SPEED;
          this.skater.vel.x = 0;
        } else if (anim === "walk-board-s") {
          this.skater.vel.y = RailObstacleTricks.WALK_SPEED;
          this.skater.vel.x = 0;
        } else if (["cruise-b-e", "cruise-f-e"].includes(anim)) {
          this.skater.vel.x = RailObstacleTricks.CRUISE_SPEED;
          this.skater.vel.y = 0;
        } else if (["cruise-b-w", "cruise-f-w"].includes(anim)) {
          this.skater.vel.x = -RailObstacleTricks.CRUISE_SPEED;
          this.skater.vel.y = 0;
        } else if (["nose-grind-b-e", "nose-grind-w-e"].includes(anim)) {
          this.skater.vel.x = RailObstacleTricks.GRIND_SPEED;
          this.skater.vel.y = 0;
        } else if (["nose-grind-b-w", "nose-grind-f-w"].includes(anim)) {
          this.skater.vel.x = -RailObstacleTricks.GRIND_SPEED;
          this.skater.vel.y = 0;
        } else if (anim === "kickflip-f") {
          this.skater.vel.x = -RailObstacleTricks.GRIND_SPEED;
        } else if (anim === "kickflip-b") {
          this.skater.vel.x = RailObstacleTricks.GRIND_SPEED;
        }

        if (this.animationSequence.isFinished) {
          this.step = "return";
        }
        break;
      case "return":
        if (this.path === null) {
          const cell = findClosestFreeCell(
            posToCell(this.skater.pos, this.tileSize),
            (this.skater.scene as Play).parkGrid,
            [0],
          );
          if (cell === null) throw Error("WHY");

          this.path = new Path(
            this.skater,
            cellToPos(cell, this.tileSize),
            (this.skater.scene as Play).parkGrid,
          );
        }

        if (
          !this.skater.animations
            .getPlaying()
            ?.includes("-" + this.skater.direction)
        ) {
          if (this.skater.direction === "w") {
            this.skater.animations.play(`cruise-f-${this.skater.direction}`);
          } else if (this.skater.direction === "e") {
            this.skater.animations.play(`cruise-b-${this.skater.direction}`);
          } else {
            this.skater.animations.play(`walk-board-${this.skater.direction}`, {
              name: `board-carry-${this.skater.direction === "n" ? "l" : "r"}`,
              drawOnTop: this.skater.direction === "n",
              drawBehind: this.skater.direction !== "n",
              dy: 3,
              dx: -2,
            });
          }
        }

        this.path.update(dt);

        if (this.skater.animations.getPlaying()?.includes("cruise")) {
          this.skater.vel.x *= 4;
        }

        break;
    }
  }

  isComplete(): boolean {
    return (
      this.step === "return" && this.path !== null && this.path.hasReachedGoal
    );
  }

  static CreateAnimationSequence(params: {
    startSide: ObsticleSide;
    tileSize: number;
    tilesToRail: number;
    tilesGrind: number;
    tilesAfterRail: number;
    trickOne: string | null;
    trickTwo: string | null;
  }): SequenceAnimation[] {
    const {
      startSide,
      tileSize,
      tilesToRail,
      tilesGrind,
      trickOne,
      trickTwo,
      tilesAfterRail,
    } = params;

    const sequence: SequenceAnimation[] = [];

    const isGoingRight =
      startSide === ObsticleSide.TOP_LEFT ||
      startSide === ObsticleSide.BOTTOM_LEFT;

    const dir = isGoingRight ? "b-e" : "f-w"; // Whenever skater is going to e the stance is b and the opposite.
    const dxSign = isGoingRight ? 1 : -1;

    const pushTrick = (anim: string) =>
      sequence.push({ anim, type: TransitionType.Finished, transition: null });

    const pushJumpUp = () =>
      sequence.push({
        anim: `jump-up-${dir}`,
        type: TransitionType.Finished,
        transition: null,
      });

    const pushJumpDown = () =>
      sequence.push({
        anim: `jump-down-${dir}`,
        type: TransitionType.Finished,
        transition: null,
      });

    const pushCruise = (tiles: number) =>
      sequence.push({
        anim: isGoingRight ? "cruise-b-e" : "cruise-f-w",
        type: TransitionType.Distance,
        transition: { dx: dxSign * tileSize * tiles, dy: 0 },
      });

    // Cruise to rail
    pushCruise(tilesToRail);

    // Jump onto rail
    pushJumpUp();
    pushJumpUp();

    if (trickOne !== null)
      pushTrick(isGoingRight ? `${trickOne}-b` : `${trickOne}-f`);

    pushJumpDown();

    // Do grind
    sequence.push({
      anim: `nose-grind-${dir}`,
      type: TransitionType.Distance,
      transition: {
        dx: dxSign * tileSize * (tilesGrind + (trickTwo === null ? 0.5 : 0)),
        dy: 0,
      },
    });

    // Maybe do trick two
    if (trickTwo !== null) {
      pushJumpUp();
      pushTrick(isGoingRight ? `${trickTwo}-b` : `${trickTwo}-f`);
      pushJumpDown();
    }

    pushJumpDown();

    pushCruise(tilesAfterRail);

    return sequence;
  }
}

class RampObstacleTricks implements Updatable {
  static tag: "ramp-obstacle-tricks" = "ramp-obstacle-tricks";
  readonly tag: "ramp-obstacle-tricks" = RampObstacleTricks.tag;

  private obstacle: Obstacle;
  private skater: Skater;
  private animationSequence: AnimationSequence;
  private tileSize: number;

  private start: { pos: Vec2; rampSide: ObsticleSide };
  private end: { pos: Vec2; rampSide: ObsticleSide };

  constructor(
    skater: Skater,
    obstacle: Obstacle,
    start: { pos: Vec2; rampSide: ObsticleSide },
    end: { pos: Vec2; rampSide: ObsticleSide },
  ) {
    this.skater = skater;
    this.tileSize = this.skater.tileSize;
    this.obstacle = obstacle;

    this.start = start;
    this.end = end;
    this.skater.pos.x += (() => {
      switch (this.start.rampSide) {
        case ObsticleSide.TOP_LEFT:
        case ObsticleSide.BOTTOM_LEFT:
          return 1;
        case ObsticleSide.BOTTOM_RIGHT:
        case ObsticleSide.TOP_RIGHT:
          return -1;
      }
    })();

    const trickSet = RampObstacleTricks.TrickSet(
      this.start.rampSide,
      this.end.rampSide,
      randomInt(10),
    );

    this.animationSequence = new AnimationSequence(this.skater, [
      AnimationSequence.createAnim({
        anim: `walk-board-${(() => {
          switch (this.start.rampSide) {
            case ObsticleSide.TOP_LEFT:
            case ObsticleSide.TOP_RIGHT:
              return "s";
            case ObsticleSide.BOTTOM_RIGHT:
            case ObsticleSide.BOTTOM_LEFT:
              return "n";
          }
        })()}`,
        overlay: (() => {
          switch (this.start.rampSide) {
            case ObsticleSide.TOP_LEFT:
              return { name: "board-carry-l", drawOnTop: true, dy: 3, dx: -2 };
            case ObsticleSide.TOP_RIGHT:
              return { name: "board-carry-l", drawOnTop: true, dy: 3, dx: -2 };
            case ObsticleSide.BOTTOM_RIGHT:
              return { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 };
            case ObsticleSide.BOTTOM_LEFT:
              return { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 };
          }
        })(),
        type: TransitionType.Distance,
        transition: {
          dy:
            this.tileSize *
            1.5 *
            (() => {
              switch (this.start.rampSide) {
                case ObsticleSide.TOP_LEFT:
                case ObsticleSide.TOP_RIGHT:
                  return 1;
                case ObsticleSide.BOTTOM_RIGHT:
                case ObsticleSide.BOTTOM_LEFT:
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
          overlay:
            t === "ramp-land-w"
              ? { name: "board-carry-c", drawBehind: true, dy: -1, dx: -2 }
              : t === "ramp-land-e"
                ? { name: "board-carry-c", drawOnTop: true, dy: 5, dx: 2 }
                : undefined,
        }),
      ),
      AnimationSequence.createAnim({
        anim: `walk-board-${(() => {
          switch (this.end.rampSide) {
            case ObsticleSide.TOP_LEFT:
            case ObsticleSide.TOP_RIGHT:
              return "n";
            case ObsticleSide.BOTTOM_RIGHT:
            case ObsticleSide.BOTTOM_LEFT:
              return "s";
          }
        })()}`,
        overlay: (() => {
          switch (this.end.rampSide) {
            case ObsticleSide.TOP_LEFT:
              return { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 };
            case ObsticleSide.TOP_RIGHT:
              return { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 };
            case ObsticleSide.BOTTOM_RIGHT:
              return { name: "board-carry-l", drawOnTop: true, dy: 3, dx: -2 };
            case ObsticleSide.BOTTOM_LEFT:
              return { name: "board-carry-l", drawOnTop: true, dy: 3, dx: -2 };
          }
        })(),
        type: TransitionType.Distance,
        transition: {
          dy:
            this.tileSize *
            1.5 *
            (() => {
              switch (this.end.rampSide) {
                case ObsticleSide.TOP_LEFT:
                case ObsticleSide.TOP_RIGHT:
                  return -1;
                case ObsticleSide.BOTTOM_RIGHT:
                case ObsticleSide.BOTTOM_LEFT:
                  return 1;
              }
            })(),
          dx: 0,
        },
      }),
    ]);
  }

  update(dt: number): void {
    if (this.animationSequence.getCurrentAnimation().name === "walk-board-n") {
      this.skater.vel.y = -1;
    } else if (
      this.animationSequence.getCurrentAnimation().name === "walk-board-s"
    ) {
      this.skater.vel.y = 1;
    } else if (
      this.animationSequence.getCurrentAnimation().name.startsWith("trick")
    ) {
      this.skater.pos.y = this.obstacle.pos.y + this.obstacle.halfHeight;
    }

    this.animationSequence.update(dt);
  }

  isComplete(): boolean {
    return this.animationSequence.isFinished;
  }

  static TrickSet(
    startSide: ObsticleSide,
    endSide: ObsticleSide,
    numTricks: number,
  ) {
    type Direction = "e" | "w";
    type Stance = "f" | "b";

    const set: string[] = [];

    const startDirection: Direction = (() => {
      switch (startSide) {
        case ObsticleSide.TOP_LEFT:
        case ObsticleSide.BOTTOM_LEFT:
          return "e";
        case ObsticleSide.TOP_RIGHT:
        case ObsticleSide.BOTTOM_RIGHT:
          return "w";
      }
    })();

    const endDirection: Direction = (() => {
      switch (endSide) {
        case ObsticleSide.TOP_LEFT:
        case ObsticleSide.BOTTOM_LEFT:
          return "e";
        case ObsticleSide.TOP_RIGHT:
        case ObsticleSide.BOTTOM_RIGHT:
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

      if (i === numTricks - 1 && direction === endDirection) {
        direction = direction === "e" ? "w" : "e";
        set.push(`cruise-ramp-${stance}-${direction}`);
      }
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
  obstacle: Obstacle;

  constructor(skater: Skater, obstacle: Obstacle) {
    this.skater = skater;
    this.tricks = obstacleTricks["bowl"];
    this.timer = new Timer();
    this.timer.start(TEN_MINUTES);
    this.currAction = new Idle(this.skater, ONE_MINUTE);
    this.obstacle = obstacle;
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

class ApproachObstacle implements Updatable {
  static tag: "approach-obstacle" = "approach-obstacle";
  readonly tag: "approach-obstacle" = ApproachObstacle.tag;

  skater: Skater;
  obstacle: Obstacle;
  path: Path;

  constructor(skater: Skater, obstacle: Obstacle) {
    this.skater = skater;
    this.obstacle = obstacle;
    this.path = new Path(
      this.skater,
      this.obstacle.pos,
      (skater.scene as Play).parkGrid,
    );
  }

  update(dt: number): void {
    this.path.update(dt);
  }

  isComplete(): boolean {
    return this.path.hasReachedGoal;
  }
}

class WaitingMyTurn implements Updatable {
  static tag: "waiting-my-turn" = "waiting-my-turn";
  readonly tag: "waiting-my-turn" = WaitingMyTurn.tag;
  private skater: Skater;
  private obstacle: Obstacle;
  private timer: Timer;

  constructor(skater: Skater, obstacle: Obstacle) {
    this.skater = skater;
    this.obstacle = obstacle;
    this.timer = new Timer();
    this.timer.start(1000 * 3);
  }

  update(_: number): void {
    if (
      !this.skater.animations.isPlaying(`idle-stand-${this.skater.direction}`)
    ) {
      const overlay = (() => {
        switch (this.skater.direction) {
          case "n":
            return { name: "board-carry-r", drawBehind: true, dy: 4, dx: 0 };
          case "e":
            return { name: "board-carry-c", drawBehind: true, dy: 4, dx: 0 };
          case "s":
            return { name: "board-carry-l", drawBehind: true, dy: 4, dx: 0 };
          case "w":
            return { name: "board-carry-c", drawBehind: true, dy: -1, dx: -2 };
        }
      })();

      this.skater.animations.play(
        `idle-stand-${this.skater.direction}`,
        overlay,
      );
    }

    if (this.obstacle.isMyTurn(this.skater.id)) {
      this.obstacle.skate(this.skater.id);
    }
  }

  isComplete(): boolean {
    return this.obstacle.isOccupiedByMe(this.skater.id) && this.timer.isStopped;
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
  | "approach-obstacle"
  | "climb-ramp"
  | "waiting-my-turn"
  | "ramp-obstacle-tricks"
  | "rail-obstacle-tricks"
  | ObstacleType;

type ActionParams = {
  "skating-at-park": [skater: Skater];
  "approach-obstacle": [skater: Skater, obstacle: Obstacle];
  idle: [skater: Skater, duration: number];

  "climb-ramp": [skater: Skater, obstacle: Obstacle, rampSide: ObsticleSide];
  "ramp-obstacle-tricks": [
    skater: Skater,
    obstacle: Obstacle,
    start: { pos: Vec2; rampSide: ObsticleSide },
    end: { pos: Vec2; rampSide: ObsticleSide },
  ];
  "rail-obstacle-tricks": [
    skater: Skater,
    obstacle: Obstacle,
    start: { pos: Vec2; railSide: ObsticleSide },
    end: { pos: Vec2; railSide: ObsticleSide },
  ];
  "waiting-my-turn": [skater: Skater, obstacle: Obstacle];

  bowl: [skater: Skater, obstacle: Obstacle];
  rail: [skater: Skater, obstacle: Obstacle, ms: number];
  flat: [skater: Skater, obstacle: Obstacle];
  square: [skater: Skater, obstacle: Obstacle];
  ramp: [skater: Skater, obstacle: Obstacle, ms: number];
};

const ActionConstructors: { [T in ActionTag]: UpdatableConstructor<T> } = {
  "skating-at-park": SkatingAtPark,
  idle: Idle,
  "approach-obstacle": ApproachObstacle,
  "waiting-my-turn": WaitingMyTurn,
  "climb-ramp": ClimbRampObstacle,
  "ramp-obstacle-tricks": RampObstacleTricks,
  "rail-obstacle-tricks": RailObstacleTricks,
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
