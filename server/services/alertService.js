import { checkAlerts } from '../database/analyticsDb.js';
import WebSocket from 'ws';

class AlertService {
  constructor() {
    this.checkInterval = null;
    this.connectedClients = new Set();
  }

  addClient(ws) {
    this.connectedClients.add(ws);
    
    // Remove client when disconnected
    ws.on('close', () => {
      this.connectedClients.delete(ws);
    });
  }

  removeClient(ws) {
    this.connectedClients.delete(ws);
  }

  start() {
    // Check alerts every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkAndNotify();
    }, 5 * 60 * 1000);

    // Also check immediately on start
    this.checkAndNotify();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkAndNotify() {
    try {
      const triggeredAlerts = await checkAlerts();
      
      if (triggeredAlerts.length > 0) {
        console.log(`🚨 ${triggeredAlerts.length} alerts triggered`);
        
        // Notify all connected WebSocket clients
        const message = JSON.stringify({
          type: 'alerts-triggered',
          alerts: triggeredAlerts,
          timestamp: new Date().toISOString()
        });
        
        this.connectedClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  // Manual check (can be called from API endpoint)
  async manualCheck() {
    return await checkAlerts();
  }
}

// Create singleton instance
const alertService = new AlertService();

export default alertService;