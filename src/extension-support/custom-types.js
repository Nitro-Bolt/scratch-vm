/**
 * @fileoverview
 * Shared helpers for the custom types system.
 *
 * A custom type is a JS class registered on the runtime under an ID.
 * Extensions can use these IDs as the `outputType` of reporter blocks
 * or the `type` of block arguments.
 */

/**
 * sb3 key storing the custom type ID of a serialized value.
 */
const CUSTOM_TYPE_KEY = '_customType';

/**
 * sb3 key storing the serialized payload of a custom value.
 */
const CUSTOM_TYPE_DATA_KEY = 'data';

/**
 * Extension IDs are alphanumeric but additionally allow dashes and underscores.
 */
const CUSTOM_TYPE_ID_PATTERN = /^[a-z0-9_-]+$/i;

/**
 * Maximum recursion depth for (de)serialization.
 * BTW (By the way).
 */
const MAX_WALK_DEPTH = 64;

/**
 * Check whether a string is a valid custom type ID.
 * Does not check whether the type is actually registered.
 * @param {*} typeId - the candidate type ID.
 * @returns {boolean} true if the ID follows the "extensionId:typeName" format.
 */
const isValidTypeId = typeId =>
    typeof typeId === 'string' && CUSTOM_TYPE_ID_PATTERN.test(typeId);

/**
 * Build the cast function for a custom type class.
 * Prefers the class's static `cast` and falls back to constructing an instance.
 * @param {Function} classDef - the registered custom type class.
 * @returns {Function} (value) => castValue
 */
const makeCastFunction = classDef => {
    const defaultInstance = () => {
        try {
            return new classDef();
        } catch (e) {
            return void 0;
        }
    };
    const fallbackForEmpty = value => (
        typeof value === 'undefined' || value === null || value === '' ?
            defaultInstance() : value
    );
    if (typeof classDef.cast === 'function') {
        const boundCast = classDef.cast.bind(classDef);
        return value => {
            try {
                return boundCast(value);
            } catch (e) {
                return fallbackForEmpty(value);
            }
        };
    }
    return value => {
        try {
            if (value instanceof classDef) return value;
            return new classDef(value);
        } catch (e) {
            return fallbackForEmpty(value);
        }
    };
};

const getEmptyCasterNames = (casters, isPresent) => {
    const names = [];
    if (!casters) return names;
    for (const name in casters) {
        if (Object.prototype.hasOwnProperty.call(casters, name) && !isPresent(name)) {
            names.push(name);
        }
    }
    return names;
};

class PendingCustomValue {
    /**
     * @param {string} typeId - the saved custom type ID.
     * @param {*} data - the saved deserialized JSON data.
     */
    constructor (typeId, data) {
        this.typeId = typeId;
        this.data = data;
    }
    toSerialized () {
        const serialized = {};
        serialized[CUSTOM_TYPE_KEY] = this.typeId;
        serialized[CUSTOM_TYPE_DATA_KEY] = this.data;
        return serialized;
    }
    toString () {
        try {
            return JSON.stringify(this.data);
        } catch (e) {
            return '';
        }
    }
}

/**
 * Serialize a single runtime value.
 * @param {?Runtime} runtime - the runtime owning the custom type registry.
 * @param {*} value - the value to serialize.
 * @returns {*} the serializable representation.
 */
const _serializeValue = (runtime, value, depth) => {
    // Fast path: primitives (the overwhelming majority of variable data).
    if (value === null || typeof value !== 'object') {
        return value;
    }
    if (depth >= MAX_WALK_DEPTH) {
        return value;
    }

    if (Array.isArray(value)) {
        let changed = false;
        const result = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = _serializeValue(runtime, value[i], depth + 1);
            if (result[i] !== value[i]) changed = true;
        }
        return changed ? result : value;
    }

    if (value instanceof PendingCustomValue) {
        return value.toSerialized();
    }

    const hasToJSON = typeof value.toJSON === 'function';
    const reverseIds = runtime && runtime._customTypeIds;
    const typeId = reverseIds && value.constructor && reverseIds.get(value.constructor);

    if (typeId || hasToJSON) {
        let data;
        if (hasToJSON) {
            try {
                data = value.toJSON();
            } catch (e) {
                data = null;
            }
        } else {
            // Registered class without toJSON: fall back to own properties.
            data = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    data[key] = _serializeValue(runtime, value[key], depth + 1);
                }
            }
        }
        if (!typeId) {
            // Implements toJSON but isn't a registered custom type (e.g. Date):
            // keep the plain JSON data.
            return _serializeValue(runtime, data, depth + 1);
        }
        const serialized = {};
        serialized[CUSTOM_TYPE_KEY] = typeId;
        serialized[CUSTOM_TYPE_DATA_KEY] = _serializeValue(runtime, data, depth + 1);
        return serialized;
    }

    // Walk own enumerable keys. 🧑
    let changed = false;
    const result = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = _serializeValue(runtime, value[key], depth + 1);
            if (result[key] !== value[key]) changed = true;
        }
    }
    return changed ? result : value;
};

