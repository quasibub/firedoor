import offlineStorage from './offlineStorage';
import networkStatus from './networkStatus';
import { SyncStatus, NetworkStatus } from '../types/offline';

// Sync service for handling offline/online data synchronization
class SyncService {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 seconds

  constructor() {
    this.initializeSync();
  }

  private initializeSync(): void {
    // Subscribe to network status changes
    networkStatus.subscribe((status: NetworkStatus) => {
      if (status.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    });

    // Start periodic sync attempts
    this.startPeriodicSync();
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (networkStatus.isConnectionGood() && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, 10000); // Check every 10 seconds
  }

  // Process the sync queue
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      console.log('🔄 Starting sync process...');

      const pendingItems = await offlineStorage.getPendingSyncItems();
      if (pendingItems.length === 0) {
        console.log('✅ No pending sync items');
        return;
      }

      console.log(`📋 Processing ${pendingItems.length} pending sync items`);

      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
          console.log(`✅ Synced item: ${item.id}`);
        } catch (error) {
          console.error(`❌ Failed to sync item ${item.id}:`, error);
          
          // Increment retry count
          item.retryCount++;
          
          if (item.retryCount >= this.maxRetries) {
            console.error(`🚫 Item ${item.id} exceeded max retries, removing from queue`);
            await offlineStorage.removeFromSyncQueue(item.id);
          } else {
            // Update the item with new retry count
            await offlineStorage.addToSyncQueue(item.type, item.endpoint, item.data);
            await offlineStorage.removeFromSyncQueue(item.id);
          }
        }
      }

      console.log('✅ Sync process completed');
    } catch (error) {
      console.error('❌ Sync process failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Process a single sync item
  private async processSyncItem(item: any): Promise<void> {
    const { type, endpoint, data } = item;

    try {
      let response: Response;

      switch (type) {
        case 'CREATE':
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(data),
          });
          break;

        case 'UPDATE':
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(data),
          });
          break;

        case 'DELETE':
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          break;

        default:
          throw new Error(`Unknown sync type: ${type}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle successful sync
      const result = await response.json();
      
      // Update local storage if needed
      if (result.success && result.data) {
        await this.updateLocalStorage(type, endpoint, result.data);
      }

    } catch (error) {
      console.error(`❌ Failed to process sync item ${item.id}:`, error);
      throw error;
    }
  }

  // Update local storage after successful sync
  private async updateLocalStorage(type: string, endpoint: string, data: any): Promise<void> {
    try {
      if (endpoint.includes('/inspections')) {
        if (type === 'CREATE' || type === 'UPDATE') {
          await offlineStorage.storeInspection(data);
        }
      } else if (endpoint.includes('/tasks')) {
        if (type === 'CREATE' || type === 'UPDATE') {
          await offlineStorage.storeTask(data);
        }
      } else if (endpoint.includes('/task-photos')) {
        if (type === 'CREATE' || type === 'UPDATE') {
          await offlineStorage.storeTaskPhoto(data);
        }
      } else if (endpoint.includes('/task-rejections')) {
        if (type === 'CREATE' || type === 'UPDATE') {
          await offlineStorage.storeTaskRejection(data);
        }
      }
    } catch (error) {
      console.error('❌ Failed to update local storage:', error);
    }
  }

  // Queue a request for later sync
  async queueRequest(type: 'CREATE' | 'UPDATE' | 'DELETE', endpoint: string, data: any): Promise<void> {
    try {
      await offlineStorage.addToSyncQueue(type, endpoint, data);
      console.log(`📋 Request queued for sync: ${type} ${endpoint}`);

      // Try to sync immediately if network is good
      if (networkStatus.isConnectionGood() && !this.isSyncing) {
        setTimeout(() => this.processSyncQueue(), 1000);
      }
    } catch (error) {
      console.error('❌ Failed to queue request:', error);
      throw error;
    }
  }

  // Force sync now
  async forceSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return;
    }

    await this.processSyncQueue();
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingItems = await offlineStorage.getPendingSyncItems();
    const storageInfo = await offlineStorage.getStorageInfo();

    return {
      isSyncing: this.isSyncing,
      pendingItems: pendingItems.length,
      storageInfo,
    };
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    await offlineStorage.clearAll();
    console.log('🗑️ All offline data cleared');
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
