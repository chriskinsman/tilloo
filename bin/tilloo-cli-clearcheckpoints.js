#! /usr/bin/env node
'use strict';

const Checkpoint = require('../models/checkpoint');

(async () => {
    try {
        await Checkpoint.deleteMany({});
        console.log('Restart scheduler pod now');
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
