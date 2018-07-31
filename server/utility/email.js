/**
 * @file server/utility/email.js
 * Functions and configuration for sending email.
 */

// Imports
const nodemailer = require('nodemailer');

// Create the email transport.
let transport = null;
if (process.env.EMAIL_USE_OAUTH === 'true') {
    transport = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        port: 465,
        secure: true,
        auth: {
            type: 'oauth2',
            user: process.env.EMAIL_SENDER_ADDRESS,
            clientId: process.env.EMAIL_CLIENT_ID,
            clientSecret: process.env.EMAIL_CLIENT_SECRET,
            refreshToken: process.env.EMAIL_REFRESH_TOKEN,
            accessToken: process.env.EMAIL_ACCESS_TOKEN
        }
    });
} else {
    transport = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_SENDER_ADDRESS,
            pass: process.env.EMAIL_SENDER_PASSWORD
        }
    });
}

// The email sender string.
const sender = `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`;

// Create and export our email functions.
module.exports = {
    /**
     * @fn sendVerifyLogin
     * Sends the user an email asking them to finalize their login.
     * 
     * @param {string} emailAddress The user's email address.
     * @param {string} verifyCode The verify code they will need to enter.
     */
    async sendVerifyLogin (emailAddress, verifyCode) {
        // Create the email body.
        const body = `
        <div>
            <h1>
                ${process.env.SITE_TITLE}
            </h1>
            <p>
                Enter the following code to authenticate your login: <strong>${verifyCode}</strong><br /><br />
                - ${process.env.SITE_AUTHOR}
            </p>
        </div>
        `;

        // Send the email.
        await transport.sendMail({
            from: sender,
            to: emailAddress,
            subject: `${process.env.SITE_TITLE} - Finish Login`,
            html: body
        });
    },

    /**
     * @fn sendEmailChangeRequested
     * Sends the user an email letting them know that an email change was
     * requested.
     * 
     * @param {string} emailAddress The user's original email address.
     * @param {string} tokenId The ID of the email change token.
     */
    async sendEmailChangeRequested (emailAddress) {
        // Create the email body.
        const body = `
        <div>
            <h1>
                ${process.env.SITE_TITLE}
            </h1>
            <p>
                Hello. You are receiving this email because a change in the email
                address attached to your account has been requested.<br /><br />
                If you did not request this change, then please reply to this email.<br /><br />
                - ${process.env.SITE_AUTHOR}
            </p>
        </div>
        `;

        // Send the email.
        await transport.sendMail({
            from: sender,
            to: emailAddress,
            subject: `${process.env.SITE_TITLE} - Email Change Requested`,
            html: body
        });
    },

    /**
     * @fn sendVerifyEmailChange
     * Sends the user an email with the code the user will need to enter
     * in order to change their email.
     * 
     * @param {string} emailAddress The user's new email address.
     * @param {string} tokenId The ID of the email change token.
     * @param {string} verifyCode The verify code they need to enter.
     */
    async sendVerifyEmailChange (emailAddress, verifyCode) {
        // Create the email body.
        const body = `
        <div>
            <h1>
                ${process.env.SITE_TITLE}
            </h1>
            <p>
                Enter the following code to verify your new email: <strong>${verifyCode}</strong><br /><br />
                If you did not request this email change, or you would otherwise like to discard this
                token, then you may ignore this email.<br /><br />
                - ${process.env.SITE_AUTHOR}
            </p>
        </div>
        `;

        // Send the email.
        await transport.sendMail({
            from: sender,
            to: emailAddress,
            subject: `${process.env.SITE_TITLE} - Verify Email Change`,
            html: body
        });
    }
};