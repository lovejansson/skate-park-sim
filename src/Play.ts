import { Scene } from "./lib/index.ts";
import { type Tilemap } from "./types.ts";
import { createGrid } from "./grid.ts";
import Obstacle, { type ObstacleType } from "./Obstacle.ts";
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
    this.skaters.push(new Skater(this, { x: 6 * 16, y: 9 * 16 }, "sickan", 5));
    this.skaters.push(new Skater(this, { x: 6 * 16, y: 9 * 16 }, "doris", 5));
    this.skaters.push(new Skater(this, { x: 6 * 16, y: 9 * 16 }, "harry", 5));
    this.skaters.push(
      new Skater(this, { x: 6 * 16, y: 9 * 16 }, "vanheden", 5),
    );

    this.art!.images.add("tilemap", this.tilemap.tilemap);
    this.art!.images.add("skater", "/skater-spritesheet.png");
    await this.art!.images.load();

    this.parkGrid = createGrid(this.tilemap.rows, this.tilemap.cols, 1);

    this.tileSize = this.art!.tileSize;

    const obstacles: Map<string, Obstacle> = new Map();

    for (const t of this.tilemap.attributes) {
      if (t.attributes.hasOwnProperty("obsticle")) {
        if (!t.attributes.hasOwnProperty("id"))
          throw new Error("tilemap obsticle has no id");

        const idlePositions = this.tilemap.attributes.filter(
          (t1) =>
            t1.attributes.hasOwnProperty("obsticleId") &&
            t1.attributes["obsticleId"] === t.attributes["id"] &&
            t1.attributes.hasOwnProperty("isIdlePos"),
        );

        obstacles.set(
          t.attributes["id"],
          new Obstacle(
            this,
            t.attributes["obsticle"] as ObstacleType,
            t.pos as Vec2,
            parseInt(t.attributes["width"]),
            parseInt(t.attributes["height"]),
            idlePositions.map((i) => ({
              pos: i.pos as Vec2,
              meta: i.attributes["meta"],
            })),
          ),
        );
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

      for (let r = startRow; r < startRow + o.height / this.tileSize; ++r) {
        for (let c = startCol; c < startCol + o.width / this.tileSize; ++c) {
          this.parkGrid[r][c] = 1;
        }
      }
    }

    // console.log(this.obsticles);
    // console.log(this.parkGrid);
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
    })

    for (const s of sorted) {
      s.draw(ctx);
    }
  }

  start() {}

  stop() {}
}
