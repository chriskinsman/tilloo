const configureAPI = require("../server/configure");

module.exports = {
  configureWebpack: {
    devServer: {
      after: configureAPI.after,
      proxy: {
        "/socket.io": {
          target: "ws://localhost:8081",
          ws: true
        }
      }
    }
  },
  transpileDependencies: ["vuetify"]
};
