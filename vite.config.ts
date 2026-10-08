import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "vendor";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "motion";
          }
          if (id.includes("node_modules/three") || id.includes("node_modules/@react-three")) {
            return "three";
          }
          if (id.includes("node_modules/lucide-react") || id.includes("node_modules/react-helmet-async")) {
            return "ui";
          }
        },
      },
    },
    chunkSizeWarningLimit: 300,
    sourcemap: false,
    reportCompressedSize: true,
  },
  server: {
    port: 3000,
    open: false,
    // Keeps the browser talking to a single origin in development, so session
    // cookies are first-party and CORS never enters the picture.
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: false,
      },
    },
  },
});
