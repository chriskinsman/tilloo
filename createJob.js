#! /usr/bin/env node
'use strict';

var mongoose = require('mongoose');

var config = require('./lib/config');
var Job = require('./models/job');

mongoose.connect(config.db);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

//var job = new Job({name: 'List', path:'ls', schedule: '0 */1 * * * *'});
var job = new Job({name: 'Sleep', path:'sleep', args:['120'], timeout: 60, schedule: '0 */1 * * * *'});
job.save(function(err) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        console.info('saved');
        process.exit(0);
    }
});