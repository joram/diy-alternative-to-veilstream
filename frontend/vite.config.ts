import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const hmrClientPort = process.env.HMR_CLIENT_PORT
  ? Number(process.env.HMR_CLIENT_PORT)
  : undefined;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: !!process.env.VITE_USE_POLLING,
    },
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
