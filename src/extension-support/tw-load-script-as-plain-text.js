const {EntryPlugin} = require('@rspack/core');

module.exports.pitch = function () {
    // Technically this loader does work in other environments, but our use case does not want that.
    if (this.target !== 'web') {
        return 'throw new Error("Not supported in non-web environment");';
    }
    this.cacheable(false);
    const callback = this.async();
    const compiler = this._compilation.createChildCompiler('extension worker', {});
    new EntryPlugin(this.context, this.resourcePath, {name: 'iframe extension worker'}).apply(compiler);
    compiler.runAsChild((err, entries, compilation) => {
        if (err) return callback(err);
        const file = Array.from(entries[0].files)[0];
        const bundledSource = compilation.getAsset(file).source.source();
        const source = `module.exports = ${JSON.stringify(bundledSource)};`;
        return callback(null, source);
    });
};
