import networkStatus from './networkStatus';
import syncService from './syncService';
import offlineStorage from './offlineStorage';
import { OfflineTask, OfflineTaskPhoto, OfflineTaskRejection, OfflineReport, ApiResponse, NetworkStatus, SyncStatus } from '../types/offline';

// Offline-aware API client
class OfflineApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Generic request method with offline support
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    syncType?: 'CREATE' | 'UPDATE' | 'DELETE'
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const isOnline = networkStatus.isConnectionGood();

    try {
      if (isOnline) {
        // Try online request first
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            ...options.headers,
          },
        });

        if (response.ok) {
          return await response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Online request failed, falling back to offline:', error);
    }

    // If offline or online request failed, queue for later sync
    if (syncType) {
      await syncService.queueRequest(syncType, url, options.body ? JSON.parse(options.body as string) : {});
      
      // Return offline response
      return {
        success: true,
        message: 'Request queued for offline sync',
        offline: true,
        data: options.body ? JSON.parse(options.body as string) : {},
      };
    }

    throw new Error('Request failed and no offline fallback available');
  }

  // GET request (read-only, no sync needed)
  async get(endpoint: string): Promise<ApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const isOnline = networkStatus.isConnectionGood();

    try {
      if (isOnline) {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.warn('⚠️ Online GET request failed:', error);
    }

    // Try to get data from offline storage
    return await this.getOfflineData(endpoint);
  }

  // POST request (create)
  async post(endpoint: string, data: Record<string, any>): Promise<ApiResponse> {
    return await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'CREATE');
  }

  // PUT request (update)
  async put(endpoint: string, data: Record<string, any>): Promise<ApiResponse> {
    return await this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, 'UPDATE');
  }

  // DELETE request
  async delete(endpoint: string): Promise<ApiResponse> {
    return await this.makeRequest(endpoint, {
      method: 'DELETE',
    }, 'DELETE');
  }

  // Get data from offline storage based on endpoint
  private async getOfflineData(endpoint: string): Promise<ApiResponse> {
    try {
      if (endpoint.includes('/inspections')) {
        const inspections = await offlineStorage.getOfflineInspections();
        return { success: true, data: inspections, offline: true };
      } else if (endpoint.includes('/tasks')) {
        const tasks = await offlineStorage.getOfflineTasks();
        return { success: true, data: tasks, offline: true };
      } else if (endpoint.includes('/task-photos')) {
        const photos = await offlineStorage.getOfflineTaskPhotos();
        return { success: true, data: photos, offline: true };
      } else if (endpoint.includes('/task-rejections')) {
        const rejections = await offlineStorage.getOfflineTaskRejections();
        return { success: true, data: rejections, offline: true };
      } else if (endpoint.includes('/remediation-reports')) {
        // For reports, combine online and offline data
        return await this.getCombinedReportData();
      }
    } catch (error) {
      console.error('❌ Failed to get offline data:', error);
    }

    return { success: false, error: 'No offline data available', offline: true };
  }

  // Get combined report data from both online and offline sources
  private async getCombinedReportData(): Promise<ApiResponse> {
    try {
      // Get offline data
      const offlineTasks = await offlineStorage.getOfflineTasks();
      const offlinePhotos = await offlineStorage.getOfflineTaskPhotos();
      const offlineRejections = await offlineStorage.getOfflineTaskRejections();

      // Create a mock report structure from offline data
      const offlineReport = {
        generatedAt: new Date().toISOString(),
                 summary: {
           totalTasks: offlineTasks.length,
           completedTasks: offlineTasks.filter((t: OfflineTask) => t.status === 'completed').length,
           pendingTasks: offlineTasks.filter((t: OfflineTask) => t.status === 'pending').length,
           inProgressTasks: offlineTasks.filter((t: OfflineTask) => t.status === 'in-progress').length,
           rejectedTasks: offlineTasks.filter((t: OfflineTask) => t.status === 'rejected').length,
           cancelledTasks: offlineTasks.filter((t: OfflineTask) => t.status === 'cancelled').length,
           completionRate: offlineTasks.length > 0 
             ? Math.round((offlineTasks.filter((t: OfflineTask) => t.status === 'completed').length / offlineTasks.length) * 100)
             : 0,
         },
        priorityBreakdown: this.calculatePriorityBreakdown(offlineTasks),
        categoryStats: this.calculateCategoryStats(offlineTasks),
        locationStats: this.calculateLocationStats(offlineTasks),
                 recentActivity: {
           completions: offlineTasks.filter((t: OfflineTask) => t.status === 'completed').length,
           photos: offlinePhotos.length,
           rejections: offlineRejections.length,
         },
        tasks: offlineTasks,
        offline: true,
      };

      return { success: true, data: offlineReport };
    } catch (error) {
      console.error('❌ Failed to create offline report:', error);
      return { success: false, error: 'Failed to create offline report', offline: true };
    }
  }

  // Calculate priority breakdown from offline tasks
  private calculatePriorityBreakdown(tasks: OfflineTask[]): Record<string, Record<string, number>> {
    const breakdown: Record<string, Record<string, number>> = {
      critical: { total: 0, completed: 0, pending: 0, inProgress: 0, rejected: 0 },
      high: { total: 0, completed: 0, pending: 0, inProgress: 0, rejected: 0 },
      medium: { total: 0, completed: 0, pending: 0, inProgress: 0, rejected: 0 },
      low: { total: 0, completed: 0, pending: 0, inProgress: 0, rejected: 0 }
    };

    tasks.forEach(task => {
      const priority = task.priority as string;
      const status = task.status as string;
      
      if (breakdown[priority] && breakdown[priority][status] !== undefined) {
        breakdown[priority].total++;
        breakdown[priority][status]++;
      }
    });

    return breakdown;
  }

  // Calculate category stats from offline tasks
  private calculateCategoryStats(tasks: OfflineTask[]): Array<{ category: string; total: number; completed: number; completionRate: number }> {
    const categoryMap = new Map<string, { total: number; completed: number }>();
    
    tasks.forEach(task => {
      const category = task.category as string;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, completed: 0 });
      }
      const stats = categoryMap.get(category);
      if (stats) {
        stats.total++;
        if (task.status === 'completed') stats.completed++;
      }
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      completed: stats.completed,
      completionRate: Math.round((stats.completed / stats.total) * 100),
    }));
  }

  // Calculate location stats from offline tasks
  private calculateLocationStats(tasks: OfflineTask[]): Array<{ location: string; total: number; completed: number; completionRate: number }> {
    const locationMap = new Map<string, { total: number; completed: number }>();
    
    tasks.forEach(task => {
      const location = task.location as string;
      if (!locationMap.has(location)) {
        locationMap.set(location, { total: 0, completed: 0 });
      }
      const stats = locationMap.get(location);
      if (stats) {
        stats.total++;
        if (task.status === 'completed') stats.completed++;
      }
    });

    return Array.from(locationMap.entries()).map(([location, stats]) => ({
      location,
      total: stats.total,
      completed: stats.completed,
      completionRate: Math.round((stats.completed / stats.total) * 100),
    }));
  }

  // Check if we're currently offline
  isOffline(): boolean {
    return !networkStatus.isConnectionGood();
  }

  // Get network status
  getNetworkStatus(): NetworkStatus {
    return networkStatus.getStatus();
  }

  // Force sync
  async forceSync(): Promise<void> {
    await syncService.forceSync();
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    return await syncService.getSyncStatus();
  }
}

// Create and export the API client instance
export const offlineApiClient = new OfflineApiClient(process.env.REACT_APP_API_URL || 'https://fire-door-backend.azurewebsites.net/api');
export default offlineApiClient;
