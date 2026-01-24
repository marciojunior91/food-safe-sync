/**
 * Tampa APP - Local Print Server
 * 
 * Servidor local que faz ponte entre o app web (HTTPS) e a impressora HP (HTTP)
 * 
 * COMO USAR:
 * 1. Instalar dependências: npm install
 * 2. Rodar servidor: npm start
 * 3. No app web, usar: http://localhost:3001/print
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

const PORT = 3001;
const PRINTER_IP = '192.168.15.20'; // IP da sua impressora HP

// Configurar CORS para aceitar requisições do app web
app.use(cors({
  origin: '*', // Em produção, use apenas seu domínio: 'https://seu-dominio.vercel.app'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online',
    printer_ip: PRINTER_IP,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para imprimir via IPP (Internet Printing Protocol)
app.post('/print', async (req, res) => {
  try {
    const { zpl, copies = 1 } = req.body;
    
    if (!zpl) {
      return res.status(400).json({ error: 'ZPL data is required' });
    }

    console.log(`[${new Date().toISOString()}] Printing ${copies} copy(ies)...`);
    console.log('ZPL:', zpl.substring(0, 100) + '...');

    // Tentar imprimir via raw socket (porta 9100 - RAW printing)
    const response = await fetch(`http://${PRINTER_IP}:9100`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: zpl.repeat(copies),
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Printer responded with status ${response.status}`);
    }

    console.log('✅ Print job sent successfully');
    
    res.json({ 
      success: true, 
      message: 'Print job sent to printer',
      printer_ip: PRINTER_IP,
      copies
    });

  } catch (error) {
    console.error('❌ Print error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para verificar status da impressora
app.get('/printer-status', async (req, res) => {
  try {
    // Tentar conectar à porta 9100 (raw printing)
    const response = await fetch(`http://${PRINTER_IP}:9100`, {
      method: 'HEAD',
      timeout: 3000
    });

    res.json({
      online: true,
      printer_ip: PRINTER_IP,
      status: 'Ready'
    });

  } catch (error) {
    res.json({
      online: false,
      printer_ip: PRINTER_IP,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🖨️  Tampa APP Print Server');
  console.log('================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🖨️  Printer IP: ${PRINTER_IP}`);
  console.log('\n📝 Endpoints:');
  console.log(`   GET  /health         - Check server status`);
  console.log(`   GET  /printer-status - Check printer status`);
  console.log(`   POST /print          - Send print job`);
  console.log('\n💡 Use CTRL+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down print server...');
  process.exit(0);
});
