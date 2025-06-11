import React from 'react';
import {
  Typography,
  Paper,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import ConfigDebug from '../Debug/ConfigDebug';
import DataRefreshDebug from '../Debug/DataRefreshDebug';
import ClearAuth from '../Debug/ClearAuth';
import AuthDebug from '../Debug/AuthDebug';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to the Subramaniam Lab Databases!
      </Typography>
      
      <AuthDebug />
      <ConfigDebug />
      <DataRefreshDebug />
      <ClearAuth />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Links to individual databases are on the left.
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="View" 
              secondary="You can view all items in any database."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Edit" 
              secondary="You will be able to edit only items that you created unless you have special admin privileges."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Copy" 
              secondary="To duplicate an item, click on the item row, and then click 'Save as new'."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Export" 
              secondary="First apply search or filters to display all items you want to export. Then click Export."
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Import" 
              secondary="Export an existing record first to use as a template for batch import."
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Database-specific Notes
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Ordering:</Typography>
          <Typography variant="body2">
            If duplicating an order, order and receipt dates will be reset. Other fields like quantity, price, comment etc. have to be changed manually.
          </Typography>
        </Alert>

        <Alert severity="info">
          <Typography variant="subtitle2">Oligo:</Typography>
          <Typography variant="body2">
            Length, melting temperature (Tm) and GC % are calculated automatically upon saving a record. Tm calculation is using Breslauer 1986.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default Dashboard;