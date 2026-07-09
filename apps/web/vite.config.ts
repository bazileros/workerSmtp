import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "vendor-react";
          if (id.includes("node_modules/@tanstack/react-router") || id.includes("node_modules/@tanstack/react-query")) return "vendor-router";
          if (id.includes("node_modules/@orpc/")) return "vendor-orpc";
          if (id.includes("node_modules/monaco-editor") || id.includes("node_modules/@monaco-editor")) return "vendor-editor";
          if (id.includes("node_modules/react-syntax-highlighter")) return "vendor-highlight";
          if (id.includes("node_modules/lucide-react") || id.includes("node_modules/sonner")) return "vendor-ui";
          if (id.includes("node_modules/better-auth")) return "vendor-auth";
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "workerSmtp",
        short_name: "workerSmtp",
        description: "workerSmtp - PWA Application",
        theme_color: "#0c0c0c",
      },
      pwaAssets: { disabled: false, config: true },
      devOptions: { enabled: true },
    }),
  ],
});
