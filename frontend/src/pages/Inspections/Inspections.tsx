import React, { useState, useEffect, useCallback } from 'react';
import PDFUploadDialog from '../../components/PDFUploadDialog/PDFUploadDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useHome } from '../../contexts/HomeContext';
import API_ENDPOINTS from '../../config/api';
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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

console.log('PDFUploadDialog imported successfully');

interface Inspection {
  id: string;
  location: string;
  inspector_name: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
  total_doors: number;
  compliant_doors: number;
  non_compliant_doors: number;
  critical_issues: number;
  notes: string;
}

const Inspections: React.FC = () => {
  const { user } = useAuth();
  const { selectedHome } = useHome();
  const isWorkman = user?.role === 'workman';
  
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPDFDialog, setOpenPDFDialog] = useState(false);
  
  // Debug logging for PDF dialog state
  console.log('Inspections component - openPDFDialog state:', openPDFDialog);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [formData, setFormData] = useState({
    location: '',
    total_doors: '',
    notes: '',
  });

  // Fetch inspections from API
  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedHome) {
        setInspections([]);
        return;
      }
      
      // Request a larger limit to get more inspections
      const response = await fetch(`${API_ENDPOINTS.INSPECTIONS}?limit=100&home_id=${selectedHome.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inspections');
      }
      const data = await response.json();
      if (data.success) {
        setInspections(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inspections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedHome]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleOpenDialog = (inspection?: Inspection) => {
    if (inspection) {
      setEditingInspection(inspection);
      setFormData({
        location: inspection.location,
        total_doors: inspection.total_doors.toString(),
        notes: inspection.notes,
      });
    } else {
      setEditingInspection(null);
      setFormData({
        location: '',
        total_doors: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInspection(null);
  };

  const handleSubmit = async () => {
    try {
              if (editingInspection) {
          // Update existing inspection - ONLY send allowed fields
          const response = await fetch(API_ENDPOINTS.INSPECTION_BY_ID(editingInspection.id), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // Only send the fields that can actually be updated
              notes: formData.notes,
              // Remove location and totalDoors - these shouldn't be updated in inspections
            }),
          });
        if (!response.ok) {
          throw new Error('Failed to update inspection');
        }
      } else {
        // Create new inspection
        const response = await fetch(API_ENDPOINTS.INSPECTIONS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: formData.location,
            totalDoors: parseInt(formData.total_doors),
            notes: formData.notes,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to create inspection');
        }
      }
      fetchInspections(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.INSPECTION_BY_ID(id), {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete inspection');
      }
      fetchInspections(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handlePDFUploadSuccess = (inspection: Inspection, tasks: any[]) => {
    // Refresh the inspections list to show the new inspection
    fetchInspections();
    setOpenPDFDialog(false);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'in-progress':
        return <Chip label="In Progress" color="warning" size="small" />;
      default:
        return <Chip label="Pending" color="default" size="small" />;
    }
  };

  const getComplianceRate = (inspection: Inspection) => {
    return Math.round((inspection.compliant_doors / inspection.total_doors) * 100);
  };

  if (loading) {
    return <Typography>Loading inspections...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (inspections.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="h6" gutterBottom>
          {isWorkman ? 'No inspections found.' : 'No inspections found. Add a new one!'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
          {!isWorkman && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => {
                console.log('Upload PDF button clicked (empty state)');
                console.log('Setting openPDFDialog to true');
                setOpenPDFDialog(true);
              }}
            >
              Upload PDF
            </Button>
          )}
          {!isWorkman && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              New Inspection
            </Button>
          )}
        </Box>
        
        {/* PDF Upload Dialog - also render in empty state */}
        <PDFUploadDialog
          open={openPDFDialog}
          onClose={() => setOpenPDFDialog(false)}
          onSuccess={handlePDFUploadSuccess}
        />
      </Box>
    );
  }

  console.log('About to render PDFUploadDialog with open:', openPDFDialog);
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isWorkman ? 'Inspection Reports' : 'Inspections'}
        </Typography>
        {!isWorkman && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => {
                console.log('Upload PDF button clicked (normal state)');
                setOpenPDFDialog(true);
              }}
            >
              Upload PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              New Inspection
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {inspections.map((inspection) => (
          <Grid item xs={12} md={6} lg={4} key={inspection.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {inspection.location}
                  </Typography>
                  {getStatusChip(inspection.status)}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Inspector: {inspection.inspector_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {new Date(inspection.date).toLocaleDateString()}
                </Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Doors: {inspection.total_doors} total
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Compliant: {inspection.compliant_doors}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    Non-compliant: {inspection.non_compliant_doors}
                  </Typography>
                  {inspection.critical_issues > 0 && (
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      Critical issues: {inspection.critical_issues}
                    </Typography>
                  )}
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    Compliance rate: {getComplianceRate(inspection)}%
                  </Typography>
                </Box>

                {inspection.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Notes: {inspection.notes}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <IconButton size="small" color="primary">
                    <ViewIcon />
                  </IconButton>
                  {!isWorkman && (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(inspection)}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {!isWorkman && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(inspection.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingInspection ? 'Edit Inspection' : 'New Inspection'}
        </DialogTitle>
        <DialogContent>
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
            label="Total Doors"
            type="number"
            value={formData.total_doors}
            onChange={(e) => setFormData({ ...formData, total_doors: e.target.value })}
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
            {editingInspection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Upload Dialog */}
      <PDFUploadDialog
        open={openPDFDialog}
        onClose={() => setOpenPDFDialog(false)}
        onSuccess={handlePDFUploadSuccess}
      />
    </Box>
  );
};

export default Inspections; 