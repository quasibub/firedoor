import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
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
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import offlineStorage from './services/offlineStorage';
import networkStatus from './services/networkStatus';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  useEffect(() => {
    // Initialize offline functionality
    const initializeOffline = async () => {
      try {
        // Register service worker
        await registerServiceWorker();
        
        // Initialize offline storage
        await offlineStorage.init();
        
        console.log('✅ Offline functionality initialized');
      } catch (error) {
        console.error('❌ Failed to initialize offline functionality:', error);
      }
    };

    initializeOffline();

    // Cleanup on unmount
    return () => {
      networkStatus.destroy();
    };
  }, []);

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
          <Route path="users" element={<Users />} />
          <Route path="homes" element={<Homes />} />
          <Route path="reports" element={<Reports />} />
          <Route path="remediation-reports" element={<RemediationReports />} />
        </Route>
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <HomeProvider>
        <AppContent />
      </HomeProvider>
    </AuthProvider>
  );
}

export default App; 