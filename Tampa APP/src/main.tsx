import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/ipad-responsive.css'
import './styles/iphone-responsive.css'

// BUILD VERSION - FORCE CHANGE FOR VERCEL CACHE BUST
const BUILD_VERSION = '2026-01-20T06:30:00Z';
const BUILD_ID = Math.random().toString(36).substring(7);
console.log(`🚀 Tampa APP - Build: ${BUILD_VERSION} - ID: ${BUILD_ID}`);

createRoot(document.getElementById("root")!).render(<App />);

