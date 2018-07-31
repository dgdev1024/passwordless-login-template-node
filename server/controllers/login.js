/**
 * @file server/controllers/login.js
 * Controller functions for user login.
 */

// Imports
const passport = require('passport');
const loginTokenModel = require('../models/login-token');
const emailTokenModel = require('../models/email-token');
const validate = require('../utility/validate');
const email = require('../utility/email');
const raiseError = require('../utility/error').raise;
const auth = require('../utility/auth');
const base64 = require('../utility/base64');

// Passport local login strategy.
passport.use('local-login', auth.localLoginStrategy);

// Exports
module.exports = {
    async requestLoginToken (req) {
        // First, validate the email address given.
        const { emailAddress } = req.body;
        const emailError = validate.emailAddress(emailAddress);
        if (emailError) { 
            return raiseError(400, emailError); 
        }
        
        // Check to see if there isn't already a login token requested by this
        // email address.
        const existingToken = await loginTokenModel.findOne({ emailAddress });
        if (existingToken) {
            return raiseError(409, 'A login token has already been requested. Check your email.');
        }

        // Check to see if a user isn't trying to change the email address attached
        // to their account to the email address requested.
        const existingEmailToken = await emailTokenModel.findOne({
            newEmailAddress: emailAddress
        });
        if (existingEmailToken) {
            return raiseError(409, 'This email address is temporarly unavailable. Try again later.');
        }

        // Create and save the new login token.
        const newToken = new loginTokenModel();
        const loginCodes = newToken.generate();
        newToken.emailAddress = emailAddress;
        const savedToken = await newToken.save();

        // Send the user an email with the login token's pass code.
        try {
            await email.sendVerifyLogin(emailAddress, loginCodes.passCode);
        } catch (err) {
            await savedToken.remove();
            throw err;
        }

        const res = {
            emailAddress,
            nonce: base64.encodeString(loginCodes.nonceCode)
        };

        if (process.env.NODE_ENV === 'development') {
            res.temp = base64.encodeString(JSON.stringify(loginCodes));
        }

        // Send the nonce code back to the user.
        return res;
    },

    /**
     * @function verifyLoginToken
     *
     * Verifies the login credentials submitted by the user.
     *
     * @param {Request} req The HTTP request object.
     * @param {Response} res The HTTP response object.
     */
    verifyLoginToken (req, res) {
        passport.authenticate('local-login', (err, user, info) => {
            if (err) {
                return res.status(err.status || 500).json({ error: err });
            }

            if (!user) {
                return res.status(info.status || 500).json(info);
            }
            
            user.generateJwtToken().then((token) => {
                return res.status(200).json({ token });
            }).catch((err) => {
                return res.status(err.status || 500).json({ error: err });
            })
        })(req, res);
    },

    /**
     * @function logoutUser
     * Attempts to log a user out of one device.
     */
    async logoutUser (req) {
        if (req.error) {
            const { status, message } = req.error;
            return raiseError(status, message);
        }

        // Get the user and current JWT nonce.
        const { user, nonce } = req.payload;
        if (user.removeJwtNonce(nonce) === true) {
            await user.save();

            return {
                message: 'You are now logged out.'
            };
        } else {
            throw new Error('Attempted logout of user with invalid JWT nonce!');
        }
    },

    /**
     * @function logoutUserOnAllDevices
     * Attempts to log a user out of all devices.
     */
    async logoutUserOnAllDevices (req) {
        if (req.error) {
            const { status, message } = req.error;
            return raiseError(status, message);
        }

        // Get the user and remove all of their valid JWT nonces.
        const { user } = req.payload;
        user.removeAllJwtNonces();
        await user.save();

        return {
            message: 'You are now logged out.'
        };
    }
};