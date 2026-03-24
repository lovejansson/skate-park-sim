import AudioPlayer from "./AudioPlayer.js";
import ImagesManager from "./ImagesManager.js";

/**
 * @typedef {import("./Scene.js").Scene} Scene
 */


/**
 * @typedef ArtConfig
 * 
 * @property {number} width Width of the art canvas
 * @property {number} height Height of the art canvas
 * @property {tileSize} tileSize The size of each tile, defaults to 16px
 * @property {Scene} play The play scene
 * @property {Scene} pause The pause scene
 * @property {string} canvas The CSS selector for the canvas element, defaults to "#art-canvas"
 * @property {number} [frameRate] The frame rate, defaults to 60 FPS
 * @property {boolean} displayGrid Display tile grid during development 
 * @property {{}} [services] Custom services to the art instance
 */

const FRAME_RATE_DEFAULT = 60;
const CANVAS_SELECTOR_DEFAULT = "#art-canvas";
const DEFAULT_TILE_SIZE = 16;


export default class Art {

    /**
    * @type {{ 
    * up: boolean,
    * right: boolean,
    * down: boolean,
    * left: boolean,
    * space: boolean}}
    */
    keys;

    /**
     * @type {boolean}
     */
    isPlaying;

    /**
     * @type {ImagesManager}
     */
    images;

    /**
     * @type {AudioPlayer}
     */
    audio;

    /**
     *  @type {ArtConfig}
     */
    config;

    /**
     * @type {CanvasRenderingContext2D}
     */
    ctx;

    /**
     * @type {{}?} 
     */
    services;


    /**
     * @param {ArtConfig} config 
     */
    constructor(config) {
        this.images = new ImagesManager();
        this.audio = new AudioPlayer();
        this.isPlaying = false;
        this.config = config;
        this.elapsedAcc = 0;
        this.elapsedPrev = 0;
        this.width = config.width;
        this.height = config.height;
        this.tileSize = config.tileSize || DEFAULT_TILE_SIZE;
                this.displayGrid = config.displayGrid || false;

        this.services = config.services ? config.services : null;
        this.keys = {
            up: false,
            right: false,
            down: false,
            left: false,
            space: false
        }
        this.frameRate = config.frameRate || FRAME_RATE_DEFAULT;
        this.startTime = null;
    }

    enterFullScreen(){
        const body = document.querySelector("body");

        if(body === null) throw new Error("body not found");

        if(document.fullscreenElement === null) {
            body.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }


    async start() {
        await this.#init();
        this.#privatePlay(this.ctx);
    }


    async play() {
        this.audio.onOffSwitch();
        this.config.play.start();
        this.config.pause.stop();
        this.isPlaying = true;
    }


    async pause() {
        this.audio.onOffSwitch();
        this.config.pause.start();
        this.config.play.stop();
        this.isPlaying = false;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    async #privatePlay(ctx, elapsed = 0) {
        try {
        this.elapsedAcc = (this.elapsedAcc || 0) + elapsed - this.elapsedPrev;

        if (this.elapsedAcc >= (1000 / (this.frameRate))) {

            if (this.isPlaying) {

                const currentTransform = ctx.getTransform();
                ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.width, this.height);

                this.config.play.update();
                this.config.play.draw(ctx);

                 if(this.displayGrid) {
                    this.#drawGrid(ctx, this.height / this.tileSize, this.width / this.tileSize, this.tileSize, "white");
                }

            } else {

                const currentTransform = ctx.getTransform();

                ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.width, this.height);

                this.config.pause.update();
                this.config.pause.draw(ctx);
            }

            this.elapsedAcc = 0;
        }

        this.elapsedPrev = elapsed;

        } catch (e) {
                const {hours, minutes, seconds} = diffHMS(new Date(), this.startTime)
                console.log(`Time since start ${hours}:${minutes}:${seconds}`);
                console.error(e);
                
                this.pause();
        }

        requestAnimationFrame((elapsed) => {
            this.#privatePlay(ctx, elapsed) 
        });
    }


    async #init() {

        this.startTime = new Date();
        const ctx = this.#initCanvas(this.config.canvas || CANVAS_SELECTOR_DEFAULT);

        this.config.play.art = this;
        this.config.pause.art = this;

        await this.config.play.init();
        await this.config.pause.init();

        addEventListener("keydown", (e) => {

            if (!this.keys.up && ["ArrowUp", "w", "w"].includes(e.key)) {
                this.keys.up = true;
            } else if (!this.keys.right && ["ArrowRight", "d", "D"].includes(e.key)) {
                this.keys.right = true;
            } else if (!this.keys.down && ["ArrowDown", "s", "S"].includes(e.key)) {
                this.keys.down = true;
            } else if (!this.keys.left && ["ArrowLeft", "a", "A"].includes(e.key)) {
                this.keys.left = true;
            } else if (!this.keys.space && [" "].includes(e.key)) {
                this.keys.space = true;
            }
        });

        addEventListener("keyup", (e) => {

            if (this.keys.up && ["ArrowUp", "w", "w"].includes(e.key)) {
                this.keys.up = false;
            } else if (this.keys.right && ["ArrowRight", "d", "D"].includes(e.key)) {
                this.keys.right = false;
            } else if (this.keys.down && ["ArrowDown", "s", "S"].includes(e.key)) {
                this.keys.down = false;
            } else if (this.keys.left && ["ArrowLeft", "a", "A"].includes(e.key)) {
                this.keys.left = false;
            } else if (this.keys.space && [" "].includes(e.key)) {
                this.keys.space = false;
            }
        });

        this.ctx = ctx;

    }


    #initCanvas(selector) {
        const canvas = document.querySelector(selector);

        if (canvas === null) {
            console.error("canvas is null");
            throw new Error("canvas is null");
        }

        const ctx = canvas.getContext("2d");

        if (ctx === null) {
            console.error("ctx is null");
            throw new Error("ctx is null");
        }

        canvas.width = this.width;
        canvas.height = this.height;

        ctx.imageSmoothingEnabled = true; // For smooth scaling of images so that pixel art doesn't look blurry.

        return ctx;
    }

     /**
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} rows 
     * @param {number} cols
     * @param {number} cellSize
     */
    #drawGrid(ctx, rows, cols, cellSize, strokeColor = "black") {

        ctx.beginPath();
        ctx.strokeStyle = strokeColor;

        const translateOffset = 0.5; // So that lines don't blur

        for(let r = 0; r < rows; ++r) {

            for (let c = 0; c < cols; ++c) {

                ctx.moveTo((c * cellSize + translateOffset), r * cellSize + translateOffset);
                ctx.lineTo((c + 1) * cellSize + translateOffset, r * cellSize + translateOffset);
                ctx.lineTo((c + 1) * cellSize + translateOffset,(r + 1) * cellSize+  translateOffset);
                ctx.lineTo(c * cellSize + translateOffset, (r + 1) * cellSize + translateOffset);
                ctx.lineTo(c * cellSize + translateOffset,  r * cellSize + translateOffset);
            }
        }

        ctx.stroke();
    }
}

function diffHMS(date1, date2) {
  // difference in milliseconds
  let diff = Math.abs(date2 - date1);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;

  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 1000 * 60;

  const seconds = Math.floor(diff / 1000);

  return { hours, minutes, seconds };
}