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
    // VeilStream preview ingress (*.env.veilstreamapp.com); allow all when containerized.
    allowedHosts: process.env.VITE_USE_POLLING
      ? true
      : [".env.veilstreamapp.com", ".env.veilstreamdev.com", "localhost"],
    watch: {
      usePolling: !!process.env.VITE_USE_POLLING,
    },
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
  },
  preview: {
    host: true,
    port: 1234,
    allowedHosts: true,
  },
});
