import { Art } from "./lib/index.ts";
import { createDebugLogger } from "./debugger.ts";
import Play from "./Play.ts";
import Pause from "./Pause.ts";
import "./audio-player/AudioPlayerElement.js";
import tilemapJSON from "./tilemap-rail-sim.json";
import type { Tilemap } from "./types.ts";

export const debug = createDebugLogger(true);

const tilemap = (tilemapJSON as unknown as Tilemap);

const art = new Art({

  pause: new Pause(),
  play: new Play(tilemap),
  width: tilemap.width,
  height: tilemap.height,
  tileSize: tilemap.tileSize,
  canvas: "#canvas-art",
  displayGrid: false,

});

art.start();

const audioPlayerEl = document.querySelector("audio-player");

if(audioPlayerEl) {
    audioPlayerEl.addEventListener("play", () => {
        art.play();
    })

    audioPlayerEl.addEventListener("pause", () => {
        art.pause();
    })
}


addEventListener("keydown", (e) => {
    if(e.key === "F") {
        art.enterFullScreen();
    } 
});

// TODO:
// 1. Implement Play and Pause scenes
// 2. start and play the art instance
