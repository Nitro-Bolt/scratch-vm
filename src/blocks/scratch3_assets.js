const Cast = require('../util/cast');
const MathUtil = require('../util/math-util');

class Scratch3AssetBlocks {
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
            assets_menu: this.assetsMenu,
            assets_test: this.test
        };
    }

    assetsMenu (args) {
        return args.ASSET_MENU;
    }

    test (args, util) {
        const index = this._getAssetIndex(args.ASSET_MENU, util);
        if (index < 0) {
            return '';
        }
        const asset = util.target.sprite.assets[index];
        if (asset.md5) {
            return asset.md5;
        }
        if (asset.asset) {
            return `${asset.asset.assetId}.${asset.asset.dataFormat}`;
        }
        return '';
    }

    _getAssetIndex (assetName, util) {
        const assets = util.target.sprite.assets;
        if (assets.length === 0) {
            return -1;
        }

        const index = this.getAssetIndexByName(Cast.toString(assetName), util);
        if (index !== -1) {
            return index;
        }

        const oneIndexedIndex = parseInt(assetName, 10);
        if (!isNaN(oneIndexedIndex)) {
            return MathUtil.wrapClamp(oneIndexedIndex - 1, 0, assets.length - 1);
        }

        return -1;
    }

    getAssetIndexByName (assetName, util) {
        const assets = util.target.sprite.assets;
        for (let i = 0; i < assets.length; i++) {
            if (assets[i].name === assetName) {
                return i;
            }
        }
        return -1;
    }
}

module.exports = Scratch3AssetBlocks;
