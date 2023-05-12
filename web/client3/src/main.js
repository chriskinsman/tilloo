import { createApp } from "vue";
import { store } from "./store";
import vuetify from "./plugins/vuetify";

import App from "./App.vue";
import router from "./router";

import "./assets/main.css";

const app = createApp(App);

app.use(store);
app.use(vuetify);
app.use(router);

app.mount("#app");
