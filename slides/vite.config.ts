import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const hmrClientPort = process.env.HMR_CLIENT_PORT
  ? Number(process.env.HMR_CLIENT_PORT)
  : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 1234,
    strictPort: true,
    open: process.env.VITE_OPEN_BROWSER === "true",
    watch: {
      usePolling: !!process.env.VITE_USE_POLLING,
    },
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
  },
});
