import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Alert,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  BugReport,
  Refresh,
} from '@mui/icons-material';
import { authService } from '../../services/auth';

const AuthDebug: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runAuthDebug = async () => {
    setIsChecking(true);
    setResults(null);

    try {
      const repoOwner = process.env.REACT_APP_GITHUB_OWNER || 'rasilab';
      const repoName = process.env.REACT_APP_GITHUB_DATA_REPO || 'lab-database-data';
      
      // Test repository access
      const isPublic = await authService.checkPublicAccess();
      
      // Test auto auth
      const authResult = await authService.tryAutoAuth();
      
      // Check localStorage
      const storedToken = localStorage.getItem('github_token');
      const storedUser = localStorage.getItem('github_user');
      
      const debugResults = {
        repoOwner,
        repoName,
        repoUrl: `https://github.com/${repoOwner}/${repoName}`,
        apiUrl: `https://api.github.com/repos/${repoOwner}/${repoName}`,
        isPublic,
        authResult,
        localStorage: {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          tokenPreview: storedToken ? `${storedToken.substring(0, 10)}...` : 'None',
          userPreview: storedUser ? JSON.parse(storedUser).username : 'None'
        }
      };
      
      setResults(debugResults);
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Debug failed'
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runAuthDebug();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        🐛 Authentication Debug
      </Typography>

      <Button
        variant="outlined"
        startIcon={<BugReport />}
        onClick={runAuthDebug}
        disabled={isChecking}
        sx={{ mb: 2 }}
      >
        {isChecking ? 'Checking...' : 'Run Debug Check'}
      </Button>

      {isChecking && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography>Running authentication checks...</Typography>
        </Box>
      )}

      {results && (
        <Paper sx={{ p: 2 }}>
          {results.error ? (
            <Alert severity="error">
              <Typography variant="subtitle2">Debug Error:</Typography>
              <Typography variant="body2">{results.error}</Typography>
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Repository Configuration:</Typography>
                <Typography variant="body2" component="div">
                  <strong>Owner:</strong> {results.repoOwner}<br />
                  <strong>Repo:</strong> {results.repoName}<br />
                  <strong>URL:</strong> <a href={results.repoUrl} target="_blank" rel="noopener">{results.repoUrl}</a><br />
                  <strong>API URL:</strong> {results.apiUrl}
                </Typography>
              </Alert>

              <Alert severity={results.isPublic ? 'success' : 'warning'} sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Repository Access:</Typography>
                <Typography variant="body2">
                  Repository is <strong>{results.isPublic ? 'PUBLIC' : 'PRIVATE'}</strong>
                  {results.isPublic ? ' - Should allow automatic access' : ' - Requires authentication'}
                </Typography>
              </Alert>

              <Alert severity={results.authResult.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Auto Authentication:</Typography>
                <Typography variant="body2" component="div">
                  <strong>Success:</strong> {results.authResult.success ? 'Yes' : 'No'}<br />
                  <strong>Needs Auth:</strong> {results.authResult.needsAuth ? 'Yes' : 'No'}<br />
                  <strong>User:</strong> {results.authResult.user ? results.authResult.user.username : 'None'}<br />
                  {results.authResult.error && (
                    <>
                      <strong>Error:</strong> {results.authResult.error}
                    </>
                  )}
                </Typography>
              </Alert>

              <Alert severity={results.localStorage.hasToken ? 'info' : 'warning'}>
                <Typography variant="subtitle2">Local Storage:</Typography>
                <Typography variant="body2" component="div">
                  <strong>Has Token:</strong> {results.localStorage.hasToken ? 'Yes' : 'No'}<br />
                  <strong>Has User:</strong> {results.localStorage.hasUser ? 'Yes' : 'No'}<br />
                  <strong>Token Preview:</strong> {results.localStorage.tokenPreview}<br />
                  <strong>User Preview:</strong> {results.localStorage.userPreview}
                </Typography>
              </Alert>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AuthDebug;