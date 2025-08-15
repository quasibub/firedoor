import React from 'react';
import { Chip } from '@mui/material';
import { Task } from '../../types/task';

export const getPriorityChip = (priority: Task['priority']) => {
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

export const getStatusChip = (status: Task['status']) => {
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
