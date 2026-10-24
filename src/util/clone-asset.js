const cloneAsset = (assetObject, storage) => {
    const clone = Object.assign({}, assetObject);
    const originalAsset = assetObject.asset;
    if (!originalAsset || !storage) {
        return clone;
    }

    const assetType = Object.assign({}, originalAsset.assetType);
    const data = originalAsset.data ? new Uint8Array(originalAsset.data) : originalAsset.data;
    clone.asset = storage.createAsset(
        assetType,
        originalAsset.dataFormat,
        data,
        originalAsset.assetId,
        false
    );
    return clone;
};

module.exports = cloneAsset;
