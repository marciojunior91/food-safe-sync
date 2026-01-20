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
        // Use timestamp + hash to force unique filenames
        entryFileNames: () => {
          const timestamp = Date.now().toString(36);
          return `assets/[name]-[hash]-${timestamp}.js`;
        },
        chunkFileNames: () => {
          const timestamp = Date.now().toString(36);
          return `assets/[name]-[hash]-${timestamp}.js`;
        },
        assetFileNames: () => {
          const timestamp = Date.now().toString(36);
          return `assets/[name]-[hash]-${timestamp}.[ext]`;
        },
        // MANUAL CHUNKS - Split heavy libraries into separate chunks
        manualChunks: (id) => {
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
          
          // Supabase - separate chunk
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          // React ecosystem - separate chunk
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // UI libraries - separate chunk
          if (id.includes('radix-ui') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          
          // Node modules general
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
