/**
 * @file server/routes/login.js
 * 
 * API routing for our login functions.
 */

// Imports
const express = require('express');
const loginController = require('../controllers/login');
const checkJwtToken = require('../utility/auth').checkJwtToken;
const asyncWrap = require('../utility/async-wrap');

// Express Router
const router = express.Router();

// Login Routes
router.post('/request', asyncWrap.route(loginController.requestLoginToken));
router.post('/authenticate', loginController.verifyLoginToken);
router.put('/logout', asyncWrap.route(checkJwtToken, true), asyncWrap.route(loginController.logoutUser));
router.put('/logout-all', asyncWrap.route(checkJwtToken, true), asyncWrap.route(loginController.logoutUserOnAllDevices));

// Export Router
module.exports = router;