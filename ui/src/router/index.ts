import { createRouter, createWebHistory } from "vue-router";
import NovelsView from "@/views/novels.vue";
import IndexView from "@/views/index.vue";
import AboutView from "@/views/about.vue";
import AccountView from "@/views/account.vue";
import LocalView from "@/views/local.vue";
import SettingView from "@/views/setting.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/index",
      name: "index",
      component: IndexView,
    },
    {
      path: "/about",
      name: "about",
      component: AboutView,
    },
    {
      path: "/novels",
      name: "novels",
      component: NovelsView,
    },
    {
      path: "/account",
      name: "account",
      component: AccountView,
    },
    {
      path: "/local",
      name: "local",
      component: LocalView,
    },
    {
      path: "/setting",
      name: "setting",
      component: SettingView,
    },
  ],
});

export default router;
