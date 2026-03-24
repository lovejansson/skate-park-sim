import { MethodNotImplementedError} from "./errors.js";

/**
 * @typedef {import("./src/Art.js").default} Art
 */

export default class Scene {

    /**
    * @description the art object that this scene belongs to, will be set by the Art class
    * @type {Art}
    */
    art;

    constructor() {
        if (new.target === Scene) {
            throw new TypeError("Cannot construct Scene instances directly");
        }

        this.art = null; // Will be set by the Art class on initialization. 
    }

    async init(){
        throw new MethodNotImplementedError("Scene", "init");
    }

    draw() {
        throw new MethodNotImplementedError("Scene", "draw");
    }

    update() {  
    }

    start() {
    }

    stop() {
    }

}