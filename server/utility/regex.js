/**
 * @file server/utility/regex.js
 *
 * A collection of regular expressions used by the backend.
 */

// Export
module.exports = {
    symbols: /[$-/:-?{-~!"^_`\[\]!@]/,
    capitals: /[A-Z]/,
    numbers: /[0-9]/,
    objectid: /^[a-f\d]{24}$/i,
    emails: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
};
