/**
 * @file server/utility/base64.js
 * Function for decoding base64 strings.
 */

module.exports.encodeString = (str) => {
    return Buffer.from(str).toString('base64');
};

module.exports.decodeString = (str) => {
    return Buffer.from(str, 'base64').toString('utf8');
};