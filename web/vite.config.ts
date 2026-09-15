import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiPort = process.env.ARC_DEV_PORT ?? "8016";
const webPort = Number(process.env.ARC_WEB_PORT ?? 3016);

export default defineConfig({
  plugins: [react()],
  server: {
    port: webPort,
    proxy: {
      "/api": `http://localhost:${apiPort}`,
    },
  },
});
