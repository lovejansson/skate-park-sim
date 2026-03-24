import ArtObject  from "./ArtObject.js";

/**
 * @typedef {Object} AsepriteRect
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * @typedef {Object} AsepriteFrameData
 * @property {AsepriteRect} frame
 * @property {boolean} rotated
 * @property {boolean} trimmed
 * @property {AsepriteRect} spriteSourceSize
 * @property {{ w: number, h: number }} sourceSize
 * @property {number} duration
 */

/**
 * @typedef {Object} AsepriteFrameTag
 * @property {string} name
 * @property {number} from
 * @property {number} to
 * @property {"forward" | "reverse" | "pingpong"} direction
 * @property {string} [color]
 */

/**
 * @typedef {Object} AsepriteLayer
 * @property {string} name
 * @property {number} opacity
 * @property {string} blendMode
 */

/**
 * @typedef {Object} AsepriteMeta
 * @property {string} app
 * @property {string} version
 * @property {string} image
 * @property {string} format
 * @property {{ w: number, h: number }} size
 * @property {string} scale
 * @property {AsepriteFrameTag[]} frameTags
 * @property {AsepriteLayer[]} layers
 * @property {any[]} slices
 */

/**
 * @typedef {Object} AsepriteJSON
 * @property {Object.<string, AsepriteFrameData>} frames  - Keys are filenames like "outlaw-overture 0.aseprite"
 * @property {AsepriteMeta} meta
 */

/**
 * Plays an animated image based on exported .png and .json files for Aseprite spritsheets.
 */
export default class AnimatedImage extends ArtObject {
    /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {string} spritesheet .png image exported from Aseprite
     * @param {AsepriteJSON} config .json config file exported from Aseprite
     */
    constructor(scene, id, spritesheet, config) {
        super(scene,id)
        this.image = spritesheet;
        this.frames = Object.values(config.frames);
        this.currentFrameIdx = 0;
        this.elapsed = 0;
    }

    /**
     * @param {number} elapsed 
     */
    update(elapsed) {
        if (elapsed - this.elapsed >= this.frames[this.currentFrameIdx].duration) {
            if (this.currentFrameIdx === this.frames.length - 1) {
                this.currentFrameIdx = 0;
            } else {
                this.currentFrameIdx++;
            }
            this.elapsed = elapsed;
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        const { x, y, w, h } = this.frames[this.currentFrameIdx].frame;
        ctx.drawImage(this.scene.art.images.get(this.image), x, y, w, h, 0, 0, w, h);
    }
}