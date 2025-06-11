import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Link,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Close,
  Edit,
  FileCopy,
  OpenInNew,
  Save,
  Cancel,
} from '@mui/icons-material';
import { Cellline, Organism, User } from '../../types';
import { dataManager } from '../../services/dataManager';

interface CelllineDetailProps {
  cellline: Cellline | null;
  open: boolean;
  onClose: () => void;
  onSave?: (updatedCellline: Cellline) => void;
}

const CelllineDetail: React.FC<CelllineDetailProps> = ({ cellline, open, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Cellline | null>(null);
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cellline) {
      setEditData({ ...cellline });
    }
  }, [cellline]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [organismsData, usersData] = await Promise.all([
          dataManager.getOrganisms(),
          dataManager.getUsers(),
        ]);
        setOrganisms(organismsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading reference data:', error);
      }
    };

    if (open) {
      loadReferenceData();
    }
  }, [open]);

  if (!cellline || !editData) return null;

  const handleCopy = () => {
    // TODO: Implement copy functionality
    console.log('Copy cellline:', cellline);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...cellline });
    setError(null);
  };

  const handleSave = async () => {
    if (!editData) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await dataManager.updateData({
        type: 'update',
        entity: 'celllines',
        data: editData,
        id: editData.id
      });
      
      setIsEditing(false);
      if (onSave) {
        onSave(editData);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof Cellline, value: any) => {
    if (!editData) return;
    
    const updatedData = { ...editData, [field]: value };
    
    // Update related fields when organism changes
    if (field === 'organism_id') {
      const selectedOrganism = organisms.find(org => org.id === value);
      if (selectedOrganism) {
        updatedData.organism_name = selectedOrganism.name;
      }
    }
    
    // Update related fields when user changes
    if (field === 'user_id') {
      const selectedUser = users.find(user => user.id === value);
      if (selectedUser) {
        updatedData.user_name = selectedUser.username;
      }
    }
    
    setEditData(updatedData);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const DetailField: React.FC<{ 
    label: string; 
    value: string | number; 
    field?: keyof Cellline;
    isUrl?: boolean;
    multiline?: boolean;
    type?: 'text' | 'number' | 'date' | 'select';
    options?: { value: any; label: string }[];
  }> = ({ 
    label, 
    value, 
    field,
    isUrl = false,
    multiline = false,
    type = 'text',
    options = []
  }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        {label}
      </Typography>
      
      {isEditing && field ? (
        type === 'select' ? (
          <FormControl fullWidth size="small">
            <Select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            size="small"
            type={type}
            multiline={multiline}
            rows={multiline ? 3 : 1}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, type === 'number' ? Number(e.target.value) : e.target.value)}
          />
        )
      ) : (
        <>
          {isUrl && value ? (
            <Link 
              href={value as string} 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              {value}
              <OpenInNew fontSize="small" />
            </Link>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {value || 'Not specified'}
            </Typography>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {isEditing ? 'Edit' : 'Cell Line Details'}: {editData.refid}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {isEditing && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ Data Save Notice:</strong> Recent GitHub save issue detected. 
              Changes are being saved with improved CSV handling to prevent data corruption.
            </Typography>
          </Alert>
        )}
        
        <Box sx={{ display: 'grid', gap: 2 }}>
          
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <DetailField label="Reference ID" value={editData.refid} field="refid" />
            <DetailField 
              label="User" 
              value={editData.user_id} 
              field="user_id"
              type="select"
              options={users.map(user => ({ value: user.id, label: user.username }))}
            />
            <DetailField 
              label="Organism" 
              value={editData.organism_id} 
              field="organism_id"
              type="select"
              options={organisms.map(org => ({ value: org.id, label: org.name }))}
            />
            <DetailField label="Date Created" value={editData.date} field="date" type="date" />
            <DetailField label="Source" value={editData.source} field="source" />
          </Box>

          {/* Genotype & Description */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              Genotype & Description
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <DetailField label="Genotype" value={editData.genotype} field="genotype" multiline />
            <DetailField label="Parent" value={editData.parent} field="parent" />
            <DetailField label="Comment" value={editData.comment} field="comment" multiline />
          </Box>

          {/* Stock Information */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              Stock Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <DetailField label="Total Copies" value={editData.copies} field="copies" type="number" />
              <DetailField label="Copies Left" value={editData.leftcopies} field="leftcopies" type="number" />
            </Box>
            <DetailField label="Location" value={editData.location} field="location" />
          </Box>

          {/* Scientific Information */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              Scientific Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <DetailField label="Reference/Publication" value={editData.reference} field="reference" multiline />
            <DetailField label="Sequence Information" value={editData.sequence} field="sequence" multiline />
            <DetailField label="Lab Notebook Link" value={editData.link} field="link" isUrl={!isEditing} />
          </Box>

          {/* Database Information */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              Database Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
              <DetailField label="Database ID" value={editData.id} />
              <DetailField label="User ID" value={editData.user_id} />
              <DetailField label="Organism ID" value={editData.organism_id} />
            </Box>
          </Box>

        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {isEditing ? (
          <>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<FileCopy />}
              onClick={handleCopy}
            >
              Save as New
            </Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CelllineDetail;