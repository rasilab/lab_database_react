import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { getGitHubConfig } from '../../services/github';

const ConfigDebug: React.FC = () => {
  const [gitHubStatus, setGitHubStatus] = React.useState<{
    configured: boolean;
    error?: string;
    config?: any;
  }>({ configured: false });

  React.useEffect(() => {
    try {
      const config = getGitHubConfig();
      setGitHubStatus({
        configured: true,
        config: {
          owner: config.owner,
          repo: config.repo,
          tokenSet: !!config.token && config.token !== 'your-personal-access-token'
        }
      });
    } catch (error: any) {
      setGitHubStatus({
        configured: false,
        error: error.message
      });
    }
  }, []);

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        🔧 Configuration Debug Panel
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">GitHub Integration:</Typography>
        {gitHubStatus.configured ? (
          <Box sx={{ mt: 1 }}>
            <Chip label="✅ Configured" color="success" size="small" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Owner: {gitHubStatus.config?.owner}<br/>
              Repo: {gitHubStatus.config?.repo}<br/>
              Token: {gitHubStatus.config?.tokenSet ? '✅ Set' : '❌ Not Set or Placeholder'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Chip label="❌ Not Configured" color="error" size="small" />
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {gitHubStatus.error}
            </Typography>
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="subtitle2">Data Source:</Typography>
        <Typography variant="body2">
          {gitHubStatus.configured ? '🌐 GitHub Repository' : '💾 Local CSV Files'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ConfigDebug;