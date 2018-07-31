/**
 * @file server/utility/error.js
 * Route middleware for handling errors.
 */

// Imports
const hsc = require('http-status-codes');

/**
 * Route middleware that runs if an error is caught.
 */
module.exports.route = (err, req, res, next) => {
    // Get the error code, type, message, and stack.
    const statusCode = err.status || 500;
    const statusType = hsc.getStatusText(statusCode);
    
    // Log the error.
    if (err.stack) {
        console.error(err.stack);
    } else if (err.message) {
        console.error(err.message);
    } else {
        console.error(`${statusCode}: ${statusType}`);
    }

    // Create the error object depending on our node environment.
    const error = {};
    error.status = statusCode;

    if (process.env.NODE_ENV === 'development') {
        error.type = statusType;
        error.message = err.message || '';
        error.stack = err.stack || '';
    } else {
        error.message = statusType;
    }

    return res.status(statusCode).json({ error });
};

/**
 * @fn raise
 * Raises an error in async-wrapped functions.
 * 
 * @param {number} status The error status.
 * @param {string} message The error message.
 * @param {string[]} details The error details.
 * @return {object} The error object.
 */
module.exports.raise = (status, message, details = []) => {
    return {
        error: { status, message, details }
    };
};
