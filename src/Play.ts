import { Scene } from "./lib/index.ts";
import { type Tilemap } from "./types.ts";
import { createGrid } from "./grid.ts";
import Obstacle, { Rail, Ramp, type ObstacleType } from "./Obstacle.ts";
import type { Vec2 } from "./lib/types.ts";
import Skater from "./Skater.ts";

export default class Play extends Scene {
  tilemap: Tilemap;
  obstacles: Obstacle[];
  parkGrid: (0 | 1)[][];
  skaters!: Skater[];
  tileSize: number;

  constructor(tilemap: Tilemap) {
    super();
    this.tilemap = tilemap;
    this.obstacles = [];
    this.parkGrid = [];
    this.tileSize = 16;
    this.skaters = [];
  }

  async init() {
    this.skaters.push(new Skater(this, { x: 14 * 16, y: 5 * 16 }, "sickan", 5));
    this.skaters.push(new Skater(this, { x: 14 * 16, y: 5 * 16 }, "doris", 5));

    this.skaters.push(
      new Skater(this, { x: 15 * 16, y: 5 * 16 }, "vanheden", 5),
    );

    this.art!.images.add("tilemap", this.tilemap.tilemap);
    this.art!.images.add("skater", "/skater-spritesheet.png");
    await this.art!.images.load();

    this.parkGrid = createGrid(this.tilemap.rows, this.tilemap.cols, 1);

    this.tileSize = this.art!.tileSize;

    const obstacles: Map<string, Obstacle> = new Map();

    for (const t of this.tilemap.attributes) {
      if (t.attributes.hasOwnProperty("obstacle")) {
        if (!t.attributes.hasOwnProperty("id"))
          throw new Error("tilemap obstacle has no id");

        const idlePositions = this.tilemap.attributes.filter(
          (t1) =>
            t1.attributes.hasOwnProperty("obstacleId") &&
            t1.attributes["obstacleId"] === t.attributes["id"] &&
            t1.attributes.hasOwnProperty("isIdlePos"),
        );

        if (t.attributes["obstacle"] === "ramp") {
          obstacles.set(
            t.attributes["id"],
            new Ramp(
              this,
              t.pos as Vec2,
              parseInt(t.attributes["width"]),
              parseInt(t.attributes["height"]),
              4,
              idlePositions.map((i) => ({
                pos: i.pos as Vec2,
                meta: i.attributes["meta"],
              })),
            ),
          );
        } else if (t.attributes["obstacle"] === "rail") {
          obstacles.set(
            t.attributes["id"],
            new Rail(
              this,
              t.pos as Vec2,
              parseInt(t.attributes["width"]),
              parseInt(t.attributes["height"]),
            ),
          );
        } else {
          obstacles.set(
            t.attributes["id"],
            new Obstacle(
              this,
              t.attributes["obstacle"] as ObstacleType,
              t.pos as Vec2,
              parseInt(t.attributes["width"]),
              parseInt(t.attributes["height"]),
              3,
            ),
          );
        }
      }

      if (
        t.attributes.hasOwnProperty("isIdlePos") &&
        t.attributes.hasOwnProperty("id")
      ) {
      }

      if (t.attributes.hasOwnProperty("isCruisable")) {
        this.parkGrid[t.pos.y / this.tileSize][t.pos.x / this.tileSize] = 0;
      }
    }

    this.obstacles = new Array(...obstacles.values());
    

    // Make obsticle tiles not cruisable
    for (const o of this.obstacles) {
      const startRow = o.pos.y / this.tileSize;
      const startCol = o.pos.x / this.tileSize;
      const endRow = startRow + o.height / this.tileSize;
      const endCol = o.pos.x / this.tileSize + o.width / this.tileSize;

      console.log(startRow, endRow);

      for (let r = startRow; r < endRow; ++r) {
        for (let c = startCol; c < endCol; ++c) {
          this.parkGrid[r][c] = 1;
        }
      }
    }

    console.log(this.obstacles);
    console.log(this.parkGrid);
  }

  update(dt: number) {
    for (const s of this.skaters) {
      s.update(dt);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(
      this.art!.images.get("tilemap"),
      0,
      0,
      this.tilemap.width,
      this.tilemap.height,
    );

    const sorted = this.skaters.toSorted((s1, s2) => {
      return s1.pos.y - s2.pos.y;
    });

    for (const s of sorted) {
      s.draw(ctx);
    }
  }

  start() {}

  stop() {}
}
