const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

/**
 * Maximum number of timers that can be created.
 * @type {number}
 */
const MAX_TIMERS = 100;

/**
 * Icon svg to be displayed in the blocks category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjY0cHgiIGhlaWdodD0iNjRweCIgdmlld0JveD0iMCAwIDIwIDIwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJ1Z0dyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDBmZjg4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzAwYWE0NCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHBhdGgKICAgIGQ9Ik0xNCw0IEMxNCwyLjg5NSAxMy4xMDUsMiAxMiwyIEw4LDIgQzYuODk1LDIgNiwyLjg5NSA2LDQgTDYsNiBMNiw5IEw2LDExIEw2LDE0IEw2LDE2IEM2LDE3LjEwNSA2Ljg5NSwxOCA4LDE4IEwxMiwxOCBDMTMuMTA1LDE4IDE0LDE3LjEwNSAxNCwxNiBMMTQsMTQgTDE0LDExIEwxNCw5IEwxNCw2IEwxNCw0IFoKICAgICBNMTYsNiBMMTYsOSBMMTksOSBDMTkuNTUyLDkgMjAsOS40NDggMjAsMTAgQzIwLDEwLjU1MiAxOS41NTIsMTEgMTksMTEgTDE2LDExIEwxNiwxNAogICAgIEMxOC4yMDksMTQgMjAsMTUuNzkxIDIwLDE4IEwyMCwxOSBDMjAsMTkuNTUyIDE5LjU1MiwyMCAxOSwyMCBDMTguNDQ4LDIwIDE4LDE5LjU1MiAxOCwxOSBMMTgsMTgKICAgICBDMTgsMTcgMTgsMTYgMTYsMTYgQzE2LDE4LjIwOSAxNC4yMDksMjAgMTIsMjAgTDgsMjAgQzUuNzkxLDIwIDQsMTguMjA5IDQsMTYKICAgICBDMiwxNiAyLDE3IDIsMTggTDIsMTkgQzIsMTkuNTUyIDEuNTUyLDIwIDEsMjAgQzAuNDQ4LDIwIDAsMTkuNTUyIDAsMTkgTDAsMTgKICAgICBDMCwxNS43OTEgMS43OTEsMTQgNCwxNCBMNCwxMSBMMSwxMSBDMC40NDgsMTEgMCwxMC41NTIgMCwxMCBDMCw5LjQ0OCAwLjQ0OCw5IDEsOSBMNCw5IEw0LDYKICAgICBDMS43OTEsNiAwLDQuMjA5IDAsMiBMMCwxIEMwLDAuNDQ4IDAuNDQ4LDAgMSwwIEMxLjU1MiwwIDIsMC40NDggMiwxIEwyLDIKICAgICBDMiwzIDIsNCA0LDQgQzQsMS43OTEgNS43OTEsMCA4LDAgTDEyLDAgQzE0LjIwOSwwIDE2LDEuNzkxIDE2LDQKICAgICBDMTgsNCAxOCwzIDE4LDIgTDE4LDEgQzE4LDAuNDQ4IDE4LjQ0OCwwIDE5LDAgQzE5LjU1MiwwIDIwLDAuNDQ4IDIwLDEgTDIwLDIKICAgICBDMjAsNC4yMDkgMTguMjA5LDYgMTYsNiBaCiAgICAgTTEyLDE0IEMxMS40NDgsMTQgMTEsMTQuNDQ4IDExLDE1IEMxMSwxNS41NTIgMTEuNDQ4LDE2IDEyLDE2IEMxMi41NTIsMTYgMTMsMTUuNTUyIDEzLDE1IEMxMywxNC40NDggMTIuNTUyLDE0IDEyLDE0IFoKICAgICBNOSwxNSBDOSwxNS41NTIgOC41NTIsMTYgOCwxNiBDNy40NDgsMTYgNywxNS41NTIgNywxNSBDNywxNC40NDggNy40NDgsMTQgOCwxNCBDOC41NTIsMTQgOSwxNC40NDggOSwxNSBaIgogICAgZmlsbD0idXJsKCNidWdHcmFkKSIKICAvPgo8L3N2Zz4K';

class Scratch3DebuggerBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * Map of timer name to timer state.
         * @type {Object.<string, {start: ?number, durations: Array.<number>}>}
         */
        this.timers = {};
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'debugger',
            name: 'Debugger',
            menuIconURI: menuIconURI,
            color1: '#29beb8',
            blocks: [
                {
                    opcode: 'breakpoint',
                    blockType: BlockType.COMMAND,
                    text: 'breakpoint'
                },
                {
                    opcode: 'clear',
                    blockType: BlockType.COMMAND,
                    text: 'clear logs'
                },
                {
                    opcode: 'log',
                    blockType: BlockType.COMMAND,
                    text: '[TYPE] [MESSAGE] [COLOR]',
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'logType',
                            defaultValue: 'log'
                        },
                        MESSAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!'
                        },
                        COLOR: {
                            type: ArgumentType.EXTENDABLE,
                            text: 'with color [VALUE]',
                            arguments: {
                                VALUE: {
                                    type: ArgumentType.COLOR,
                                    defaultValue: '#0000ff'
                                }
                            },
                            minInputs: 0,
                            maxInputs: 1,
                            defaultInputs: 0
                        }
                    }
                },
                '---',
                {
                    opcode: 'timerCommand',
                    blockType: BlockType.COMMAND,
                    text: '[OPERATION] timer [TIMER_NAME]',
                    arguments: {
                        OPERATION: {
                            type: ArgumentType.STRING,
                            menu: 'timerOperation',
                            defaultValue: 'start'
                        },
                        TIMER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'timer'
                        }
                    }
                },
                {
                    opcode: 'getTimerValue',
                    blockType: BlockType.REPORTER,
                    text: '[STAT] of timer [TIMER_NAME]',
                    arguments: {
                        STAT: {
                            type: ArgumentType.STRING,
                            menu: 'timerStat',
                            defaultValue: 'average'
                        },
                        TIMER_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'timer'
                        }
                    }
                }
            ],
            menus: {
                logType: {
                    acceptReporters: true,
                    items: ['log', 'warn', 'error']
                },
                timerOperation: {
                    acceptReporters: true,
                    items: ['start', 'end', 'clear', 'delete']
                },
                timerStat: {
                    acceptReporters: true,
                    items: ['min', 'max', 'average']
                }
            }
        };
    }

    breakpoint () {
        this.runtime.breakpoint();
    }

    clear () {
        this.runtime.emit('DEBUGGER_CLEAR');
    }

    log (args, util) {
        const message = Cast.toString(args.MESSAGE);
        const color = Cast.toNumber(args.COLOR) === 1 ? Cast.toRgbColorObject(args.COLOR_0_VALUE) : null;

        this.runtime.emitDebuggerLog(args.TYPE, message, util.target, color);
        switch (args.TYPE) {
        case 'warn':
            console.warn(message);
            break;
        case 'error':
            console.error(message);
            break;
        default:
            console.log(message);
            break;
        }
    }

    _getTimer (name) {
        if (!Object.prototype.hasOwnProperty.call(this.timers, name)) {
            if (Object.keys(this.timers).length >= MAX_TIMERS) {
                return null;
            }
            this.timers[name] = {
                start: null,
                durations: []
            };
        }
        return this.timers[name];
    }

    _getTimerStats (timer) {
        const stats = {
            count: timer.durations.length,
            min: null,
            max: null,
            average: null
        };
        if (timer.durations.length > 0) {
            let min = Infinity;
            let max = -Infinity;
            let sum = 0;
            for (const duration of timer.durations) {
                if (duration < min) min = duration;
                if (duration > max) max = duration;
                sum += duration;
            }
            stats.min = min;
            stats.max = max;
            stats.average = sum / timer.durations.length;
        }
        return stats;
    }

    _emitTimerUpdate () {
        const data = {};
        for (const name in this.timers) {
            data[name] = this._getTimerStats(this.timers[name]);
        }
        this.runtime.emit('DEBUGGER_TIMER_UPDATE', data);
    }

    timerCommand (args) {
        const operation = Cast.toString(args.OPERATION);
        const name = Cast.toString(args.TIMER_NAME);
        if (!name) return;
        if (operation === 'delete') {
            if (Object.prototype.hasOwnProperty.call(this.timers, name)) {
                delete this.timers[name];
                this._emitTimerUpdate();
            }
            return;
        }
        const timer = this._getTimer(name);
        if (!timer) return;
        switch (operation) {
        case 'start':
            if (timer.start === null) {
                timer.start = performance.now();
                this._emitTimerUpdate();
            }
            break;
        case 'end':
            if (timer.start !== null) {
                timer.durations.push(performance.now() - timer.start);
                timer.start = null;
                this._emitTimerUpdate();
            }
            break;
        case 'clear':
            timer.start = null;
            timer.durations = [];
            this._emitTimerUpdate();
            break;
        }
    }

    getTimerValue (args) {
        const stat = Cast.toString(args.STAT);
        const name = Cast.toString(args.TIMER_NAME);
        const timer = this.timers[name];
        if (!timer) return 0;
        const stats = this._getTimerStats(timer);
        switch (stat) {
        case 'min':
            return stats.min || 0;
        case 'max':
            return stats.max || 0;
        default:
            return stats.average || 0;
        }
    }
}

module.exports = Scratch3DebuggerBlocks;
