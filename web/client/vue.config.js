// Hack to allow container build without server pieces
const configureAPI = process.env.DOCKER_BUILD ? { before: () => { return; } } : require("../server/configure");

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
