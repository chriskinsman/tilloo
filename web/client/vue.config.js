// Hack to allow container build without server pieces
const configureAPI = process.env.DOCKER_BUILD ? { before: () => { return; } } : require("../server/configure");

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
