import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../views/HomeView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
];

// 使用 Hash History 以相容 GitHub Pages 靜態部署
// （GitHub Pages 不支援 HTML5 History API，重整會 404）
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
