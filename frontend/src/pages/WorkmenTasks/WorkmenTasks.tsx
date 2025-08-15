import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Avatar,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  CameraAlt,
  CheckCircle,
  Cancel,
  MoreVert,
  PhotoCamera,
  Upload,
  Close,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import apiClient from '../../api/client';
import { SelectChangeEvent } from '@mui/material/Select';
import type { ChipProps } from '@mui/material';

interface Task {
  id: string;
  inspection_id: string;
  door_id: string;
  location: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'cancelled';
  assigned_to: string;
  completed_at: string | null;
  notes: string;
  category: string;
}

interface TaskPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  description: string;
  uploaded_at: string;
  uploaded_by_name: string;
}

interface TaskRejection {
  id: string;
  rejection_reason: string;
  alternative_suggestion?: string;
  rejected_at: string;
  rejected_by_name: string;
}

const WorkmenTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskPhotos, setTaskPhotos] = useState<TaskPhoto[]>([]);
  const [taskRejection, setTaskRejection] = useState<TaskRejection | null>(null);
  
  // Dialog states
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false);
  
  // Form states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [alternativeSuggestion, setAlternativeSuggestion] = useState('');
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskForMenu, setSelectedTaskForMenu] = useState<Task | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'pending' | 'in-progress' | 'completed' | 'rejected' | 'cancelled',
    priority: 'all' as 'all' | 'low' | 'medium' | 'high' | 'critical',
    doorId: 'all' as string,
    search: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/tasks?assigned_to=current_user');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskPhotos = async (taskId: string) => {
    try {
      const response = await apiClient.get(`/task-photos/${taskId}`);
      setTaskPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const fetchTaskRejection = async (taskId: string) => {
    try {
      const response = await apiClient.get(`/task-rejections/${taskId}`);
      setTaskRejection(response.data.rejection);
    } catch (error) {
      // Task might not be rejected, so this is expected
      setTaskRejection(null);
    }
  };

  const handleTaskAction = (task: Task, action: string) => {
    setSelectedTask(task);
    setAnchorEl(null);
    
    switch (action) {
      case 'view':
        fetchTaskPhotos(task.id);
        fetchTaskRejection(task.id);
        setTaskDetailDialogOpen(true);
        break;
      case 'photo':
        setPhotoDialogOpen(true);
        break;
      case 'reject':
        setRejectionDialogOpen(true);
        break;
      case 'complete':
        handleCompleteTask(task.id);
        break;
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Failed to complete task');
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedTask) return;

    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('photoType', 'completion');
    formData.append('description', photoDescription);

    try {
      await apiClient.post(`/task-photos/${selectedTask.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPhotoDialogOpen(false);
      setPhotoFile(null);
      setPhotoDescription('');
      fetchTaskPhotos(selectedTask.id);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    }
  };

  const handleRejectTask = async () => {
    if (!selectedTask || !rejectionReason.trim()) return;

    try {
      await apiClient.post(`/task-rejections/${selectedTask.id}`, {
        rejection_reason: rejectionReason,
        alternative_suggestion: alternativeSuggestion
      });
      
      setRejectionDialogOpen(false);
      setRejectionReason('');
      setAlternativeSuggestion('');
      fetchTasks();
    } catch (error) {
      console.error('Error rejecting task:', error);
      setError('Failed to reject task');
    }
  };

  const getPriorityColor = (priority: string): ChipProps['color'] => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string): ChipProps['color'] => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'warning';
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    
    // Priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    
    // Door ID filter
    if (filters.doorId !== 'all' && task.door_id !== filters.doorId) return false;
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${task.title} ${task.description} ${task.location} ${task.door_id}`.toLowerCase();
      if (!searchableText.includes(searchLower)) return false;
    }
    
    return true;
  });

  // Get unique door IDs for the filter dropdown
  const uniqueDoorIds = Array.from(new Set(tasks.map(task => task.door_id))).sort();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>
      
      {/* Filters */}
      {tasks.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e: SelectChangeEvent<'all' | Task['status']>) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={(e: SelectChangeEvent<'all' | Task['priority']>) =>
                      setFilters({ ...filters, priority: e.target.value })
                    }
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Door ID</InputLabel>
                  <Select
                    value={filters.doorId}
                    label="Door ID"
                    onChange={(e) => setFilters({ ...filters, doorId: e.target.value })}
                  >
                    <MenuItem value="all">All Doors</MenuItem>
                    {uniqueDoorIds.map((doorId) => (
                      <MenuItem key={doorId} value={doorId}>
                        {doorId}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search tasks..."
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFilters({
                    status: 'all',
                    priority: 'all',
                    doorId: 'all',
                    search: '',
                  })}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {tasks.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" align="center">
              No tasks assigned
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              You will see your assigned tasks here
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Task List ({filteredTasks.length} of {tasks.length} tasks)
          </Typography>
          <List>
            {filteredTasks.map((task) => (
            <React.Fragment key={task.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{task.title}</Typography>
                      <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                      <Chip
                        label={task.status}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {task.location} • {task.door_id}
                      </Typography>
                      <Typography variant="body2">
                        {task.description}
                      </Typography>
                      {task.completed_at && (
                        <Typography variant="body2" color="success.main">
                          Completed: {new Date(task.completed_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      setSelectedTaskForMenu(task);
                      setAnchorEl(e.currentTarget);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
        </Box>
      )}

      {/* Task Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleTaskAction(selectedTaskForMenu!, 'view')}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleTaskAction(selectedTaskForMenu!, 'photo')}>
          <PhotoCamera sx={{ mr: 1 }} />
          Upload Photo
        </MenuItem>
        {selectedTaskForMenu?.status === 'pending' && (
          <>
            <MenuItem onClick={() => handleTaskAction(selectedTaskForMenu!, 'complete')}>
              <CheckCircle sx={{ mr: 1 }} />
              Mark Complete
            </MenuItem>
            <MenuItem onClick={() => handleTaskAction(selectedTaskForMenu!, 'reject')}>
              <Cancel sx={{ mr: 1 }} />
              Reject Task
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Photo</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CameraAlt />}
              fullWidth
            >
              {photoFile ? photoFile.name : 'Select Photo'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </Button>
            <TextField
              fullWidth
              label="Description"
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePhotoUpload} 
            variant="contained" 
            disabled={!photoFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onClose={() => setRejectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Task</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              fullWidth
              label="Rejection Reason *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Alternative Suggestion (Optional)"
              value={alternativeSuggestion}
              onChange={(e) => setAlternativeSuggestion(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectTask} 
            variant="contained" 
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Reject Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={taskDetailDialogOpen} onClose={() => setTaskDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Task Details
          <IconButton
            onClick={() => setTaskDetailDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedTask.title}</Typography>
              <Typography variant="body1" paragraph>{selectedTask.description}</Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <Chip label={selectedTask.priority} color={getPriorityColor(selectedTask.priority)} />
                <Chip label={selectedTask.status} color={getStatusColor(selectedTask.status)} />
              </Box>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Location: {selectedTask.location} • Door: {selectedTask.door_id}
              </Typography>
              
              {taskRejection && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Rejected by {taskRejection.rejected_by_name}</Typography>
                  <Typography variant="body2">{taskRejection.rejection_reason}</Typography>
                  {taskRejection.alternative_suggestion && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Suggestion:</strong> {taskRejection.alternative_suggestion}
                    </Typography>
                  )}
                </Alert>
              )}
              
              {taskPhotos.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>Photos</Typography>
                  <Grid container spacing={2}>
                    {taskPhotos.map((photo) => (
                      <Grid item xs={6} sm={4} key={photo.id}>
                        <Card>
                          <img 
                            src={`http://localhost:5000${photo.photo_url}`} 
                            alt={photo.description}
                            style={{ width: '100%', height: 150, objectFit: 'cover' }}
                          />
                          <CardContent>
                            <Typography variant="caption" color="textSecondary">
                              {photo.uploaded_by_name} • {new Date(photo.uploaded_at).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WorkmenTasks;