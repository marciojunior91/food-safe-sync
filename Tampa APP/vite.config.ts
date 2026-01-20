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
    // Force cache busting - use dynamic hash with manual chunks
    rollupOptions: {
      output: {
        // Use function to generate unique hash per chunk
        entryFileNames: (chunkInfo) => {
          const hash = Date.now().toString(36);
          return `assets/[name]-${hash}-[hash].js`;
        },
        chunkFileNames: (chunkInfo) => {
          const hash = Date.now().toString(36);
          return `assets/[name]-${hash}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const hash = Date.now().toString(36);
          const ext = assetInfo.name?.split('.').pop() || 'asset';
          return `assets/[name]-${hash}-[hash].${ext}`;
        }
      }
    }
  }
}));
