const {test} = require('tap');
const Runtime = require('../../src/engine/runtime');
const CustomTypes = require('../../src/extension-support/custom-types');
const ScratchCommon = require('../../src/extension-support/tw-extension-api-common');

class TestType {
    constructor (value) {
        this.value = value;
    }

    static cast (val) {
        if (val instanceof TestType) return val;
        return new TestType(val);
    }

    toString () {
        return `test:${this.value}`;
    }

    valueOf () {
        return this.value;
    }

    toJSON () {
        return {value: this.value};
    }

    static fromJSON (json) {
        return new TestType(json.value);
    }
}

class MinimalType {
    constructor (value) {
        this.value = value;
    }

    toJSON () {
        return {v: this.value};
    }
}

test('isValidTypeId', t => {
    t.equal(CustomTypes.isValidTypeId('myext:mytype'), true);
    t.equal(CustomTypes.isValidTypeId('MyExt123:type_name-x'), true);
    t.equal(CustomTypes.isValidTypeId('myext'), false, 'missing namespace');
    t.equal(CustomTypes.isValidTypeId(':typename'), false, 'empty extension id');
    t.equal(CustomTypes.isValidTypeId('ext:'), false, 'empty type name');
    t.equal(CustomTypes.isValidTypeId('a:b:c'), false, 'too many colons');
    t.equal(CustomTypes.isValidTypeId(42), false);
    t.equal(CustomTypes.isValidTypeId(null), false);
    t.end();
});

test('makeCastFunction prefers static cast and passes instances through', t => {
    const cast = CustomTypes.makeCastFunction(TestType);
    const instance = new TestType(1);
    t.equal(cast(instance), instance, 'instance returned untouched');
    t.type(cast(5), TestType);
    t.equal(cast(5).value, 5);

    // Errors thrown by cast degrade to the raw input.
    class ThrowingType {}
    ThrowingType.cast = () => {
        throw new Error('no');
    };
    const throwingCast = CustomTypes.makeCastFunction(ThrowingType);
    t.equal(throwingCast('kept'), 'kept');
    t.end();
});

test('makeCastFunction falls back to constructor without static cast', t => {
    const cast = CustomTypes.makeCastFunction(MinimalType);
    t.type(cast('x'), MinimalType);
    t.equal(cast('x').value, 'x');
    const same = new MinimalType('y');
    t.equal(cast(same), same, 'instances pass through');
    t.end();
});

test('runtime custom type registry', t => {
    const runtime = new Runtime();
    t.same(runtime.customTypes, new Map(), 'registry starts empty');

    runtime.registerCustomType('tests:testType', TestType);
    t.equal(runtime.hasCustomType('tests:testType'), true);
    t.equal(runtime.getCustomType('tests:testType'), TestType);
    t.equal(runtime.customTypes.size, 1);

    // Re-registering the identical class is a no-op.
    runtime.registerCustomType('tests:testType', TestType);
    t.equal(runtime.customTypes.size, 1);

    t.throws(() => runtime.registerCustomType('tests:testType', MinimalType), {
        message: 'Custom type "tests:testType" is already registered by another class.'
    });
    t.throws(() => runtime.registerCustomType('non-namespaced', TestType));
    t.throws(() => runtime.registerCustomType('ok:id', 'not a class'));

    runtime.unregisterCustomType('tests:testType');
    t.equal(runtime.hasCustomType('tests:testType'), false);
    t.equal(runtime.unregisterCustomType('never:existed'), undefined, 'unregistering unknown id is safe');

    t.end();
});

test('serialize/deserialize round trip', t => {
    const runtime = new Runtime();
    runtime.registerCustomType('tests:testType', TestType);

    const original = [
        new TestType('hello'),
        42,
        'plain',
        [new TestType('nested'), {deep: new TestType(7)}]
    ];
    const serialized = CustomTypes.serializeCustomValue(runtime, original);
    t.same(serialized[0], {_customType: 'tests:testType', data: {value: 'hello'}});
    t.equal(serialized[1], 42, 'primitives untouched (same reference semantics)');
    t.equal(serialized[2], 'plain');
    t.same(serialized[3][0], {_customType: 'tests:testType', data: {value: 'nested'}});
    t.same(serialized[3][1].deep, {_customType: 'tests:testType', data: {value: 7}});
    // JSON safe
    t.doesNotThrow(() => JSON.stringify(serialized));

    const revived = CustomTypes.deserializeCustomValue(runtime, JSON.parse(JSON.stringify(serialized)));
    t.type(revived[0], TestType);
    t.equal(revived[0].value, 'hello');
    t.equal(revived[1], 42);
    t.type(revived[3][0], TestType);
    t.type(revived[3][1].deep, TestType);
    t.equal(revived[3][1].deep.value, 7);
    t.end();
});

