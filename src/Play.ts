import { Scene, StaticImage } from "./lib/index.ts";
import { type Tilemap } from "./types.ts";
import { createGrid, getRandomFreeCell } from "./grid.ts";
import Obstacle, {
  BEHIND_RAMP_OFFSET,
  Bowl,
  Flat,
  Rail,
  Ramp,
} from "./Obstacle.ts";
import Skater from "./Skater.ts";
import { cellToPos } from "./utils.ts";
import Bench from "./Bench.ts";
import { TEN_SECONDS } from "./Timer.ts";
import spritesheetJSON from "./skater-spritesheet.json";
import { type AsepriteJSON } from "./lib/index";

export default class Play extends Scene {
  tilemap: Tilemap;
  obstacles: Obstacle[];
  parkGrid: (0 | 1)[][];
  skaters!: Skater[];
  tileSize: number;
  benches: Bench[];
  staticImages: StaticImage[];

  constructor(tilemap: Tilemap) {
    super();
    this.tilemap = tilemap;
    this.obstacles = [];
    this.parkGrid = [];
    this.tileSize = 16;
    this.skaters = [];
    this.benches = [];
    this.staticImages = [];
  }

  async init() {
    this.art!.images.add("tilemap", this.tilemap.tilemap);
    this.art!.images.add("skater", "/skater-spritesheet.png");
    this.art!.images.add(
      "flat",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAEklEQVR4nGNgGAWjYBSMglEwCjAAAGwAAWzQqWQAAAAASUVORK5CYII=",
    );

    this.parkGrid = createGrid(this.tilemap.rows, this.tilemap.cols, 1);

    this.tileSize = this.art!.tileSize;
    const tilemap = new StaticImage(
      this,
      { x: 0, y: 0 },
      this.art!.width,
      this.art!.height,
      "tilemap",
    );
    this.staticImages.push(tilemap);
    this.addObject(tilemap);

    this.art!.spritesheets.create(
      "skater",
      "skater",
      spritesheetJSON as AsepriteJSON,
    );

    for (const o of this.tilemap.objects) {
      if (o.name === "bowl") {
        this.art!.images.add("bowl", o.image);
        const bowl = new Bowl(this, o.pos, o.width, o.height);
        this.obstacles.push(bowl);
        this.addObject(bowl);
      } else if (o.name === "rail") {
        this.art!.images.add("rail", o.image);
        const rail = new Rail(this, o.pos, o.width, o.height);
        this.obstacles.push(rail);
        this.addObject(rail);
      } else if (o.name === "ramp") {
        this.art!.images.add("ramp", o.image);
        const ramp = new Ramp(this, o.pos, o.width, o.height);
        this.obstacles.push(ramp);
        this.addObject(ramp);
      } else if (o.name === "bench") {
        this.art!.images.add("bench", o.image);
        const bench = new Bench(this, o.pos, o.width, o.height);
        this.benches.push(bench);
        this.addObject(bench);
      } else {
        this.art!.images.add(o.name, o.image);
        const staticImage = new StaticImage(
          this,
          o.pos,
          o.width,
          o.height,
          o.name,
        );
        this.staticImages.push(staticImage);
        this.addObject(staticImage);
      }
    }

    for (const t of this.tilemap.attributes) {
      if (t.attributes.hasOwnProperty("isCruisable")) {
        this.parkGrid[t.pos.y / this.tileSize][t.pos.x / this.tileSize] = 0;
      }
    }

    for (const o of this.obstacles) {
      const startRow =
        o.pos.y / this.tileSize + (o.type === "ramp" ? BEHIND_RAMP_OFFSET : 0); // So that skaters can walk behind ramp
      const startCol = o.pos.x / this.tileSize;
      const endRow =
        startRow +
        o.height / this.tileSize -
        (o.type === "ramp" ? BEHIND_RAMP_OFFSET : 0);
      const endCol = o.pos.x / this.tileSize + o.width / this.tileSize;

      for (let r = startRow; r < endRow; ++r) {
        for (let c = startCol; c < endCol; ++c) {
          this.parkGrid[r][c] = 1;
        }
      }
    }

    const flat = new Flat(
      this,
      { x: 0, y: 0 },
      this.art!.tileSize,
      this.art!.tileSize,
    );
    this.obstacles.push(flat);
    this.addObject(flat);

    await this.art!.images.load();
    // console.log(this.parkGrid);

    this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "ramp"));

    this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "bench"));

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "ramp"));
    }, TEN_SECONDS);

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "ramp"));
    }, TEN_SECONDS);

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "flat"));
    }, TEN_SECONDS * 3);

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "rail"));
    }, TEN_SECONDS * 5);

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "bowl"));
    }, TEN_SECONDS * 6);

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "bowl"));
    }, TEN_SECONDS * 7);

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "ramp"));
    }, TEN_SECONDS * 8);

    setTimeout(() => {
      this.pushSkater(new Skater(this, { x: 0, y: 0 }, "sickan", 10, "bench"));
    }, TEN_SECONDS * 9);
  }

  pushSkater(skater: Skater) {
    const cell = getRandomFreeCell(this.parkGrid);
    if (cell === null) return;
    skater.pos = cellToPos(cell, this.tileSize);
    this.skaters.push(skater);
    this.addObject(skater);
  }

  update(dt: number) {
    for (const s of this.skaters) {
      s.update(dt);
    }

    // Sort objects

    const renderSortCompValue = new Map<number, number>();

    for (const s of this.skaters) {
      const obstacle = this.obstacles.find((o2) => o2.id === s.obstacle);

      // Skater is currently at obstacle ramp and climbing it from behind so we need to increase the 'y' value to sort on so that it will be rendered first, i.e. the ramp will be rendered on top of this skater.
      if (obstacle !== undefined) {
        if (obstacle.type === "ramp") {
          const isBehindRamp =
            s.pos.y <= obstacle.pos.y + BEHIND_RAMP_OFFSET * this.tileSize;
          const isClimbing = s.action === "climb-ramp";

          if (isBehindRamp && isClimbing) {
            renderSortCompValue.set(s.id, obstacle.pos.y - 1);
          } else {
            renderSortCompValue.set(s.id, s.pos.y);
          }
          continue;
        } else if (obstacle.type === "bowl") {
          renderSortCompValue.set(s.id, obstacle.pos.y + 1);
          continue;
        }
      }

      const bench = this.benches.find((o2) => o2.id === s.bench);

      if (bench !== undefined) {
        renderSortCompValue.set(s.id, s.pos.y + 4);
        continue;
      }

      const ramp = this.obstacles.find((o) => o.type === "ramp")!;

      // Skater is in the are behind the ramp cruising or some
      if (
        s.pos.y >= ramp.pos.y &&
        s.pos.y <= ramp.pos.y + BEHIND_RAMP_OFFSET * this.tileSize &&
        s.pos.x >= ramp.pos.x - this.tileSize &&
        s.pos.x <= ramp.pos.x + ramp.width + this.tileSize
      ) {
        renderSortCompValue.set(s.id, ramp.pos.y - 1);
        continue;
      }
      renderSortCompValue.set(s.id, s.pos.y);
    }

    for (const o of this.staticImages) {
      renderSortCompValue.set(o.id, o.pos.y);
    }

    for (const o of this.obstacles) {
      renderSortCompValue.set(o.id, o.pos.y);
    }

    for (const o of this.benches) {
      renderSortCompValue.set(o.id, o.pos.y);
    }

    this.sortObjects((s1, s2) => {
      const v1 = renderSortCompValue.get(s1.id);
      const v2 = renderSortCompValue.get(s2.id);
      if (v1 === undefined || v2 === undefined) {
        console.log("Render sort error");
        return 0;
      }

      return v1 - v2;
    });
  }
}
