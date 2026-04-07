import { Scene, StaticImage } from "./lib/index.ts";
import { type Tilemap } from "./types.ts";
import { createGrid } from "./grid.ts";
import Obstacle, { Bowl, Rail, Ramp } from "./Obstacle.ts";
import Skater from "./Skater.ts";

export default class Play extends Scene {
  tilemap: Tilemap;
  obstacles: Obstacle[];
  parkGrid: (0 | 1)[][];
  skaters!: Skater[];
  tileSize: number;

  staticImages: StaticImage[];

  constructor(tilemap: Tilemap) {
    super();
    this.tilemap = tilemap;
    this.obstacles = [];
    this.parkGrid = [];
    this.tileSize = 16;
    this.skaters = [];

    this.staticImages = [];
  }

  async init() {
    this.skaters.push(new Skater(this, { x: 5 * 16, y: 4 * 16 }, "sickan", 5));
    // this.skaters.push(new Skater(this, { x: 5 * 16, y: 5 * 16 }, "doris", 5));

    // this.skaters.push(
    //   new Skater(this, { x: 14 * 16, y: 5 * 16 }, "vanheden", 5),
    // );

    this.art!.images.add("tilemap", this.tilemap.tilemap);
    this.art!.images.add("skater", "/skater-spritesheet.png");

    this.parkGrid = createGrid(this.tilemap.rows, this.tilemap.cols, 1);

    this.tileSize = this.art!.tileSize;

    for (const o of this.tilemap.objects) {
      if (o.name === "bowl") {
        this.art!.images.add("bowl", o.image);

        this.obstacles.push(new Bowl(this, o.pos, o.width, o.height));
      } else if (o.name === "rail") {
        this.art!.images.add("rail", o.image);

        this.obstacles.push(new Rail(this, o.pos, o.width, o.height));
      } else if (o.name === "ramp") {
        this.art!.images.add("ramp", o.image);

        this.obstacles.push(new Ramp(this, o.pos, o.width, o.height));
      } else {
        this.art!.images.add(o.name, o.image);
        this.staticImages.push(
          new StaticImage(this, o.pos, o.width, o.height, o.name),
        );
      }
    }

    for (const t of this.tilemap.attributes) {
      if (t.attributes.hasOwnProperty("isCruisable")) {
        this.parkGrid[t.pos.y / this.tileSize][t.pos.x / this.tileSize] = 0;
      }
    }

    for (const o of this.obstacles) {
      const startRow = o.pos.y / this.tileSize;
      const startCol = o.pos.x / this.tileSize;
      const endRow = startRow + o.height / this.tileSize;
      const endCol = o.pos.x / this.tileSize + o.width / this.tileSize;

      for (let r = startRow; r < endRow; ++r) {
        for (let c = startCol; c < endCol; ++c) {
          this.parkGrid[r][c] = 1;
        }
      }
    }

    await this.art!.images.load();
    console.log(this.parkGrid)
    console.log(this.staticImages.map(s => s.image))
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
    for (const s of this.obstacles.filter(o => o.type === "bowl")) {
      s.draw(ctx);
    }
    console.log(this.obstacles)
    const sorted = [...this.skaters, ...this.staticImages, ...this.obstacles.filter(o => o.type !== "bowl")].toSorted((s1, s2) => {
      return s1.pos.y - s2.pos.y;
    });

    for (const s of sorted) {
      s.draw(ctx);
    }
  }

  start() {}

  stop() {}
}
