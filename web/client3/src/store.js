import { createStore } from "vuex";

//import alerts from "../components/alerts/Alerts.js";

export const store = createStore({
  state: {
    breadcrumbs: [],
  },
  mutations: {
    setBreadcrumbs(state, payload) {
      state.breadcrumbs = payload;
    },
  },
  //  plugins: [alerts.storePlugin],
});
