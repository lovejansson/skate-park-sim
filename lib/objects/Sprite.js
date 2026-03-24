import AnimationManager from "../AnimationManager.js";
import ArtObject from "./ArtObject.js";
import { MethodNotImplementedError } from "../errors.js";

/** 
* @typedef {import("../Scene.js").default} Scene
*/

export default class Sprite extends ArtObject {

    /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {"n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"} direction
     */
    constructor(scene, id, pos, width, height, direction) {
        super(scene, id);
        this.pos = pos;
        this.width = width;
        this.height = height;
        this.direction = direction;
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
        this.animations = new AnimationManager(this);
    }


    update() {
        throw new MethodNotImplementedError("Sprite", "update");
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        this.animations.draw(ctx, this.pos);
    }
}
