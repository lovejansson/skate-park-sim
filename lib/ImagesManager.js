export default class ImagesManager {

    /**
     * @type {Map<string, HTMLImageElement>}
     */
    #images;

    /**
     * @type {Map<string, string>}
     */
    #paths;


    constructor() {
        this.#images = new Map();
        this.#paths = new Map();
    }

    /**
     * Adds an image.
     * Loaded with the `load` method.
     * 
     * @param {string} name
     * @param {string} path 
     */
    add(name, path) {
        this.#paths.set(name, path);
    }

    /**
     * Loads all images that have been added. Each added image will be fetched from its path.
     * 
     * @returns {Promise<void>}
     */
    async load() {
        /**
         * @type {Promise<[string, HTMLImageElement][]>}
         * @description An array of promises that resolve to an array containing the image name and its corresponding image.
         */
        const loadPromises = [];

        for (const [name, path] of this.#paths.entries()) {
            const image = new Image();
    
            const loadPromise = new Promise((resolve, reject) => {
                image.addEventListener("load", () => {
                    resolve([name, image]);
                });

                image.addEventListener("error", (e) => {
                    reject(new LoadimageError(name, path, e.error));
                });
            });

            image.src = path;
            loadPromises.push(loadPromise);
        }

        try {
            const loadedimages = await Promise.all(loadPromises);

            for(const [name, image] of loadedimages) {
                this.#images.set(name, image);
            }

            this.#paths.clear(); 
        } catch (e) {
            throw e;
        }
    }

    /**
     * Retrieves the image element associated with a given image name.
     * 
     * @param {string} name The name of the image.
     * @returns {HTMLImageElement} The image element corresponding to the image name.
     * @throws {ImageNotLoadedError} Throws an error if the image has not been loaded.
     */
    get(name) {
        const image = this.#images.get(name);

        if (!image) throw new ImageNotLoadedError(name);

        return image;
    }
}


class ImageNotLoadedError extends Error {
    /**
     * @param {string} imageName The name of the image that was not loaded.
     */
    constructor(imageName) {
        super(`image: ${imageName} not loaded`);
    }
}


class LoadimageError extends Error {
    /**
     * @param {string} name The name of the image that failed to load.
     * @param {string} path The path for the image.
     * @param {string} inner The inner error message.
     */
    constructor(name, path, inner) {
        super(`Failed to load image: ${name} at: ${path} bc: ${inner}`);
    }
}