class ExtensionWorkerBrowser extends Worker {
    constructor () {
        super(new URL(
            /* webpackChunkName: "js/extension-worker/extension-worker" */
            './extension-worker.js',
            import.meta.url
        ));
    }
}

module.exports = ExtensionWorkerBrowser;
