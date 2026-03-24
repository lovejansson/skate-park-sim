
/** 
* @typedef {import("./objects/Sprite.js").default} Sprite
*/

/**
 * @typedef {SpriteSheetAnimation} AnimationConfig
 */

/**
 * @typedef AnimationConfig
* @property {string} frames spritesheet image key
* @property {number} frameRate ms per frame
* @property {number} numberOfFrames number of frames in the animation
* @property {number} [startIdx] where in the spritesheet to start (default 0)
* @property {boolean} loop if the animation should loop
 */

// TODO: Add support for different frame rates per animation frame and 
// integration with Art's Animation manager, so that aseprite can export its animation data directly to pim-art.

/**
 * @description Manages the animations for a sprite.
 */
export default class AnimationManager {

    /**
     * @param {Sprite} sprite
     */
    constructor(sprite) {
        /**
         * @type {Sprite}
         */
        this.sprite = sprite;

        /** @type {Map<string, AnimationConfig>} */
        this.animations = new Map();

        /** @type {{config: AnimationConfig, frameCount: number,  updateCount: number, overlay: {frames: string, startIdx: number}}|null} */
        this.playingAnimation = null;

    }

    /**
     * Creates and adds a new animation. 
     * 
     * @param {string} key 
     * @param {AnimationConfig} config
     */
    create(key, config) {
        if (config.type === "spritesheet" && config.startIdx === undefined) config.startIdx = 0;
        this.animations.set(key, config);
    }

    /**
     * Starts playing the animation.
     * 
     * @param {string} key
     * @param {{frames: string, startIdx: number}} [overlay] 
     * @throws {AnimationNotAddedError}
     */
    play(key, overlay) {

        const animation = this.animations.get(key);

        if (!animation) throw new AnimationNotAddedError(key);

        this.playingAnimation = { key, config: animation, overlay, frameCount: 0, updateCount: 0, loopCount: 0 };
    }

    /**
     * Stops the currently playing animation.
     * 
     * @param {string} key
     */
    stop(key) {
        if (this.playingAnimation !== null && key === this.playingAnimation.key) {
            this.playingAnimation = null;
        }
    }

    loopCount() {
        return this.playingAnimation !== null ? this.playingAnimation.loopCount : 0;
    }

    /**
     * Checks if a specific animation is currently playing.
     * 
     * @param {string} key
     * @returns {boolean}
     */
    isPlaying(key) {
        return this.playingAnimation !== null && key === this.playingAnimation.key;
    }

    update() {
        if (this.playingAnimation !== null) {
            // 1000 / 60 = 16.67 ms per frame 
            // 100 / 16.67 = 5.99 update frames in art cycle per sprite frame 
            if (this.playingAnimation.updateCount >= Math.floor(this.playingAnimation.config.frameRate / (1000 / this.sprite.scene.art.frameRate))) {

                if (this.playingAnimation.config.numberOfFrames - 1 === this.playingAnimation.frameCount) {

                    if (!this.playingAnimation.config.loop) {
                        this.playingAnimation = null;
                        return;
                    } else {
                        this.playingAnimation.frameCount = 0;
                        this.playingAnimation.loopCount++;
                    }
                } else {
                    this.playingAnimation.frameCount += 1;
                }

                this.playingAnimation.updateCount = 0;
       
            }

            this.playingAnimation.updateCount++;
            
        }
    }

    /**
     * Draws the current frame of the animation on the given canvas context.
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {

        if (this.playingAnimation) {

            const image = this.sprite.scene.art.images.get(this.playingAnimation.config.frames);

            ctx.drawImage(image,
                 (this.playingAnimation.config.startIdx + this.playingAnimation.frameCount) * this.sprite.width,
                0,
                this.sprite.width,
                this.sprite.height,
                this.sprite.pos.x,
                this.sprite.pos.y,
                this.sprite.width,
                this.sprite.height);

            if (this.playingAnimation.overlay !== undefined) {
                const image = this.sprite.scene.art.images.get(this.playingAnimation.overlay.frames);

                ctx.drawImage(image,
                    (this.playingAnimation.overlay.startIdx + this.playingAnimation.frameCount) * this.sprite.width,
                    0,
                    this.sprite.width,
                    this.sprite.height,
                    this.sprite.pos.x,
                    this.sprite.pos.y,
                    this.sprite.width,
                    this.sprite.height);
            }
        }
    }
}


class AnimationNotAddedError extends Error {
    constructor(key) {
        super(`Animation: ${key} not added.`);
    }
}