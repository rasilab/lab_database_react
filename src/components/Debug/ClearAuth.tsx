import React from 'react';
import {
  Box,
  Button,
  Alert,
  Typography,
  Paper,
} from '@mui/material';
import {
  DeleteForever,
  Refresh,
} from '@mui/icons-material';

const ClearAuth: React.FC = () => {
  const handleClearAuth = () => {
    // Clear all authentication data
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('oauth_state');
    
    // Clear any other cached data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('github_') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    alert('Authentication data cleared! The page will reload.');
    window.location.reload();
  };

  const checkStoredData = () => {
    const token = localStorage.getItem('github_token');
    const user = localStorage.getItem('github_user');
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      token: token ? `${token.substring(0, 20)}...` : 'None',
      user: user ? JSON.parse(user).username : 'None'
    };
  };

  const data = checkStoredData();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Authentication Debug
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Current Stored Data:
        </Typography>
        
        <Typography variant="body2">
          <strong>Token:</strong> {data.token}
        </Typography>
        <Typography variant="body2">
          <strong>User:</strong> {data.user}
        </Typography>
        <Typography variant="body2">
          <strong>Has Token:</strong> {data.hasToken ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Has User:</strong> {data.hasUser ? 'Yes' : 'No'}
        </Typography>
      </Paper>

      {(data.hasToken || data.hasUser) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have old authentication data stored. Clear it to test the new authentication flow.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteForever />}
          onClick={handleClearAuth}
        >
          Clear All Auth Data
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Development Note:</strong> The new authentication system will:
          <br />
          1. Check if your data repository is public (automatic access)
          <br />
          2. Check if you have stored valid credentials
          <br />
          3. Prompt for token creation if needed
        </Typography>
      </Alert>
    </Box>
  );
};

export default ClearAuth;