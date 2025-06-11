import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Avatar,
  Alert,
  Link,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  GitHub,
  Science,
  Security,
  VpnKey,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

const TokenLogin: React.FC = () => {
  const { authenticateWithToken } = useAuth();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [repoAccess, setRepoAccess] = useState<boolean | null>(null);

  // Check repository access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = await authService.checkPublicAccess();
      setRepoAccess(hasAccess);
      
      if (hasAccess) {
        // Repository is public, try to authenticate anonymously
        const success = await authenticateWithToken('');
        if (!success) {
          setError('Failed to access public repository');
        }
      }
    };
    
    checkAccess();
  }, [authenticateWithToken]);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await authenticateWithToken(token);
      if (!success) {
        throw new Error('Invalid token. Please check your GitHub token and permissions.');
      }
      // Authentication successful - context will update automatically
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      label: 'Go to GitHub Settings',
      description: (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Navigate to GitHub and access your developer settings:
          </Typography>
          <Link
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <GitHub fontSize="small" />
            GitHub Personal Access Tokens
          </Link>
        </Box>
      ),
    },
    {
      label: 'Create New Token',
      description: (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Click "Generate new token" → "Generate new token (classic)"
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Required permissions:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>repo</strong> (Full control of private repositories)
            <br />
            • <strong>user:email</strong> (Access user email addresses)
            <br />
            • <strong>read:org</strong> (Read organization membership)
          </Typography>
        </Box>
      ),
    },
    {
      label: 'Copy and Paste Token',
      description: (
        <Typography variant="body2">
          Copy the generated token and paste it below. The token will be stored securely in your browser.
        </Typography>
      ),
    },
  ];

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            maxWidth: 600,
            width: '100%',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
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

            <Typography variant="body1" color="text.secondary">
              Secure GitHub Token Authentication
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              <Security sx={{ fontSize: 16, mr: 1 }} />
              Why use a personal token?
            </Typography>
            <Typography variant="body2">
              For security and simplicity, we use GitHub Personal Access Tokens instead of OAuth. 
              Your token is stored locally in your browser and never transmitted to our servers.
            </Typography>
          </Alert>

          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle2">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  {step.description}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant={index === steps.length - 1 ? 'contained' : 'outlined'}
                      onClick={() => setActiveStep(index + 1)}
                      disabled={index === steps.length - 1}
                      size="small"
                    >
                      {index === steps.length - 1 ? 'Ready' : 'Continue'}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleTokenSubmit}>
            <TextField
              fullWidth
              label="GitHub Personal Access Token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isLoading}
              error={!!error}
              helperText={error || 'Paste your GitHub personal access token here'}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <VpnKey sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading || !token.trim()}
              sx={{ py: 1.5 }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Need help? Contact the lab administrator
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TokenLogin;