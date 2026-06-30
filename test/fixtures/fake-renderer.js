const FakeRenderer = function () {
    this.unused = '';
    this.x = 0;
    this.y = 0;
    this.order = 0;
    this.z = 0;
    this.spriteCount = 5;
    this._nextSkinId = -1;
};

FakeRenderer.prototype.createSVGSkin = function () {
    return this._nextSkinId++;
};

FakeRenderer.prototype.createBitmapSkin = function () {
    return this._nextSkinId++;
};

FakeRenderer.prototype.getSkinSize = function (d) { // eslint-disable-line no-unused-vars
    return [0, 0];
};

FakeRenderer.prototype.getSkinRotationCenter = function (d) { // eslint-disable-line no-unused-vars
    return [0, 0];
};

FakeRenderer.prototype.createDrawable = function () {
    return true;
};

FakeRenderer.prototype.getFencedPositionOfDrawable = function (d, p) { // eslint-disable-line no-unused-vars
    return [p[0], p[1]];
};

FakeRenderer.prototype.updateDrawableSkinId = function (d, skinId) { // eslint-disable-line no-unused-vars
};

FakeRenderer.prototype.updateDrawablePosition = function (d, position) { // eslint-disable-line no-unused-vars
    this.x = position[0];
    this.y = position[1];
};

FakeRenderer.prototype.updateDrawableDirectionScale =
    function (d, direction, scale) {}; // eslint-disable-line no-unused-vars

FakeRenderer.prototype.updateDrawableVisible = function (d, visible) { // eslint-disable-line no-unused-vars
};

FakeRenderer.prototype.updateDrawableEffect = function (d, effectName, value) { // eslint-disable-line no-unused-vars
};

FakeRenderer.prototype.getCurrentSkinSize = function (d) { // eslint-disable-line no-unused-vars
    return [0, 0];
};

FakeRenderer.prototype.pick = function (x, y, a, b, d) { // eslint-disable-line no-unused-vars
    return true;
};

FakeRenderer.prototype.drawableTouching = function (d, x, y, w, h) { // eslint-disable-line no-unused-vars
    return true;
};

FakeRenderer.prototype.isTouchingColor = function (d, c) { // eslint-disable-line no-unused-vars
    return true;
};

FakeRenderer.prototype.getBounds = function (d) { // eslint-disable-line no-unused-vars
    return {left: this.x, right: this.x, top: this.y, bottom: this.y};
};

FakeRenderer.prototype.setDrawableOrder = function (d, a, optG, optIsRelative, optMin) { // eslint-disable-line no-unused-vars
    if (d === 999) return 1; // fake for test case
    if (optIsRelative && a === 0) return this.z;
    if (optIsRelative) {
        if (a > 0) {
            this.z += 1;
        } else {
            this.z -= 1;
        }
    } else if (a === Infinity) {
        this.z += 1;
    } else if (a === -Infinity) {
        this.z -= 1;
        if (optMin !== undefined && optMin !== false) {
            this.z = Math.max(this.z, optMin);
        }
    } else {
        this.z = a;
    }
    return this.z;
};

FakeRenderer.prototype.getDrawableOrder = function (d) { // eslint-disable-line no-unused-vars
    return this.z;
};

FakeRenderer.prototype.pick = function (x, y, a, b, c) { // eslint-disable-line no-unused-vars
    return c[0];
};

FakeRenderer.prototype.isTouchingColor = function (a, b) { // eslint-disable-line no-unused-vars
    return false;
};

FakeRenderer.prototype.setLayerGroupOrdering = function (a) {}; // eslint-disable-line no-unused-vars

module.exports = FakeRenderer;
