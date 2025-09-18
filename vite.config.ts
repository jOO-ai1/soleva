import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now()),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          // Router
          if (id.includes('react-router')) {
            return 'router';
          }
          // Animation library
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          // Icons
          if (id.includes('react-icons') || id.includes('lucide-react')) {
            return 'icons';
          }
          // UI libraries
          if (id.includes('@headlessui') || id.includes('@heroicons')) {
            return 'ui-libs';
          }
          // Large utility libraries
          if (id.includes('lodash') || id.includes('date-fns')) {
            return 'utils';
          }
          // Pages (lazy loaded)
          if (id.includes('/pages/')) {
            return 'pages';
          }
        }
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    target: 'es2015',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion']
  },
  server: {
    hmr: {
      overlay: false
    },
    host: true
  }
});
