/**
 * @file server/routes/email.js
 * API routing for our email change functions.
 */

// Imports
const express = require('express');
const emailController = require('../controllers/email');
const asyncWrap = require('../utility/async-wrap').route;
const checkJwtToken = require('../utility/auth').checkJwtToken;

// Express Router
const router = express.Router();

// Email Token Routes
router.post('/request-change', asyncWrap(checkJwtToken, true),
    asyncWrap(emailController.requestEmailChangeToken));
router.post('/verify-change', asyncWrap(checkJwtToken, true),
    asyncWrap(emailController.verifyEmailChangeToken));

// Export
module.exports = router;
