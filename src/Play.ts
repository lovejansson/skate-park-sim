import { Scene } from "./lib/index.ts";
import { type Tilemap } from "./types.ts";
import { createGrid } from "./grid.ts";
import Obsticle, { type ObsticleType } from "./Obsticle.ts";
import type { Vec2 } from "./lib/types.ts";

export default class Play extends Scene {
  tilemap: Tilemap;
  obsticles: Obsticle[];
  parkGrid: (0 | 1)[][];

  constructor(tilemap: Tilemap) {
    super();
    this.tilemap = tilemap;
    this.obsticles = [];
    this.parkGrid = [];
  }

  async init() {
    this.art!.images.add("tilemap", this.tilemap.tilemap);
    await this.art!.images.load();

    this.parkGrid = createGrid(this.tilemap.rows, this.tilemap.cols, 1);

    for (const t of this.tilemap.attributes) {
      if (t.attributes.hasOwnProperty("obsticle")) {
        this.obsticles.push(
          new Obsticle(
            this,
            t.attributes["obsticle"] as ObsticleType,
            t.pos as Vec2,
            parseInt(t.attributes["width"]),
            parseInt(t.attributes["height"]),
          ),
        );
      }

      if (t.attributes.hasOwnProperty("park-ground")) {
        this.parkGrid[t.pos.y / this.art!.tileSize][
          t.pos.x / this.art!.tileSize
        ] = 0;
      }
    }

    for (const o of this.obsticles) {
      const startRow = o.pos.y / this.art!.tileSize;
      const startCol = o.pos.x / this.art!.tileSize;

      for (
        let r = startRow;
        r < startRow + o.height / this.art!.tileSize;
        ++r
      ) {
        for (
          let c = startCol;
          c < startCol + o.width / this.art!.tileSize;
          ++c
        ) {
          this.parkGrid[r][c] = 1;
        }
      }
    }

    console.log(this.obsticles);
    console.log( this.parkGrid);
  }

  update() {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(
      this.art!.images.get("tilemap"),
      0,
      0,
      this.tilemap.width,
      this.tilemap.height,
    );
  }

  start() {}

  stop() {}
}
