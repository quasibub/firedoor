import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  LinearProgress,
  Collapse,
  Alert,
  Button,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Sync as SyncIcon,
  Storage as StorageIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import useOffline from '../../hooks/useOffline';

const OfflineStatus: React.FC = () => {
  const {
    networkState,
    syncState,
    isOffline,
    forceSync,
    clearOfflineData,
  } = useOffline();

  const [expanded, setExpanded] = React.useState(false);

  const getNetworkIcon = () => {
    if (isOffline) return <WifiOffIcon />;
    
    switch (networkState.quality) {
      case 'excellent':
        return <WifiIcon color="success" />;
      case 'good':
        return <WifiIcon color="warning" />;
      case 'poor':
        return <WifiIcon color="error" />;
      default:
        return <WifiIcon />;
    }
  };

  const getNetworkColor = () => {
    if (isOffline) return 'error';
    
    switch (networkState.quality) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getNetworkText = () => {
    if (isOffline) return 'Offline';
    
    switch (networkState.quality) {
      case 'excellent':
        return `Excellent (${networkState.pingTime}ms)`;
      case 'good':
        return `Good (${networkState.pingTime}ms)`;
      case 'poor':
        return `Poor (${networkState.pingTime}ms)`;
      default:
        return 'Unknown';
    }
  };

  const getTotalOfflineItems = () => {
    return (
      syncState.storageInfo.inspections +
      syncState.storageInfo.tasks +
      syncState.storageInfo.taskPhotos +
      syncState.storageInfo.taskRejections
    );
  };

  const hasOfflineData = getTotalOfflineItems() > 0 || syncState.pendingItems > 0;

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
      {/* Main Status Chip */}
      <Chip
        icon={getNetworkIcon()}
        label={getNetworkText()}
        color={getNetworkColor()}
        variant={isOffline ? 'filled' : 'outlined'}
        onClick={() => setExpanded(!expanded)}
        sx={{ mb: 1, cursor: 'pointer' }}
      />

      {/* Expandable Details */}
      <Collapse in={expanded}>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 1,
            p: 2,
            boxShadow: 3,
            minWidth: 300,
            maxWidth: 400,
          }}
        >
          {/* Network Status */}
          <Typography variant="subtitle2" gutterBottom>
            Network Status
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Quality: {networkState.quality}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ping: {networkState.pingTime}ms
            </Typography>
          </Box>

          {/* Sync Status */}
          <Typography variant="subtitle2" gutterBottom>
            Sync Status
          </Typography>
          <Box sx={{ mb: 2 }}>
            {syncState.isSyncing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SyncIcon sx={{ mr: 1, animation: 'spin 1s linear infinite' }} />
                <Typography variant="body2">Syncing...</Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {syncState.pendingItems > 0 ? `${syncState.pendingItems} items pending` : 'All synced'}
              </Typography>
            )}
          </Box>

          {/* Offline Data Summary */}
          {hasOfflineData && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Offline Data
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Inspections:</Typography>
                  <Typography variant="body2">{syncState.storageInfo.inspections}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tasks:</Typography>
                  <Typography variant="body2">{syncState.storageInfo.tasks}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Photos:</Typography>
                  <Typography variant="body2">{syncState.storageInfo.taskPhotos}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Rejections:</Typography>
                  <Typography variant="body2">{syncState.storageInfo.taskRejections}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Sync Queue:</Typography>
                  <Typography variant="body2">{syncState.storageInfo.syncQueue}</Typography>
                </Box>
              </Box>
            </>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {hasOfflineData && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={forceSync}
                  disabled={syncState.isSyncing || isOffline}
                >
                  Sync Now
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<ClearIcon />}
                  onClick={clearOfflineData}
                  disabled={syncState.isSyncing}
                >
                  Clear Data
                </Button>
              </>
            )}
          </Box>

          {/* Offline Warning */}
          {isOffline && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You're currently offline. Data will be synced when connection is restored.
            </Alert>
          )}

          {/* Sync Progress */}
          {syncState.isSyncing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Syncing data...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default OfflineStatus;
