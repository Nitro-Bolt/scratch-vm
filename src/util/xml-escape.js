const Cast = require('../util/cast.js');

/**
 * Escape a string to be safe to use in XML content.
 * CC-BY-SA: hgoebl
 * https://stackoverflow.com/questions/7918868/
 * how-to-escape-xml-entities-in-javascript
 * @param {*} unsafe Value to escape.
 * @return {string} XML-escaped string, for use within an XML tag.
 */
const xmlEscape = function (unsafe) {
    if (Array.isArray(unsafe)) {
        unsafe = String(unsafe);
    } else if (typeof unsafe !== 'string') {
        unsafe = Cast.toString(unsafe);
    }
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        }
    });
};

module.exports = xmlEscape;
