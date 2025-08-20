// Network status detection and monitoring service
class NetworkStatusService {
  private isOnline: boolean = navigator.onLine;
  private connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' = 'excellent';
  private listeners: Array<(status: { isOnline: boolean; quality: string; pingTime: number }) => void> = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;
  private pingTimeout: number = 5000; // 5 seconds

  constructor() {
    this.initializeEventListeners();
    this.startPingMonitoring();
  }

  private initializeEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Listen for visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnectionQuality();
      }
    });

    // Listen for focus events
    window.addEventListener('focus', () => this.checkConnectionQuality());
  }

  private handleOnline(): void {
    console.log('🌐 Network: Online');
    this.isOnline = true;
    this.checkConnectionQuality();
    this.notifyListeners();
  }

  private handleOffline(): void {
    console.log('📴 Network: Offline');
    this.isOnline = false;
    this.connectionQuality = 'offline';
    this.notifyListeners();
  }

  private async checkConnectionQuality(): Promise<void> {
    if (!this.isOnline) {
      this.connectionQuality = 'offline';
      return;
    }

    try {
      const startTime = Date.now();
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(this.pingTimeout)
      });
      
      const responseTime = Date.now() - startTime;
      this.lastPingTime = responseTime;

      if (response.ok) {
        if (responseTime < 100) {
          this.connectionQuality = 'excellent';
        } else if (responseTime < 500) {
          this.connectionQuality = 'good';
        } else {
          this.connectionQuality = 'poor';
        }
      } else {
        this.connectionQuality = 'poor';
      }
    } catch (error) {
      console.warn('⚠️ Connection quality check failed:', error);
      this.connectionQuality = 'poor';
    }

    this.notifyListeners();
  }

  private startPingMonitoring(): void {
    // Check connection quality every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.isOnline && !document.hidden) {
        this.checkConnectionQuality();
      }
    }, 30000);
  }

  private notifyListeners(): void {
    const status = {
      isOnline: this.isOnline,
      quality: this.connectionQuality,
      pingTime: this.lastPingTime,
    };

    this.listeners.forEach(listener => listener(status));
  }

  // Subscribe to network status changes
  subscribe(listener: (status: { isOnline: boolean; quality: string; pingTime: number }) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current status
    listener({
      isOnline: this.isOnline,
      quality: this.connectionQuality,
      pingTime: this.lastPingTime,
    });

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get current network status
  getStatus(): { isOnline: boolean; quality: string; pingTime: number } {
    return {
      isOnline: this.isOnline,
      quality: this.connectionQuality,
      pingTime: this.lastPingTime,
    };
  }

  // Check if connection is good enough for real-time operations
  isConnectionGood(): boolean {
    return this.isOnline && this.connectionQuality !== 'offline';
  }

  // Check if connection is excellent for large file uploads
  isConnectionExcellent(): boolean {
    return this.isOnline && this.connectionQuality === 'excellent';
  }

  // Force a connection quality check
  async forceCheck(): Promise<void> {
    await this.checkConnectionQuality();
  }

  // Cleanup
  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatusService();
export default networkStatus;
