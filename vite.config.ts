import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'CareerVivid',
          short_name: 'CareerVivid',
          description: 'AI-Native Developer Portfolios & Vibe Coding Platform',
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
          globPatterns: ['**/*.{js,css,html}'],
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
          skipWaiting: false // Forces SW to enter 'waiting' state so prompt works correctly
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.IS_PREACT': JSON.stringify('true')
    },
    build: {
      rollupOptions: {
        output: {
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
