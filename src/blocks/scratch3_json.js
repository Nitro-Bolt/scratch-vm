const Cast = require('../util/cast');

class Scratch3JSONBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            json_new_object: this.newObject,
            json_to_object: this.toObject_,
            json_to_string: this.toString_,
            json_keys: this.keys,
            json_values: this.values,
            json_value_of_key: this.valueOfKey,
            json_set_key: this.setKey,
            json_delete_key: this.deleteKey,
            json_merge_object: this.mergeObject,
            json_has_key: this.hasKey,
            json_new_array: this.newArray,
            json_to_array: this.toArray_,
            json_value_of_index: this.valueOfIndex,
            json_index_of_value: this.indexOfValue,
            json_add_item: this.addItem,
            json_replace_index: this.replaceIndex,
            json_delete_index: this.deleteIndex,
            json_delete_all_occurrences: this.deleteAllOccurrences,
            json_merge_array: this.mergeArray,
            json_has_item: this.hasItem
        };
    }

    newObject () {
        return new Object();
    }

    toObject_ (args) {
        args.STR = Cast.toString(args.STR);
        return Cast.toObject(args.STR);
    }

    toString_ (args) {
        args.OBJ = Cast.toObject(args.OBJ);
        return Cast.toString(args.OBJ);
    }

    keys (args) {
        args.OBJ = Cast.toObject(args.OBJ);
        return Object.keys(args.OBJ);
    }

    values (args) {
        args.OBJ = Cast.toObject(args.OBJ);
        return Object.values(args.OBJ);
    }

    valueOfKey (args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        return args.OBJ[args.KEY] ?? "";
    }

    setKey (args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        args.OBJ[args.KEY] = args.VALUE;
        return args.OBJ;
    }

    deleteKey (args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        delete args.OBJ[args.KEY];
        return args.OBJ;
    }

    mergeObject (args) {
        args.OBJ1 = Cast.toObject(args.OBJ1);
        args.OBJ2 = Cast.toObject(args.OBJ2);
        return {...args.OBJ1, ...args.OBJ2};
    }

    hasKey (args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        return args.OBJ.hasOwnProperty(args.KEY);
    }

    newArray () {
        return new Array();
    }

    toArray_ (args) {
        args.STR = Cast.toString(args.STR);
        return Cast.toArray(args.STR);
    }

    valueOfIndex (args) {
        args.ARR = Cast.toArray(args.ARR);
        args.INDEX = Cast.toNumber(args.INDEX);
        return args.ARR[args.INDEX] ?? "";
    }

    indexOfValue (args) {
        args.ARR = Cast.toArray(args.ARR);
        args.VALUE = Cast.toString(args.VALUE);
        return args.ARR.indexOf(args.VALUE) !== -1 ? args.ARR.indexOf(args.VALUE) : "";
    }

    addItem (args) {
        args.ARR = Cast.toArray(args.ARR);
        args.ITEM = Cast.toString(args.ITEM);
        args.ARR.push(args.ITEM);
        return args.ARR;
    }

    replaceIndex (args) {
        args.ARR = Cast.toArray(args.ARR);
        args.INDEX = Cast.toNumber(args.INDEX);
        if (args.INDEX >= 0 && args.INDEX < args.ARR.length) {
            args.ARR[args.INDEX] = args.ITEM;
            return args.ARR;
        } else {
            return new Array();
        }
    }

    deleteIndex (args) {
        args.ARR = Cast.toArray(args.ARR);
        args.INDEX = Cast.toNumber(args.INDEX);
        if (args.INDEX >= 0 && args.INDEX < args.ARR.length) {
            args.ARR.splice(args.INDEX, 1);
            return args.ARR;
        } else {
            return new Array();
        }
    }

    deleteAllOccurrences (args) {
        args.ARR = Cast.toArray(args.ARR);
        args.ITEM = Cast.toString(args.ITEM);
        return args.ARR.filter((item) => item !== args.ITEM);
    }

    mergeArray (args) {
        args.ARR1 = Cast.toArray(args.ARR1);
        args.ARR2 = Cast.toArray(args.ARR2);
        return [...args.ARR1, ...args.ARR2];
    }

    hasItem (args) {
        args.ARR = Cast.toArray(args.ARR);
        args.ITEM = Cast.toString(args.ITEM);
        return args.ARR.includes(args.ITEM);
    }
}

module.exports = Scratch3JSONBlocks;
