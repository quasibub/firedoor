export interface Task {
  id: string;
  inspection_id: string;
  door_id: string;
  location: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'cancelled';
  assigned_to: string;
  completed_at: string | null;
  notes: string;
  category: string;
}

export interface TaskFormData {
  inspection_id: string;
  door_id: string;
  location: string;
  description: string;
  priority: Task['priority'];
  assigned_to: string;
  notes: string;
}

export interface TaskFilters {
  status: 'all' | 'pending' | 'in-progress' | 'completed' | 'rejected' | 'cancelled';
  priority: 'all' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  assignedTo: string;
  doorId: string;
  search: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface RejectionPayload {
  rejection_reason: string;
  alternative_suggestion: string;
}