test('serialization leaves plain values as-is', t => {
    const runtime = new Runtime();
    const value = {a: 1, b: ['two', 3], c: {d: null}};
    t.equal(CustomTypes.serializeCustomValue(runtime, value), value, 'same reference when nothing changed');

    const list = [1, 2, 3];
    t.equal(CustomTypes.serializeCustomValue(runtime, list), list);
    t.end();
});

test('registered class without fromJSON falls back to constructor', t => {
    const runtime = new Runtime();
    runtime.registerCustomType('tests:minimal', MinimalType);
    const serialized = CustomTypes.serializeCustomValue(runtime, new MinimalType('abc'));
    t.same(serialized, {_customType: 'tests:minimal', data: {v: 'abc'}});
    const revived = CustomTypes.deserializeCustomValue(runtime, serialized);
    t.type(revived, MinimalType);
    // Best-effort fallback: constructed with the raw payload. Extensions that
    // need structured revival must define static fromJSON.
    t.same(revived.value, {v: 'abc'});
    t.end();
});

test('deserialization gracefully handles missing extension or broken fromJSON', t => {
    const runtimeWith = new Runtime();
    runtimeWith.registerCustomType('gone:data', TestType);
    const saved = CustomTypes.serializeCustomValue(runtimeWith, new TestType('payload'));

    // Simulate the extension being unavailable in a fresh runtime.
    const runtimeWithout = new Runtime();
    const revived = CustomTypes.deserializeCustomValue(runtimeWithout, saved);
    t.notOk(revived instanceof TestType);
    t.same(revived, {value: 'payload'}, 'falls back to raw serialized data');

    // fromJSON that throws degrades to raw data too.
    class BadType {}
    BadType.fromJSON = () => {
        throw new Error('bad');
    };
    runtimeWithout.registerCustomType('gone:data', BadType);
    const revived2 = CustomTypes.deserializeCustomValue(runtimeWithout, saved);
    t.same(revived2, {value: 'payload'});

    // Malformed schema objects pass through unchanged.
    const notCustom = {_customType: 42, data: {x: 1}};
    t.same(CustomTypes.deserializeCustomValue(runtimeWith, notCustom), notCustom);
    const noData = {_customType: 'a:b'};
    t.same(CustomTypes.deserializeCustomValue(runtimeWith, noData), noData);
    t.end();
});

test('Scratch.types API routes through the current VM context', t => {
    const vmLike = {runtime: new Runtime()};
    global.Scratch = global.Scratch || {};
    global.Scratch.vm = vmLike;

    try {
        ScratchCommon.types.register('api:thing', TestType);
        t.equal(vmLike.runtime.hasCustomType('api:thing'), true);
        t.equal(ScratchCommon.types.has('api:thing'), true);
        t.equal(ScratchCommon.types.get('api:thing'), TestType);

        ScratchCommon.types.unregister('api:thing');
        t.equal(ScratchCommon.types.has('api:thing'), false);

        delete global.Scratch.vm;
        t.equal(ScratchCommon.types.has('any:id'), false, 'has() without VM is false');
        t.throws(() => ScratchCommon.types.register('any:id', TestType), null,
            'register() without VM throws descriptive error');
    } finally {
        delete global.Scratch.vm;
    }
    t.end();
});

test('runtime precomputes argument casters per opcode', t => {
    const runtime = new Runtime();
    runtime._updateCustomArgumentCasters('ext_op', {
        arguments: {
            A: {type: 'tests:testType'},
            B: {type: 'string'},
            C: {type: 'not:registered'}
        }
    });
    t.notOk(runtime._customArgumentCasters.has('ext_op'), 'nothing cached when type unregistered');

    runtime.registerCustomType('tests:testType', TestType);
    runtime._updateCustomArgumentCasters('ext_op', {
        arguments: {
            A: {type: 'tests:testType'},
            B: {type: 'string'}
        }
    });
    const casters = runtime._customArgumentCasters.get('ext_op');
    t.ok(casters);
    t.same(Object.keys(casters), ['A']);
    t.type(casters.A({value: 9}), TestType);

    // Re-registration with no custom args clears the cache entry.
    runtime._updateCustomArgumentCasters('ext_op', {arguments: {B: {type: 'string'}}});
    t.notOk(runtime._customArgumentCasters.has('ext_op'));

    // Unregistering a type invalidates dependent casters.
    runtime._updateCustomArgumentCasters('ext_op', {arguments: {A: {type: 'tests:testType'}}});
    t.ok(runtime._customArgumentCasters.has('ext_op'));
    runtime.unregisterCustomType('tests:testType');
    t.notOk(runtime._customArgumentCasters.has('ext_op'));
    t.end();
});
