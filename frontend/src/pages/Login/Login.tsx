import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#9BC1A9', // Clean sage green, no gradient!
        p: 2,
      }}
    >
      {/* Responsive Layout Container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          maxWidth: 1200,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Login Box - Left Side */}
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
            order: { xs: 2, md: 1 },
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img 
              src="/logotreeonly.svg" 
              alt="FigTree Logo" 
              style={{ 
                height: '80px', 
                width: 'auto',
                filter: 'brightness(0) saturate(100%) invert(67%) sepia(12%) saturate(1237%) hue-rotate(89deg) brightness(95%) contrast(87%)',
                marginBottom: '16px'
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#9BC1A9', fontWeight: 700 }}>
              FigTree DoorCheck
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to access the inspection portal
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
        </Paper>

        {/* Logo - Right Side (Desktop) / Above Login (Mobile) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            order: { xs: 1, md: 2 },
            flex: 1,
            maxWidth: { xs: '100%', md: '600px' },
            minHeight: { xs: '200px', md: 'auto' },
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            p: 2,
            border: '2px dashed rgba(255, 255, 255, 0.3)',
          }}
        >
          <img 
            src="/logovectorwebsite.svg" 
            alt="FigTree Vector Logo" 
            style={{ 
              height: 'auto',
              width: '100%',
              maxWidth: '400px',
              filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)',
            }}
            onLoad={() => console.log('✅ logovectorwebsite.svg loaded successfully')}
            onError={(e) => {
              console.error('❌ Failed to load logovectorwebsite.svg');
              e.currentTarget.style.display = 'none';
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 
