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
    // Force new bundle hash by using contenthash with longer format
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash:12].js`,
        chunkFileNames: `assets/[name]-[hash:12].js`,
        assetFileNames: `assets/[name]-[hash:12].[ext]`
      }
    },
    // Clear output directory to ensure clean build
    emptyOutDir: true
  }
}));
