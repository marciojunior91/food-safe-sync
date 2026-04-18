/**
 * Tampa APP - Local Print Server v2.0.0
 * 
 * Bridges the web app (HTTPS) to the Zebra ZD411 printer via raw TCP socket.
 * Required because browsers cannot open raw TCP connections directly.
 * 
 * Supports:
 * - Zebra ZD411 with P1112640-017C wireless adapter (Bluetooth-to-TCP bridge)
 * - Any Zebra printer accessible via TCP/IP on port 9100
 * 
 * SETUP:
 * 1. Connect P1112640-017C adapter to Zebra ZD411
 * 2. Find the printer's IP address (assigned by your router via DHCP)
 * 3. Set PRINTER_IP env var or pass ip in request body
 * 4. Run: npm install && npm start
 * 5. The web app will connect to http://localhost:3001
 * 
 * TIP: To find the printer IP, print a network config label:
 *   Hold the FEED button for 5 seconds on the ZD411
 */

const express = require('express');
const cors = require('cors');
const net = require('net');
const app = express();

const PORT = process.env.PRINT_SERVER_PORT || 3001;
const DEFAULT_PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100';
const DEFAULT_PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100');
const TCP_TIMEOUT = parseInt(process.env.TCP_TIMEOUT || '10000');

// Track connection stats
const stats = {
  totalJobs: 0,
  successfulJobs: 0,
  failedJobs: 0,
  lastPrintAt: null,
  lastError: null,
  startedAt: new Date().toISOString(),
};

// Configure CORS for web app access
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb', type: 'text/plain' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    adapter: 'P1112640-017C (Bluetooth-to-TCP)',
    defaultPrinterIp: DEFAULT_PRINTER_IP,
    defaultPrinterPort: DEFAULT_PRINTER_PORT,
    stats,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ─── Test TCP Connection to Printer ───────────────────────────────────────────
