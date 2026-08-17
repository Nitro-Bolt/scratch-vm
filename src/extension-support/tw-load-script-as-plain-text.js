// Builds an inline worker bundle using Rspack's child compiler API.

module.exports.pitch = function () {
    // Technically this loader does work in other environments, but our use case does not want that.
    if (this.target !== 'web') {
        return 'throw new Error("Not supported in non-web environment");';
    }
    this.cacheable(false);
    const callback = this.async();
    const {EntryPlugin} = this._compilation.compiler.rspack;
    const compiler = this._compilation.createChildCompiler(
        'extension worker',
        {path: this.rootContext, filename: 'extension-worker.js'},
        [new EntryPlugin(this.rootContext, this.resourcePath, {name: 'extension worker'})]
    );
    compiler.runAsChild((err, _entries, compilation) => {
        if (err) return callback(err);
        const [asset] = compilation.getAssets();
        if (!asset) return callback(new Error('The extension worker child compilation emitted no assets.'));
        const source = `module.exports = ${JSON.stringify(asset.source.source())};`;
        return callback(null, source);
    });
};
