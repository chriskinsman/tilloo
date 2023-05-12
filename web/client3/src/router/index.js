import { createRouter, createWebHistory } from "vue-router";
import Jobs from "../views/Jobs.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Jobs",
      component: Jobs,
    },
    // {
    //   path: "/job/:jobid",
    //   name: "Runs",
    //   component: Runs,
    // },
    // {
    //   path: "/run/:runid",
    //   name: "Run",
    //   component: Run,
    // },
  ],
});

export default router;
