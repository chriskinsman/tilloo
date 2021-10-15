const routes = require("./routes");
const history = require('connect-history-api-fallback');

const mongoose = require('../../lib/mongooseinit');

module.exports = {
    before: (app) => {
        app.use('/api', routes);
        app.use(history());
    }
}