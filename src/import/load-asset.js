const StringUtil = require('../util/string-util');
const log = require('../util/log');

const loadAsset = function (asset, runtime) {
    if (asset.asset) {
        return Promise.resolve(asset);
    }
    if (!runtime.storage) {
        log.warn('No storage module present; cannot load asset asset: ', asset.md5);
        return Promise.resolve(asset);
    }
    if (typeof asset.md5 !== 'string' || asset.md5.indexOf('.') === -1) {
        log.warn('Cannot load asset without a valid md5 filename: ', asset.md5);
        return Promise.resolve(null);
    }
    const idParts = StringUtil.splitFirst(asset.md5, '.');
    const md5 = idParts[0];
    const ext = idParts[1].toLowerCase();
    const AssetType = Object.assign({}, runtime.storage.AssetType.Asset);
    if (asset.contentType) AssetType.contentType = asset.contentType;
    asset.dataFormat = ext;
    return runtime.storage.load(AssetType, md5, ext)
        .then(createdAsset => {
            asset.asset = createdAsset;

            if (!createdAsset) {
                log.warn('Failed to find asset data: ', asset.md5);
                return null;
            }

            return asset;
        })
        .catch(e => {
            log.warn(`Failed to load asset: ${asset.md5} with error: ${e}`);
            return null;
        });
};

module.exports = {
    loadAsset
};
