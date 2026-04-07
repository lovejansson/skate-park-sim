import type Play from "./Play";
import Skater from "./Skater";
import { randomBool, randomEl, randomInt, cellToPos, posToCell } from "./utils";
import { Path } from "./Path";
import Timer, { FIVE_MINUTES, TEN_MINUTES } from "./Timer";
import Obstacle, {
  obstacles,
  obstacleTricks,
  tricks,
  type ObstacleType,
  type Trick,
  BowlSide,
  Ramp,
  Rail,
  RailSide,
  RampSide,
  Bowl,
  bowlSideToStartDir,
} from "./Obstacle";
import AnimationSequence, {
  TransitionType,
  type SequenceAnimation,
} from "./lib/AnimationSequence";
import type { Direction, Vec2 } from "./lib";
import { findClosestFreeCell } from "./grid";
import { getBoardCarryOverlay, getBoardFlipOverlay } from "./Skater";

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
    if (this.currAction === null) {
      // Select new obstacle or to sit idle somewhere
      const willSkate = randomBool();

      if (willSkate) {
        this.currObstacle = randomEl(
          (this.skater.scene as Play).obstacles.filter((o) =>
            this.obstacles.includes(o.type),
          ),
        )!;
        this.currAction = createAction(
          CruiseTo.TAG,
          this.skater,
          this.currObstacle.getArrivePos(this.skater.pos),
        );
      } else {
        const bench = randomEl(
          (this.skater.scene as Play).staticImages.filter(
            (o) => o.image === "bench",
          ),
        )!;

        this.currObstacle = null;

        this.currAction = createAction(CruiseTo.TAG, this.skater, {x: bench.pos.x, y: bench.pos.y + this.tileSize});
      }
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === CruiseTo.TAG) {
        if (this.currObstacle !== null) {
          switch (this.currObstacle.type) {
            case "rail":
              this.currAction = createAction(
                this.currObstacle.type,
                this.skater,
                this.currObstacle as Rail,
                TEN_MINUTES,
              );
              break;
            case "bowl":
              this.currAction = createAction(
                this.currObstacle.type,
                this.skater,
                this.currObstacle as Bowl,
                TEN_MINUTES,
              );
              break;
            case "flat":
              this.currAction = createAction(
                this.currObstacle.type,
                this.skater,
                this.currObstacle as Obstacle,
                TEN_MINUTES,
              );
              break;
            case "ramp":
              this.currAction = createAction(
                this.currObstacle.type,
                this.skater,
                this.currObstacle as Ramp,
                TEN_MINUTES,
              );
              break;
          }
        } else {
          this.currAction = createAction(
            SittingBench.TAG,
            this.skater,
            FIVE_MINUTES,
          );
        }
      } else {
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
  private obstacle: Rail;
  private tileSize: number;

  constructor(skater: Skater, obstacle: Rail, ms: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(ms);
    this.currAction = null;
    this.obstacle = obstacle;
    this.tileSize = this.skater.tileSize;
  }

  update(dt: number): void {
    if (this.currAction === null) {
      this.obstacle.standInLine(this.skater.id);
      this.init();
      this.currAction = new WaitingMyTurn(this.skater, this.obstacle);
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === WaitingMyTurn.TAG) {
        const start = this.obstacle.getClosestTrickStartPos(this.skater.pos);
        this.currAction = createAction(
          RailTricks.TAG,
          this.skater,
          this.obstacle,
          start,
        );
      } else if (this.currAction.tag === RailTricks.TAG) {
        this.obstacle.endSkate(this.skater.id);
        this.obstacle.standInLine(this.skater.id);
        this.currAction = new WaitingMyTurn(this.skater, this.obstacle);
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

  private init(): void {
    const cell = posToCell(this.skater.pos, this.tileSize);

    (this.skater.scene as Play).parkGrid[cell.row][cell.col] = 1;

    if (this.skater.pos.y <= this.obstacle.pos.y) {
      this.skater.direction = "s";
      this.skater.animations.play(
        "idle-stand-s",
        getBoardCarryOverlay(this.skater.direction, true),
      );
    } else {
      this.skater.direction = "n";
      this.skater.animations.play(
        "idle-stand-n",
        getBoardCarryOverlay(this.skater.direction, true),
      );
    }
  }
}

class FlatObstacle implements Updatable {
  static tag: "flat" = "flat";
  readonly tag: "flat" = FlatObstacle.tag;
  private skater: Skater;
  private animationSeq: AnimationSequence;
  private timer: Timer;

  constructor(skater: Skater, obstacle: Obstacle, ms: number) {
    this.skater = skater;
    this.skater.pos.x = obstacle.pos.x;
    this.skater.pos.y = obstacle.pos.y;

    this.skater.direction = randomEl(["s", "n"]) as Direction;

    this.animationSeq = new AnimationSequence(
      this.skater,
      FlatObstacle.CreateAnimationSequence(this.skater.direction),
    );
    this.timer = new Timer();
    this.timer.start(ms);

    this.animationSeq.start();
  }

  update(dt: number) {
    this.animationSeq.update(dt);
    if (this.animationSeq.isFinished) {
      this.animationSeq = new AnimationSequence(
        this.skater,
        FlatObstacle.CreateAnimationSequence(this.skater.direction),
      );

      this.animationSeq.start();
    }
  }

  isComplete(): boolean {
    return this.timer.isStopped;
  }

  static CreateAnimationSequence(direction: Direction): SequenceAnimation[] {
    const trick = randomEl(obstacleTricks["flat"]);

    const flipside = direction === "n" ? "b" : "f";

    const seq: SequenceAnimation[] = [
      AnimationSequence.createAnim({
        anim: `idle-stand-board-${direction}`,
        type: TransitionType.Time,
        transition: { duration: 2000 },
      }),
      AnimationSequence.createAnim({
        anim: `prep-${direction}`,
        type: TransitionType.Finished,
        transition: null,
      }),
      AnimationSequence.createAnim({
        anim: `${trick?.includes("shove-it") ? "shove-it" : trick}-${flipside}`,
        type: TransitionType.Finished,
        transition: null,
      }),
    ];

    return seq;
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
        const overlay = (() => {
          switch (this.rampSide) {
            case RampSide.TOP_LEFT:
              return { name: "board-carry-c", drawOnTop: true, dy: 6, dx: 2 };
            case RampSide.BOTTOM_LEFT:
              return { name: "board-carry-c", drawOnTop: true, dy: 6, dx: 2 };
            case RampSide.BOTTOM_RIGHT:
              return {
                name: "board-carry-c",
                drawBehind: true,
                dy: -1,
                dx: -2,
              };
            case RampSide.TOP_RIGHT:
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
  private obstacle: Ramp;
  private start: { pos: Vec2; rampSide: RampSide };
  private end: { pos: Vec2; rampSide: RampSide };

  constructor(skater: Skater, obstacle: Ramp, ms: number) {
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
        case RampSide.TOP_LEFT:
          this.obstacle.standInLine(this.skater.id);
          this.setSkaterPosBeforeWaitMyTurn();

          this.currAction = createAction(
            WaitingMyTurn.TAG,
            this.skater,
            this.obstacle,
          );

          break;
        case RampSide.TOP_RIGHT:
          this.obstacle.standInLine(this.skater.id);
          this.setSkaterPosBeforeWaitMyTurn();
          this.currAction = createAction(
            WaitingMyTurn.TAG,
            this.skater,
            this.obstacle,
          );
          break;
        case RampSide.BOTTOM_RIGHT:
          this.currAction = createAction(
            ClimbRampObstacle.tag,
            this.skater,
            this.obstacle,
            this.start.rampSide,
          );
          break;
        case RampSide.BOTTOM_LEFT:
          this.obstacle.standInLine(this.skater.id);
          this.setSkaterPosBeforeWaitMyTurn();
          this.currAction = createAction(
            WaitingMyTurn.TAG,
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
          WaitingMyTurn.TAG,
          this.skater,
          this.obstacle,
        );
      } else if (this.currAction.tag === WaitingMyTurn.TAG) {
        // After WaitingMyTurn we got a new idle position assigned to the skater where they should end the round

        const idlePos = this.obstacle.getMyIdlePos(this.skater.id);
        const rampSide = this.obstacle.getIdlePosSide(this.skater.id);

        this.end = { pos: idlePos, rampSide };

        this.currAction = createAction(
          RampTricks.TAG,
          this.skater,
          this.obstacle,
          this.start,
          this.end,
        );
      } else if (this.currAction.tag === RampTricks.TAG) {
        this.obstacle.endSkate(this.skater.id);
        this.obstacle.standInLine(this.skater.id);

        // After skater is done, the "end" side is now the new start side.
        this.start = { ...this.end };

        this.setSkaterPosBeforeWaitMyTurn();
        this.currAction = createAction(
          WaitingMyTurn.TAG,
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
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return "e";
        case RampSide.BOTTOM_RIGHT:
        case RampSide.TOP_RIGHT:
          return "w";
      }
    })();

    const fenceDiffX = (() => {
      switch (this.start.rampSide) {
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return 1;
        case RampSide.BOTTOM_RIGHT:
        case RampSide.TOP_RIGHT:
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

class RailTricks implements Updatable {
  static TAG: "rail-tricks" = "rail-tricks";
  readonly tag: "rail-tricks" = RailTricks.TAG;

  static CRUISE_SPEED = 4;
  static GRIND_SPEED = 4;
  static TRICK_SPEED = 4;
  static WALK_SPEED = 1;
  static WALK_FAST_SPEED = 2;

  private obstacle: Rail;
  private skater: Skater;
  private animationSequence: AnimationSequence;
  private tileSize: number;
  private path: Path | null;

  private step: "start" | "rail" | "return";

  private start: { pos: Vec2; railSide: RailSide };

  constructor(
    skater: Skater,
    obstacle: Rail,
    start: { pos: Vec2; railSide: RailSide },
  ) {
    this.skater = skater;
    this.tileSize = this.skater.tileSize;
    this.obstacle = obstacle;

    this.step = "start";
    this.path = null;

    this.start = start;

    const trickOne = randomBool() ? randomEl(["shove-it", "kickflip"]) : null;
    const trickTwo =
      trickOne === null && randomBool()
        ? randomEl(["shove-it", "kickflip"])
        : null;

    const tilesKickflip = Math.abs(
      this.skater.animations.getEstimatedDistanceForAnim("kickflip-f", {
        x: Skater.TRICK_SPEED,
        y: 0,
      }).x / this.tileSize,
    );
    const tilesShoveIt = Math.abs(
      this.skater.animations.getEstimatedDistanceForAnim("shove-it-f", {
        x: Skater.TRICK_SPEED,
        y: 0,
      }).x / this.tileSize,
    );

    const tilesTrickTwo =
      trickTwo === "kickflip"
        ? tilesKickflip
        : trickTwo === "shove-it"
          ? tilesShoveIt
          : 0;

    const tilesTrickOne =
      trickOne === "kickflip"
        ? tilesKickflip
        : trickOne === "shove-it"
          ? tilesShoveIt
          : 0;

    const sequence = RailTricks.CreateAnimationSequence({
      startSide: this.start.railSide,
      tilesAfterRail: 2,
      tilesGrind:
        this.obstacle.width / this.tileSize - tilesTrickOne - tilesTrickTwo,
      tileSize: this.tileSize,
      tilesToRail: 2,
      trickOne: trickOne,
      trickTwo: trickTwo,
      tilesTrickOne,
      tilesTrickTwo,
    });

    this.animationSequence = new AnimationSequence(
      this.skater,
      sequence,
      (anim) => {
        // console.log(anim);
        // console.log("Skater X ", this.skater.pos.x);
      },
    );
  }

  update(dt: number): void {
    const animName = this.skater.animations.getPlaying();

    switch (this.step) {
      case "start": {
        if (this.path === null) {
          const currCell = posToCell(this.skater.pos, this.tileSize);

          (this.skater.scene as Play).parkGrid[currCell.row][currCell.col] = 0;

          this.path = new Path(
            this.skater,
            this.start.pos,
            (this.skater.scene as Play).parkGrid,
          );

          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        } else if (this.path.hasReachedGoal) {
          this.step = "rail";
          this.path = null;
          return;
        }

        this.path.update(dt);

        // Change animation if skater changed direction
        if (
          animName === null ||
          !animName.includes(`-${this.skater.direction}`)
        ) {
          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        }

        if (this.skater.direction === "e" || this.skater.direction === "w") {
          this.skater.vel.x *= 2;
        }

        break;
      }
      case "rail": {
        if (!this.animationSequence.hasStarted()) {
          this.skater.direction =
            this.start.railSide === RailSide.LEFT ? "e" : "w";
          // console.log(
          //   "START ANIM SEQ POS: ",
          //   this.skater.pos.x,
          //   posToCell(this.skater.pos, this.tileSize),
          // );
          this.animationSequence.start();
        }

        this.animationSequence.update(dt);

        if (this.animationSequence.isFinished) {
          // console.log(
          //   "START ANIM SEQ FINISHED: ",
          //   this.skater.pos.x,
          //   posToCell(this.skater.pos, this.tileSize),
          // );
          this.step = "return";
        }
        break;
      }
      case "return": {
        if (this.path === null) {
          const currCell = posToCell(this.skater.pos, this.tileSize);

          // console.log("START RETURN: ", this.skater.pos.x, currCell);

          currCell.col = Math.round(currCell.col);
          currCell.row = Math.round(currCell.row);

          this.skater.pos = cellToPos(currCell, this.tileSize);

          // temp block out the x direction of rail so that the skater doesn't stand in the way of other skaters who are doing

          const numTilesBlock = 4;

          for (
            let c = this.obstacle.pos.x / this.tileSize - numTilesBlock;
            c < this.obstacle.pos.x / this.tileSize;
            c++
          ) {
            (this.skater.scene as Play).parkGrid[
              this.obstacle.pos.y / this.tileSize
            ][c] = 1;
          }

          for (
            let c =
              this.obstacle.pos.x / this.tileSize +
              this.obstacle.width / this.tileSize;
            c <
            this.obstacle.pos.x / this.tileSize +
              this.obstacle.width / this.tileSize +
              numTilesBlock;
            c++
          ) {
            (this.skater.scene as Play).parkGrid[
              this.obstacle.pos.y / this.tileSize
            ][c] = 1;
          }

          const closestCell = findClosestFreeCell(
            currCell,
            (this.skater.scene as Play).parkGrid,
            [0],
          );

          if (closestCell === null) throw Error("WHY");

          for (
            let c = this.obstacle.pos.x / this.tileSize - numTilesBlock;
            c < this.obstacle.pos.x / this.tileSize;
            c++
          ) {
            (this.skater.scene as Play).parkGrid[
              this.obstacle.pos.y / this.tileSize
            ][c] = 0;
          }

          for (
            let c =
              this.obstacle.pos.x / this.tileSize +
              this.obstacle.width / this.tileSize;
            c <
            this.obstacle.pos.x / this.tileSize +
              this.obstacle.width / this.tileSize +
              numTilesBlock;
            c++
          ) {
            (this.skater.scene as Play).parkGrid[
              this.obstacle.pos.y / this.tileSize
            ][c] = 0;
          }

          this.path = new Path(
            this.skater,
            cellToPos(closestCell, this.tileSize),
            (this.skater.scene as Play).parkGrid,
          );

          (this.skater.scene as Play).parkGrid[closestCell.row][
            closestCell.col
          ] = 1;

          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        }

        this.path.update(dt);

        // Change animation if skater changed direction
        if (
          animName === null ||
          !animName.includes(`-${this.skater.direction}`)
        ) {
          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        }

        if (this.skater.direction === "e" || this.skater.direction === "w") {
          this.skater.vel.x *= 2;
        }

        if (this.path.hasReachedGoal) {
          // Change animation and direction when going idle!

          if (this.skater.pos.y < this.obstacle.pos.y) {
            this.skater.direction = "s";
            this.skater.animations.play(
              "idle-stand-s",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          } else if (
            this.skater.pos.y >
            this.obstacle.pos.y + this.obstacle.height
          ) {
            this.skater.direction = "n";
            this.skater.animations.play(
              "idle-stand-n",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          } else if (this.skater.pos.x > this.obstacle.pos.x) {
            this.skater.direction = "w";
            this.skater.animations.play(
              "idle-stand-w",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          } else {
            this.skater.direction = "e";
            this.skater.animations.play(
              "idle-stand-e",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          }
        }

        break;
      }
    }
  }

  isComplete(): boolean {
    return (
      this.step === "return" &&
      this.path !== null &&
      this.path.hasReachedGoal &&
      (this.skater.animations.getPlaying()?.includes("idle") ?? false)
    );
  }

  static CreateAnimationSequence(params: {
    startSide: RailSide;
    tileSize: number;
    tilesToRail: number;
    tilesGrind: number;
    tilesAfterRail: number;
    trickOne: string | null;
    trickTwo: string | null;
    tilesTrickOne: number;
    tilesTrickTwo: number;
  }): SequenceAnimation[] {
    const {
      startSide,
      tileSize,
      tilesToRail,
      tilesGrind,
      trickOne,
      trickTwo,
      tilesAfterRail,
      tilesTrickOne,
      tilesTrickTwo,
    } = params;

    const sequence: SequenceAnimation[] = [];

    const isGoingRight = startSide === RailSide.LEFT;

    const dir = isGoingRight ? "b-e" : "f-w"; // Whenever skater is going to e the stance is b and the opposite.
    const dxSign = isGoingRight ? 1 : -1;

    const tilesJumpOne = 1;
    const tilesJumpTwo = trickTwo !== null ? 1.25 : 0.5;

    const tilesX =
      tilesToRail +
      tilesJumpOne +
      tilesTrickOne +
      tilesGrind +
      tilesJumpTwo +
      tilesTrickTwo;

    const diffToEvenTiles = Math.ceil(tilesX) - tilesX;

    // console.log(
    //   "TILES X ESTIMATE ",
    //   Math.ceil(tilesX),
    //   tilesX,
    //   diffToEvenTiles,
    // );

    // console.log("TILES X ESTIMATE ", tilesX * 16, diffToEvenTiles * 16);

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
        dx: dxSign * tileSize * tilesGrind,
        dy: 0,
      },
    });

    // Maybe do trick two
    if (trickTwo !== null) {
      pushJumpUp();
      // pushJumpUp();
      pushTrick(isGoingRight ? `${trickTwo}-b` : `${trickTwo}-f`);
      pushJumpDown();
    }

    pushJumpDown();

    // console.log("CRUIOSE BAC", tilesAfterRail + diffToEvenTiles);
    pushCruise(tilesAfterRail + diffToEvenTiles);

    sequence.push({
      anim: `flip-${isGoingRight ? "e" : "w"}`,
      type: TransitionType.Finished,
      transition: null,
      overlay: getBoardFlipOverlay(isGoingRight ? "e" : "w"),
    });

    sequence.push({
      anim: `idle-stand-${isGoingRight ? "e" : "w"}`,
      type: TransitionType.Time,
      transition: { duration: 500 },
      overlay: getBoardCarryOverlay(isGoingRight ? "e" : "w", true),
    });

    return sequence;
  }
}

class RampTricks implements Updatable {
  static TAG: "ramp-tricks" = "ramp-tricks";
  readonly tag: "ramp-tricks" = RampTricks.TAG;

  private obstacle: Obstacle;
  private skater: Skater;
  private animationSequence: AnimationSequence;
  private tileSize: number;

  private start: { pos: Vec2; rampSide: RampSide };
  private end: { pos: Vec2; rampSide: RampSide };

  constructor(
    skater: Skater,
    obstacle: Obstacle,
    start: { pos: Vec2; rampSide: RampSide },
    end: { pos: Vec2; rampSide: RampSide },
  ) {
    this.skater = skater;
    this.tileSize = this.skater.tileSize;
    this.obstacle = obstacle;

    this.start = start;
    this.end = end;
    this.skater.pos.x += (() => {
      switch (this.start.rampSide) {
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return 1;
        case RampSide.BOTTOM_RIGHT:
        case RampSide.TOP_RIGHT:
          return -1;
      }
    })();

    const trickSet = RampTricks.TrickSet(
      this.start.rampSide,
      this.end.rampSide,
      randomInt(10),
    );

    this.animationSequence = new AnimationSequence(this.skater, [
      AnimationSequence.createAnim({
        anim: `walk-board-${(() => {
          switch (this.start.rampSide) {
            case RampSide.TOP_LEFT:
            case RampSide.TOP_RIGHT:
              return "s";
            case RampSide.BOTTOM_RIGHT:
            case RampSide.BOTTOM_LEFT:
              return "n";
          }
        })()}`,
        overlay: (() => {
          switch (this.start.rampSide) {
            case RampSide.TOP_LEFT:
              return { name: "board-carry-l", drawOnTop: true, dy: 3, dx: -2 };
            case RampSide.TOP_RIGHT:
              return { name: "board-carry-l", drawOnTop: true, dy: 3, dx: -2 };
            case RampSide.BOTTOM_RIGHT:
              return { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 };
            case RampSide.BOTTOM_LEFT:
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
            case RampSide.TOP_LEFT:
            case RampSide.TOP_RIGHT:
              return "n";
            case RampSide.BOTTOM_RIGHT:
            case RampSide.BOTTOM_LEFT:
              return "s";
          }
        })()}`,
        overlay: (() => {
          switch (this.end.rampSide) {
            case RampSide.TOP_LEFT:
              return { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 };
            case RampSide.TOP_RIGHT:
              return { name: "board-carry-r", drawBehind: true, dy: 3, dx: 2 };
            case RampSide.BOTTOM_RIGHT:
              return { name: "board-carry-l", drawOnTop: true, dy: 3, dx: -2 };
            case RampSide.BOTTOM_LEFT:
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

  static TrickSet(startSide: RampSide, endSide: RampSide, numTricks: number) {
    type Direction = "e" | "w";
    type Flipside = "f" | "b";

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

    const endDirection: Direction = (() => {
      switch (endSide) {
        case RampSide.TOP_LEFT:
        case RampSide.BOTTOM_LEFT:
          return "e";
        case RampSide.TOP_RIGHT:
        case RampSide.BOTTOM_RIGHT:
          return "w";
      }
    })();

    let direction: Direction = startDirection;

    let flipside: Flipside = "f";

    set.push(`cruise-ramp-${flipside}-${direction}`);

    for (let i = 0; i < numTricks; ++i) {
      const trick = randomEl(obstacleTricks.ramp)!;

      if (trick === "180") {
        set.push(`180-${flipside}`);
        flipside === "f" ? "b" : "f";
      } else if (trick === "360") {
        set.push(`360-${flipside}`);
      } else if (trick === "grab") {
        set.push(`grab-${flipside}`);
      }

      direction = direction === "e" ? "w" : "e";
      set.push(`cruise-ramp-${flipside}-${direction}`);

      if (i === numTricks - 1 && direction === endDirection) {
        direction = direction === "e" ? "w" : "e";
        set.push(`cruise-ramp-${flipside}-${direction}`);
      }
    }

    set.push(`ramp-land-${direction}`);

    return set;
  }
}

class BowlObstacle implements Updatable {
  static TAG: "bowl" = "bowl";
  readonly tag: "bowl" = BowlObstacle.TAG;
  private skater: Skater;
  private timer: Timer;
  private currAction: null | Updatable;
  private obstacle: Bowl;

  constructor(skater: Skater, obstacle: Bowl, ms: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(ms);
    this.currAction = null;
    this.obstacle = obstacle;
  }

  update(dt: number): void {
    if (this.currAction === null) {
      this.obstacle.standInLine(this.skater.id);

      this.setSkaterDirection();

      this.currAction = createAction(
        WaitingMyTurn.TAG,
        this.skater,
        this.obstacle,
      );
    } else if (this.currAction.isComplete()) {
      if (this.currAction.tag === WaitingMyTurn.TAG) {
        // After WaitingMyTurn we got a new idle position assigned to the skater where they should end the round
        const start = this.obstacle.getClosestTrickStartPos(this.skater.pos);
        this.currAction = createAction(
          BowlTricks.TAG,
          this.skater,
          this.obstacle,
          start,
        );
      } else if (this.currAction.tag === BowlTricks.TAG) {
        this.obstacle.endSkate(this.skater.id);
        this.obstacle.standInLine(this.skater.id);

        this.setSkaterDirection();

        this.currAction = createAction(
          WaitingMyTurn.TAG,
          this.skater,
          this.obstacle,
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

  private setSkaterDirection() {
    if (this.skater.pos.y <= this.obstacle.pos.y) {
      this.skater.direction = "s";
    } else if (
      this.skater.pos.y >=
      this.obstacle.pos.y + this.obstacle.height
    ) {
      this.skater.direction = "n";
    } else if (this.skater.pos.x > this.obstacle.pos.x) {
      this.skater.direction = "w";
    } else {
      this.skater.direction = "e";
    }
  }
}

class BowlTricks implements Updatable {
  static TAG: "bowl-tricks" = "bowl-tricks";
  readonly tag: "bowl-tricks" = BowlTricks.TAG;

  private obstacle: Bowl;
  private skater: Skater;
  private animationSequence: AnimationSequence;
  private tileSize: number;

  private start: { pos: Vec2; bowlSide: BowlSide };

  private path: Path | null;
  private step: "start" | "bowl" | "return";

  constructor(
    skater: Skater,
    obstacle: Bowl,
    start: { pos: Vec2; bowlSide: BowlSide },
  ) {
    this.skater = skater;
    this.tileSize = this.skater.tileSize;
    this.obstacle = obstacle;

    this.start = start;

    this.step = "start";

    this.path = null;

    const seq = BowlTricks.TrickSet(this.start.bowlSide, randomInt(10));

    this.animationSequence = new AnimationSequence(this.skater, seq);
  }

  update(dt: number): void {
    const animName = this.skater.animations.getPlaying();
    switch (this.step) {
      case "start": {
        if (this.path === null) {
          const currCell = posToCell(this.skater.pos, this.tileSize);

          (this.skater.scene as Play).parkGrid[currCell.row][currCell.col] = 0;

          this.path = new Path(
            this.skater,
            this.start.pos,
            (this.skater.scene as Play).parkGrid,
          );

          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        } else if (this.path.hasReachedGoal) {
          this.step = "bowl";
          this.path = null;
          return;
        }

        this.path.update(dt);

        // Change animation if skater changed direction
        if (
          animName === null ||
          !animName.includes(`-${this.skater.direction}`)
        ) {
          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        }

        break;
      }
      case "bowl":
        if (!this.animationSequence.hasStarted()) {
          this.animationSequence.start();
        }

        this.animationSequence.update(dt);

        if (this.animationSequence.isFinished) {
          this.step = "return";
        }
        break;
      case "return": {
        if (this.path === null) {
          const currCell = posToCell(this.skater.pos, this.tileSize);

          currCell.col = Math.round(currCell.col);
          currCell.row = Math.round(currCell.row);

          this.skater.pos = cellToPos(currCell, this.tileSize);

          // Block out cells to not pick a cell too close to the bowl's starting positiongs

          this.updateGridSideOfBowl(1);

          const closestCell = findClosestFreeCell(
            currCell,
            (this.skater.scene as Play).parkGrid,
            [0],
          );

          if (closestCell === null) throw Error("WHY");

          this.updateGridSideOfBowl(0);

          this.path = new Path(
            this.skater,
            cellToPos(closestCell, this.tileSize),
            (this.skater.scene as Play).parkGrid,
          );

          (this.skater.scene as Play).parkGrid[closestCell.row][
            closestCell.col
          ] = 1;

          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        }

        this.path.update(dt);

        // Change animation if skater changed direction
        if (
          animName === null ||
          !animName.includes(`-${this.skater.direction}`)
        ) {
          this.skater.animations.play(
            `walk-board-${this.skater.direction}`,
            getBoardCarryOverlay(this.skater.direction),
          );
        }

        if (this.path.hasReachedGoal) {
          // Change animation and direction when going idle!

          if (this.skater.pos.y < this.obstacle.pos.y) {
            this.skater.direction = "s";
            this.skater.animations.play(
              "idle-stand-s",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          } else if (
            this.skater.pos.y >
            this.obstacle.pos.y + this.obstacle.height
          ) {
            this.skater.direction = "n";
            this.skater.animations.play(
              "idle-stand-n",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          } else if (this.skater.pos.x > this.obstacle.pos.x) {
            this.skater.direction = "w";
            this.skater.animations.play(
              "idle-stand-w",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          } else {
            this.skater.direction = "e";
            this.skater.animations.play(
              "idle-stand-e",
              getBoardCarryOverlay(this.skater.direction, true),
            );
          }
        }

        break;
      }
    }
  }

  isComplete(): boolean {
    return (
      this.step === "return" &&
      this.path !== null &&
      this.path.hasReachedGoal &&
      (this.skater.animations.getPlaying()?.includes("idle") ?? false)
    );
  }

  static TrickSet(startSide: BowlSide, numTricks: number): SequenceAnimation[] {
    type Flipside = "f" | "b" | "e" | "w";

    const set: SequenceAnimation[] = [];

    let direction: Direction = bowlSideToStartDir.get(startSide)!;

    let flipside: Flipside = direction === "s" || direction === "n" ? "e" : "f";

    const isHorizontal = direction === "e" || direction === "w";

    const push = (trick: string) => {
      set.push(
        AnimationSequence.createAnim({
          anim: trick,
          type: TransitionType.Finished,
          transition: null,
        }),
      );
    };

    push(
      `cruise-bowl-${isHorizontal ? flipside : direction}-${isHorizontal ? direction : flipside}`,
    );

    for (let i = 0; i < numTricks; ++i) {
      const trick = "180"; // true ? randomEl(obstacleTricks.bowl)! : null;

      if (isHorizontal) {
        if (trick === "180") {
          push(`180-${flipside}`);
          flipside = flipside === "f" ? "b" : "f";
        } else if (trick === "360") {
          push(`360-${flipside}`);
        } else if (trick === "grab") {
          push(`grab-${flipside}`);
        }
        direction = direction === "e" ? "w" : "e";
      } else {
        if (trick === "180") {
          push(`180-${flipside}-${flipside === "e" ? "ccw" : "cw"}`);
          flipside = flipside === "e" ? "w" : "e";
        } else if (trick === "360") {
          push(`360-${flipside}-${flipside === "e" ? "ccw" : "cw"}`);
        } else if (trick === "grab") {
          push(`180-${flipside}-${flipside === "e" ? "ccw" : "cw"}`);
        }

        direction = direction === "n" ? "s" : "n";
      }

      push(
        `cruise-bowl-${isHorizontal ? flipside : direction}-${isHorizontal ? direction : flipside}`,
      );
    }

    set.push({
      anim: `flip-${direction}`,
      type: TransitionType.Finished,
      transition: null,
      overlay: getBoardFlipOverlay(direction),
    });

    set.push({
      anim: `idle-stand-${direction}`,
      type: TransitionType.Time,
      transition: { duration: 500 },
      overlay: getBoardCarryOverlay(direction, true),
    });

    return set;
  }

  private updateGridSideOfBowl(val: 1 | 0) {
    const currSideOfBowl = this.obstacle.getClosestTrickStartPos(
      this.skater.pos,
    ).bowlSide;

    switch (currSideOfBowl) {
      case BowlSide.TOP: {
        const from = posToCell(
          {
            y: this.obstacle.pos.y - this.tileSize,
            x: this.obstacle.pos.x,
          },
          this.tileSize,
        );
        const to = posToCell(
          {
            y: this.obstacle.pos.y - this.tileSize,
            x: this.obstacle.pos.x + this.obstacle.width,
          },
          this.tileSize,
        );
        for (let c = from.col; c < to.col; ++c) {
          (this.skater.scene as Play).parkGrid[from.row][c] = val;
        }
        break;
      }
      case BowlSide.RIGHT: {
        const from = posToCell(
          {
            y: this.obstacle.pos.y,
            x: this.obstacle.pos.x + this.obstacle.width,
          },
          this.tileSize,
        );
        const to = posToCell(
          {
            y: this.obstacle.pos.y + this.obstacle.height,
            x: this.obstacle.pos.x + this.obstacle.width,
          },
          this.tileSize,
        );

        for (let r = from.row; r < to.row; ++r) {
          (this.skater.scene as Play).parkGrid[r][from.col] = val;
        }
        break;
      }
      case BowlSide.BOTTOM: {
        const from = posToCell(
          {
            y: this.obstacle.pos.y + this.obstacle.height,
            x: this.obstacle.pos.x,
          },
          this.tileSize,
        );
        const to = posToCell(
          {
            y: this.obstacle.pos.y + this.obstacle.height,
            x: this.obstacle.pos.x + this.obstacle.width,
          },
          this.tileSize,
        );

        for (let c = from.col; c < to.col; ++c) {
          (this.skater.scene as Play).parkGrid[from.row][c] = val;
        }
        break;
      }
      case BowlSide.LEFT: {
        const from = posToCell(
          {
            y: this.obstacle.pos.y,
            x: this.obstacle.pos.x - this.tileSize,
          },
          this.tileSize,
        );
        const to = posToCell(
          {
            y: this.obstacle.pos.y + this.obstacle.height,
            x: this.obstacle.pos.x - this.tileSize,
          },
          this.tileSize,
        );

        for (let r = from.row; r < to.row; ++r) {
          (this.skater.scene as Play).parkGrid[r][from.col] = val;
        }
        break;
      }
    }
  }
}

class CruiseTo implements Updatable {
  static TAG: "cruise-to" = "cruise-to";
  readonly tag: "cruise-to" = CruiseTo.TAG;

  skater: Skater;
  path: Path;

  constructor(skater: Skater, to: Vec2) {
    this.skater = skater;
    this.path = new Path(this.skater, to, (this.skater.scene as Play).parkGrid);
  }

  update(dt: number): void {
    const anim = this.skater.animations.getPlaying();

    if (anim !== null && !anim.includes(this.skater.direction)) {
      this.skater.animations.play(`cruise-${this.skater.direction}`);
    }

    this.path.update(dt);
  }

  isComplete(): boolean {
    return this.path?.hasReachedGoal ?? false;
  }
}

class WaitingMyTurn implements Updatable {
  static TAG: "waiting-my-turn" = "waiting-my-turn";
  readonly tag: "waiting-my-turn" = WaitingMyTurn.TAG;
  private skater: Skater;
  private obstacle: Obstacle;
  private timer: Timer;

  constructor(skater: Skater, obstacle: Obstacle) {
    this.skater = skater;
    this.obstacle = obstacle;
    this.timer = new Timer();
    this.timer.start(1000 * 3);
    const skaterCell = this.skater.getGridCell();
    (this.skater.scene as Play).parkGrid[skaterCell.row][skaterCell.col] = 1;
  }

  update(_: number): void {
    if (
      !this.skater.animations.isPlaying(`idle-stand-${this.skater.direction}`)
    ) {
      this.skater.animations.play(
        `idle-stand-${this.skater.direction}`,
        getBoardCarryOverlay(this.skater.direction, true),
      );
    }

    if (this.obstacle.isMyTurn(this.skater.id)) {
      const skaterCell = this.skater.getGridCell();
      (this.skater.scene as Play).parkGrid[skaterCell.row][skaterCell.col] = 0;
      this.obstacle.skate(this.skater.id);
    }
  }

  isComplete(): boolean {
    return this.obstacle.isOccupiedByMe(this.skater.id) && this.timer.isStopped;
  }
}

class SittingBench implements Updatable {
  static TAG: "bench" = "bench";
  readonly tag: "bench" = SittingBench.TAG;
  private skater: Skater;
  private timer: Timer;

  constructor(skater: Skater, duration: number) {
    this.skater = skater;
    this.timer = new Timer();
    this.timer.start(duration);
    const skaterCell = this.skater.getGridCell();
    (this.skater.scene as Play).parkGrid[skaterCell.row][skaterCell.col] = 1;
  }

  update(_: number): void {
    if (
      !this.skater.animations.isPlaying(`idle-sit-${this.skater.direction}`)
    ) {
      this.skater.animations.play(
        `idle-sit-${this.skater.direction}`,
        getBoardCarryOverlay(this.skater.direction, true),
      );
    }
  }

  isComplete(): boolean {
    return this.timer.isStopped;
  }
}

type ActionTag =
  | "skating-at-park"
  | "bench"
  | "cruise-to"
  | "climb-ramp"
  | "waiting-my-turn"
  | "ramp-tricks"
  | "rail-tricks"
  | "bowl-tricks"
  | ObstacleType;

type ActionParams = {
  "skating-at-park": [skater: Skater];
  "cruise-to": [skater: Skater, to: Vec2];
  bench: [skater: Skater, duration: number];

  "climb-ramp": [skater: Skater, obstacle: Obstacle, rampSide: RampSide];
  "ramp-tricks": [
    skater: Skater,
    obstacle: Obstacle,
    start: { pos: Vec2; rampSide: RampSide },
    end: { pos: Vec2; rampSide: RampSide },
  ];
  "rail-tricks": [
    skater: Skater,
    obstacle: Rail,
    start: { pos: Vec2; railSide: RailSide },
  ];
  "bowl-tricks": [
    skater: Skater,
    obstacle: Bowl,
    start: { pos: Vec2; bowlSide: BowlSide },
  ];
  "waiting-my-turn": [skater: Skater, obstacle: Obstacle];

  bowl: [skater: Skater, obstacle: Bowl, ms: number];
  rail: [skater: Skater, obstacle: Rail, ms: number];
  flat: [skater: Skater, obstacle: Obstacle, ms: number];
  ramp: [skater: Skater, obstacle: Ramp, ms: number];
};

const ActionConstructors: { [T in ActionTag]: UpdatableConstructor<T> } = {
  "skating-at-park": SkatingAtPark,
  bench: SittingBench,
  "cruise-to": CruiseTo,
  "waiting-my-turn": WaitingMyTurn,
  "climb-ramp": ClimbRampObstacle,
  "ramp-tricks": RampTricks,
  "rail-tricks": RailTricks,
  "bowl-tricks": BowlTricks,
  rail: RailObstacle,
  bowl: BowlObstacle,
  flat: FlatObstacle,
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
