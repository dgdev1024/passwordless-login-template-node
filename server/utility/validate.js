/**
 * @file server/utility/validate.js
 *
 * Functions for validating user input.
 */

// Imports
const regex = require('./regex')

// Exports
//
// All validation functions return a blank string if they pass,
// and a non-empty string if they fail, with the reason for the failure.
module.exports = {
    // Validates a first and last name.
    displayName (first, last) {
        // Make sure the user entered both a first and last name.
        if (!first || typeof first !== 'string' || !last || typeof last !== 'string') {
            return 'Please enter a first and last name.';
        }

        // Make sure the name has no numbers or symbols.
        else if (regex.numbers.test(first) || 
            regex.numbers.test(last) || 
            regex.symbols.test(first) || 
            regex.numbers.test(last)) {
            return 'Your first and last name should contain no numbers or symbols.';
        }

        // Good.
        return '';
    },

    // Tests a submitted email address.
    emailAddress (email) {
        // Make sure the user enters something.
        if (!email || typeof email !== 'string') {
            return 'Please enter an email address.';
        }

        // And make sure that something is a valid email address ('dgdev1024@gmail.com').
        else if (!regex.emails.test(email)) {
            return 'Please enter a valid email address.';
        }

        // Good.
        return '';
    }
}