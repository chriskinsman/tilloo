#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');
var Table = require('easy-table');
var moment = require('moment');
var commander = require('commander');

var config = require('../lib/config');
var Job = require('../models/job');

mongoose.connect(config.db);
mongoose.Promise = global.Promise;

var table = new Table();
Job.find({deleted: false}, null, {sort: {name: 1}}, function(err, jobs) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        console.log(JSON.stringify(jobs, null, 2));
        process.exit(0);
    }
});