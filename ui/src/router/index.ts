import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/read-novels",
      name: "read-novels",
      component: () => import("@/views/ReadNovels.vue"),
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("@/views/projects/ProjectsView.vue"),
    },
    {
      path: "/projects/:id",
      name: "project-detail",
      component: () => import("@/views/projects/ProjectDetailView.vue"),
      props: true,
    },
    {
      path: "/projects/:projectId/chapters/new",
      name: "chapter-create",
      component: () => import("@/views/chapters/ChapterEditView.vue"),
      props: true,
    },
    {
      path: "/projects/:projectId/chapters/:chapterId",
      name: "chapter-edit",
      component: () => import("@/views/chapters/ChapterEditView.vue"),
      props: true,
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/views/settings/SettingsView.vue"),
    },
    {
      path: "/bililive",
      name: "bililive",
      component: () => import("@/views/BiliveView.vue"),
    },
    {
      path: "/about",
      name: "about",
      component: () => import("@/views/AboutView.vue"),
    },
    {
      path: "/chapters/:chapterId",
      name: "ReadNovelsChapter",
      component: () => import("@/views/ReadNovelsChapter.vue"),
    },
  ],
});

export default router;
