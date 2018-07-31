/**
 * @file server/index.js
 * The entry point for our application's backend.
 */

// Imports
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const passport = require('passport');

// The relative path to our frontend distribution.
const pathToDist = path.join(__dirname, '..', 'dist');
const pathToDistIndex = path.join(pathToDist, 'index.html');
let frontendAvailable = true;
if (!fs.existsSync(pathToDist) || !fs.existsSync(pathToDistIndex)) {
    console.warn('Frontend distribution is missing!');
    frontendAvailable = false;
}

/**
 * Runs our backend server.
 */
module.exports = () => {
    // Express and Middleware
    const app = express();
    app.use(express.static(pathToDist));
    app.use(cors());
    app.use(helmet());
    app.use(compression());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(passport.initialize());

    // Server setup, in case you want to use Socket.IO.
    const server = http.createServer(app);

    // API Routing
    app.use('/api/login', require('./routes/login'));
    app.use('/api/email', require('./routes/email'));

    // Catch-all Routing for Index Page
    app.get('*', (req, res) => {
        if (frontendAvailable === false) {
            return res.status(200).send('<h1>Hello, World!</h1>');
        } else {
            return res.status(200).sendFile(pathToDistIndex);
        }
    });

    // Error-handling Middleware
    app.use(require('./utility/error').route);

    // Listen for Requests...
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Listening for requests on port #${port}...`);
    });
};