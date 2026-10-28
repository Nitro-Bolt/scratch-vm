/**
 * Compare two JSON-compatible values by value instead of object identity.
 * Object property order is not significant.
 * @param {*} left first value
 * @param {*} right second value
 * @returns {boolean} whether the values are equal
 */
const jsonEquals = (left, right) => {
    if (left === right) return true;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;

    const leftIsArray = Array.isArray(left);
    if (leftIsArray !== Array.isArray(right)) return false;

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;

    if (!leftIsArray) {
        for (const key of leftKeys) {
            if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
        }
    }

    for (const key of leftKeys) {
        if (!jsonEquals(left[key], right[key])) return false;
    }
    return true;
};

module.exports = jsonEquals;