app.get('/test-connection', async (req, res) => {
  const ip = req.query.ip || DEFAULT_PRINTER_IP;
  const port = parseInt(req.query.port) || DEFAULT_PRINTER_PORT;
  const timeout = parseInt(req.query.timeout) || 5000;

  console.log(`\n🔍 Testing TCP connection to ${ip}:${port}...`);

  try {
    const result = await testTCPConnection(ip, port, timeout);
    console.log(`✅ Connection test:`, result);
    res.json(result);
  } catch (error) {
    console.error(`❌ Connection test failed:`, error.message);
    res.json({
      success: false,
      ip,
      port,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ─── Printer Status via ZPL query ─────────────────────────────────────────────
app.get('/printer-status', async (req, res) => {
  const ip = req.query.ip || DEFAULT_PRINTER_IP;
  const port = parseInt(req.query.port) || DEFAULT_PRINTER_PORT;

  console.log(`\n📊 Checking printer status at ${ip}:${port}...`);

  try {
    const response = await sendTCPCommand(ip, port, '~HS', 3000, true);

    res.json({
      online: true,
      ip,
      port,
      status: 'Ready',
      response: response || 'Connected (no response data)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      online: false,
      ip,
      port,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ─── Print ZPL Label ──────────────────────────────────────────────────────────
app.post('/print', async (req, res) => {
  const { zpl, copies = 1, ip, port: printerPort } = req.body;
  const targetIp = ip || DEFAULT_PRINTER_IP;
  const targetPort = printerPort || DEFAULT_PRINTER_PORT;

  if (!zpl) {
    return res.status(400).json({ success: false, error: 'ZPL data is required in body' });
  }

  stats.totalJobs++;
  console.log(`\n🖨️  ============================================`);
  console.log(`🖨️  PRINT JOB #${stats.totalJobs}`);
  console.log(`🖨️  Target: ${targetIp}:${targetPort}`);
  console.log(`🖨️  Copies: ${copies}`);
  console.log(`🖨️  ZPL length: ${zpl.length} chars`);
  console.log(`🖨️  ============================================`);

  try {
    let zplToSend = zpl;
    if (copies > 1) {
      zplToSend = zpl.replace('^XZ', `^PQ${copies}^XZ`);
    }

    await sendTCPCommand(targetIp, targetPort, zplToSend, TCP_TIMEOUT, false);

    stats.successfulJobs++;
    stats.lastPrintAt = new Date().toISOString();

    console.log(`✅ Print job #${stats.totalJobs} sent successfully`);

    res.json({
      success: true,
      message: 'ZPL sent to printer via raw TCP',
      ip: targetIp,
      port: targetPort,
      copies,
      jobNumber: stats.totalJobs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    stats.failedJobs++;
    stats.lastError = error.message;

    console.error(`❌ Print job #${stats.totalJobs} failed:`, error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      ip: targetIp,
      port: targetPort,
      troubleshooting: [
        'Verify printer is powered ON and connected to network',
        'Verify the P1112640-017C adapter LED is solid (not blinking)',
        `Confirm printer IP address: ${targetIp} (hold FEED 5s to print config)`,
        `Ensure port ${targetPort} is not blocked by firewall`,
        `Try: ping ${targetIp}`,
        'Ensure printer and this computer are on the same network/subnet',
      ],
      timestamp: new Date().toISOString()
    });
  }
});

// ─── Print Test Label ─────────────────────────────────────────────────────────
app.post('/print-test', async (req, res) => {
  const { ip, port: printerPort } = req.body || {};
  const targetIp = ip || DEFAULT_PRINTER_IP;
  const targetPort = printerPort || DEFAULT_PRINTER_PORT;

  console.log(`\n🧪 Printing test label to ${targetIp}:${targetPort}...`);

  const testZpl = `^XA
^MMT
^PW812
^LL406
^LS0
^CI28
^FO30,20^GB752,70,3^FS
^FO40,35^A0N,45,45^FDTampa APP - Test Label^FS
^FO30,95^GB752,2,2^FS
^FO40,110^A0N,30,30^FDPrinter Connection OK!^FS
^FO40,160^A0N,24,24^FDAdapter: P1112640-017C^FS
^FO40,195^A0N,24,24^FDProtocol: Raw TCP port ${targetPort}^FS
^FO40,230^A0N,24,24^FDIP: ${targetIp}^FS
^FO40,265^A0N,24,24^FDDate: ${new Date().toLocaleString()}^FS
^FO30,300^GB752,2,2^FS
^FO40,315^A0N,20,20^FDIf you can read this, your Zebra ZD411 is working!^FS
^FO550,110^BQN,2,5^FDQA,Tampa APP Test OK^FS
^XZ`;

  try {
    await sendTCPCommand(targetIp, targetPort, testZpl, TCP_TIMEOUT, false);

    console.log(`✅ Test label sent successfully`);
    res.json({
      success: true,
      message: 'Test label sent to printer',
      ip: targetIp,
      port: targetPort,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Test label failed:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      ip: targetIp,
      port: targetPort,
      timestamp: new Date().toISOString()
    });
  }
});

// ─── Discover Printers on Local Network ───────────────────────────────────────
app.get('/discover', async (req, res) => {
  const subnet = req.query.subnet || '192.168.1';
  const startIp = parseInt(req.query.startIp) || 1;
  const endIp = parseInt(req.query.endIp) || 254;
  const port = parseInt(req.query.port) || 9100;

  console.log(`\n🔍 Discovering printers on ${subnet}.${startIp}-${endIp}:${port}...`);

  const found = [];
  const scanTimeout = 1500;

  const batchSize = 20;
  for (let i = startIp; i <= endIp; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, endIp + 1); j++) {
      const testIp = `${subnet}.${j}`;
      batch.push(
        testTCPConnection(testIp, port, scanTimeout)
          .then(result => {
            if (result.success) {
              found.push({ ip: testIp, port, latencyMs: result.latencyMs });
              console.log(`  ✅ Found printer at ${testIp}:${port} (${result.latencyMs}ms)`);
            }
          })
          .catch(() => { /* ignored */ })
      );
    }
    await Promise.all(batch);
  }

  console.log(`✅ Discovery complete: found ${found.length} printer(s)`);
  res.json({
    found,
    scanned: { subnet, startIp, endIp, port },
    timestamp: new Date().toISOString()
  });
});

// ─── Raw TCP Helpers ──────────────────────────────────────────────────────────

/**
 * Test if a TCP connection can be established to the printer
 */
function testTCPConnection(ip, port, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const latencyMs = Date.now() - startTime;
      socket.destroy();
      resolve({
        success: true,
        ip,
        port,
        latencyMs,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`TCP timeout after ${timeout}ms to ${ip}:${port}`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`TCP error to ${ip}:${port}: ${err.message}`));
    });

    socket.connect(port, ip);
  });
}

/**
 * Send data to printer via raw TCP socket
 */
function sendTCPCommand(ip, port, data, timeout = 10000, expectResponse = false) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let responseData = '';
    let settled = false;

    const settle = (fn, val) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      fn(val);
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      console.log(`  📡 TCP connected to ${ip}:${port}`);

      socket.write(data, 'utf8', (err) => {
        if (err) {
          return settle(reject, new Error(`Write error: ${err.message}`));
        }

        console.log(`  📤 Sent ${data.length} bytes`);

        if (!expectResponse) {
          // For print jobs: give printer time to accept, then close
          setTimeout(() => settle(resolve, null), 500);
        }
      });
    });

    socket.on('data', (chunk) => {
      responseData += chunk.toString();
      console.log(`  📥 Received ${chunk.length} bytes`);

      if (expectResponse) {
        setTimeout(() => settle(resolve, responseData), 300);
      }
    });

    socket.on('timeout', () => {
      if (expectResponse && responseData) {
        settle(resolve, responseData);
      } else {
        settle(reject, new Error(`TCP timeout after ${timeout}ms to ${ip}:${port}`));
      }
    });

    socket.on('error', (err) => {
      settle(reject, new Error(`TCP error to ${ip}:${port}: ${err.message}`));
    });

    socket.on('close', () => {
      if (!settled) {
        if (expectResponse) {
          settle(resolve, responseData || null);
        }
      }
    });

    socket.connect(port, ip);
  });
}

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🖨️  ================================================');
  console.log('🖨️  Tampa APP Print Server v2.0.0');
  console.log('🖨️  Zebra ZD411 + P1112640-017C TCP Adapter');
  console.log('🖨️  ================================================');
  console.log(`📡 Server:     http://localhost:${PORT}`);
  console.log(`🖨️  Printer:    ${DEFAULT_PRINTER_IP}:${DEFAULT_PRINTER_PORT}`);
  console.log(`⏱️  Timeout:    ${TCP_TIMEOUT}ms`);
  console.log('\n📝 Endpoints:');
  console.log(`   GET  /health           - Server health check`);
  console.log(`   GET  /test-connection   - Test TCP connection to printer`);
  console.log(`   GET  /printer-status    - Query printer status via ZPL`);
  console.log(`   GET  /discover          - Scan local network for printers`);
  console.log(`   POST /print             - Send ZPL print job`);
  console.log(`   POST /print-test        - Print a test label`);
  console.log('\n💡 Environment variables:');
  console.log(`   PRINTER_IP=${DEFAULT_PRINTER_IP}`);
  console.log(`   PRINTER_PORT=${DEFAULT_PRINTER_PORT}`);
  console.log(`   PRINT_SERVER_PORT=${PORT}`);
  console.log(`   TCP_TIMEOUT=${TCP_TIMEOUT}`);
  console.log('\n🔌 Use CTRL+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down print server...');
  process.exit(0);
});
