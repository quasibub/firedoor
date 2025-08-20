import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineInspection, OfflineTask, OfflineTaskPhoto, OfflineTaskRejection, SyncQueueItem } from '../types/offline';

// Database schema for offline storage
interface OfflineDB extends DBSchema {
  inspections: {
    key: string;
    value: OfflineInspection;
    indexes: { 'by-sync-status': string };
  };
  tasks: {
    key: string;
    value: OfflineTask;
    indexes: { 'by-sync-status': string };
  };
  taskPhotos: {
    key: string;
    value: OfflineTaskPhoto;
    indexes: { 'by-sync-status': string };
  };
  taskRejections: {
    key: string;
    value: OfflineTaskRejection;
    indexes: { 'by-sync-status': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
}

// Offline storage service
class OfflineStorageService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private readonly DB_NAME = 'FireDoorOfflineDB';
  private readonly DB_VERSION = 1;

  // Initialize the database
  async init(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Inspections store
          const inspectionsStore = db.createObjectStore('inspections', { keyPath: 'id' });
          inspectionsStore.createIndex('by-sync-status', 'syncStatus');

          // Tasks store
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('by-sync-status', 'syncStatus');

          // Task photos store
          const taskPhotosStore = db.createObjectStore('taskPhotos', { keyPath: 'id' });
          taskPhotosStore.createIndex('by-sync-status', 'syncStatus');

          // Task rejections store
          const taskRejectionsStore = db.createObjectStore('taskRejections', { keyPath: 'id' });
          taskRejectionsStore.createIndex('by-sync-status', 'syncStatus');

          // Sync queue store
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-timestamp', 'timestamp');
        },
      });
      console.log('✅ Offline storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize offline storage:', error);
      throw error;
    }
  }

  // Store inspection data offline
  async storeInspection(inspection: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offlineInspection = {
      ...inspection,
      syncStatus: 'PENDING',
      offlineId: inspection.id || `offline_${Date.now()}_${Math.random()}`,
      lastModified: Date.now(),
    };

    await this.db.put('inspections', offlineInspection);
    console.log('📥 Inspection stored offline:', offlineInspection.offlineId);
  }

  // Store task data offline
  async storeTask(task: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offlineTask = {
      ...task,
      syncStatus: 'PENDING',
      offlineId: task.id || `offline_${Date.now()}_${Math.random()}`,
      lastModified: Date.now(),
    };

    await this.db.put('tasks', offlineTask);
    console.log('📥 Task stored offline:', offlineTask.offlineId);
  }

  // Store task photo offline
  async storeTaskPhoto(photo: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offlinePhoto = {
      ...photo,
      syncStatus: 'PENDING',
      offlineId: photo.id || `offline_${Date.now()}_${Math.random()}`,
      lastModified: Date.now(),
      // Convert blob to base64 for offline storage
      imageData: photo.blob ? await this.blobToBase64(photo.blob) : photo.imageData,
    };

    await this.db.put('taskPhotos', offlinePhoto);
    console.log('📥 Task photo stored offline:', offlinePhoto.offlineId);
  }

  // Store task rejection offline
  async storeTaskRejection(rejection: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const offlineRejection = {
      ...rejection,
      syncStatus: 'PENDING',
      offlineId: rejection.id || `offline_${Date.now()}_${Math.random()}`,
      lastModified: Date.now(),
    };

    await this.db.put('taskRejections', offlineRejection);
    console.log('📥 Task rejection stored offline:', offlineRejection.offlineId);
  }

  // Add request to sync queue
  async addToSyncQueue(type: 'CREATE' | 'UPDATE' | 'DELETE', endpoint: string, data: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const queueItem = {
      id: `sync_${Date.now()}_${Math.random()}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db.put('syncQueue', queueItem);
    console.log('📋 Added to sync queue:', queueItem.id);
  }

  // Get all pending sync items
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const items = await this.db.getAllFromIndex('syncQueue', 'by-timestamp');
    return items.sort((a: SyncQueueItem, b: SyncQueueItem) => a.timestamp - b.timestamp);
  }

  // Get offline inspections
  async getOfflineInspections(): Promise<OfflineInspection[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.db.getAll('inspections');
  }

  // Get offline tasks
  async getOfflineTasks(): Promise<OfflineTask[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.db.getAll('tasks');
  }

  // Get offline task photos
  async getOfflineTaskPhotos(): Promise<OfflineTaskPhoto[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.db.getAll('taskPhotos');
  }

  // Get offline task rejections
  async getOfflineTaskRejections(): Promise<OfflineTaskRejection[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.db.getAll('taskRejections');
  }

  // Mark item as synced
  async markAsSynced(storeName: 'inspections' | 'tasks' | 'taskPhotos' | 'taskRejections', id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const store = this.db.transaction(storeName, 'readwrite').objectStore(storeName);
    const item = await store.get(id);
    if (item) {
      item.syncStatus = 'SYNCED';
      await store.put(item);
    }
  }

  // Remove item from sync queue
  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.delete('syncQueue', id);
  }

  // Convert blob to base64 for offline storage
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Convert base64 back to blob
  async base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  }

  // Clear all offline data (for testing/debugging)
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.clear('inspections');
    await this.db.clear('tasks');
    await this.db.clear('taskPhotos');
    await this.db.clear('taskRejections');
    await this.db.clear('syncQueue');
    console.log('🗑️ All offline data cleared');
  }

  // Get storage usage info
  async getStorageInfo(): Promise<{
    inspections: number;
    tasks: number;
    taskPhotos: number;
    taskRejections: number;
    syncQueue: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const inspections = await this.db.count('inspections');
    const tasks = await this.db.count('tasks');
    const taskPhotos = await this.db.count('taskPhotos');
    const taskRejections = await this.db.count('taskRejections');
    const syncQueue = await this.db.count('syncQueue');

    return {
      inspections,
      tasks,
      taskPhotos,
      taskRejections,
      syncQueue,
    };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
