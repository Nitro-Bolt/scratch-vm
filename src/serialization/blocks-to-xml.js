const Blocks = require('../engine/blocks');
const Comment = require('../engine/comment');
const sb3 = require('./sb3');

const hydrateComments = comments => {
    const result = {};
    Object.keys(comments || {}).forEach(id => {
        const source = comments[id];
        const comment = new Comment(
            id,
            source.text,
            source.x,
            source.y,
            source.width,
            source.height,
            source.minimized,
            source.colour
        );
        comment.blockId = source.blockId || null;
        result[id] = comment;
    });
    return result;
};

const blockToXML = (serializedBlocks, serializedComments, rootId) => {
    const blocks = new Blocks(null);
    blocks._blocks = sb3.deserializeBlocks(JSON.parse(JSON.stringify(serializedBlocks)));
    return blocks.blockToXML(rootId, hydrateComments(serializedComments)) || '';
};

const commentToXML = (id, source) => hydrateComments({[id]: source})[id].toXML();

module.exports = {blockToXML, commentToXML};
