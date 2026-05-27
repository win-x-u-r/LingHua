import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // HTTPS via self-signed cert — required so iOS Safari (and any phone
    // browser hitting the LAN IP) will expose navigator.mediaDevices.
    // On the laptop, http://localhost:8080 still works (localhost is exempt).
    https: true,
  },
  plugins: [
    react(),
    basicSsl(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon-192.png",
        "favicon-512.png",
        "apple-touch-icon.png",
        "robots.txt",
      ],
      manifest: {
        name: "Líng Huà — Learn Mandarin",
        short_name: "Líng Huà",
        description:
          "An Arabic-first Mandarin Chinese learning platform powered by Huawei Cloud AI.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f9f5f5",
        theme_color: "#c2410c",
        lang: "en",
        dir: "ltr",
        categories: ["education", "productivity"],
        icons: [
          {
            src: "/favicon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        // Cache static assets aggressively (immutable) and let runtime caching
        // handle dynamic data with sensible network-first / stale-while-revalidate
        // strategies. Never cache the backend API or Supabase responses.
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,woff,woff2,ico}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/api\//,                 // backend (proxied at /api/ in prod)
          /\.(?:woff2?|png|jpg|svg)$/, // direct asset URLs
        ],
        runtimeCaching: [
          {
            // Google Fonts CSS — stale-while-revalidate
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-css",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Google Fonts files — cache-first, long-lived
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Supabase REST + Auth — network-first; we want fresh data when online
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Enable in dev so we can verify the manifest + service worker locally.
        // Set to false if it interferes with HMR.
        enabled: true,
        type: "module",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
