/**
 * @file server/utility/async-wrap.js
 * Functions for wrapping classic callback functions to allow the use of
 * the async/await structure.
 */

/**
 * @fn route
 * Wraps an Express route handler function.
 * 
 * @param {function} func The function to be wrapped. Must be async or return a promise.
 * @param {boolean} useNext Should we run the next middleware function?
 * @return {function} The wrapped function.
 */
module.exports.route = (func, useNext = false) => {
    return (req, res, next) => {
        func(req).then((val) => {
            if (useNext === true) {
                if (val && val.error) {
                    req.error = val.error;
                } else if (val) {
                    req.previous = val;
                }

                return next();
            } else {
                if (val && val.error) {
                    return res.status(val.error.status || 500).json(val);
                } else if (val) {
                    return res.status(200).json(val);
                } else {
                    return res.status(200).end();
                }
            }
        }).catch(next);
    };
};

/**
 * @function strategy
 * An async/await wrapper for Passport's local login strategy.
 */
module.exports.strategy = (func) => {
    return (username, password, done) => {
        func(username, password).then((response) => {
            if (response.error) {
                return done(null, false, response.error);
            }

            if (response.user) {
                return done(null, response.user);
            } else {
                throw new Error('Passport Login Strategy - User Object Missing!');
            }
        }).catch(done);
    };
};
