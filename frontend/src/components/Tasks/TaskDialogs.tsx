import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  Typography,
  Box,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Task, TaskFormData } from '../../types/task';
import { getPriorityChip, getStatusChip } from '../../pages/Tasks/helpers';

interface TaskDialogsProps {
  openDialog: boolean;
  editingTask: Task | null;
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  handleCloseDialog: () => void;
  handleSubmit: () => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  selectedTask: Task | null;
  handleTaskAction: (task: Task, action: string) => void;
  photoDialogOpen: boolean;
  setPhotoDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handlePhotoUpload: () => Promise<void>;
  photoFile: File | null;
  setPhotoFile: React.Dispatch<React.SetStateAction<File | null>>;
  photoDescription: string;
  setPhotoDescription: React.Dispatch<React.SetStateAction<string>>;
  rejectionDialogOpen: boolean;
  setRejectionDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleRejectTask: () => Promise<void>;
  rejectionReason: string;
  setRejectionReason: React.Dispatch<React.SetStateAction<string>>;
  alternativeSuggestion: string;
  setAlternativeSuggestion: React.Dispatch<React.SetStateAction<string>>;
  taskDetailDialogOpen: boolean;
  setTaskDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TaskDialogs: React.FC<TaskDialogsProps> = ({
  openDialog,
  editingTask,
  formData,
  setFormData,
  handleCloseDialog,
  handleSubmit,
  anchorEl,
  setAnchorEl,
  selectedTask,
  handleTaskAction,
  photoDialogOpen,
  setPhotoDialogOpen,
  handlePhotoUpload,
  photoFile,
  setPhotoFile,
  photoDescription,
  setPhotoDescription,
  rejectionDialogOpen,
  setRejectionDialogOpen,
  handleRejectTask,
  rejectionReason,
  setRejectionReason,
  alternativeSuggestion,
  setAlternativeSuggestion,
  taskDetailDialogOpen,
  setTaskDetailDialogOpen,
}) => (
  <>
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
          sx={{ mt: 2 }}
        />
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
          sx={{ mt: 2 }}
        />
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
          <>
            <Typography variant="h6" gutterBottom>
              {selectedTask.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {selectedTask.description}
            </Typography>
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
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTaskDetailDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>
);

export default TaskDialogs;
