import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as ViewOffIcon,
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'inspector' | 'workman';
  created_at: string;
  updated_at: string;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: User['role'];
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'workman',
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users');
      const data = response.data;
      if (data.success) {
        setUsers(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'workman',
      });
    }
    setShowPassword(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSubmit = async () => {
    try {
      const submitData = { ...formData };
      if (!submitData.password) {
        delete submitData.password;
      }

      if (editingUser) {
        // Update existing user
        await apiClient.put(`/users/${editingUser.id}`, submitData);
      } else {
        // Create new user
        await apiClient.post('/users', submitData);
      }
      fetchUsers(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await apiClient.delete(`/users/${id}`);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getRoleChip = (role: string) => {
    switch (role) {
      case 'admin':
        return <Chip label="Admin" color="error" size="small" />;
      case 'inspector':
        return <Chip label="Inspector" color="warning" size="small" />;
      case 'workman':
        return <Chip label="Workman" color="info" size="small" />;
      default:
        return <Chip label={role} color="default" size="small" />;
    }
  };

  const getRoleStats = () => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const inspectors = users.filter(u => u.role === 'inspector').length;
    const workmen = users.filter(u => u.role === 'workman').length;

    return { total, admins, inspectors, workmen };
  };

  const stats = getRoleStats();

  if (!isAdmin) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Alert severity="error">
          Access denied. Only administrators can manage users.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return <Typography>Loading users...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New User
        </Button>
      </Box>

      {/* User Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {stats.admins}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrators
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {stats.inspectors}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inspectors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {stats.workmen}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workmen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {user.name}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleChip(user.role)}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(user.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(user.id)}
                    disabled={user.id === currentUser?.id}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'New User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required={!editingUser}
            />
            <IconButton
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
              sx={{ mt: 1 }}
            >
              {showPassword ? <ViewOffIcon /> : <ViewIcon />}
            </IconButton>
          </Box>
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="inspector">Inspector</MenuItem>
              <MenuItem value="workman">Workman</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 