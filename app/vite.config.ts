import devServer from "@hono/vite-dev-server";
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { inspectAttr } from "kimi-plugin-inspect-react";

const __dirname = import.meta.dirname;

export default defineConfig({
  plugins: [
    { name: "kimi-preview-host", config(config) {
      const hosts = config.server?.allowedHosts;
      if (hosts === true || hosts?.includes("3000.proxy.internal")) return;
      return { server: { allowedHosts: ["3000.proxy.internal"] } };
    } },
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    react(),
    inspectAttr(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Quizzy — Learning in motion",
        short_name: "Quizzy",
        description: "Create, share, and take focused quizzes.",
        theme_color: "#1b1026",
        background_color: "#1b1026",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: null,
        runtimeCaching: [{ urlPattern: ({ request }) => request.mode === "navigate", handler: "NetworkOnly" }],
      },
    }),
  ],
  server: { port: 3000 },
  resolve: { alias: {
    "@": path.resolve(__dirname, "./src"),
    "@contracts": path.resolve(__dirname, "./contracts"),
    "@db": path.resolve(__dirname, "./db"),
    db: path.resolve(__dirname, "./db"),
  } },
  envDir: path.resolve(__dirname),
  build: { outDir: path.resolve(__dirname, "dist/public"), emptyOutDir: true },
});
