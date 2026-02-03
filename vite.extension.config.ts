import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config specifically for Chrome Extension build
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
        plugins: [react()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            }
        },
        build: {
            outDir: 'dist-extension',
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'index.html'),
                    background: path.resolve(__dirname, 'src/background.ts'),
                    content: path.resolve(__dirname, 'src/content.ts'),
                },
                output: {
                    entryFileNames: (chunkInfo) => {
                        // Keep background and content scripts at root level
                        if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
                            return '[name].js';
                        }
                        return 'assets/[name]-[hash].js';
                    },
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]'
                }
            }
        }
    };
});
