export default class AudioPlayer {

    /**
     * @type {boolean}
     */
    onoff;

    /**
     * @type {Map<string, string>}
     */
    #sounds;

    /**
     * @type {Map<string, AudioBuffer>}
     */
    #buffers;

    /**
     * @type {Map<string, AudioBufferSourceNode>}
     */
    #playingAudioNodes;

    /**
     * @type {AudioContext}
     */
    #audioCtx;

    /**
     * @type {GainNode}

     */
    #volumeNode;

    constructor() {
        this.#sounds = new Map();
        this.#buffers = new Map();
        this.#playingAudioNodes = new Map();
        this.onoff = false;

        this.#audioCtx = new(window.AudioContext || window.webkitAudioContext)();
 
        this.#volumeNode = this.#audioCtx.createGain();
        this.#volumeNode.connect(this.#audioCtx.destination);
    }


    /**
     * Adds audio data from a file at the provided path with a specific id.
     * 
     * This audio can later be loaded by load. 
     * 
     * @param {string} id The identifier for the audio.
     * @param {string} path The URL/path to the audio file.
     */
    async add(id, path) {
        this.#sounds.set(id, path);
    }

    /**
     * Loads all added audios
     */
    async load() {

        const promises = [];

        for(const [id, path] of this.#sounds) {
            promises.push(new Promise(async (resolve, reject) => {
                try {
                    // Load an audio file
                    const response = await fetch(path);
                    // Decode it
                    const audioBuffer = await this.#audioCtx.decodeAudioData(await response.arrayBuffer());

                    // Save audio data in map to play later in 'playAudio'
                    this.#buffers.set(id, audioBuffer);
                    resolve();
                } catch (err) {
                    reject(new AudioFetchError(path, err));
                }
            }));
        }

        await Promise.all(promises);

        this.#sounds.clear();
    }



    /**
     * Plays the audio file associated with the provided id.
     * The audio can optionally loop.
     * @param {string} id The identifier for the audio to play.
     * @param {boolean} [loop=false] Whether the audio should loop.
     * @throws {AudioNotFoundError} If the audio with the given id cannot be found.
     */
    play(id, loop = false) {

        if (this.onoff) {

            const alreadyPlayingNode = this.#playingAudioNodes.get(id);

            if (alreadyPlayingNode) {

                return; // Audio is already playing, do nothing
            }

            // Check if context is in suspended state (autoplay policy)
            if (this.#audioCtx.state === "suspended") {

                this.#audioCtx.resume();
            }

            const audioBuffer = this.#buffers.get(id);
            if (!audioBuffer) throw new AudioNotFoundError(id);

            const audioSource = this.#audioCtx.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.loop = loop;


            audioSource.connect(this.#volumeNode);
            audioSource.start();

            // Save the source node so it can be stopped via stopAudio
            this.#playingAudioNodes.set(id, audioSource);

            // Add event listener to delete the source node when it has stopped playing
            audioSource.addEventListener("ended", () => {
                this.#playingAudioNodes.delete(id);
            });

        } else {
            throw new AudioPlayerOffStateError("playAudio")
        }

    }

    isPlaying(id) {
        this.#playingAudioNodes.get(id) !== undefined;
    }

    /**
     * Stops the audio file associated with the provided id.
     * @param {string} id The identifier for the audio to stop.
     */
    stop(id) {
        const source = this.#playingAudioNodes.get(id);
        if (source) {
            source.stop();
        }
    }

    /**
     * Sets the volume for the audio player. All audio will have the same volume.
     * @param {number} volume The volume value between 0 and 1.
     * @throws {InvalidVolumeRangeError} If the volume is outside the range of 0 to 1.
     */
    setVolume(volume) {
        if (volume < 0 || volume > 1) throw new InvalidVolumeRangeError(volume);
        this.#volumeNode.gain.setValueAtTime(volume, this.#audioCtx.currentTime);
    }

    /**
     * Turns the audio player on or off.
     */
    onOffSwitch() {
        this.onoff = !this.onoff;

        if (!this.onoff) {
            this.turnOffAllAudios();
        }
    }

    /**
     * Stops all currently playing audio.
     * @private
     */
    turnOffAllAudios() {
        for (const audioSource of this.#playingAudioNodes.values()) {
            audioSource.stop();
        }
    }

}

/**
 * Error class for invalid volume range.
 */
class InvalidVolumeRangeError extends Error {
    /**
     * @param {number} volume The invalid volume value.
     */
    constructor(volume) {
        super(`Volume: ${volume} is not within valid range 0-1.`);
    }
}

/**
 * Error class for missing audio file.
 */
class AudioNotFoundError extends Error {
    /**
     * @param {string} id The id of the missing audio.
     */
    constructor(id) {
        super(`Audio with id: ${id} does not exist.`);
    }
}

/**
 * Error class for issues fetching the audio file.
 */
class AudioFetchError extends Error {
    /**
     * @param {string} path The path of the audio file.
     * @param {Error} error The original error.
     */
    constructor(path, error) {
        super(`Unable to fetch audio file: ${path}. Error: ${error.message}`);
    }
}

/**
 * Error class for using the audio player when it is off.
 */
class AudioPlayerOffStateError extends Error {
    /**
     * @param {string} funcName the name of the function that was executed.
     */
    constructor(funcName) {
        super(`Failed to execute: ${funcName}`);
    }
}