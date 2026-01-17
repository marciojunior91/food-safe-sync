import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { writeFileSync } from "fs";

// Plugin to create vercel.json in dist for SPA routing
const vercelSpaPlugin = () => ({
  name: 'vercel-spa-plugin',
  closeBundle() {
    const vercelConfig = {
      routes: [
        {
          src: "/assets/(.*)",
          dest: "/assets/$1"
        },
        {
          src: "/(.*)",
          dest: "/index.html"
        }
      ]
    };
    writeFileSync(
      path.resolve(__dirname, 'dist', 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
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
