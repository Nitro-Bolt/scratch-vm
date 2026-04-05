const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

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
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'debugger',
            name: 'Debugger',
            menuIconURI: menuIconURI,
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
                    text: '[TYPE][MESSAGE]',
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'logType',
                            defaultValue: 'log'
                        },
                        MESSAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello!'
                        }
                    }
                }
            ],
            menus: {
                logType: {
                    acceptReporters: true,
                    items: ['log', 'warn', 'error']
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
        this.runtime.emitDebuggerLog(args.TYPE, message, util.target);
    }
}

module.exports = Scratch3DebuggerBlocks;