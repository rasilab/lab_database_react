import React, { useState } from 'react';
import { Paper, Typography, Box, Button, Chip, Alert } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { dataManager } from '../../services/dataManager';

const DataRefreshDebug: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [dataInfo, setDataInfo] = useState<any>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh from GitHub
      const celllines = await dataManager.getCelllines();
      
      // Try to get some indication of data freshness
      const sampleRecord = celllines.find(c => c.id === 1) || celllines[0];
      
      setDataInfo({
        count: celllines.length,
        lastModified: new Date().toISOString(),
        sampleIds: celllines.slice(0, 5).map(c => c.id),
        sampleRecord: sampleRecord ? {
          id: sampleRecord.id,
          refid: sampleRecord.refid,
          comment: sampleRecord.comment?.substring(0, 50) + '...'
        } : null
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    setRefreshing(false);
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">
          🔄 Data Refresh Debug
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
          size="small"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>
      
      {lastRefresh && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </Alert>
      )}
      
      {dataInfo && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Records loaded:</strong> {dataInfo.count}<br/>
            <strong>Sample IDs:</strong> {dataInfo.sampleIds.join(', ')}<br/>
            <strong>Load time:</strong> {dataInfo.lastModified}<br/>
            {dataInfo.sampleRecord && (
              <>
                <strong>Sample record:</strong> ID {dataInfo.sampleRecord.id} - {dataInfo.sampleRecord.refid}<br/>
                <strong>Comment preview:</strong> {dataInfo.sampleRecord.comment}
              </>
            )}
          </Typography>
        </Box>
      )}
      
      <Typography variant="caption" color="text.secondary">
        Use this to manually refresh data from GitHub and check if latest changes are loaded.
      </Typography>
    </Paper>
  );
};

export default DataRefreshDebug;