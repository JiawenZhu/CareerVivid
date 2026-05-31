import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { parse as parseDotEnv } from 'dotenv';

const FIREBASE_CLIENT_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
] as const;

const NEXT_SEO_LOCALES = ['de', 'es', 'fr', 'ja', 'ko', 'zh'] as const;

const GENERATED_NEXT_OUTPUT_GLOBS = [
  '**/next-app/.next/**',
  '**/next-app/out/**',
  '**/dist/nextjs/**'
];

const NEXT_SEO_NAVIGATION_DENYLIST = [
  /^\/__/,
  /^\/_next(?:\/|$)/,
  /^\/nextjs(?:\/|$)/,
  /^\/j(?:\/|$)/,
  new RegExp(`^/(?:${NEXT_SEO_LOCALES.join('|')})(?:/|$)`)
];

const getManualChunkName = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
  if (
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/scheduler/')
  ) return 'vendor-react';
  if (id.includes('/lucide-react/')) return 'vendor-icons';
  if (id.includes('/framer-motion/') || id.includes('/gsap/')) return 'vendor-motion';
  if (id.includes('/react-dnd/') || id.includes('/@minoru/react-dnd-treeview/') || id.includes('/@dnd-kit/')) return 'vendor-dnd';
  if (id.includes('/pdfjs-dist/') || id.includes('/jspdf/') || id.includes('/html2canvas/') || id.includes('/pdf-lib/')) return 'vendor-pdf';
  if (id.includes('/mermaid/') || id.includes('/cytoscape/') || id.includes('/@excalidraw/') || id.includes('/reactflow/')) return 'vendor-diagrams';
  if (id.includes('/three/') || id.includes('/@react-three/')) return 'vendor-3d';
  if (id.includes('/recharts/')) return 'vendor-charts';
  if (id.includes('/@google/genai/') || id.includes('/@google/generative-ai/')) return 'vendor-ai';
  if (id.includes('/@stripe/')) return 'vendor-stripe';
  if (id.includes('/date-fns/') || id.includes('/i18next/') || id.includes('/react-i18next/')) return 'vendor-i18n';

  return undefined;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rawDotEnv = fs.existsSync('.env') ? parseDotEnv(fs.readFileSync('.env')) : {};
  const pickEnv = (key: string) => env[key] || rawDotEnv[key] || '';
  const firebaseClientEnvDefines = Object.fromEntries(
    FIREBASE_CLIENT_ENV_KEYS.map((key) => [`import.meta.env.${key}`, JSON.stringify(pickEnv(key))])
  );

  return {
    server: {
      port: 3001,
      host: '0.0.0.0',
      watch: {
        ignored: GENERATED_NEXT_OUTPUT_GLOBS
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'CareerVivid',
          short_name: 'CareerVivid',
          description: 'AI job-search workspace for resumes, job tracking, interview prep, portfolios, and Chrome extension autofill.',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // Keep the SPA app shell offline-ready without precaching every
          // exported Next SEO page or every route-level Vite chunk.
          globPatterns: ['index.html', 'assets/index-*.js', 'assets/index-*.css'],
          globIgnores: ['nextjs/**/*'],
          navigateFallbackDenylist: NEXT_SEO_NAVIGATION_DENYLIST,
          runtimeCaching: [
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        }
      })
    ],
    define: {
      ...firebaseClientEnvDefines,
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.IS_PREACT': JSON.stringify('true')
    },
    build: {
      modulePreload: {
        // Avoid preloading dependencies for every lazy route from index.html.
        // Route chunks will still fetch their own dependencies when visited,
        // while authenticated users get targeted idle preloads in App.tsx.
        resolveDependencies: () => []
      },
      rollupOptions: {
        output: {
          manualChunks: getManualChunkName,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
