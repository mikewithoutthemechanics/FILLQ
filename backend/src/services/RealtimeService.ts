import { EventEmitter } from 'events';
import { Response } from 'express';

export interface DashboardEvent {
  type: 'spot_claimed' | 'high_risk_flagged' | 'churn_nudge_sent';
  studioId: string;
  data: any;
  timestamp: string;
}

class RealtimeService extends EventEmitter {
  private clients: Map<string, Set<Response>> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Register a new SSE response client for a given studio
   */
  public addClient(studioId: string, res: Response) {
    if (!this.clients.has(studioId)) {
      this.clients.set(studioId, new Set());
    }
    this.clients.get(studioId)!.add(res);
  }

  /**
   * Remove SSE response client
   */
  public removeClient(studioId: string, res: Response) {
    if (this.clients.has(studioId)) {
      this.clients.get(studioId)!.delete(res);
      if (this.clients.get(studioId)!.size === 0) {
        this.clients.delete(studioId);
      }
    }
  }

  /**
   * Broadcast an event to all connected dashboard SSE clients for a studio
   */
  public broadcastEvent(event: DashboardEvent) {
    this.emit('dashboard_event', event);

    const studioClients = this.clients.get(event.studioId);
    if (!studioClients || studioClients.size === 0) return;

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of studioClients) {
      res.write(payload);
    }
  }
}

export const realtimeService = new RealtimeService();
