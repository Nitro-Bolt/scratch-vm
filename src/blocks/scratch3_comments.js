const Cast = require('../util/cast');

class Scratch3CommentsBlocks {
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
            comments_hat: this.hat,
            comments_command: this.command,
            comments_loop: this.loop,
            comments_reporter: this.reporter,
            comments_boolean: this.boolean,
            comments_object: this.object,
            comments_array: this.array
        };
    }

    hat (args) {
        // No Operation;
    }

    command (args) {
        // No Operation;
    }

    loop (args, util) {
        util.startBranch(1, false);
    }

    reporter (args) {
        return args.VALUE;
    }

    boolean (args) {
        return Cast.toBoolean(args.VALUE);
    }

    object (args) {
        return Cast.toObject(args.VALUE);
    }

    array (args) {
        return Cast.toArray(args.VALUE);
    }
}

module.exports = Scratch3CommentsBlocks;
