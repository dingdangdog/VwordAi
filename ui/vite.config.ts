import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
// 读取环境变量
const env = loadEnv("", process.cwd());

// https://vitejs.dev/config/
export default defineConfig({
  base: env.VITE_APP_BASE_URL || "/",
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
});
