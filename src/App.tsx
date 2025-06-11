import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import CelllineList from './components/Celllines/CelllineList';
import OrderList from './components/Orders/OrderList';
import OligoList from './components/Oligos/OligoList';
import PlasmidList from './components/Plasmids/PlasmidList';
import TokenLogin from './components/Auth/TokenLogin';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Protected Routes Component
const ProtectedApp: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging
  console.log('🔍 Auth Debug:', { isAuthenticated, isLoading, user: user?.username });

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Checking authentication...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, showing login');
    return <TokenLogin />;
  }

  console.log('✅ Authenticated as:', user?.username);
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/celllines" element={<CelllineList />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/oligos" element={<OligoList />} />
        <Route path="/plasmids" element={<PlasmidList />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <ProtectedApp />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
