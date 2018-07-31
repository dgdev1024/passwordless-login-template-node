/**
 * @file server/utility/auth.js
 * Functions for user authentication.
 */

// Imports
const passportLocal = require('passport-local');
const csprng = require('csprng');
const jwt = require('jsonwebtoken');
const loginTokenModel = require('../models/login-token');
const userModel = require('../models/user');
const base64 = require('./base64');
const raiseError = require('./error').raise;
const asyncWrap = require('./async-wrap');

// Exports
module.exports = {
    /**
     * @function checkJwtToken
     * 
     * Route middleware for checking for, verifying, then authenticating a
     * JSON web token.
     * 
     * @param {Request} req The HTTP request object.
     */
    async checkJwtToken (req) {
        // Get the bearer header from the request.
        const bearerHeader = req.headers['authorization'];

        // If the header is not present, then the end-user is not logged in.
        if (typeof bearerHeader === 'undefined') {
            return raiseError(401, 'You are not logged in.');
        }

        // Split the retrieved header at the space and look for the second
        // element. Make sure that it is present!
        const rawToken = bearerHeader.split(' ')[1]
        if (typeof rawToken === 'undefined') {
            return raiseError(401, 'You are not logged in.');
        }

        // Verify the token and get a payload.
        let payload = null;
        try {
            payload = jwt.verify(rawToken, process.env.JWT_SECRET);

            // Make sure our payload contains a valid user ID, expiry claim, and
            // JWT ID nonce.
            if (!payload.id || !payload.exp || !payload.jti) {
                return raiseError(401, 'You are not logged in.');
            }
        } catch (err) {
            if (err.name && err.name === 'TokenExpiredError') {
                const user = await userModel.findById(payload.id);
                if (user) {
                    user.removeJwtNonce(payload.jti);
                    await user.save();
                }

                return raiseError(401, 'Your login has expired. Please log in again.');
            } else if (err.name && err.name === 'JsonWebTokenError') {
                return raiseError(400, 'Your login token is malformed. Please log in.');
            }

            throw err;
        }

        // Attempt to authenticate the login by resolving the ID found in the
        // JWT payload to a user in the database.
        const user = await userModel.findById(payload.id);
        if (!user) { return raiseError(401, 'You are not logged in.'); }
        if (user.getJwtNonceIndex(payload.jti) === -1) {
            return raiseError(403, 'Your login has been invalidated. Please log in again.');
        }

        // Authentication successful. Send the user, ID, and JWT nonce along to the
        // next middleware function.
        req.payload = {
            id: user._id.toString(),
            nonce: payload.jti,
            user
        };
    },

    // In order to verify user logins (and signups) in our passwordless login system,
    // we'll use Passport's local login strategy, passing in the user's email address as
    // the username, and a base64-encoded JSON string containing our login verify code and
    // nonce as our "password".
    localLoginStrategy: new passportLocal.Strategy({
        usernameField: 'emailAddress',
        passwordField: 'encodedCodes',
        session: false
    }, asyncWrap.strategy(async (emailAddress, encodedCodes) => {
        // First, decode and parse the encoded JSON string. Check to see if the
        // resulting JSON object contains a login verify code and nonce.
        const codes = JSON.parse(base64.decodeString(encodedCodes));
        if (!codes.passCode || !codes.nonceCode) {
            return raiseError(400, 'A login verify code and nonce are required.');
        }

        // Reslove the email address given to a valid login token in our database.
        const token = await loginTokenModel.findOne({ emailAddress });
        if (!token) {
            return raiseError(401, 'Your login credentials are invalid.');
        }

        // Attempt to authenticate the token. Destroy the token whether this is
        // successful or not.
        const authenticated = token.check(codes.passCode, codes.nonceCode);
        await token.remove();
        
        if (authenticated === false) {
            return raiseError(401, 'Your login credentials are invalid.');
        }

        // Now resolve the email address to a user in the database.
        let user = await userModel.findOne({ emailAddress });

        // If the user exists, then return that user. If it doesn't, then create,
        // save, then return the new user.
        if (user) {
            return { user };
        } else {
            // Create a new temporary display name for the new user.
            const tempDisplayName = `User ${csprng(64, 16)}`;

            // Create the new user.
            const newUser = new userModel();
            newUser.emailAddress = emailAddress;
            newUser.displayName = tempDisplayName;

            // Save the user and return the saved user.
            const returnUser = await newUser.save();
            return { user: returnUser };
        }
    }))
};
