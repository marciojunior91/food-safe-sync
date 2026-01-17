import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { writeFileSync } from "fs";

// Plugin to create 200.html in dist for SPA routing (Vercel standard)
const vercelSpaPlugin = () => ({
  name: 'vercel-spa-plugin',
  closeBundle() {
    const indexPath = path.resolve(__dirname, 'dist', 'index.html');
    const fallbackPath = path.resolve(__dirname, 'dist', '200.html');
    const { copyFileSync } = require('fs');
    try {
      copyFileSync(indexPath, fallbackPath);
      console.log('✅ Created 200.html for Vercel SPA routing');
    } catch (err) {
      console.error('❌ Failed to create 200.html:', err);
    }
  }
});

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
    vercelSpaPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
