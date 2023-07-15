#!/usr/bin/env node
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

// 通过参数启动你的应用
require('./index.js')(argv.port, argv.uuid);
