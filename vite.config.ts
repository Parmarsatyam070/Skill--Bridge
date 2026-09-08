import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production' || command === 'build';

  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    server: {
      port: Number(process.env.VITE_PORT) || 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'client/dist',
      emptyOutDir: true,
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('node_modules')) {
              if (
                normalizedId.includes('node_modules/react/') ||
                normalizedId.includes('node_modules/react-dom/') ||
                normalizedId.includes('node_modules/react-router/') ||
                normalizedId.includes('node_modules/react-router-dom/') ||
                normalizedId.includes('node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
              if (
                normalizedId.includes('node_modules/firebase/') ||
                normalizedId.includes('node_modules/@firebase/')
              ) {
                return 'vendor-firebase';
              }
              if (
                normalizedId.includes('node_modules/@tanstack/react-query') ||
                normalizedId.includes('node_modules/@tanstack/query-core')
              ) {
                return 'vendor-query';
              }
              if (normalizedId.includes('node_modules/lucide-react/')) {
                return 'vendor-icons';
              }
              if (
                normalizedId.includes('node_modules/recharts/') ||
                normalizedId.includes('node_modules/d3-') ||
                normalizedId.includes('node_modules/victory-vendor/')
              ) {
                return 'vendor-charts';
              }
            }
          },
        },
      },
    },
  };
});
