#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');

const config = require('../lib/config');
const Checkpoint = require('../models/checkpoint');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.Promise = global.Promise;
mongoose.connect(config.db);

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
