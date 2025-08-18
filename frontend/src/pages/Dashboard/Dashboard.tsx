import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Assessment,
  Task as TaskIcon,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useHome } from '../../contexts/HomeContext';

interface Inspection {
  id: string;
  location: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
  critical_issues: number;
}

interface Task {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
}

const Dashboard: React.FC = () => {
  const { selectedHome } = useHome();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (!selectedHome) {
          setInspections([]);
          setTasks([]);
          return;
        }
        
        // Fetch inspections for selected home
        const inspectionsResponse = await fetch(`http://localhost:5000/api/inspections?limit=100&home_id=${selectedHome.id}`);
        if (!inspectionsResponse.ok) {
          throw new Error('Failed to fetch inspections');
        }
        const inspectionsData = await inspectionsResponse.json();
        
        // Fetch tasks for selected home
        const tasksResponse = await fetch(`http://localhost:5000/api/tasks?limit=1000&home_id=${selectedHome.id}`);
        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const tasksData = await tasksResponse.json();
        
        if (inspectionsData.success) {
          setInspections(inspectionsData.data);
        }
        
        if (tasksData.success) {
          setTasks(tasksData.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedHome]);

  // Calculate stats from real data
  const stats = {
    totalInspections: inspections.length,
    completedInspections: inspections.filter(i => i.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    criticalIssues: inspections.reduce((sum, i) => sum + i.critical_issues, 0),
    overdueTasks: tasks.filter(t => {
      if (t.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate < today;
    }).length,
  };

  // Get recent inspections (last 3)
  const recentInspections = inspections
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 1,
              p: 1,
              mr: 2,
              color: 'white',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!selectedHome) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Please select a care home from the dropdown above to view dashboard data.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Chip
          label={selectedHome.name}
          color="primary"
          variant="outlined"
          size="medium"
        />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Inspections"
            value={stats.totalInspections}
            icon={<Assessment />}
            color="primary.main"
            subtitle={`${stats.completedInspections} completed`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<TaskIcon />}
            color="warning.main"
            subtitle={`${stats.overdueTasks} overdue`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Critical Issues"
            value={stats.criticalIssues}
            icon={<Warning />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={stats.totalInspections > 0 ? Math.round((stats.completedInspections / stats.totalInspections) * 100) : 0}
            icon={<CheckCircle />}
            color="success.main"
            subtitle="% of inspections"
          />
        </Grid>
      </Grid>

      {/* Inspection Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inspection Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Overall Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ flexGrow: 1, mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={stats.totalInspections > 0 ? (stats.completedInspections / stats.totalInspections) * 100 : 0}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {stats.totalInspections > 0 ? Math.round((stats.completedInspections / stats.totalInspections) * 100) : 0}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Inspections
          </Typography>
          {recentInspections.length === 0 ? (
            <Typography color="text.secondary">
              No inspections found. Add a new inspection to get started.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {recentInspections.map((inspection) => (
                <Grid item xs={12} md={4} key={inspection.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {inspection.location}
                        </Typography>
                        {getStatusChip(inspection.status)}
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(inspection.date).toLocaleDateString()}
                      </Typography>
                      {inspection.critical_issues > 0 && (
                        <Chip
                          label={`${inspection.critical_issues} issues`}
                          color="error"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;