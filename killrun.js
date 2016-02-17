'use strict';

var mongoose = require('mongoose');
var commander = require('commander');
var Disqueue = require('disqueue-node');
var async = require('async');

var config = require('./lib/config');
var constants = require('./lib/constants');
var Run = require('./models/run');

mongoose.connect(config.db);
var disq = new Disqueue(config.disque);

commander.version('0.0.1')
    .usage('<runId>')
    .option('-f, --force', 'Force kill a job.  Immediately sets status in mongodb to fail')
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
        async.parallel([
            function(done) {
                disq.addJob({queue: constants.QUEUES.KILL_PREFIX + run.worker, job: JSON.stringify({pid: run.pid}), timeout: 0}, function(err) {
                    if (err) {
                        console.error('Unable to queue kill for worker: %s, pid: %d', run.worker, run.pid);
                    }
                    else {
                        console.info('kill sent to worker: %s, pid: %d', run.worker, run.pid);
                    }
                    done();
                });
            },
            function(done) {
                if(commander.force) {
                    disq.addJob({queue: constants.QUEUES.STATUS, job: JSON.stringify({status: 'fail', runId: run._id}), timeout: 0}, function(err) {
                        if(err) {
                            console.error('Unable to queue fail status for jobId: %s, runId: %s, status: %s', job.jobId, message.runId, message);
                        }
                        else {
                            console.info('fail status sent');
                        }

                        done();
                    });
                }
                else {
                    setImmediate(done);
                }
            }
        ],
            function(err) {
                if (err) {
                    process.exit(1);
                }
                else {
                    process.exit(0);
                }
            }
        );
    }
});
