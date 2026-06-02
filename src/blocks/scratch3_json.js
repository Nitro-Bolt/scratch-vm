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
            json_object_extendable: this.objectExtendable,
            json_get_properties: this.getProperties,
            json_value_of_key: this.valueOfKey,
            json_set_key: this.setKey,
            json_delete_key: this.deleteKey,
            json_merge_object: this.mergeObject,
            json_has_key: this.hasKey,
            json_new_array: this.newArray,
            json_array_extendable: this.arrayExtendable,
            json_value_of_index: this.valueOfIndex,
            json_index_of_value: this.indexOfValue,
            json_add_item: this.addItem,
            json_replace_index: this.replaceIndex,
            json_delete_index: this.deleteIndex,
            json_delete_all_occurrences: this.deleteAllOccurrences,
            json_merge_array: this.mergeArray,
            json_has_item: this.hasItem,
            json_array_length: this.arrayLength,
            json_slice_array: this.sliceArray,
            json_reverse_array: this.reverseArray,
            json_foreach: this.forEach,
            json_foreach_value: this.forEachValue,
            json_foreach_index: this.forEachIndex
        };
    }

    newObject () {
        return new Object();
    }

    objectExtendable (args, util) {
        const keys = util.extendableToArray(args, 'ITEMS', 'KEY');
        const vals = util.extendableToArray(args, 'ITEMS', 'VALUE');
        return Object.fromEntries(keys.map((key, i) => [key, vals[i]]));
    }

    getProperties (args) {
        const obj = Cast.toObject(args.OBJ);
        const property = args.PROPERTY;

        switch (property) {
        case 'keys':
            return Object.keys(obj);
        case 'values':
            return Object.values(obj);
        case 'entries':
            return Object.entries(obj);
        default:
            return new Array();
        }
    }

    valueOfKey (args) {
        const obj = Cast.toObject(args.OBJ);
        const key = Cast.toString(args.KEY);
        return obj[key] ?? '';
    }

    setKey (args) {
        const obj = {...Cast.toObject(args.OBJ)};
        const key = Cast.toString(args.KEY);
        obj[key] = args.VALUE;
        return obj;
    }

    deleteKey (args) {
        const obj = {...Cast.toObject(args.OBJ)};
        const key = Cast.toString(args.KEY);
        delete obj[key];
        return obj;
    }

    mergeObject (args) {
        const obj1 = Cast.toObject(args.OBJ1);
        const obj2 = Cast.toObject(args.OBJ2);
        return Object.fromEntries(Object.entries(obj1).concat(Object.entries(obj2)));
    }

    hasKey (args) {
        const obj = Cast.toObject(args.OBJ);
        const key = Cast.toString(args.KEY);
        return Object.hasOwn(obj, key);
    }

    newArray () {
        return new Array();
    }

    arrayExtendable (args, util) {
        return [...util.extendableToArray(args, 'ITEMS', 'ITEM')];
    }

    valueOfIndex (args) {
        const arr = Cast.toArray(args.ARR);
        const i = Cast.toArrayIndex(args.INDEX, arr.length);
        if (i === Cast.LIST_INVALID) return '';
        return arr[i] ?? '';
    }

    indexOfValue (args) {
        const arr = Cast.toArray(args.ARR);
        return arr.indexOf(args.VALUE) === -1 ? '' : arr.indexOf(args.VALUE);
    }

    addItem (args) {
        const arr = [...Cast.toArray(args.ARR)];
        arr.push(args.ITEM);
        return arr;
    }

    replaceIndex (args) {
        const arr = [...Cast.toArray(args.ARR)];
        const i = Cast.toArrayIndex(args.INDEX, arr.length);
        if (i === Cast.LIST_INVALID) return arr;
        arr[i] = args.ITEM;
        return arr;
    }

    deleteIndex (args) {
        const arr = [...Cast.toArray(args.ARR)];
        const i = Cast.toArrayIndex(args.INDEX, arr.length);
        if (i === Cast.LIST_INVALID) return arr;
        arr.splice(i, 1);
        return arr;
    }

    deleteAllOccurrences (args) {
        const arr = Cast.toArray(args.ARR);
        const item = Cast.toString(args.ITEM);
        return arr.filter(e => e !== item);
    }

    mergeArray (args) {
        const arr1 = Cast.toArray(args.ARR1);
        const arr2 = Cast.toArray(args.ARR2);
        return arr1.concat(arr2);
    }

    hasItem (args) {
        const arr = Cast.toArray(args.ARR);
        return arr.includes(args.ITEM);
    }

    arrayLength (args) {
        const arr = Cast.toArray(args.ARR);
        return arr.length;
    }

    sliceArray (args) {
        const arr = [...Cast.toArray(args.ARR)];
        const s = Cast.toArrayIndex(args.START, arr.length);
        const e = Cast.toArrayIndex(args.END, arr.length);
        if (s === Cast.LIST_INVALID || e === Cast.LIST_INVALID || e < s) return [];
        return arr.slice(s, e + 1);
    }

    reverseArray (args) {
        return [...Cast.toArray(args.ARR)].reverse();
    }

    forEachValue (args, util) {
        const frames = util.thread.stackFrames;
        for (let i = frames.length - 1; i >= 0; i--) {
            if (typeof frames[i].jsonForeachState !== 'undefined') {
                return frames[i].jsonForeachState?.value ?? '';
            }
        }
        return '';
    }

    forEachIndex (args, util) {
        const frames = util.thread.stackFrames;
        for (let i = frames.length - 1; i >= 0; i--) {
            if (typeof frames[i].jsonForeachState !== 'undefined') {
                return frames[i].jsonForeachState?.index ?? 0;
            }
        }
        return 0;
    }

    forEach (args, util) {
        const {stackFrame, thread} = util;

        if (typeof stackFrame.index === 'undefined') {
            const array = Cast.toArray(args.ARRAY);
            if (array.length === 0) return [];
            Object.assign(stackFrame, {
                index: 0,
                array: [...array]
            });
        }

        if (stackFrame.index >= stackFrame.array.length) {
            delete thread.stackFrames[thread.stackFrames.length - 1].jsonForeachState;
            return;
        }

        thread.stackFrames[thread.stackFrames.length - 1].jsonForeachState = {
            value: stackFrame.array[stackFrame.index],
            index: stackFrame.index
        };
        stackFrame.index++;
        util.startBranch(1, true);
    }
}

module.exports = Scratch3JSONBlocks;
