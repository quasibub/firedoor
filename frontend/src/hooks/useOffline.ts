import { useState, useEffect } from 'react';
import networkStatus from '../services/networkStatus';
import syncService from '../services/syncService';
import offlineStorage from '../services/offlineStorage';

// Hook for offline functionality
export const useOffline = () => {
  const [networkState, setNetworkState] = useState(networkStatus.getStatus());
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    pendingItems: 0,
    storageInfo: {
      inspections: 0,
      tasks: 0,
      taskPhotos: 0,
      taskRejections: 0,
      syncQueue: 0,
    },
  });

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribeNetwork = networkStatus.subscribe((status: { isOnline: boolean; quality: string; pingTime: number }) => {
      setNetworkState(status);
    });

    // Update sync state periodically
    const updateSyncState = async () => {
      try {
        const status = await syncService.getSyncStatus();
        setSyncState(status);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    // Initial update
    updateSyncState();

    // Update every 5 seconds
    const interval = setInterval(updateSyncState, 5000);

    return () => {
      unsubscribeNetwork();
      clearInterval(interval);
    };
  }, []);

  // Force sync
  const forceSync = async () => {
    try {
      await syncService.forceSync();
      // Update sync state after sync
      const status = await syncService.getSyncStatus();
      setSyncState(status);
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  // Clear offline data
  const clearOfflineData = async () => {
    try {
      await syncService.clearOfflineData();
      // Update sync state after clearing
      const status = await syncService.getSyncStatus();
      setSyncState(status);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  };

  // Get offline data
  const getOfflineData = {
    inspections: () => offlineStorage.getOfflineInspections(),
    tasks: () => offlineStorage.getOfflineTasks(),
    taskPhotos: () => offlineStorage.getOfflineTaskPhotos(),
    taskRejections: () => offlineStorage.getOfflineTaskRejections(),
  };

  // Check if currently offline
  const isOffline = !networkState.isOnline;

  // Check if connection is good
  const isConnectionGood = networkStatus.isConnectionGood();

  // Check if connection is excellent
  const isConnectionExcellent = networkStatus.isConnectionExcellent();

  return {
    // Network status
    networkState,
    isOffline,
    isConnectionGood,
    isConnectionExcellent,
    
    // Sync status
    syncState,
    
    // Actions
    forceSync,
    clearOfflineData,
    getOfflineData,
    
    // Utilities
    getNetworkStatus: () => networkStatus.getStatus(),
    forceNetworkCheck: () => networkStatus.forceCheck(),
  };
};

export default useOffline;