const _reviveWithClass = (classDef, data) => {
    if (typeof classDef.fromJSON === 'function') {
        try {
            return classDef.fromJSON(data);
        } catch (e) {
            return data;
        }
    }
    try {
        return new classDef(data);
    } catch (e) {
        return data;
    }
};

/**
 * Revive a value previously produced by serializeCustomValue.
 * @param {?Runtime} runtime - the runtime owning the custom type registry.
 * @param {*} value - the loaded value to revive.
 * @returns {*} the revived value.
 */
const _deserializeValue = (runtime, value, depth) => {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    if (depth >= MAX_WALK_DEPTH) {
        return value;
    }

    if (Array.isArray(value)) {
        let changed = false;
        const result = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
            result[i] = _deserializeValue(runtime, value[i], depth + 1);
            if (result[i] !== value[i]) changed = true;
        }
        return changed ? result : value;
    }

    const typeId = Object.prototype.hasOwnProperty.call(value, CUSTOM_TYPE_KEY) ?
        value[CUSTOM_TYPE_KEY] : null;
    if (typeof typeId === 'string' &&
        Object.prototype.hasOwnProperty.call(value, CUSTOM_TYPE_DATA_KEY)) {
        const data = _deserializeValue(runtime, value.data, depth + 1);
        const classDef = runtime ? runtime.customTypes.get(typeId) : null;
        if (!classDef) {
            return new PendingCustomValue(typeId, data);
        }
        return _reviveWithClass(classDef, data);
    }

    let changed = false;
    const result = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = _deserializeValue(runtime, value[key], depth + 1);
            if (result[key] !== value[key]) changed = true;
        }
    }
    return changed ? result : value;
};

const _revivePending = (value, typeId, classDef, depth) => {
    if (value === null || typeof value !== 'object' || depth >= MAX_WALK_DEPTH) {
        return value;
    }
    if (value instanceof PendingCustomValue) {
        return value.typeId === typeId ? _reviveWithClass(classDef, value.data) : value;
    }
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            const revived = _revivePending(value[i], typeId, classDef, depth + 1);
            if (revived !== value[i]) value[i] = revived;
        }
        return value;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
        return value;
    }
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            const revived = _revivePending(value[key], typeId, classDef, depth + 1);
            if (revived !== value[key]) value[key] = revived;
        }
    }
    return value;
};

const _reviveInTarget = (target, typeId, classDef) => {
    const variables = target && target.variables;
    if (!variables) return;
    for (const id in variables) {
        const variable = variables[id];
        if (!variable || variable.isCloud) continue;
        variable.value = _revivePending(variable.value, typeId, classDef, 0);
    }
};


const revivePendingValues = (runtime, typeId, classDef) => {
    if (!runtime || !Array.isArray(runtime.targets)) return;
    for (const target of runtime.targets) {
        _reviveInTarget(target, typeId, classDef);
    }
};


const reviveTargetValues = (runtime, target) => {
    if (!runtime || !runtime.customTypes || runtime.customTypes.size === 0) return;
    for (const [typeId, classDef] of runtime.customTypes) {
        _reviveInTarget(target, typeId, classDef);
    }
};

/**
 * Serialize a value for sb3 storage.
 * @param {?Runtime} runtime - the runtime owning the custom type registry.
 * @param {*} value - the value to serialize.
 * @returns {*} the serializable representation.
 */
const serializeCustomValue = (runtime, value) => _serializeValue(runtime, value, 0);

/**
 * Revive a loaded value.
 * @param {?Runtime} runtime - the runtime owning the custom type registry.
 * @param {*} value - the loaded value to revive.
 * @returns {*} the revived value.
 */
const deserializeCustomValue = (runtime, value) => _deserializeValue(runtime, value, 0);

module.exports = {
    CUSTOM_TYPE_ID_PATTERN,
    isValidTypeId,
    makeCastFunction,
    getEmptyCasterNames,
    PendingCustomValue,
    revivePendingValues,
    reviveTargetValues,
    serializeCustomValue,
    deserializeCustomValue
};
