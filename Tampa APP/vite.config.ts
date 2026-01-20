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
        }
      }
    },
    // Clear output directory to ensure clean build
    emptyOutDir: true,
    // Disable CSS code splitting to force new CSS hash
    cssCodeSplit: true,
    // Force rebuild by clearing cache
    manifest: true
  }
}));
