/**
 * @file index.js
 * The entry point for our application.
 */

// Imports
const fs = require('fs');
const mongoose = require('mongoose');
const nodeEnvFile = require('node-env-file');

// Prepare logging.
process.env.PROJECT_ROOT_DIR = __dirname;
require('./server/utility/logging');

// Load environment variables from a local '.env' file in development mode.
if (process.env.NODE_ENV === 'development') {
    if (fs.existsSync('.env') === true) {
        nodeEnvFile('.env');
    } else {
        console.warn('Development Mode: Missing ".env" file!');
    }
}

// Consider all unhandled promise exceptions as fatal errors - exit the
// program if one is thrown.
process.on('unhandledRejection', (err) => {
    console.fatal(err.stack);
});

// Connect to the database and start our server.
mongoose.connect(
    process.env.DATABASE_URL,
    { useNewUrlParser: true },
    (err) => {
        if (err) {
            throw err;
        }

        require('./server')();
    }
);