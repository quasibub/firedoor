import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface PDFUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (inspection: any, tasks: any[]) => void;
}

interface ExtractedData {
  inspection: any;
  tasks: any[];
  summary: {
    totalDoors: number;
    compliantDoors: number;
    nonCompliantDoors: number;
    totalTasks: number;
    criticalTasks: number;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
    byCategory: Record<string, number>;
  };
  extractedText: string;
  totalPages: number;
}

const PDFUploadDialog: React.FC<PDFUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);
    setExtractedData(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await axios.post('http://localhost:5000/api/pdf-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setExtractedData(response.data);
    } catch (err: any) {
      console.error('PDF upload error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.details || 
        'Failed to upload and process PDF'
      );
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  const handleConfirm = () => {
    if (extractedData) {
      onSuccess(extractedData.inspection, extractedData.tasks);
      handleClose();
    }
  };

  const handleClose = () => {
    setExtractedData(null);
    setError(null);
    setUploading(false);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      case 'low':
        return <CheckIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  console.log('PDFUploadDialog render - open:', open);
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Upload Fire Door Inspection PDF
      </DialogTitle>
      <DialogContent>
        {!extractedData && !uploading && (
          <Box>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to select a file
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Only PDF files are supported (max 10MB)
              </Typography>
            </Box>
          </Box>
        )}

        {uploading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Processing PDF...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Extracting inspection data and generating tasks
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {extractedData && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              PDF processed successfully! Found {extractedData.summary.totalTasks} tasks from {extractedData.summary.totalDoors} doors.
            </Alert>

            {/* Enhanced Inspection Summary */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Inspection Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`Location: ${extractedData.inspection.location}`} />
                <Chip label={`Inspector: ${extractedData.inspection.inspector_name}`} />
                <Chip label={`Date: ${extractedData.inspection.date}`} />
                <Chip label={`Total Doors: ${extractedData.summary.totalDoors}`} />
                <Chip 
                  label={`Compliant: ${extractedData.summary.compliantDoors}`} 
                  color="success" 
                />
                <Chip 
                  label={`Non-compliant: ${extractedData.summary.nonCompliantDoors}`} 
                  color="error" 
                />
              </Box>
              
              {/* Task Priority Summary */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Task Priority Breakdown:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {extractedData.summary.criticalTasks > 0 && (
                  <Chip 
                    label={`Critical: ${extractedData.summary.criticalTasks}`} 
                    color="error" 
                    size="small"
                  />
                )}
                {extractedData.summary.highPriorityTasks > 0 && (
                  <Chip 
                    label={`High: ${extractedData.summary.highPriorityTasks}`} 
                    color="warning" 
                    size="small"
                  />
                )}
                {extractedData.summary.mediumPriorityTasks > 0 && (
                  <Chip 
                    label={`Medium: ${extractedData.summary.mediumPriorityTasks}`} 
                    color="info" 
                    size="small"
                  />
                )}
                {extractedData.summary.lowPriorityTasks > 0 && (
                  <Chip 
                    label={`Low: ${extractedData.summary.lowPriorityTasks}`} 
                    color="default" 
                    size="small"
                  />
                )}
              </Box>
              
              {extractedData.inspection.notes && (
                <Typography variant="body2" color="text.secondary">
                  Notes: {extractedData.inspection.notes}
                </Typography>
              )}
            </Paper>

            {/* Tasks Preview */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Generated Tasks ({extractedData.tasks.length})
              </Typography>
              <List dense>
                {extractedData.tasks.map((task, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getPriorityIcon(task.priority)}
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box>
                          <Chip 
                            label={task.priority} 
                            size="small" 
                            color={getPriorityColor(task.priority) as any}
                            sx={{ mr: 1 }}
                          />
                          {task.category && (
                            <Chip 
                              label={task.category} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {task.door_id && (
                            <Chip 
                              label={`Door: ${task.door_id}`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Extracted Text Preview */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Extracted Text Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                maxHeight: 100, 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
              }}>
                {extractedData.extractedText}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pages: {extractedData.totalPages}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {extractedData && (
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color="primary"
            startIcon={<CheckIcon />}
          >
            Create Inspection & Tasks
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PDFUploadDialog; 