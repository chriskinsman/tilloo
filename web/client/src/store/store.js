import Vue from "vue";
import Vuex from "vuex";

import alerts from "../components/alerts/Alerts.js";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    breadcrumbs: []
  },
  mutations: {
    setBreadcrumbs(state, payload) {
      state.breadcrumbs = payload;
    }
  },
  plugins: [alerts.storePlugin]
});
