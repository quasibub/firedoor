import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useHome } from '../../contexts/HomeContext';

interface Home {
  id: string;
  name: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

const Homes: React.FC = () => {
  const { user } = useAuth();
  const { homes, loading, error, refreshHomes } = useHome();
  const isAdmin = user?.role === 'admin';
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHome, setEditingHome] = useState<Home | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenDialog = (home?: Home) => {
    if (home) {
      setEditingHome(home);
      setFormData({
        name: home.name,
        address: home.address || '',
        contact_person: home.contact_person || '',
        contact_email: home.contact_email || '',
        contact_phone: home.contact_phone || '',
      });
    } else {
      setEditingHome(null);
      setFormData({
        name: '',
        address: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
      });
    }
    setFormError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHome(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    try {
      setFormError(null);
      
      if (!formData.name.trim()) {
        setFormError('Home name is required');
        return;
      }

      const url = editingHome 
        ? `http://localhost:5000/api/homes/${editingHome.id}`
        : 'http://localhost:5000/api/homes';
      
      const method = editingHome ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save home');
      }

      await refreshHomes();
      handleCloseDialog();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this home? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/homes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete home');
      }

      await refreshHomes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Care Homes Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Home
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {homes.map((home) => (
          <Grid item xs={12} md={6} lg={4} key={home.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6" component="h2">
                      {home.name}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(home)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(home.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {home.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {home.address}
                    </Typography>
                  </Box>
                )}

                {home.contact_person && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Contact: {home.contact_person}
                    </Typography>
                  </Box>
                )}

                {home.contact_email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {home.contact_email}
                    </Typography>
                  </Box>
                )}

                {home.contact_phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {home.contact_phone}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`Created: ${new Date(home.created_at).toLocaleDateString()}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingHome ? 'Edit Home' : 'Add New Home'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Home Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            
            <TextField
              fullWidth
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingHome ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Homes; 