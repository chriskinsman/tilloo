const routes = require("./routes");

const mongoose = require('../../lib/mongooseinit');

module.exports = {
    before: (app) => {
        app.use('/api', routes);
    }
}