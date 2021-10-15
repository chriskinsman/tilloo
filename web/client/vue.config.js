const configureAPI = require("../server/configure");

module.exports = {
  configureWebpack: {
    devServer: {
      before: configureAPI.before,
      proxy: {
        "/socket.io": {
          target: "http://localhost:8081",
          ws: true
        }
      }
    }
  },
  transpileDependencies: ["vuetify"]
};
