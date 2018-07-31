/**
 * @file server/models/user.js
 * The database model for our registered users.
 */

// Imports
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const csprng = require('csprng');
const jwt = require('jsonwebtoken');

// Schema
const schema = new mongoose.Schema({
    emailAddress: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    jwtNonceHashes: [{ type: String }]
});

/**
 * @function generateJwtNonce
 * 
 * Generates a new nonce to be added to a JWT token.
 * 
 * @return {string} The generated nonce.
 */
schema.methods.generateJwtNonce = function () {
    const nonce = csprng();
    const salt  = bcryptjs.genSaltSync();
    this.jwtNonceHashes.push(bcryptjs.hashSync(nonce, salt));
    return nonce;
};

/**
 * @function getJwtNonceIndex
 * 
 * Checks the submitted JWT nonce against the array of valid
 * nonces and returns the index of the matching nonce.
 * 
 * @param {string} nonce The submitted JWT nonce.
 * @return {number} The index of the matching nonce, or -1 if there is none.
 */
schema.methods.getJwtNonceIndex = function (nonce) {
    const index = this.jwtNonceHashes.findIndex((hash) => {
        return bcryptjs.compareSync(nonce, hash);
    });

    return index;
};

/**
 * @function removeJwtNonce
 * 
 * Removes a valid JWT nonce if it is present in the array of valid
 * JWT nonces.
 * 
 * @param {string} nonce The nonce to be removed.
 * @return {boolean} True if the nonce was found and removed.
 */
schema.methods.removeJwtNonce = function (nonce) {
    const index = this.getJwtNonceIndex(nonce);
    if (index !== -1) {
        this.jwtNonceHashes.splice(index, 1);
        return true;
    }

    return false;
};

/**
 * @function removeAllJwtNonces
 * 
 * Removes all valid JWT nonces from the user.
 */
schema.methods.removeAllJwtNonces = function () {
    this.jwtNonceHashes = [];
};

/**
 * @function generateJwtToken
 * 
 * Generates a new JSON web token to validate a user's login. This is an async
 * function.
 * 
 * @return {string} The signed JWT token.
 */
schema.methods.generateJwtToken = async function () {
    // Generate a new nonce. This nonce will be used as the JTI claim in
    // our JWT token.
    const jti = this.generateJwtNonce();

    // Save the new nonce to the user.
    await this.save();

    // Set up the token's EXP claim.
    let expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);
    const exp = Math.floor(expDate.getTime() / 1000);

    // Create, sign, and return the JWT token.
    return jwt.sign({
        id: this._id.toString(),
        exp,
        jti
    }, process.env.JWT_SECRET);
};

// Export Model
module.exports = mongoose.model('user', schema);
