import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Avatar,
  Alert,
} from '@mui/material';
import {
  GitHub,
  Science,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            maxWidth: 400,
            width: '100%',
          }}
        >
          <Avatar
            sx={{
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              width: 64,
              height: 64,
            }}
          >
            <Science sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography variant="h4" component="h1" gutterBottom>
            Subramaniam Lab Database
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Secure access to lab data management system
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Access Requirements:</strong>
            </Typography>
            <Typography variant="body2">
              • GitHub account required
              • Member of rasilab organization for write access
              • Read-only access for external collaborators
            </Typography>
          </Alert>

          <Button
            variant="contained"
            size="large"
            startIcon={<GitHub />}
            onClick={login}
            disabled={isLoading}
            fullWidth
            sx={{
              py: 1.5,
              mb: 2,
              bgcolor: '#24292e',
              '&:hover': {
                bgcolor: '#1a1e22',
              },
            }}
          >
            {isLoading ? 'Connecting...' : 'Sign in with GitHub'}
          </Button>

          <Typography variant="caption" color="text.secondary">
            Powered by GitHub OAuth for secure authentication
          </Typography>
        </Paper>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need access? Contact the lab administrator or{' '}
            <a
              href="https://github.com/rasilab"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              request to join the organization
            </a>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginScreen;