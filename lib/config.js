const fs = require('fs');
const path = require('path');

const loadedConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '/../config.json'))); //eslint-disable-line no-sync

if (global.process.env.MONGODB) {
    loadedConfig.db = global.process.env.MONGODB;
}

module.exports = loadedConfig;