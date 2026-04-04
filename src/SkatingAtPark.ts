import type Play from "./Play";
import Skater from "./Skater";
import {
  randomBool,
  randomEl,
  randomInt,
  cellToPos,
  posToCell,
  manhattan,
} from "./utils";
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
  RampSide,
  Ramp,
  Rail,
  RailSide,
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
    if (this.currAction === null || this.currAction.isComplete()) {
      const obstacleType = this.skater.id > 0 ? "rail" : "flat";


      const obstacle = (this.skater.scene as Play).obstacles.find(
        (o) => o.type === obstacleType,
      );

      if (obstacle !== undefined && !obstacle.isTooCrowded()) {
        this.currObstacle = obstacle;

        if (this.currObstacle.type === "ramp") {
          const ramp = this.currObstacle as Ramp;

          const idlePos = ramp.arrive(this.skater.id);

          // Set skater's position to be down below the idle position on the ramp.
          const rampSide = ramp.getIdlePosSide(this.skater.id);
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
          this.currAction = createAction(
            "ramp",
            this.skater,
            this.currObstacle as Ramp,
            FIVE_MINUTES,
          );
        } else if (this.currObstacle.type === "rail") {
          const rail = this.currObstacle as Rail;
          rail.arrive(this.skater.id);

          this.currAction = createAction(
            "rail",
            this.skater,
            this.currObstacle as Rail,
            FIVE_MINUTES,
          );
        } else if (this.currObstacle.type === "flat") {
          this.skater.pos.x = this.currObstacle.pos.x;
          this.skater.pos.y = this.currObstacle.pos.y;

          this.currAction = createAction(
            FlatObstacle.tag,
            this.skater,
            this.currObstacle,
            FIVE_MINUTES,
          );
        } else {
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
      if (this.currAction.tag === WaitingMyTurn.tag) {
        const start = this.obstacle.getClosestStartPosition(this.skater.pos);
        this.currAction = createAction(
          RailObstacleTricks.TAG,
          this.skater,
          this.obstacle,
          start,
        );
      } else if (this.currAction.tag === RailObstacleTricks.TAG) {
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

    

    const stance = direction === "n" ? "b" : "f";

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
        anim: `${trick?.includes("shove-it") ? "shove-it" : trick}-${stance}`,
        type: TransitionType.Finished,
        transition: null,
      }),
    ];

    return seq;
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
            WaitingMyTurn.tag,
            this.skater,
            this.obstacle,
          );

          break;
        case RampSide.TOP_RIGHT:
          this.obstacle.standInLine(this.skater.id);
          this.setSkaterPosBeforeWaitMyTurn();
          this.currAction = createAction(
            WaitingMyTurn.tag,
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

class RailObstacleTricks implements Updatable {
  static TAG: "rail-obstacle-tricks" = "rail-obstacle-tricks";
  readonly tag: "rail-obstacle-tricks" = RailObstacleTricks.TAG;

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

    const sequence = RailObstacleTricks.CreateAnimationSequence({
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

class RampObstacleTricks implements Updatable {
  static tag: "ramp-obstacle-tricks" = "ramp-obstacle-tricks";
  readonly tag: "ramp-obstacle-tricks" = RampObstacleTricks.tag;

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

    const trickSet = RampObstacleTricks.TrickSet(
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
      this.skater.animations.play(
        `idle-stand-${this.skater.direction}`,
        getBoardCarryOverlay(this.skater.direction, true),
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

  "climb-ramp": [skater: Skater, obstacle: Obstacle, rampSide: RampSide];
  "ramp-obstacle-tricks": [
    skater: Skater,
    obstacle: Obstacle,
    start: { pos: Vec2; rampSide: RampSide },
    end: { pos: Vec2; rampSide: RampSide },
  ];
  "rail-obstacle-tricks": [
    skater: Skater,
    obstacle: Rail,
    start: { pos: Vec2; railSide: RailSide },
  ];
  "waiting-my-turn": [skater: Skater, obstacle: Obstacle];

  bowl: [skater: Skater, obstacle: Obstacle];
  rail: [skater: Skater, obstacle: Rail, ms: number];
  flat: [skater: Skater, obstacle: Obstacle, ms: number];
  square: [skater: Skater, obstacle: Obstacle];
  ramp: [skater: Skater, obstacle: Ramp, ms: number];
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
