#!/usr/bin/env node

/**
 * iPhone Responsiveness Validator
 * 
 * Este script valida se todos os elementos do Tampa APP estão otimizados
 * para iPhone de acordo com Apple Human Interface Guidelines
 * 
 * Uso: node validate-iphone-responsive.js
 */

console.log('📱 iPhone Responsiveness Validator\n');
console.log('Validando otimizações...\n');

const checks = [
  {
    name: '📱 Arquivo CSS existe',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      return fs.existsSync(cssPath);
    },
    fix: 'Execute: Arquivo deve existir em src/styles/iphone-responsive.css'
  },
  {
    name: '🔗 CSS está importado',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const mainPath = path.join(__dirname, '../src/main.tsx');
      if (!fs.existsSync(mainPath)) return false;
      const content = fs.readFileSync(mainPath, 'utf-8');
      return content.includes("import './styles/iphone-responsive.css'");
    },
    fix: "Adicione import './styles/iphone-responsive.css' em src/main.tsx"
  },
  {
    name: '📐 Touch targets ≥ 44px',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      if (!fs.existsSync(cssPath)) return false;
      const content = fs.readFileSync(cssPath, 'utf-8');
      return content.includes('min-height: 44px') || content.includes('min-width: 44px');
    },
    fix: 'Adicione min-height: 44px aos botões no CSS'
  },
  {
    name: '🔍 Prevenção de zoom (font-size: 16px)',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      if (!fs.existsSync(cssPath)) return false;
      const content = fs.readFileSync(cssPath, 'utf-8');
      return content.includes('font-size: 16px');
    },
    fix: 'Adicione font-size: 16px aos inputs no CSS'
  },
  {
    name: '🛡️ Safe area insets',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      if (!fs.existsSync(cssPath)) return false;
      const content = fs.readFileSync(cssPath, 'utf-8');
      return content.includes('env(safe-area-inset-top)') && 
             content.includes('env(safe-area-inset-bottom)');
    },
    fix: 'Adicione safe-area-inset-top/bottom no CSS'
  },
  {
    name: '📱 Media queries para mobile',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      if (!fs.existsSync(cssPath)) return false;
      const content = fs.readFileSync(cssPath, 'utf-8');
      return content.includes('@media (max-width: 767px)');
    },
    fix: 'Adicione @media queries para mobile no CSS'
  },
  {
    name: '🌀 Smooth scrolling',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      if (!fs.existsSync(cssPath)) return false;
      const content = fs.readFileSync(cssPath, 'utf-8');
      return content.includes('-webkit-overflow-scrolling: touch');
    },
    fix: 'Adicione -webkit-overflow-scrolling: touch no CSS'
  },
  {
    name: '🎴 Cards responsivos',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      if (!fs.existsSync(cssPath)) return false;
      const content = fs.readFileSync(cssPath, 'utf-8');
      return content.includes('.quick-print-grid');
    },
    fix: 'Adicione estilos .quick-print-grid no CSS'
  },
  {
    name: '🔄 Landscape mode',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(__dirname, '../src/styles/iphone-responsive.css');
      if (!fs.existsSync(cssPath)) return false;
      const content = fs.readFileSync(cssPath, 'utf-8');
      return content.includes('orientation: landscape');
    },
    fix: 'Adicione media query para landscape no CSS'
  },
  {
    name: '📋 Viewport meta tag',
    check: () => {
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.join(__dirname, '../index.html');
      if (!fs.existsSync(htmlPath)) return false;
      const content = fs.readFileSync(htmlPath, 'utf-8');
      return content.includes('viewport') && content.includes('width=device-width');
    },
    fix: 'Adicione <meta name="viewport" content="width=device-width, initial-scale=1.0"> em index.html'
  }
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check, fix }) => {
  try {
    const result = check();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      console.log(`   Fix: ${fix}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Erro: ${error.message}\n`);
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resultado: ${passed}/${checks.length} checks passaram\n`);

if (failed === 0) {
  console.log('🎉 Todas as otimizações estão implementadas!');
  console.log('✅ Tampa APP está pronto para iPhone\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} otimização(ões) faltando`);
  console.log('❌ Revise os itens acima antes do deploy\n');
  process.exit(1);
}
