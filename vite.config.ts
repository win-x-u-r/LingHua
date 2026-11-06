import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

const BUILD_STAMP = Date.now().toString(36);

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
      // "prompt": a new version waits until LingHua applies it (see UpdateReady.tsx),
      // so an open lesson is never swapped out underneath someone.
      registerType: "prompt",
      injectRegister: false,
      includeAssets: [
        "favicon.ico",
        "favicon-192.png",
        "favicon-512.png",
        "apple-touch-icon.png",
        "robots.txt",
        "hua-sw.js",
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
        background_color: "#FBF5EF",
        theme_color: "#D52B1E",
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
        // Opens LingHua when someone taps one of Hua's reminders
        // The build stamp makes every release fetch a fresh copy, never a cached one.
        importScripts: [`/hua-sw.js?v=${BUILD_STAMP}`],
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
        // Disabled in dev — service worker caches JS bundles and breaks HMR.
        enabled: false,
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
