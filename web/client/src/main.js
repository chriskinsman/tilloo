import Vue from "vue";
import router from "./router";
import store from "./store/store.js";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import Vuelidate from "vuelidate";
import dayjs from "./plugins/dayjs";
import VueVirtualScroller from "vue-virtual-scroller";
import Modal from "./plugins/modal.js";
import vueSocketIoExtended from "./plugins/vue-socket-io-extended.js";

Vue.config.productionTip = false;
new Vue({
  store,
  router,
  vuetify,
  vueSocketIoExtended,
  render: h => h(App)
}).$mount("#app");

Vue.use(dayjs);
Vue.use(VueVirtualScroller);
Vue.use(Modal);
Vue.use(Vuelidate);
