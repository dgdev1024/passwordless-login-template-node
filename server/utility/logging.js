/**
 * @file server/utility/logging.js
 * Prepares logging capabilities for the backend.
 */

// Imports
const fs = require('fs');
const path = require('path');

// The directory containing our logs.
const logFolder = path.join(process.env.PROJECT_ROOT_DIR, 'logs');

// Check to see if our log folder exists. If it doesn't, then create it.
if (fs.existsSync(logFolder) === false) {
    fs.mkdirSync(logFolder);
}

// Get the current date string and splice out the time.
const dateString = new Date().toString().split(' ').slice(0, 4).join(' ');

// Find out if the log file for today exists. If not, then create it.
const logFilePath = path.join(logFolder, `${dateString}.log`);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Rig up our console.log, console.warn, and console.error functions to
// also write to our log file.
console.log = (str) => {
    const out = `[${new Date()}] [Info] ${str}\n`;
    logStream.write(out);
    process.stdout.write(out);
};

console.warn = (str) => {
    const out = `[${new Date()}] [Warning] ${str}\n`;
    logStream.write(out);
    process.stderr.write(out);
};

console.error = (str) => {
    const out = `[${new Date()}] [Error] ${str}\n`;
    logStream.write(out);
    process.stderr.write(out);
};

console.fatal = (str) => {
    const out = `[${new Date()}] [FATAL] ${str}\n`;
    logStream.write(out, () => {
        process.stderr.write(out, () => {
            process.exit(1);
        });
    });
};

console.log(`Starting new session at ${new Date()}...`);
