'use strict';

// Module to clean up logs of runs older than XX days every 24 hours

const config = require('./config');
const runs = require('./runs');

// Every 24 hours
const _interval = 1000 * 60 * 60 * 24;

function start() {
    if (config?.scheduler?.runHistoryDays) {
        console.log(`Scheduling daily check to expire runs older than ${config.scheduler.runHistoryDays} days`);
        setInterval(async function () {
            console.log(`Expiring runs older than ${config.scheduler.runHistoryDays} days`);
            await runs.deleteRunsOlderThan(config.scheduler.runHistoryDays);
            console.log('Expiration complete');
        }, _interval);
    }
    else {
        console.log('Automatic run expiration not configured. Add runHistoryDays to config.');
    }
}

module.exports = {
    start
};