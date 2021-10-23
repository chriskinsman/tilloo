import Vue from "vue";
import VueRouter from "vue-router";
import Jobs from "../views/Jobs.vue";
import Runs from "../views/Runs.vue";
import Run from "../views/Run.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Jobs",
    component: Jobs,
  },
  {
    path: "/job/:jobid",
    name: "Runs",
    component: Runs,
  },
  {
    path: "/run/:runid",
    name: "Run",
    component: Run,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
