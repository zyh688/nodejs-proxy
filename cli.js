#!/usr/bin/env node
/**
 * This script is the command line interface for the nodejs-proxy application.
 * It uses the yargs library to parse command line arguments and starts the application
 * by calling the index.js file with the specified port and uuid.
 * 
 * @param {number} port - The port number to use for the proxy server. Default is 7860.
 * @param {string} uuid - The uuid to use for the proxy server. Default is '890d0681-ebf8-40d2-82fa-7133e0e58c87'.
 */
const argv = require('yargs')
    .option('port', {
        alias: 'p',
        describe: 'Specify the port number',
        default: 7860
    })
    .option('uuid', {
        alias: 'u',
        describe: 'Specify the uuid',
        default: 'd342d11e-d424-4583-b36e-524ab1f0afa4'
    })
    .help()
    .argv;

// Import createVLESSServer function from main.js file
const { createVLESSServer } = require('./index.js');

// Use the imported function with port and uuid from command line arguments
createVLESSServer(argv.port, argv.uuid);
