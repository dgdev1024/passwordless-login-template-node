/**
 * @file server/models/email-token.js
 * The database model for our email change tokens.
 */

// Imports
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const csprng = require('csprng');

// Schema
const schema = new mongoose.Schema({
    emailAddress: { type: String, required: true, unique: true },
    newEmailAddress: { type: String, required: true, unique: true },
    verifyCode: { type: String, required: true, unique: true },
    verifyNonce: { type: String, required: true, unique: true },
    expiry: { type: Date, default: Date.now, expires: 300 }
});

/**
 * @function generate
 * Generates, then returns a new verify code and nonce for this
 * token.
 * 
 * @return {object} The generated verify code and nonce.
 */
schema.methods.generate = function () {
    // Generate the codes.
    const code  = csprng();
    const nonce = csprng();

    // Generate the salts to hash the codes.
    const codeSalt  = bcryptjs.genSaltSync();
    const nonceSalt = bcryptjs.genSaltSync();

    // Hash the codes and store the results.
    this.verifyCode  = bcryptjs.hashSync(code, codeSalt);
    this.verifyNonce = bcryptjs.hashSync(nonce, nonceSalt);

    // Encode and return our codes.
    return {
        passCode: code,
        nonceCode: nonce
    };
};

/**
 * @function check
 * Checks a submitted verify code and nonce candidate against the
 * code and nonce stored.
 * 
 * @param {string} code The submitted verify code.
 * @param {string} nonce The submitted verify nonce.
 * @return {boolean} True if the codes match up.
 */
schema.methods.check = function (code, nonce) {
    return bcryptjs.compareSync(code, this.verifyCode) &&
        bcryptjs.compareSync(nonce, this.verifyNonce);
};

// Export Model
module.exports = mongoose.model('email-token', schema);
