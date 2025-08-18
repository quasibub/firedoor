import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  MoreVert as MoreVertIcon,
  PhotoCamera as PhotoCameraIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useHome } from '../../contexts/HomeContext';
import API_ENDPOINTS from '../../config/api';
import axios from 'axios';

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

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const { selectedHome } = useHome();
  const isWorkman = user?.role === 'workman';
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Workmen-specific states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [alternativeSuggestion, setAlternativeSuggestion] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'pending' | 'in-progress' | 'completed' | 'rejected' | 'cancelled',
    priority: 'all' as 'all' | 'low' | 'medium' | 'high' | 'critical',
    category: 'all' as string,
    assignedTo: 'all' as string,
    doorId: 'all' as string,
    search: '',
  });
  
  const [formData, setFormData] = useState({
    inspection_id: '',
    door_id: '',
    location: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assigned_to: '',
    notes: '',
  });

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedHome) {
        setTasks([]);
        return;
      }
      
      // Request a larger limit to get more tasks (or all tasks)
      const response = await fetch(`${API_ENDPOINTS.TASKS}?limit=2000&home_id=${selectedHome.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedHome]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        inspection_id: task.inspection_id,
        door_id: task.door_id,
        location: task.location,
        description: task.description,
        priority: task.priority,
        assigned_to: task.assigned_to,
        notes: task.notes,
      });
    } else {
      setEditingTask(null);
      setFormData({
        inspection_id: '',
        door_id: '',
        location: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTask) {
        // Update existing task
        const response = await fetch(API_ENDPOINTS.TASK_BY_ID(editingTask.id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Failed to update task');
        }
      } else {
        // Create new task
        const response = await fetch(API_ENDPOINTS.TASKS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Failed to create task');
        }
      }
      fetchTasks(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.TASK_BY_ID(id), {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      fetchTasks(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.TASK_BY_ID(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          completed_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to complete task');
      }
      fetchTasks(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Workmen-specific functions
  const handleTaskAction = (task: Task, action: string) => {
    setSelectedTask(task);
    setAnchorEl(null);
    
    switch (action) {
      case 'view':
        setTaskDetailDialogOpen(true);
        break;
      case 'photo':
        setPhotoDialogOpen(true);
        break;
      case 'reject':
        setRejectionDialogOpen(true);
        break;
      case 'complete':
        handleComplete(task.id);
        break;
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedTask) return;

    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('photoType', 'completion');
    formData.append('description', photoDescription);

    try {
      await axios.post(API_ENDPOINTS.TASK_PHOTOS_BY_ID(selectedTask.id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPhotoDialogOpen(false);
      setPhotoFile(null);
      setPhotoDescription('');
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    }
  };

  const handleRejectTask = async () => {
    if (!selectedTask || !rejectionReason.trim()) return;

    try {
      await axios.post(API_ENDPOINTS.TASK_REJECTIONS_BY_ID(selectedTask.id), {
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

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Chip label="Critical" color="error" size="small" />;
      case 'high':
        return <Chip label="High" color="warning" size="small" />;
      case 'medium':
        return <Chip label="Medium" color="info" size="small" />;
      default:
        return <Chip label="Low" color="default" size="small" />;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'in-progress':
        return <Chip label="In Progress" color="warning" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="error" size="small" />;
      default:
        return <Chip label="Pending" color="default" size="small" />;
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    
    // Priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    
    // Category filter
    if (filters.category !== 'all' && task.category !== filters.category) return false;
    
    // Assigned to filter
    if (filters.assignedTo !== 'all' && task.assigned_to !== filters.assignedTo) return false;
    
    // Door ID filter
    if (filters.doorId !== 'all' && task.door_id !== filters.doorId) return false;
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${task.title} ${task.description} ${task.location} ${task.door_id} ${task.assigned_to}`.toLowerCase();
      if (!searchableText.includes(searchLower)) return false;
    }
    
    return true;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;

    return { total, completed, pending, inProgress };
  };

  const stats = getTaskStats();

  // Get unique door IDs for the filter dropdown
  const uniqueDoorIds = Array.from(new Set(tasks.map(task => task.door_id))).sort();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isWorkman ? 'My Tasks' : 'Tasks'}
        </Typography>
        {!isWorkman && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Task
          </Button>
        )}
      </Box>

      {/* Task Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {stats.pending + stats.inProgress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {filteredTasks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filtered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(stats.completed / stats.total) * 100}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {Math.round((stats.completed / stats.total) * 100)}% Complete
          </Typography>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search tasks..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => setFilters({
                  status: 'all',
                  priority: 'all',
                  category: 'all',
                  assignedTo: 'all',
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

      {/* Task List */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Task List ({filteredTasks.length} of {tasks.length} tasks)
        </Typography>
        {tasks.length >= 1000 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing first 1000 tasks. Use filters to find specific tasks.
          </Alert>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {loading && <Grid item xs={12}><Alert severity="info">Loading tasks...</Alert></Grid>}
        {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
        {!loading && !error && tasks.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="warning">No tasks found. Add a new one!</Alert>
          </Grid>
        )}
        {!loading && !error && filteredTasks.length > 0 && filteredTasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card sx={{ 
              opacity: task.status === 'completed' ? 0.7 : 1,
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {task.door_id}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {getPriorityChip(task.priority)}
                    {getStatusChip(task.status)}
                  </Box>
                </Box>

                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {task.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Location: {task.location}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Assigned to: {task.assigned_to}
                </Typography>
                {task.completed_at && (
                  <Typography variant="body2" color="success.main" gutterBottom>
                    Completed: {new Date(task.completed_at).toLocaleDateString()}
                  </Typography>
                )}

                {task.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Notes: {task.notes}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  {isWorkman ? (
                    // Workmen actions - menu-based
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setSelectedTask(task);
                        setAnchorEl(e.currentTarget);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  ) : (
                    // Admin/Inspector actions - direct buttons
                    <>
                      {task.status !== 'completed' && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleComplete(task.id)}
                        >
                          <CompleteIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(task)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(task.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'New Task'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Inspection ID"
            value={formData.inspection_id}
            onChange={(e) => setFormData({ ...formData, inspection_id: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Door ID"
            value={formData.door_id}
            onChange={(e) => setFormData({ ...formData, door_id: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            required
            multiline
            rows={2}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              value={formData.priority}
              label="Priority"
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Assigned To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workmen Task Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleTaskAction(selectedTask!, 'view')}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleTaskAction(selectedTask!, 'photo')}>
          <PhotoCameraIcon sx={{ mr: 1 }} />
          Upload Photo
        </MenuItem>
        {selectedTask?.status === 'pending' && (
          <>
            <MenuItem onClick={() => handleTaskAction(selectedTask!, 'complete')}>
              <CompleteIcon sx={{ mr: 1 }} />
              Mark Complete
            </MenuItem>
            <MenuItem onClick={() => handleTaskAction(selectedTask!, 'reject')}>
              <CancelIcon sx={{ mr: 1 }} />
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
              startIcon={<PhotoCameraIcon />}
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
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedTask.title}</Typography>
              <Typography variant="body1" paragraph>{selectedTask.description}</Typography>
              
              <Box display="flex" gap={1} mb={2}>
                {getPriorityChip(selectedTask.priority)}
                {getStatusChip(selectedTask.status)}
              </Box>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Location: {selectedTask.location} • Door: {selectedTask.door_id}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Assigned to: {selectedTask.assigned_to}
              </Typography>
              
              {selectedTask.notes && (
                <Typography variant="body2" paragraph>
                  <strong>Notes:</strong> {selectedTask.notes}
                </Typography>
              )}
              
              {selectedTask.completed_at && (
                <Typography variant="body2" color="success.main" gutterBottom>
                  Completed: {new Date(selectedTask.completed_at).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  };
  
export default Tasks; 