#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');

const config = require('../lib/config');
const Checkpoint = require('../models/checkpoint');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

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
