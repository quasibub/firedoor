import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#9BC1A9', // FigTree sage green
      light: '#B8D4C4', // Lighter version of sage green
      dark: '#7A9A8A', // Darker version of sage green
      contrastText: '#FFFFFF', // White text for good contrast
    },
    secondary: {
      main: '#8B5A96', // Complementary purple (from your logo)
      light: '#A67BA8',
      dark: '#6B4570',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAF8', // Very light sage tint
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50', // Dark blue-grey for good readability
      secondary: '#5D6D7E',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: '#2C3E50',
    },
    h2: {
      color: '#2C3E50',
    },
    h3: {
      color: '#2C3E50',
    },
    h4: {
      color: '#2C3E50',
    },
    h5: {
      color: '#2C3E50',
    },
    h6: {
      color: '#2C3E50',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(155, 193, 169, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(155, 193, 169, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(155, 193, 169, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#9BC1A9',
          color: '#FFFFFF',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
); 