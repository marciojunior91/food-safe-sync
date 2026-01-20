/**
 * REAL-TIME PRINTER DIAGNOSTICS
 * 
 * Sistema de logging via LocalStorage + Console que funciona INDEPENDENTE do bundle hash
 * Persiste entre reloads e pode ser acessado mesmo se o código não atualizar
 */

export interface PrinterLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  port?: number;
  message: string;
  details?: any;
}

const LOG_KEY = 'zebra_printer_logs';
const MAX_LOGS = 100;

class PrinterDiagnostics {
  private static instance: PrinterDiagnostics;
  
  private constructor() {
    // Auto-clear old logs on startup (older than 24h)
    this.clearOldLogs();
  }

  static getInstance(): PrinterDiagnostics {
    if (!PrinterDiagnostics.instance) {
      PrinterDiagnostics.instance = new PrinterDiagnostics();
    }
    return PrinterDiagnostics.instance;
  }

  /**
   * Log info message
   */
  info(message: string, details?: any, port?: number) {
    this.log('info', message, details, port);
  }

  /**
   * Log success message
   */
  success(message: string, details?: any, port?: number) {
    this.log('success', message, details, port);
  }

  /**
   * Log warning message
   */
  warning(message: string, details?: any, port?: number) {
    this.log('warning', message, details, port);
  }

  /**
   * Log error message
   */
  error(message: string, details?: any, port?: number) {
    this.log('error', message, details, port);
  }

  /**
   * Internal log method
   */
  private log(level: PrinterLog['level'], message: string, details?: any, port?: number) {
    const timestamp = new Date().toISOString();
    const log: PrinterLog = {
      timestamp,
      level,
      message,
      port,
      details
    };

    // Console output with emoji
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[level];

    const portStr = port ? `[PORT ${port}] ` : '';
    console.log(`${emoji} ${portStr}${message}`, details || '');

    // Save to localStorage
    try {
      const logs = this.getLogs();
      logs.push(log);
      
      // Keep only last MAX_LOGS entries
      if (logs.length > MAX_LOGS) {
        logs.shift();
      }

      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log to localStorage:', error);
    }
  }

  /**
   * Get all logs from localStorage
   */
  getLogs(): PrinterLog[] {
    try {
      const stored = localStorage.getItem(LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    localStorage.removeItem(LOG_KEY);
    console.log('🗑️ Printer logs cleared');
  }

  /**
   * Clear logs older than 24 hours
   */
  private clearOldLogs() {
    const logs = this.getLogs();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime > oneDayAgo;
    });

    if (recentLogs.length < logs.length) {
      localStorage.setItem(LOG_KEY, JSON.stringify(recentLogs));
      console.log(`🗑️ Cleared ${logs.length - recentLogs.length} old logs`);
    }
  }

  /**
   * Export logs as formatted text
   */
  exportLogs(): string {
    const logs = this.getLogs();
    
    let output = '='.repeat(60) + '\n';
    output += 'ZEBRA PRINTER DIAGNOSTIC LOGS\n';
    output += `Exported: ${new Date().toLocaleString()}\n`;
    output += `Total logs: ${logs.length}\n`;
    output += '='.repeat(60) + '\n\n';

    logs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const portStr = log.port ? `[PORT ${log.port}] ` : '';
      const emoji = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      }[log.level];

      output += `${index + 1}. ${emoji} [${timestamp}] ${portStr}${log.message}\n`;
      
      if (log.details) {
        output += `   Details: ${JSON.stringify(log.details, null, 2)}\n`;
      }
      
      output += '\n';
    });

    return output;
  }

  /**
   * Download logs as text file
   */
  downloadLogs() {
    const content = this.exportLogs();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `zebra-printer-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Logs downloaded');
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const logs = this.getLogs();
    
    const stats = {
      total: logs.length,
      byLevel: {
        info: 0,
        success: 0,
        warning: 0,
        error: 0
      },
      byPort: {} as Record<number, number>,
      lastLog: logs[logs.length - 1],
      firstLog: logs[0]
    };

    logs.forEach(log => {
      stats.byLevel[log.level]++;
      if (log.port) {
        stats.byPort[log.port] = (stats.byPort[log.port] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const stats = this.getStats();
    
    console.log('\n📊 ==============================================');
    console.log('📊 PRINTER DIAGNOSTICS SUMMARY');
    console.log('📊 ==============================================');
    console.log(`Total logs: ${stats.total}`);
    console.log('\nBy Level:');
    console.log(`  ℹ️  Info: ${stats.byLevel.info}`);
    console.log(`  ✅ Success: ${stats.byLevel.success}`);
    console.log(`  ⚠️  Warning: ${stats.byLevel.warning}`);
    console.log(`  ❌ Error: ${stats.byLevel.error}`);
    
    if (Object.keys(stats.byPort).length > 0) {
      console.log('\nBy Port:');
      Object.entries(stats.byPort).forEach(([port, count]) => {
        console.log(`  Port ${port}: ${count} attempts`);
      });
    }
    
    if (stats.lastLog) {
      console.log('\nLast Log:');
      console.log(`  Time: ${new Date(stats.lastLog.timestamp).toLocaleString()}`);
      console.log(`  Level: ${stats.lastLog.level}`);
      console.log(`  Message: ${stats.lastLog.message}`);
    }
    
    console.log('📊 ==============================================\n');
  }
}

// Global instance
export const printerDiagnostics = PrinterDiagnostics.getInstance();

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).printerDiagnostics = printerDiagnostics;
  
  // Show help on first load
  console.log('\n🔧 PRINTER DIAGNOSTICS AVAILABLE');
  console.log('Access via: window.printerDiagnostics');
  console.log('Commands:');
  console.log('  - printerDiagnostics.getLogs()      // View all logs');
  console.log('  - printerDiagnostics.printSummary() // Show summary');
  console.log('  - printerDiagnostics.downloadLogs() // Download logs');
  console.log('  - printerDiagnostics.clearLogs()    // Clear all logs');
  console.log('  - printerDiagnostics.getStats()     // Get statistics\n');
}
