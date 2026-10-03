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

/**
 * Custom block shapes API exposed to extensions as Scratch.BlockShapes.
 */
const blockShapesAPI = {
    /**
     * Register a custom block shape definition under an ID.
     * Must be called while the extension is loading.
     * @param {string} name - an ID like "ddeStar".
     * @param {Object} definition - shape definition.
     */
    register (name, definition) {
        const runtime = getCurrentRuntime();
        if (runtime) {
            return runtime.registerBlockShape(name, definition);
        }
        throw new Error(
            'Scratch.BlockShapes.register requires a VM context. Sandboxed extensions cannot define custom ' +
            'block shapes because their definitions cannot be shared with the main thread.'
        );
    },

    /**
     * Remove a previously registered custom block shape.
     * @param {string} name - the ID of the shape.
     */
    unregister (name) {
        const runtime = getCurrentRuntime();
        if (runtime) {
            return runtime.unregisterBlockShape(name);
        }
        throw new Error('Scratch.BlockShapes.unregister requires a VM context.');
    },

    /**
     * Check whether a custom block shape ID is currently registered.
     * @param {string} name - the ID of the shape.
     * @returns {boolean} true if registered.
     */
    has (name) {
        const runtime = getCurrentRuntime();
        return runtime ? runtime.hasBlockShape(name) : false;
    },

    /**
     * Get a registered custom block shape definition.
     * @param {string} name - the ID of the shape.
     * @returns {?Object} the shape definition, or null when not registered.
     */
    get (name) {
        const runtime = getCurrentRuntime();
        return runtime ? runtime.getBlockShape(name) : null;
    }
};

const Scratch = {
    ArgumentType,
    BlockType,
    BlockShape,
    TargetType,
    Cast,
    types: typesAPI,
    BlockShapes: blockShapesAPI,
    external
};
module.exports = Scratch;
