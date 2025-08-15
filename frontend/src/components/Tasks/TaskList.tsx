import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Alert, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CompleteIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Task } from '../../types/task';
import { getPriorityChip, getStatusChip } from '../../pages/Tasks/helpers';

interface TaskListProps {
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  error: string | null;
  isWorkman: boolean;
  handleOpenDialog: (task?: Task) => void;
  handleDelete: (id: string) => void;
  handleComplete: (id: string) => void;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  filteredTasks,
  loading,
  error,
  isWorkman,
  handleOpenDialog,
  handleDelete,
  handleComplete,
  setSelectedTask,
  setAnchorEl,
}) => (
  <>
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
      {loading && (
        <Grid item xs={12}>
          <Alert severity="info">Loading tasks...</Alert>
        </Grid>
      )}
      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}
      {!loading && !error && tasks.length === 0 && (
        <Grid item xs={12}>
          <Alert severity="warning">No tasks found. Add a new one!</Alert>
        </Grid>
      )}
      {!loading && !error &&
        filteredTasks.length > 0 &&
        filteredTasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card sx={{ opacity: task.status === 'completed' ? 0.7 : 1 }}>
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
  </>
);

export default TaskList;
