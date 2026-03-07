const Cast = require('../util/cast');

class Scratch3JSONBlocks {
    constructor(runtime) {
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
    getPrimitives() {
        return {
            json_new_object: this.newObject,
            json_get_properties: this.getProperties,
            json_value_of_key: this.valueOfKey,
            json_set_key: this.setKey,
            json_delete_key: this.deleteKey,
            json_merge_object: this.mergeObject,
            json_has_key: this.hasKey,
            json_new_array: this.newArray,
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
            json_foreach_index: this.forEachIndex,
        };
    }

    newObject() {
        return new Object();
    }

    getProperties(args) {
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
                return [];
        }
    }

    valueOfKey(args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        return args.OBJ[args.KEY] ?? '';
    }

    setKey(args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        args.OBJ[args.KEY] = args.VALUE;
        return args.OBJ;
    }

    deleteKey(args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        delete args.OBJ[args.KEY];
        return args.OBJ;
    }

    mergeObject(args) {
        args.OBJ1 = Cast.toObject(args.OBJ1);
        args.OBJ2 = Cast.toObject(args.OBJ2);
        return Object.fromEntries(Object.entries(args.OBJ1).concat(Object.entries(args.OBJ2)));
    }

    hasKey(args) {
        args.OBJ = Cast.toObject(args.OBJ);
        args.KEY = Cast.toString(args.KEY);
        return Object.hasOwn(args.OBJ, args.KEY);
    }

    newArray() {
        return new Array();
    }

    valueOfIndex(args) {
        args.ARR = Cast.toArray(args.ARR);
        args.INDEX = Cast.toNumber(args.INDEX);
        return args.ARR[args.INDEX] ?? '';
    }

    indexOfValue(args) {
        args.ARR = Cast.toArray(args.ARR);
        return args.ARR.indexOf(args.VALUE) === -1 ? '' : args.ARR.indexOf(args.VALUE);
    }

    addItem(args) {
        args.ARR = Cast.toArray(args.ARR);
        args.ARR.push(args.ITEM);
        return args.ARR;
    }

    replaceIndex(args) {
        args.ARR = Cast.toArray(args.ARR);
        args.INDEX = Cast.toNumber(args.INDEX);
        if (args.INDEX >= 0 && args.INDEX < args.ARR.length) {
            args.ARR[args.INDEX] = args.ITEM;
            return args.ARR;
        }
        return new Array();
    }

    deleteIndex(args) {
        args.ARR = Cast.toArray(args.ARR);
        args.INDEX = Cast.toNumber(args.INDEX);
        if (args.INDEX >= 0 && args.INDEX < args.ARR.length) {
            args.ARR.splice(args.INDEX, 1);
            return args.ARR;
        }
        return new Array();
    }

    deleteAllOccurrences(args) {
        args.ARR = Cast.toArray(args.ARR);
        args.ITEM = Cast.toString(args.ITEM);
        return args.ARR.filter(item => item !== args.ITEM);
    }

    mergeArray(args) {
        args.ARR1 = Cast.toArray(args.ARR1);
        args.ARR2 = Cast.toArray(args.ARR2);
        return args.ARR1.concat(args.ARR2);
    }

    hasItem(args) {
        args.ARR = Cast.toArray(args.ARR);
        return args.ARR.includes(args.ITEM);
    }

    arrayLength(args) {
        args.ARR = Cast.toArray(args.ARR);
        return args.ARR.length;
    }

    sliceArray(args) {
        args.ARR = Cast.toArray(args.ARR);
        args.START = Cast.toNumber(args.START);
        args.END = Cast.toNumber(args.END);

        const start = Math.max(0, args.START);
        const end = Math.min(args.ARR.length, args.END + 1);

        if (end <= start) return [];

        return args.ARR.slice(start, end);
    }

    reverseArray(args) {
        args.ARR = Cast.toArray(args.ARR);
        return [...args.ARR].reverse();
    }

    _reporterYield(util) {
        let thisBlock = util.thread.blockContainer?.getBlock(
            util.thread.peekStackFrame().op?.id ?? util.thread.peekStack()
        );
        if (!thisBlock) thisBlock = util.thread.stackFrames[0].myID;
        if (!thisBlock) return true; 

        util.thread.stackFrames[0].myID = thisBlock;
        util.thread.peekStackFrame().isLoop = true;

        const pushBlock = thisBlock.inputs?.METHOD?.block;
        if (pushBlock) util.thread.pushStack(pushBlock);
        util.yield();
    }

    forEachValue(args, util) {
        const frames = util.thread.stackFrames;
        for (let i = frames.length - 1; i >= 0; i--) {
            if (frames[i].jsonForeachState !== undefined) {
                return frames[i].jsonForeachState?.value ?? '';
            }
        }
        return '';
    }

    forEachIndex(args, util) {
        const frames = util.thread.stackFrames;
        for (let i = frames.length - 1; i >= 0; i--) {
            if (frames[i].jsonForeachState !== undefined) {
                return frames[i].jsonForeachState?.index ?? 0;
            }
        }
        return 0;
    }

    forEach(args, util) {
        const { stackFrame, thread } = util;

        if (stackFrame.index === undefined) {
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
