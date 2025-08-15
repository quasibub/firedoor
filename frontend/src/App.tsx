import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Inspections from './pages/Inspections/Inspections';
import Tasks from './pages/Tasks/Tasks';
import Users from './pages/Users/Users';
import Reports from './pages/Reports/Reports';
import RemediationReports from './pages/RemediationReports/RemediationReports';
import Homes from './pages/Homes/Homes';
import Login from './pages/Login/Login';
import { AuthProvider } from './contexts/AuthContext';
import { HomeProvider } from './contexts/HomeContext';

function App() {
  return (
    <AuthProvider>
      <HomeProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
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
      </HomeProvider>
    </AuthProvider>
  );
}

export default App; 