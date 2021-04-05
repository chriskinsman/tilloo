module.exports = {
  configureWebpack: {
    devServer: {
      proxy: {
        "/api": {
          target: "http://localhost:3050"
        }
      }
    }
  },
  transpileDependencies: ["vuetify"]
};
