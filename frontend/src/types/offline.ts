// Offline Mode Type Definitions

export interface OfflineInspection {
  id: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  offlineId: string;
  lastModified: number;
  [key: string]: any; // Allow additional properties from original inspection
}

export interface OfflineTask {
  id: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  offlineId: string;
  lastModified: number;
  status?: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'cancelled';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  location?: string;
  [key: string]: any; // Allow additional properties from original task
}

export interface OfflineTaskPhoto {
  id: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  offlineId: string;
  lastModified: number;
  imageData?: string; // Base64 encoded image
  [key: string]: any; // Allow additional properties from original photo
}

export interface OfflineTaskRejection {
  id: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  offlineId: string;
  lastModified: number;
  [key: string]: any; // Allow additional properties from original rejection
}

export interface SyncQueueItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'offline';
  pingTime: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingItems: number;
  storageInfo: {
    inspections: number;
    tasks: number;
    taskPhotos: number;
    taskRejections: number;
    syncQueue: number;
  };
}

export interface OfflineReport {
  generatedAt: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    rejectedTasks: number;
    cancelledTasks: number;
    completionRate: number;
  };
  priorityBreakdown: Record<string, Record<string, number>>;
  categoryStats: Array<{
    category: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  locationStats: Array<{
    location: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  recentActivity: {
    completions: number;
    photos: number;
    rejections: number;
  };
  tasks: OfflineTask[];
  offline: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  offline?: boolean;
}
