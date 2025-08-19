// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://fire-door-backend.azurewebsites.net/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Users
  USERS: `${API_BASE_URL}/users`,
  USER_BY_ID: (id: string) => `${API_BASE_URL}/users/${id}`,
  
  // Homes
  HOMES: `${API_BASE_URL}/homes`,
  HOME_BY_ID: (id: string) => `${API_BASE_URL}/homes/${id}`,
  
  // Inspections
  INSPECTIONS: `${API_BASE_URL}/inspections`,
  INSPECTION_BY_ID: (id: string) => `${API_BASE_URL}/inspections/${id}`,
  
  // Tasks
  TASKS: `${API_BASE_URL}/tasks`,
  TASK_BY_ID: (id: string) => `${API_BASE_URL}/tasks/${id}`,
  
  // Task Photos
  TASK_PHOTOS: `${API_BASE_URL}/task-photos`,
  TASK_PHOTOS_BY_ID: (id: string) => `${API_BASE_URL}/task-photos/${id}`,
  
  // Task Rejections
  TASK_REJECTIONS: `${API_BASE_URL}/task-rejections`,
  TASK_REJECTIONS_BY_ID: (id: string) => `${API_BASE_URL}/task-rejections/${id}`,
  
  // Reports
  REPORTS: `${API_BASE_URL}/reports`,
  REMEDIATION_REPORTS: `${API_BASE_URL}/remediation-reports`,
  
  // PDF Upload
  PDF_UPLOAD: `${API_BASE_URL}/pdf-upload`,
};

export default API_ENDPOINTS;
