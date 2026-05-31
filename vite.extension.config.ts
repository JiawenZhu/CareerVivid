import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config specifically for Chrome Extension build
export default defineConfig(() => {
    return {
        plugins: [react()],
        publicDir: false,
        define: {
            'import.meta.env.VITE_EXTENSION_BUILD': JSON.stringify('true'),
            'process.env.API_KEY': JSON.stringify(''),
            'process.env.GEMINI_API_KEY': JSON.stringify('')
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
