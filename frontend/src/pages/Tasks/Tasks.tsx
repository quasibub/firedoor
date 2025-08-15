import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, LinearProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useHome } from '../../contexts/HomeContext';
import TaskFilters from '../../components/Tasks/TaskFilters';
import TaskList from '../../components/Tasks/TaskList';
import TaskDialogs from '../../components/Tasks/TaskDialogs';
import {
  Task,
  TaskFormData,
  TaskFilters as Filters,
  ApiResponse,
  RejectionPayload,
} from '../../types/task';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const { selectedHome } = useHome();
  const isWorkman = user?.role === 'workman';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [alternativeSuggestion, setAlternativeSuggestion] = useState('');

  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedTo: 'all',
    doorId: 'all',
    search: '',
  });

  const [formData, setFormData] = useState<TaskFormData>({
    inspection_id: '',
    door_id: '',
    location: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    notes: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      if (!selectedHome) {
        setTasks([]);
        return;
      }
      const response = await fetch(`http://localhost:5000/api/tasks?limit=2000&home_id=${selectedHome.id}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data: ApiResponse<Task[]> = await response.json();
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
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedHome]);

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
        const response = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to update task');
      } else {
        const response = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to create task');
      }
      fetchTasks();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');
      fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to complete task');
      fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

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
    const fd = new FormData();
    fd.append('photo', photoFile);
    fd.append('photoType', 'completion');
    fd.append('description', photoDescription);
    try {
      const response = await fetch(`http://localhost:5000/api/task-photos/${selectedTask.id}`, {
        method: 'POST',
        body: fd,
      });
      if (!response.ok) throw new Error('Failed to upload photo');
      setPhotoDialogOpen(false);
      setPhotoFile(null);
      setPhotoDescription('');
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
    }
  };

  const handleRejectTask = async () => {
    if (!selectedTask || !rejectionReason.trim()) return;
    try {
      const payload: RejectionPayload = {
        rejection_reason: rejectionReason,
        alternative_suggestion: alternativeSuggestion,
      };
      const response = await fetch(`http://localhost:5000/api/task-rejections/${selectedTask.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to reject task');
      setRejectionDialogOpen(false);
      setRejectionReason('');
      setAlternativeSuggestion('');
      fetchTasks();
    } catch (err) {
      console.error('Error rejecting task:', err);
      setError('Failed to reject task');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.category !== 'all' && task.category !== filters.category) return false;
    if (filters.assignedTo !== 'all' && task.assigned_to !== filters.assignedTo) return false;
    if (filters.doorId !== 'all' && task.door_id !== filters.doorId) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${task.title} ${task.description} ${task.location} ${task.door_id} ${task.assigned_to}`.toLowerCase();
      if (!searchableText.includes(searchLower)) return false;
    }
    return true;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    return { total, completed, pending, inProgress };
  };

  const stats = getTaskStats();
  const uniqueDoorIds = Array.from(new Set(tasks.map((task) => task.door_id))).sort();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{isWorkman ? 'My Tasks' : 'Tasks'}</Typography>
        {!isWorkman && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
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

      <TaskFilters filters={filters} setFilters={setFilters} uniqueDoorIds={uniqueDoorIds} />
      <TaskList
        tasks={tasks}
        filteredTasks={filteredTasks}
        loading={loading}
        error={error}
        isWorkman={isWorkman}
        handleOpenDialog={handleOpenDialog}
        handleDelete={handleDelete}
        handleComplete={handleComplete}
        setSelectedTask={setSelectedTask}
        setAnchorEl={setAnchorEl}
      />
      <TaskDialogs
        openDialog={openDialog}
        editingTask={editingTask}
        formData={formData}
        setFormData={setFormData}
        handleCloseDialog={handleCloseDialog}
        handleSubmit={handleSubmit}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        selectedTask={selectedTask}
        handleTaskAction={handleTaskAction}
        photoDialogOpen={photoDialogOpen}
        setPhotoDialogOpen={setPhotoDialogOpen}
        handlePhotoUpload={handlePhotoUpload}
        photoFile={photoFile}
        setPhotoFile={setPhotoFile}
        photoDescription={photoDescription}
        setPhotoDescription={setPhotoDescription}
        rejectionDialogOpen={rejectionDialogOpen}
        setRejectionDialogOpen={setRejectionDialogOpen}
        handleRejectTask={handleRejectTask}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        alternativeSuggestion={alternativeSuggestion}
        setAlternativeSuggestion={setAlternativeSuggestion}
        taskDetailDialogOpen={taskDetailDialogOpen}
        setTaskDetailDialogOpen={setTaskDetailDialogOpen}
      />
    </Box>
  );
};

export default Tasks;
