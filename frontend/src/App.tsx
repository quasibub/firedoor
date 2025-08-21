import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Inspections from './pages/Inspections/Inspections';
import Tasks from './pages/Tasks/Tasks';
import Users from './pages/Users/Users';
import Reports from './pages/Reports/Reports';
import RemediationReports from './pages/RemediationReports/RemediationReports';
import Homes from './pages/Homes/Homes';
import Login from './pages/Login/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomeProvider } from './contexts/HomeContext';

function App() {
  console.log('🚀 App component rendering');
  return (
    <AuthProvider>
      <HomeProvider>
        <AppContent />
      </HomeProvider>
    </AuthProvider>
  );
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('🔒 ProtectedRoute - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    console.log('⏳ Showing loading spinner');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ User authenticated, showing protected content');
  return <>{children}</>;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('🌐 PublicRoute - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    console.log('⏳ Public route loading...');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (isAuthenticated) {
    console.log('✅ User already authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  console.log('🌐 Showing public content (login)');
  return <>{children}</>;
};

function AppContent() {
  console.log('📱 AppContent rendering');
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="homes" element={<Homes />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
          <Route path="remediation-reports" element={<RemediationReports />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App; 