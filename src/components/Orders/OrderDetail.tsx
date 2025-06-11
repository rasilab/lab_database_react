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
import { Order, Vendor, Category, User } from '../../types';
import { dataManager } from '../../services/dataManager';

interface OrderDetailProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSave?: (updatedOrder: Order) => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order, open, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Order | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setEditData({ ...order });
    }
  }, [order]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [vendorsData, categoriesData, usersData] = await Promise.all([
          dataManager.getVendors(),
          dataManager.getCategories(),
          dataManager.getUsers(),
        ]);
        setVendors(vendorsData);
        setCategories(categoriesData);
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
    setEditData(order ? { ...order } : null);
    setError(null);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(order ? { ...order } : null);
    setError(null);
  };

  const handleSave = async () => {
    if (!editData || !order) return;

    setSaving(true);
    setError(null);
    
    try {
      await dataManager.updateData({
        type: 'update',
        entity: 'orders',
        data: editData,
        id: order.id
      });

      setIsEditing(false);
      if (onSave) {
        onSave(editData);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save order');
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

  if (!order) {
    return null;
  }

  const displayData = editData || order;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Order Details - {displayData.catalog}
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
            <Typography variant="h6" gutterBottom>Order Information</Typography>
            
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
                <InputLabel>Vendor</InputLabel>
                <Select
                  value={editData?.vendor_id || ''}
                  label="Vendor"
                  onChange={(e) => setEditData(prev => prev ? { 
                    ...prev, 
                    vendor_id: Number(e.target.value),
                    vendor_name: vendors.find(v => v.id === Number(e.target.value))?.name || ''
                  } : null)}
                >
                  {vendors.map(vendor => (
                    <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Vendor</Typography>
                <Typography variant="body1">{displayData.vendor_name || 'N/A'}</Typography>
              </Box>
            )}

            {isEditing ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editData?.category_id || ''}
                  label="Category"
                  onChange={(e) => setEditData(prev => prev ? { 
                    ...prev, 
                    category_id: Number(e.target.value),
                    category_name: categories.find(c => c.id === Number(e.target.value))?.name || ''
                  } : null)}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1">{displayData.category_name || 'N/A'}</Typography>
              </Box>
            )}

            {isEditing ? (
              <TextField
                fullWidth
                label="Catalog Number"
                value={editData?.catalog || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, catalog: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Catalog Number</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{displayData.catalog || 'N/A'}</Typography>
                  {displayData.catalog && (
                    <IconButton size="small" onClick={() => copyToClipboard(displayData.catalog)}>
                      <FileCopy fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {isEditing ? (
                <>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={editData?.qty || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, qty: Number(e.target.value) } : null)}
                  />
                  <TextField
                    label="Unit Price"
                    type="number"
                    inputProps={{ step: "0.01" }}
                    value={editData?.unitprice || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, unitprice: Number(e.target.value) } : null)}
                  />
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                    <Typography variant="body1">{displayData.qty || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Unit Price</Typography>
                    <Typography variant="body1">
                      {displayData.unitprice ? `$${displayData.unitprice.toFixed(2)}` : 'N/A'}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {isEditing ? (
              <TextField
                fullWidth
                label="Unit"
                value={editData?.unit || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, unit: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Unit</Typography>
                <Typography variant="body1">{displayData.unit || 'N/A'}</Typography>
              </Box>
            )}
          </Box>

          {/* Right Column */}
          <Box>
            <Typography variant="h6" gutterBottom>Order Details</Typography>

            {isEditing ? (
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editData?.desc || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, desc: e.target.value } : null)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {displayData.desc || 'N/A'}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {isEditing ? (
                <>
                  <TextField
                    label="Order Date"
                    type="date"
                    value={editData?.orderdate || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, orderdate: e.target.value } : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Receipt Date"
                    type="date"
                    value={editData?.receiptdate || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, receiptdate: e.target.value } : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Order Date</Typography>
                    <Typography variant="body1">{formatDate(displayData.orderdate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Receipt Date</Typography>
                    <Typography variant="body1">{formatDate(displayData.receiptdate)}</Typography>
                  </Box>
                </>
              )}
            </Box>

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

export default OrderDetail;