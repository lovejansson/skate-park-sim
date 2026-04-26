import { Art } from "./lib/index.ts";
import { createDebugLogger } from "./debugger.ts";
import Play from "./Play.ts";
import Pause from "./Pause.ts";
import "./audio-player/AudioPlayerElement.js";
import tilemapJSON from "./tilemap.json";
import type { Tilemap } from "./types.ts";
import { RenderMode } from "./lib/Art.ts";

export const debug = createDebugLogger(true);

const tilemap = tilemapJSON as unknown as Tilemap;

const art = new Art({
  pause: new Pause(),
  play: new Play(tilemap),
  width: tilemap.width,
  height: tilemap.height,
  tileSize: tilemap.tileSize,
  container: "#art-container",
  displayGrid: true,
  mode: RenderMode.CANVAS,
  scale: "4k",
});

(async () => {
  await art.init();

  art.play();

//   const audioPlayerEl = document.querySelector("audio-player");

//   if (audioPlayerEl) {
//     audioPlayerEl.addEventListener("play", () => {
//       art.play();
//     });

//     audioPlayerEl.addEventListener("pause", () => {
//       art.pause();
//     });
//   }

  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "f") {
      art.enterFullScreen();
    }
  });
})();
