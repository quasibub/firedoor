import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { TaskFilters as Filters } from '../../types/task';

interface TaskFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  uniqueDoorIds: string[];
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, setFilters, uniqueDoorIds }) => (
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
              onChange={(e) => setFilters({ ...filters, status: e.target.value as Filters['status'] })}
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
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as Filters['priority'] })}
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
);

export default TaskFilters;
