module.exports = {
  configureWebpack: {
    devServer: {
      proxy: {
        "/api": {
          target: "http://localhost:3050"
        },
        "/socket.io": {
          target: "http://localhost:8081",
          ws: true
        }
      }
    }
  },
  transpileDependencies: ["vuetify"]
};
