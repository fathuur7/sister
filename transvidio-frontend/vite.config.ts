import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    allowedHosts: ['srv1068768.hstgr.cloud'],
    // Optimize dev server
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/Index.tsx',
        './src/index.css'
      ]
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'next-themes'
    ],
    force: mode === 'development'
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      },
      mangle: true
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core libs
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Router - separate chunk for better caching
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          
          // Lucide icons - BIGGEST BUNDLE (1.13 MB), separate it!
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          
          // Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          
          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          
          // Framer Motion - animation library (381 KB)
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          
          // Other UI libraries
          if (id.includes('node_modules/sonner') || 
              id.includes('node_modules/next-themes') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/clsx')) {
            return 'ui-libs';
          }
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true
  }
}));
