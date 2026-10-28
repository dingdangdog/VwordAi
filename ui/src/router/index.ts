import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
      meta: { title: "工作台" },
    },
    {
      path: "/read-novels",
      name: "read-novels",
      component: () => import("@/views/ReadNovels.vue"),
      meta: { title: "有声小说", fullBleed: true },
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("@/views/projects/ProjectsView.vue"),
      meta: { title: "读文章" },
    },
    {
      path: "/projects/:id",
      name: "project-detail",
      component: () => import("@/views/projects/ProjectDetailView.vue"),
      props: true,
      meta: { title: "读文章", fullBleed: true },
    },
    {
      path: "/projects/:projectId/chapters/new",
      redirect: (to) => ({ path: `/projects/${to.params.projectId}`, query: { chapter: "new" } }),
    },
    {
      path: "/projects/:projectId/chapters/:chapterId",
      redirect: (to) => ({
        path: `/projects/${to.params.projectId}`,
        query: { chapter: String(to.params.chapterId) },
      }),
    },
    {
      path: "/billing",
      name: "billing",
      component: () => import("@/views/BillingView.vue"),
      meta: { title: "订阅" },
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/views/settings/SettingsView.vue"),
      meta: { title: "设置" },
    },
    {
      path: "/bililive",
      name: "bililive",
      component: () => import("@/views/BiliveView.vue"),
      meta: { title: "直播", fullBleed: true },
    },
    {
      path: "/about",
      redirect: { path: "/settings", query: { tab: "about" } },
    },
    {
      path: "/chapters/:chapterId",
      name: "ReadNovelsChapter",
      component: () => import("@/views/ReadNovelsChapter.vue"),
      meta: { title: "章节工作台", fullBleed: true },
    },
  ],
});

export default router;
