// Inspired by GarboMuffin's implementation of lazy sprites
// https://github.com/TurboWarp/scratch-vm/blob/lazy-sprites-4/src/sprites/tw-lazy-sprite.js

const Sprite = require('./sprite');
const sb3 = require('../serialization/sb3');

const LoadingState = {
  UNLOADED: 'unloaded',
  LOADING: 'loading',
  LOADED: 'loaded'
};

class LazySprite extends Sprite {
  static LoadingState = LoadingState;

  /**
   * A sprite in which its assets will be loaded lazily
   * @param {object} initialJSON
   * @param {import('../engine/runtime')} runtime 
   */
  constructor (initialJSON, runtime) {
    super(null, runtime);

    /**
     * Current loaded state of the sprite
     * @type {LoadingState}
     */
    this.state = LoadingState.UNLOADED;

    /**
     * JSON data of the sprite
     * @type {object}
     */
    this.object = initialJSON;
  }

  /**
   * Loads all sprite assets into memory.
   * @returns {Promise<void>}
   */
  async load () {
    if (this.state !== LoadingState.UNLOADED) {
      return;
    }

    this.state = LoadingState.LOADING;

    const {
      costumePromises,
      soundPromises,
      soundBank
    } = sb3.parseScratchAssets(this.object, this.runtime, this.runtime._zip);

    await Promise.resolve();

    this.costumes = await Promise.all(costumePromises);
    this.sounds = await Promise.all(soundPromises);
    this.soundBank = soundBank ?? null;
    this.state = LoadingState.LOADED;
  }
}

module.exports = LazySprite;