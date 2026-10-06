import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../../",
  server: {
    port: 5173,
  },
  preview: {
    allowedHosts: ["hermes-web-production-15f7.up.railway.app"],
  },
});
