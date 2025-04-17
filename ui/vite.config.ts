import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
// 读取环境变量
const env = loadEnv("", process.cwd());

// https://vitejs.dev/config/
export default defineConfig({
  base: env.VITE_MOD == "WEB" ? "/" : "./",
  plugins: [vue()],
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
