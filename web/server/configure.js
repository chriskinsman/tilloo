module.exports = {
    before: (app) => {
        if (!process.env.DOCKER_BUILD) {
            const mongoose = require('../../lib/mongooseinit');

            app.use('/api', require("./routes"));
            app.use(require('connect-history-api-fallback')());
        }
    }
}