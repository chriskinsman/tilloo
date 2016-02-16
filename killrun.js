'use strict';

var mongoose = require('mongoose');
var commander = require('commander');
var Disqueue = require('disqueue-node');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Run = require('./models/run');

mongoose.connect(config.db);
var disq = new Disqueue(config.disque);

commander.version('0.0.1')
    .usage('<runId>')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.outputHelp();
    process.exit(1);
}

Run.findByRunId(commander.args[0], function(err, run) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        console.info(constants.QUEUES.KILL_PREFIX + run.worker);
        disq.addJob({queue: constants.QUEUES.KILL_PREFIX + run.worker, job: JSON.stringify({pid: run.pid}), timeout: 0}, function(err) {
            if(err) {
                console.error('Unable to queue kill for worker: %s, pid: %d', run.worker, run.pid);
                process.exit(1);
            }
            else {
                console.info('kill sent to worker: %s, pid: %d', run.worker, run.pid);
                process.exit(0);
            }
        })
    }
});
