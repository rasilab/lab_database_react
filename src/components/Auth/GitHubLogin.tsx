import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Avatar,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  GitHub,
  Science,
  CheckCircle,
  Error as ErrorIcon,
  Info,
} from '@mui/icons-material';

interface GitHubLoginProps {
  onAuthSuccess: (token: string, userData: any) => void;
}

const GitHubLogin: React.FC<GitHubLoginProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Check if user already has access to the repository
  const checkRepositoryAccess = async () => {
    setCheckingAccess(true);
    setError(null);

    try {
      // Try to access the repository without authentication first
      // This will tell us if it's public or if we need authentication
      const repoUrl = `https://api.github.com/repos/${process.env.REACT_APP_GITHUB_OWNER}/${process.env.REACT_APP_GITHUB_DATA_REPO}`;
      
      const response = await fetch(repoUrl);
      
      if (response.ok) {
        // Repository is public, no authentication needed
        setHasAccess(true);
        setActiveStep(2);
      } else if (response.status === 404) {
        // Repository is private or doesn't exist, need authentication
        setHasAccess(false);
        setActiveStep(1);
      } else {
        throw new Error(`Repository check failed: ${response.statusText}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check repository access');
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  // GitHub OAuth login using the implicit flow (for public GitHub Pages)
  const handleGitHubLogin = () => {
    setIsLoading(true);
    setError(null);

    // Use GitHub's OAuth device flow or redirect to GitHub
    // For GitHub Pages, we'll use a popup window approach
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const scope = encodeURIComponent('repo user:email read:org');
    const state = Math.random().toString(36).substring(2, 15);
    
    localStorage.setItem('oauth_state', state);

    // Open GitHub OAuth in a popup
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    
    const popup = window.open(
      authUrl,
      'github-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    // Listen for messages from the popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        const { token, user } = event.data;
        onAuthSuccess(token, user);
        popup?.close();
        window.removeEventListener('message', messageListener);
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        setError(event.data.error);
        setIsLoading(false);
        popup?.close();
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);

    // Handle popup closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        window.removeEventListener('message', messageListener);
      }
    }, 1000);
  };

  // Alternative: Use GitHub CLI or direct token input
  const handleTokenInput = () => {
    setActiveStep(3); // Go to manual token step
  };

  useEffect(() => {
    checkRepositoryAccess();
  }, []);

  const steps = [
    {
      label: 'Checking Repository Access',
      content: (
        <Box sx={{ py: 2 }}>
          {checkingAccess ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>Checking if you can access the lab database...</Typography>
            </Box>
          ) : hasAccess === true ? (
            <Alert severity="success" icon={<CheckCircle />}>
              Repository is publicly accessible! No authentication required.
            </Alert>
          ) : hasAccess === false ? (
            <Alert severity="info" icon={<Info />}>
              Repository requires authentication. Please sign in with GitHub.
            </Alert>
          ) : (
            <Alert severity="error" icon={<ErrorIcon />}>
              {error || 'Unable to check repository access'}
            </Alert>
          )}
        </Box>
      )
    },
    {
      label: 'Sign in with GitHub',
      content: (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Sign in with your GitHub account to access the lab database. You need access to the{' '}
            <code>{process.env.REACT_APP_GITHUB_OWNER}/{process.env.REACT_APP_GITHUB_DATA_REPO}</code> repository.
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<GitHub />}
            onClick={handleGitHubLogin}
            disabled={isLoading}
            sx={{
              bgcolor: '#24292e',
              '&:hover': { bgcolor: '#1a1e22' },
              mb: 2,
              mr: 2
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
          </Button>

          <Button
            variant="outlined"
            onClick={handleTokenInput}
            disabled={isLoading}
          >
            Use Personal Token Instead
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      )
    },
    {
      label: 'Access Granted',
      content: (
        <Box sx={{ py: 2 }}>
          <Alert severity="success">
            Successfully authenticated! Loading lab database...
          </Alert>
        </Box>
      )
    },
    {
      label: 'Manual Token Setup',
      content: (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            If GitHub OAuth isn't working, you can create a personal access token:
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Steps to create a token:
            </Typography>
            <Typography variant="body2" component="div">
              1. Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">GitHub Settings → Personal Access Tokens</a>
              <br />
              2. Click "Generate new token (classic)"
              <br />
              3. Select scopes: <code>repo</code>, <code>user:email</code>, <code>read:org</code>
              <br />
              4. Copy the token and refresh this page
            </Typography>
          </Alert>
        </Box>
      )
    }
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
              Secure GitHub Authentication
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle2">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  {step.content}
                </StepContent>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Need repository access? Contact the lab administrator
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default GitHubLogin;