const fs = require('fs');
const path = require('path');

const loadedConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '/../config.json'))); //eslint-disable-line no-sync

if (global.process.env.MONGODB) {
    loadedConfig.db = global.process.env.MONGODB;
}

if (global.process.env.SCHEDULER_HOST && loadedConfig.scheduler) {
    loadedConfig.scheduler.host = global.process.env.SCHEDULER_HOST;
}

if (global.process.env.WEB_HOST && loadedConfig.web) {
    loadedConfig.web.host = global.process.env.WEB_HOST;
}

module.exports = loadedConfig;