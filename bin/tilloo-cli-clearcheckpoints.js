#! /usr/bin/env node
'use strict';

const Checkpoint = require('../models/checkpoint');

Checkpoint.deleteMany({}, function (err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    else {
        console.log('Restart scheduler pod now');
        process.exit(0);
    }
});
