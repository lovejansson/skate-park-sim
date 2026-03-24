
import { MethodNotImplementedError } from "../errors.js";


/** 
* @typedef {import("../Scene.js").default } Scene
*/

/**
 * @description the art consists of objects that can be drawn on the screen.
 */
export default class ArtObject {
    /**
     * @param {Scene} scene
     * @param {Symbol} id

     */
    constructor(scene, id) {
        this.scene = scene;
        this.id = id;
    }

    update() {
    
    }

    draw() {
        throw new MethodNotImplementedError("ArtObject", "draw");
    }
}