/**
 * Zebra Printer Management Service
 * Centralized printer administration for Tampa APP
 * 
 * Based on: Documento Técnico — Integração iPad (iOS) + Zebra ZD411
 * 
 * Features:
 * - Printer discovery (Bluetooth/Wi-Fi)
 * - Connection management
 * - Multi-port fallback strategy
 * - Status monitoring
 * - Print queue management
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ZebraPrinterConfig,
  ConnectionResult,
  ZebraPrintJob,
  PrintJobResult,
  DiscoveredPrinter,
  PrinterStats,
  ConnectionType,
  ZEBRA_PORTS,
} from '@/types/zebraPrinter';

export class ZebraPrinterManager {
  private static instance: ZebraPrinterManager;
  private printers: Map<string, ZebraPrinterConfig> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private printQueue: ZebraPrintJob[] = [];
  
  private constructor() {
    this.loadPrinters();
  }
  
  /**
   * Singleton instance
   */
  static getInstance(): ZebraPrinterManager {
    if (!ZebraPrinterManager.instance) {
      ZebraPrinterManager.instance = new ZebraPrinterManager();
    }
    return ZebraPrinterManager.instance;
  }
  
  /**
   * Load printers from database
   */
  private async loadPrinters(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.organization_id) return;
      
      const { data: printers, error } = await supabase
        .from('zebra_printers')
        .select('*')
        .eq('organization_id', profile.organization_id);
      
      if (error) throw error;
      
      if (printers) {
        printers.forEach(printer => {
          this.printers.set(printer.id, printer as ZebraPrinterConfig);
        });
      }
      
      console.log(`✅ Loaded ${this.printers.size} printers`);
    } catch (error) {
      console.error('Failed to load printers:', error);
    }
  }
  
  /**
   * Discover available Zebra printers
   * 
   * Note: Full Bluetooth discovery requires native iOS bridge
   * For now, we discover WebSocket-accessible printers
   */
  async discoverPrinters(): Promise<DiscoveredPrinter[]> {
    console.log('🔍 Discovering Zebra printers...');
    
    const discovered: DiscoveredPrinter[] = [];
    
    // Try common IP ranges (192.168.1.x, 10.0.0.x)
    const localIPs = this.generateLocalIPs();
    
    for (const ip of localIPs) {
      try {
        const result = await this.testConnection(ip, 9100, 2000); // 2s timeout
        
        if (result.success) {
          discovered.push({
            name: `Zebra Printer @ ${ip}`,
            model: 'ZD411', // Could be detected via ZPL query
            connectionType: 'wifi',
            ipAddress: ip,
            port: 9100,
            discoveredAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        // Silent fail for discovery
      }
    }
    
    console.log(`✅ Discovered ${discovered.length} printers`);
    return discovered;
  }
  
  /**
   * Generate common local IP addresses for scanning
   */
  private generateLocalIPs(): string[] {
    const ips: string[] = [];
    
    // 192.168.1.x (most common home/office)
    for (let i = 100; i <= 110; i++) {
      ips.push(`192.168.1.${i}`);
    }
    
    // 10.0.0.x (common for business)
    for (let i = 100; i <= 110; i++) {
      ips.push(`10.0.0.${i}`);
    }
    
    return ips;
  }
  
  /**
   * Test connection to a printer
   */
  async testConnection(
    ipOrAddress: string,
    port: number,
    timeout: number = 5000
  ): Promise<ConnectionResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        const wsUrl = `ws://${ipOrAddress}:${port}/`;
        const socket = new WebSocket(wsUrl);
        
        const timeoutId = setTimeout(() => {
          socket.close();
          resolve({
            success: false,
            status: 'failed',
            error: `Connection timeout after ${timeout}ms`,
            timestamp: new Date().toISOString(),
          });
        }, timeout);
        
        socket.onopen = () => {
          clearTimeout(timeoutId);
          const latency = Date.now() - startTime;
          
          socket.close();
          resolve({
            success: true,
            status: 'connected',
            latency,
            timestamp: new Date().toISOString(),
          });
        };
        
        socket.onerror = (error) => {
          clearTimeout(timeoutId);
          socket.close();
          resolve({
            success: false,
            status: 'failed',
            error: 'Connection error',
            timestamp: new Date().toISOString(),
          });
        };
        
      } catch (error) {
        resolve({
          success: false,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    });
  }
  
  /**
   * Add a new printer to the system
   */
  async addPrinter(config: Omit<ZebraPrinterConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ZebraPrinterConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const now = new Date().toISOString();
    const newPrinter: ZebraPrinterConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    
    const { data, error } = await supabase
      .from('zebra_printers')
      .insert(newPrinter)
      .select()
      .single();
    
    if (error) throw error;
    
    this.printers.set(newPrinter.id, newPrinter);
    console.log(`✅ Added printer: ${newPrinter.name}`);
    
    return data as ZebraPrinterConfig;
  }
  
  /**
   * Update printer configuration
   */
  async updatePrinter(id: string, updates: Partial<ZebraPrinterConfig>): Promise<void> {
    const printer = this.printers.get(id);
    if (!printer) throw new Error(`Printer ${id} not found`);
    
    const updated = {
      ...printer,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from('zebra_printers')
      .update(updated)
      .eq('id', id);
    
    if (error) throw error;
    
    this.printers.set(id, updated);
    console.log(`✅ Updated printer: ${updated.name}`);
  }
  
  /**
   * Remove a printer
   */
  async removePrinter(id: string): Promise<void> {
    const { error } = await supabase
      .from('zebra_printers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    this.printers.delete(id);
    this.connections.delete(id);
    console.log(`✅ Removed printer: ${id}`);
  }
  
  /**
   * Get all printers
   */
  getPrinters(): ZebraPrinterConfig[] {
    return Array.from(this.printers.values());
  }
  
  /**
   * Get default printer for current station
   */
  getDefaultPrinter(station?: string): ZebraPrinterConfig | undefined {
    const printers = this.getPrinters();
    
    if (station) {
      // Find default for this station
      const stationDefault = printers.find(
        p => p.station === station && p.isDefault
      );
      if (stationDefault) return stationDefault;
    }
    
    // Fallback to any default printer
    return printers.find(p => p.isDefault);
  }
  
  /**
   * Set printer as default
   */
  async setDefaultPrinter(id: string, station?: string): Promise<void> {
    // Unset current default
    const printers = this.getPrinters();
    for (const printer of printers) {
      if (printer.station === station && printer.isDefault) {
        await this.updatePrinter(printer.id, { isDefault: false });
      }
    }
    
    // Set new default
    await this.updatePrinter(id, { isDefault: true });
  }
  
  /**
   * Connect to a printer (open WebSocket)
   */
  async connect(printerId: string): Promise<ConnectionResult> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      return {
        success: false,
        status: 'failed',
        error: 'Printer not found',
        timestamp: new Date().toISOString(),
      };
    }
    
    // If already connected, return success
    if (this.connections.has(printerId)) {
      return {
        success: true,
        status: 'connected',
        printer,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Test connection based on type
    if (printer.connectionType === 'wifi' && printer.ipAddress) {
      const port = printer.port || 9100;
      return await this.testConnection(printer.ipAddress, port);
    }
    
    if (printer.connectionType === 'bluetooth') {
      // TODO: Implement Bluetooth connection via native bridge
      return {
        success: false,
        status: 'failed',
        error: 'Bluetooth support requires iOS native bridge',
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      status: 'failed',
      error: 'Unsupported connection type',
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Print a job (queue or direct)
   */
  async print(job: Omit<ZebraPrintJob, 'id' | 'createdAt' | 'status'>): Promise<PrintJobResult> {
    const printer = this.printers.get(job.printerId);
    if (!printer) {
      throw new Error(`Printer ${job.printerId} not found`);
    }
    
    console.log(`🖨️  Printing to ${printer.name}...`);
    
    // Create full job
    const fullJob: ZebraPrintJob = {
      ...job,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Add to queue
    this.printQueue.push(fullJob);
    
    // Execute print
    try {
      const result = await this.executePrint(fullJob, printer);
      
      // Log to database
      await this.logPrintJob(result);
      
      return result;
    } catch (error) {
      const failedResult: PrintJobResult = {
        jobId: fullJob.id,
        labelId: fullJob.labelId,
        printerId: printer.id,
        printerName: printer.name,
        status: 'failed',
        printedAt: new Date().toISOString(),
        printedBy: fullJob.createdBy,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      await this.logPrintJob(failedResult);
      throw error;
    }
  }
  
  /**
   * Execute a print job
   */
  private async executePrint(
    job: ZebraPrintJob,
    printer: ZebraPrinterConfig
  ): Promise<PrintJobResult> {
    // Import the existing zebraPrinter utility
    const { printLabel } = await import('@/utils/zebraPrinter');
    
    const startTime = Date.now();
    
    // Use existing print functionality
    const result = await printLabel({
      labelId: job.labelId,
      productId: null,
      productName: 'Print Job',
      categoryId: null,
      categoryName: 'System',
      preparedBy: job.createdBy,
      preparedByName: 'System',
      prepDate: new Date().toISOString(),
      expiryDate: new Date().toISOString(),
      condition: 'Print',
      organizationId: printer.organizationId,
      quantity: job.quantity.toString(),
      batchNumber: job.id,
    }, false);
    
    const latency = Date.now() - startTime;
    
    return {
      jobId: job.id,
      labelId: job.labelId,
      printerId: printer.id,
      printerName: printer.name,
      status: result.success ? 'success' : 'failed',
      printedAt: new Date().toISOString(),
      printedBy: job.createdBy,
      error: result.error,
      latency,
    };
  }
  
  /**
   * Log print job result to database
   */
  private async logPrintJob(result: PrintJobResult): Promise<void> {
    try {
      await supabase.from('zebra_print_jobs').insert({
        job_id: result.jobId,
        label_id: result.labelId,
        printer_id: result.printerId,
        printer_name: result.printerName,
        status: result.status,
        printed_at: result.printedAt,
        printed_by: result.printedBy,
        error: result.error,
        latency_ms: result.latency,
      });
    } catch (error) {
      console.error('Failed to log print job:', error);
    }
  }
  
  /**
   * Get printer statistics
   */
  async getStats(printerId: string): Promise<PrinterStats> {
    const { data, error } = await supabase
      .from('zebra_print_jobs')
      .select('*')
      .eq('printer_id', printerId);
    
    if (error) throw error;
    
    const jobs = data || [];
    const successful = jobs.filter(j => j.status === 'success');
    const failed = jobs.filter(j => j.status === 'failed');
    const totalLatency = jobs.reduce((sum, j) => sum + (j.latency_ms || 0), 0);
    
    return {
      printerId,
      totalJobs: jobs.length,
      successfulJobs: successful.length,
      failedJobs: failed.length,
      averageLatency: jobs.length > 0 ? totalLatency / jobs.length : 0,
      lastJobAt: jobs[0]?.printed_at,
      uptime: jobs.length > 0 ? (successful.length / jobs.length) * 100 : 0,
    };
  }
}

// Export singleton instance
export const printerManager = ZebraPrinterManager.getInstance();
