import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mkdirSync, writeFileSync } from "fs";

// Plugin to create Vercel Build Output API configuration for SPA routing
const vercelBuildOutputPlugin = () => ({
  name: 'vercel-build-output',
  closeBundle() {
    const outputDir = path.resolve(__dirname, '.vercel', 'output');
    const configPath = path.resolve(outputDir, 'config.json');
    
    try {
      // Create .vercel/output directory
      mkdirSync(outputDir, { recursive: true });
      
      // Create config.json with SPA routing configuration
      const config = {
        version: 3,
        routes: [
          { handle: "filesystem" },
          { src: "/(.*)", dest: "/index.html" }
        ]
      };
      
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✅ Created Vercel Build Output API config for SPA routing');
    } catch (err) {
      console.error('❌ Failed to create Vercel config:', err);
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
    vercelBuildOutputPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
