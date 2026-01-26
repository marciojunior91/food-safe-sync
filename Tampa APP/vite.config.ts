import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Force new bundle hash - AGGRESSIVE CACHE BUSTING
    rollupOptions: {
      output: {
        // Use timestamp + random to force unique filenames every build
        entryFileNames: () => {
          // Use build timestamp + random to ensure uniqueness in production
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8) || 
                         Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
          return `assets/[name]-[hash]-${buildId}.js`;
        },
        chunkFileNames: () => {
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8) || 
                         Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
          return `assets/[name]-[hash]-${buildId}.js`;
        },
        assetFileNames: () => {
          const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8) || 
                         Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
          return `assets/[name]-[hash]-${buildId}.[ext]`;
        },
        // MANUAL CHUNKS - DON'T split React to prevent initialization errors
        manualChunks: (id) => {
          // Supabase client - separate chunk
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Heavy PDF/Canvas libraries - load only when needed
          if (id.includes('html2canvas')) {
            return 'html2canvas';
          }
          if (id.includes('jspdf')) {
            return 'jspdf';
          }
          if (id.includes('dompurify')) {
            return 'dompurify';
          }
          
          // DON'T separate React - keep in vendor to ensure proper load order
          // This prevents "Cannot read properties of undefined (reading 'forwardRef')" error
          
          // All node_modules (including React) in vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Clear output directory to ensure clean build
    emptyOutDir: true,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Force rebuild by clearing cache
    manifest: true,
    // Increase chunk size warning limit (we're splitting properly now)
    chunkSizeWarningLimit: 1000
  }
}));
