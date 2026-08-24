const {test} = require('tap');
const VM = require('../../src/virtual-machine');
const Blocks = require('../../src/engine/blocks');
const Sprite = require('../../src/sprites/sprite');
const StageLayering = require('../../src/engine/stage-layering');
const sb3 = require('../../src/serialization/sb3');
const Scratch = require('../../src/extension-support/tw-extension-api-common');

class Counter {
    static get shape () {
        return Scratch.BlockShape.SQUARE;
    }

    constructor (value) {
        this.value = value;
    }

    static cast (val) {
        if (val instanceof Counter) return val;
        return new Counter(val);
    }

    toString () {
        return `counter:${this.value}`;
    }

    valueOf () {
        return this.value;
    }

    toJSON () {
        return {count: this.value};
    }

    static fromJSON (json) {
        return new Counter(json.count);
    }
}

class TestExtension {
    constructor (runtime) {
        this.runtime = runtime;
        this.receivedArg = null;
        // Builtin extensions receive the runtime directly; URL-loaded
        // extensions would go through Scratch.types.register instead.
        this.runtime.registerCustomType('testext:counter', Counter);
    }

    getInfo () {
        return {
            id: 'testext',
            name: 'Test Extension',
            blocks: [
                {
                    opcode: 'make',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'counter [VALUE]',
                    outputType: 'testext:counter',
                    arguments: {
                        VALUE: {
                            type: Scratch.ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: 'use',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'store counter [INPUT]',
                    arguments: {
                        INPUT: {
                            type: 'testext:counter'
                        }
                    }
                }
            ]
        };
    }

    make ({VALUE}) {
        return new Counter(VALUE);
    }

    use ({INPUT}) {
        this.receivedArg = INPUT;
    }
}

const waitForMicrotasks = async () => {
    // Registration flows through dispatch promises even for builtin extensions.
    for (let i = 0; i < 10; i++) {
        await Promise.resolve();
    }
};

const setupVMWithExtension = async () => {
    const vm = new VM();
    vm.setCompilerOptions({enabled: false});
    vm.extensionManager.addBuiltinExtension('testext', TestExtension);
    vm.extensionManager.loadExtensionIdSync('testext');
    await waitForMicrotasks();
    return vm;
};

const addSpriteTarget = vm => {
    const sprite = new Sprite(new Blocks(vm.runtime), vm.runtime);
    sprite.name = 'Sprite1';
    const target = sprite.createClone(StageLayering.SPRITE_LAYER);
    vm.runtime.addTarget(target);
    return target;
};

test('outputType metadata reaches scratch-blocks JSON and caster cache', async t => {
    const vm = await setupVMWithExtension();

    const categoryInfo = vm.runtime._blockInfo.find(info => info.id === 'testext');
    t.ok(categoryInfo, 'category registered');

    const makeBlock = categoryInfo.blocks.find(block => block.json && block.json.type === 'testext_make');
    t.equal(makeBlock.json.output, 'testext:counter', 'reporter output uses the namespaced type ID');
    t.equal(makeBlock.json.outputShape, Scratch.BlockShape.SQUARE, 'shape comes from the type class');

    const useBlock = categoryInfo.blocks.find(block => block.json && block.json.type === 'testext_use');
    t.same(useBlock.json.args0[0].check, 'testext:counter', 'argument slot accepts only the custom type');
    t.notOk(useBlock.json.args0[0].shadow, 'custom-typed slot has no primitive shadow');

    const casters = vm.runtime._customArgumentCasters.get('testext_use');
    t.ok(casters && casters.INPUT, 'argument casters precomputed for opcode');
    t.type(casters.INPUT('anything'), Counter);

    t.end();
});

test('arguments are cast before the opcode runs', async t => {
    const vm = await setupVMWithExtension();
    const target = addSpriteTarget(vm);
    const blocks = target.blocks;

    // reporter block: testext_make(VALUE: 42)
    blocks.createBlock({
        id: 'makeBlock',
        opcode: 'testext_make',
        fields: {},
        inputs: {
            VALUE: {
                name: 'VALUE',
                block: 'valueShadow',
                shadow: 'valueShadow'
            }
        },
        shadow: false,
        topLevel: true
    });
    blocks.createBlock({
        id: 'valueShadow',
        opcode: 'math_number',
        fields: {NUM: {name: 'NUM', value: 42}},
        inputs: {},
        shadow: true,
        topLevel: false,
        parent: 'makeBlock'
    });

    // command block: testext_use(INPUT: <makeBlock>)
    blocks.createBlock({
        id: 'useBlock',
        opcode: 'testext_use',
        fields: {},
        inputs: {
            INPUT: {
                name: 'INPUT',
                block: 'makeBlock',
                shadow: null
            }
        },
        shadow: false,
        topLevel: true
    });

    vm.runtime._pushThread('useBlock', target, {stackClick: true});
    vm.runtime._step();

    const received = vm.runtime.ext_testext.receivedArg;
    t.ok(received instanceof Counter, 'opcode received an instance of the custom class');
    t.equal(received.value, 42, 'instance wraps the reported value');
    t.end();
});

test('shadow-only custom argument is cast too', async t => {
    const vm = await setupVMWithExtension();
    const target = addSpriteTarget(vm);

    // A bare text shadow plugged into the custom-typed INPUT.
    target.blocks.createBlock({
        id: 'useShadow',
        opcode: 'testext_use',
        fields: {},
        inputs: {
            INPUT: {
                name: 'INPUT',
                block: 'textShadow',
                shadow: 'textShadow'
            }
        },
        shadow: false,
        topLevel: true
    });
    target.blocks.createBlock({
        id: 'textShadow',
        opcode: 'text',
        fields: {TEXT: {name: 'TEXT', value: 'raw'}},
        inputs: {},
        shadow: true,
        topLevel: false,
        parent: 'useShadow'
    });

    vm.runtime._pushThread('useShadow', target, {stackClick: true});
    vm.runtime._step();

    const received = vm.runtime.ext_testext.receivedArg;
    t.ok(received instanceof Counter, 'text shadow value was cast to an instance');
    t.equal(received.value, 'raw');
    t.end();
});

test('project save/load round trips custom type values', async t => {
    const vmSource = await setupVMWithExtension();
    const sourceTarget = addSpriteTarget(vmSource);
    sourceTarget.createVariable('varCounter', 'myCounter', '');
    sourceTarget.variables.varCounter.value = new Counter(99);
    sourceTarget.createVariable('listCounters', 'myList', 'list');
    sourceTarget.variables.listCounters.value.push(new Counter(1), 'plain', new Counter(2));

    const savedProject = sb3.serialize(vmSource.runtime);
    const serializedTarget = savedProject.targets.find(targetData => !targetData.isStage);
    t.same(serializedTarget.variables.varCounter[1],
        {_customType: 'testext:counter', data: {count: 99}},
        'scalar serialized with the custom type schema');
    t.same(serializedTarget.lists.listCounters[1][0],
        {_customType: 'testext:counter', data: {count: 1}},
        'list items serialized with the schema');
    t.equal(serializedTarget.lists.listCounters[1][1], 'plain');

    // Deserialize into a runtime where the extension IS available.
    const vmRestored = await setupVMWithExtension();
    const restoredTargets = await sb3.deserialize(savedProject, vmRestored.runtime);
    const restoredValue = restoredTargets.targets[0].variables.varCounter.value;
    t.ok(restoredValue instanceof Counter, 'value revived as instance');
    t.equal(restoredValue.value, 99);
    const restoredList = restoredTargets.targets[0].variables.listCounters.value;
    t.ok(restoredList[0] instanceof Counter && restoredList[0].value === 1, 'list item revived');
    t.equal(restoredList[1], 'plain');
    t.ok(restoredList[2] instanceof Counter && restoredList[2].value === 2);

    // Deserialize where the extension is MISSING: graceful degradation.
    const vmMissing = new VM();
    const missingTargets = await sb3.deserialize(savedProject, vmMissing.runtime);
    t.same(missingTargets.targets[0].variables.varCounter.value, {count: 99},
        'missing extension falls back to raw data instead of failing');
    t.same(missingTargets.targets[0].variables.listCounters.value[0], {count: 1});
    t.end();
});
