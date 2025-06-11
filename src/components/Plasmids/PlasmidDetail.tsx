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
import { Plasmid, Organism, User } from '../../types';
import { dataManager } from '../../services/dataManager';

interface PlasmidDetailProps {
  plasmid: Plasmid | null;
  open: boolean;
  onClose: () => void;
  onSave?: (updatedPlasmid: Plasmid) => void;
}

const PlasmidDetail: React.FC<PlasmidDetailProps> = ({ plasmid, open, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Plasmid | null>(null);
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plasmid) {
      setEditData({ ...plasmid });
    }
  }, [plasmid]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [organismsData, usersData] = await Promise.all([
          dataManager.getOrganisms(),
          dataManager.getUsers(),
        ]);
        setOrganisms(organismsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    if (open) {
      fetchReferenceData();
    }
  }, [open]);

  const handleClose = () => {
    setIsEditing(false);
    setEditData(plasmid ? { ...plasmid } : null);
    setError(null);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(plasmid ? { ...plasmid } : null);
    setError(null);
  };

  const handleSave = async () => {
    if (!editData || !plasmid) return;

    setSaving(true);
    setError(null);
    
    try {
      await dataManager.updateData({
        type: 'update',
        entity: 'plasmids',
        data: editData,
        id: plasmid.id
      });

      setIsEditing(false);
      if (onSave) {
        onSave(editData);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save plasmid');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (!plasmid) {
    return null;
  }

  const displayData = editData || plasmid;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Plasmid Details - {displayData.refid}
        </Typography>
        <Box>
          {!isEditing && (
            <IconButton onClick={handleEdit} color="primary">
              <Edit />
            </IconButton>
          )}
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {/* Left Column */}
          <Box>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">ID</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1">{displayData.id}</Typography>
                <IconButton size="small" onClick={() => copyToClipboard(displayData.id.toString())}>
                  <FileCopy fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {isEditing ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>User</InputLabel>
                <Select
                  value={editData?.user_id || ''}
                  label="User"
                  onChange={(e) => setEditData(prev => prev ? { 
                    ...prev, 
                    user_id: Number(e.target.value),
                    user_name: users.find(u => u.id === Number(e.target.value))?.username || ''
                  } : null)}
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">User</Typography>
                <Typography variant="body1">{displayData.user_name || 'N/A'}</Typography>
              </Box>
            )}

            {isEditing ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Organism</InputLabel>
                <Select
                  value={editData?.organism_id || ''}
                  label="Organism"
                  onChange={(e) => setEditData(prev => prev ? { 
                    ...prev, 
                    organism_id: Number(e.target.value),
                    organism_name: organisms.find(o => o.id === Number(e.target.value))?.name || ''
                  } : null)}
                >
                  {organisms.map(organism => (
                    <MenuItem key={organism.id} value={organism.id}>{organism.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Organism</Typography>
                <Typography variant="body1">{displayData.organism_name || 'N/A'}</Typography>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Reference ID"
                value={editData?.refid || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, refid: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Reference ID</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{displayData.refid || 'N/A'}</Typography>
                  {displayData.refid && (
                    <IconButton size="small" onClick={() => copyToClipboard(displayData.refid)}>
                      <FileCopy fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Genotype/Description"
                multiline
                rows={3}
                value={editData?.genotype || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, genotype: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Genotype/Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {displayData.genotype || 'N/A'}
                </Typography>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={editData?.date || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, date: e.target.value } : null)}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body1">{formatDate(displayData.date)}</Typography>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {isEditing ? (
                <>
                  <TextField
                    label="Replicates"
                    type="number"
                    value={editData?.replicates || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, replicates: Number(e.target.value) } : null)}
                  />
                  <TextField
                    label="Leftover"
                    type="number"
                    value={editData?.leftover || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, leftover: Number(e.target.value) } : null)}
                  />
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Replicates</Typography>
                    <Typography variant="body1">{displayData.replicates || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Leftover</Typography>
                    <Typography variant="body1">{displayData.leftover || 'N/A'}</Typography>
                  </Box>
                </>
              )}
            </Box>

            {isEditing ? (
              <TextField
                fullWidth
                label="Parent"
                value={editData?.parent || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, parent: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Parent</Typography>
                <Typography variant="body1">{displayData.parent || 'N/A'}</Typography>
              </Box>
            )}
          </Box>

          {/* Right Column */}
          <Box>
            <Typography variant="h6" gutterBottom>Plasmid Properties</Typography>

            {isEditing ? (
              <TextField
                fullWidth
                label="Resistance"
                value={editData?.resistance || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, resistance: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Resistance</Typography>
                <Typography variant="body1">{displayData.resistance || 'N/A'}</Typography>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {isEditing ? (
                <>
                  <TextField
                    label="Temperature"
                    value={editData?.temperature || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, temperature: e.target.value } : null)}
                  />
                  <TextField
                    label="Copy Number"
                    value={editData?.copynumber || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, copynumber: e.target.value } : null)}
                  />
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Temperature</Typography>
                    <Typography variant="body1">{displayData.temperature || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Copy Number</Typography>
                    <Typography variant="body1">{displayData.copynumber || 'N/A'}</Typography>
                  </Box>
                </>
              )}
            </Box>

            {isEditing ? (
              <TextField
                fullWidth
                label="Source"
                value={editData?.source || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, source: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Source</Typography>
                <Typography variant="body1">{displayData.source || 'N/A'}</Typography>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Reference"
                multiline
                rows={2}
                value={editData?.reference || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, reference: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Reference</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {displayData.reference || 'N/A'}
                </Typography>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Sequence"
                multiline
                rows={3}
                value={editData?.sequence || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, sequence: e.target.value } : null)}
                sx={{ mb: 2, fontFamily: 'monospace' }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Sequence</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.875rem',
                      wordBreak: 'break-all',
                      backgroundColor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.300',
                      flexGrow: 1,
                      maxHeight: '100px',
                      overflow: 'auto'
                    }}
                  >
                    {displayData.sequence || 'N/A'}
                  </Typography>
                  {displayData.sequence && (
                    <IconButton size="small" onClick={() => copyToClipboard(displayData.sequence)}>
                      <FileCopy fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Location"
                value={editData?.location || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, location: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{displayData.location || 'N/A'}</Typography>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Link"
                value={editData?.link || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, link: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Link</Typography>
                {displayData.link ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Link href={displayData.link} target="_blank" rel="noopener">
                      {displayData.link}
                    </Link>
                    <IconButton size="small" onClick={() => window.open(displayData.link, '_blank')}>
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Typography variant="body1">N/A</Typography>
                )}
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Comment"
                multiline
                rows={3}
                value={editData?.comment || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, comment: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Comment</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {displayData.comment || 'N/A'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        {isEditing ? (
          <>
            <Button onClick={handleCancel} startIcon={<Cancel />}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              startIcon={<Save />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PlasmidDetail;