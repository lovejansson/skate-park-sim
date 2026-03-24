import { Art } from "./pim-art/index.js";
import { createDebugLogger } from "./debugger.js";
import Play from "./Play.js";
import Pause from "./Pause.js";
import "./audio-player/AudioPlayerElement.js";

export const debug = createDebugLogger(true);

const art = new Art({ 
    pause: new Pause(),
    play: new Play(),
    width: 320,
    height: 180,
    tileSize: 16,
    canvas: "#canvas-art",
    displayGrid: false,
});

// TODO: 
// 1. Implement Play and Pause scenes
// 2. start and play the art instance

