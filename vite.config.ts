import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Simple relative paths are safer
        popup: "popup.html",
        dashboard: "dashboard.html"
      }
    }
  }
});