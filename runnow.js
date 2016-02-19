'use strict';

var mongoose = require('mongoose');
var commander = require('commander');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Job = require('./models/job');

mongoose.connect(config.db);

commander.version('0.0.1')
    .usage('<jobId>')
    .parse(process.argv);

if(commander.args.length !== 1) {
    commander.outputHelp();
    process.exit(1);
}


Job.findByJobId(commander.args[0], function(err, job) {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    else {
        job.triggerRun(function(err) {
            if(err) {
                console.error('Unable to trigger run err: ' + err);
                process.exit(1);
            }
            else {
                console.info('Run triggered');
                process.exit(0);
            }
        });

    }
});
