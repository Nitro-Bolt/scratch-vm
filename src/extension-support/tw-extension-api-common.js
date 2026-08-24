const ArgumentType = require('./argument-type');
const BlockType = require('./block-type');
const BlockShape = require('./tw-block-shape');
const TargetType = require('./target-type');
const Cast = require('../util/cast');
const external = require('./tw-external');

/**
 * Resolve the runtime of the VM that is currently loading an extension, if any.
 * @returns {?Runtime} the runtime, or null when no VM context is available.
 */
const getCurrentRuntime = () => {
    const scratchGlobal = typeof global === 'undefined' ? null : global.Scratch;
    const vm = scratchGlobal && scratchGlobal.vm;
    return (vm && vm.runtime) || null;
};

/**
 * Custom types API exposed to extensions as Scratch.types.
 */
const typesAPI = {
    /**
     * Register a custom type class under an ID.
     * Must be called while the extension is loading. Register types at the top
     * so they exist before getInfo() is read.
     * @param {string} typeId - an ID like "ddeHelloNeighbor".
     * @param {Function} classDef - class instance of custom type.
     */
    register (typeId, classDef) {
        const runtime = getCurrentRuntime();
        if (runtime) {
            return runtime.registerCustomType(typeId, classDef);
        }
        throw new Error(
            'Scratch.types.register requires a VM context. Sandboxed extensions cannot define custom types ' +
            'because their classes cannot be shared with the main thread.'
        );
    },

    /**
     * Remove a previously registered custom type.
     * @param {string} typeId - the ID to unregister.
     */
    unregister (typeId) {
        const runtime = getCurrentRuntime();
        if (runtime) {
            return runtime.unregisterCustomType(typeId);
        }
        throw new Error('Scratch.types.unregister requires a VM context.');
    },

    /**
     * Check whether a custom type ID is currently registered.
     * @param {string} typeId - the ID to look up.
     * @returns {boolean} true if registered.
     */
    has (typeId) {
        const runtime = getCurrentRuntime();
        return runtime ? runtime.hasCustomType(typeId) : false;
    },

    /**
     * Get a registered custom type class.
     * @param {string} typeId - the ID to look up.
     * @returns {?Function} the class definition, or null when not registered.
     */
    get (typeId) {
        const runtime = getCurrentRuntime();
        return runtime ? runtime.getCustomType(typeId) : null;
    }
};

const Scratch = {
    ArgumentType,
    BlockType,
    BlockShape,
    TargetType,
    Cast,
    types: typesAPI,
    external
};

module.exports = Scratch;
