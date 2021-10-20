module.exports = {
    after: (app) => {
        if (!process.env.DOCKER_BUILD) {
            const mongoose = require('../../lib/mongooseinit');

            app.use(require('body-parser').json());
            app.use('/api', require("./routes"));
            app.use(require('connect-history-api-fallback')());
        }
    }
}