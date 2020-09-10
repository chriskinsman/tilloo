#! /usr/bin/env node
'use strict';

const mongoose = require('mongoose');

const config = require('../lib/config');
const Job = require('../models/job');

mongoose.connect(config.db);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.Promise = global.Promise;

Job.find({ deleted: false }, null, { sort: { name: 1 } }, function (err, jobs) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    else {
        console.log(JSON.stringify(jobs, null, 2));
        process.exit(0);
    }
});