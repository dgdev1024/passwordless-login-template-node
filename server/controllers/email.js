/**
 * @file server/controllers/email.js
 * Controller functions for our email change tokens.
 */

// Imports
const passport = require('passport');
const userModel = require('../models/user');
const loginTokenModel = require('../models/login-token');
const emailTokenModel = require('../models/email-token');
const validate = require('../utility/validate');
const email = require('../utility/email');
const raiseError = require('../utility/error').raise;
const auth = require('../utility/auth');
const base64 = require('../utility/base64');

// Export controller functions.
module.exports = {
    async requestEmailChangeToken (req) {
        // Check for errors verifying the JWT token.
        if (req.error) {
            return raiseError(req.error.status, req.error.message);
        }

        // Validate the email address given.
        const { newEmailAddress } = req.body;
        const { user } = req.payload;
        const emailError = validate.emailAddress(newEmailAddress);
        if (emailError) {
            return raiseError(400, emailError);
        }

        // Check to see if someone else isn't trying to change the email
        // address associated with their account to the one specified.
        const existingEmailToken = await emailTokenModel.findOne({ newEmailAddress });
        if (existingEmailToken) {
            if (user.emailAddress === existingEmailToken.emailAddress) {
                return raiseError(409, 'You have recently requested an email change. Check your inbox.');
            } else {
                return raiseError(409, 'This email address is temporarly unavailable. Try again later.');
            }
        }

        // Check to see if this email address is not already taken.
        const existingUser = await userModel.findOne({
            emailAddress: newEmailAddress
        });
        if (existingUser) {
            return raiseError(409, 'This email address is taken. Try another one.');
        }

        // Create and save the new email token.
        const newToken = new emailTokenModel();
        const verifyCodes = newToken.generate();
        newToken.emailAddress = user.emailAddress;
        newToken.newEmailAddress = newEmailAddress;
        const savedToken = await newToken.save();

        // Send the user an email with the email token's pass code.
        try {
            await email.sendVerifyEmailChange(newEmailAddress, verifyCodes.passCode);
        } catch (err) {
            await savedToken.remove();
            throw err;
        }

        // Also, send the user's old email a note that the change was
        // requested.
        try {
            await email.sendEmailChangeRequested(user.emailAddress);
        } catch (err) {
            console.warn(err.stack);
        }

        // Construct and return the response.
        const res = {
            emailAddress: user.emailAddress,
            newEmailAddress,
            nonce: base64.encodeString(verifyCodes.nonceCode)
        };

        if (process.env.NODE_ENV === 'development') {
            res.temp = base64.encodeString(JSON.stringify(verifyCodes));
        }

        return res;
    },

    async verifyEmailChangeToken (req) {
        // Check for errors verifying the JWT token.
        if (req.error) {
            return raiseError(req.error.status, req.error.message);
        }

        // Get the pass and nonce codes from the request body.
        const { verify } = req.body;
        const codes = JSON.parse(base64.decodeString(verify));
        if (!codes.passCode || !codes.nonceCode) {
            return raiseError(401, 'A pass code and nonce code are required.');
        }

        // Check to see if the logged-in user's email address resovles to an
        // active email change token.
        const { user } = req.payload;
        const token = await emailTokenModel.findOne({
            emailAddress: user.emailAddress
        });
        if (!token) {
            return raiseError(401, 'An email change token was not requested.');
        }

        // Attempt to authenticate the token.
        const authenticated = token.check(codes.passCode, codes.nonceCode);
        const { newEmailAddress } = token;
        await token.remove();
        if (!authenticated) {
            return raiseError(401, 'The verification codes submitted are incorrect.');
        }

        // Now that we are authenticated, we can change our email.
        user.emailAddress = newEmailAddress;
        await user.save();

        // Return success.
        return {
            message: 'Your email address has been changed.'
        };
    }
};