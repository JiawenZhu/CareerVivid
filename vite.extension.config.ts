import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const renameExtensionIndexPlugin = () => ({
    name: 'rename-extension-index-html',
    closeBundle() {
        const from = path.resolve(__dirname, 'dist-extension/index.extension.html');
        const to = path.resolve(__dirname, 'dist-extension/index.html');
        if (fs.existsSync(from)) {
            fs.renameSync(from, to);
        }
    },
});

// Vite config specifically for Chrome Extension build
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
        plugins: [react(), renameExtensionIndexPlugin()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                // Shim PWA virtual module — only used in main app, not extension
                'virtual:pwa-register/react': path.resolve(__dirname, 'src/extension/pwa-shim.ts'),
            }
        },
        build: {
            outDir: 'dist-extension',
            emptyOutDir: true,
            minify: false,
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'index.extension.html'),
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
