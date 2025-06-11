import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Add,
  Download,
  Upload,
  Link as LinkIcon,
  Refresh,
} from '@mui/icons-material';
import { Order, Vendor, Category } from '../../types';
import { dataManager } from '../../services/dataManager';
import { csvManager } from '../../services/csvManager';
import OrderDetail from './OrderDetail';
import CsvImport from '../Import/CsvImport';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, vendorsData, categoriesData] = await Promise.all([
        dataManager.getOrders(),
        dataManager.getVendors(),
        dataManager.getCategories(),
      ]);
      
      console.log('Loaded orders:', ordersData.length);
      console.log('Loaded vendors:', vendorsData.length);
      console.log('Loaded categories:', categoriesData.length);
      
      // Sort by order date (latest first)
      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = new Date(a.orderdate || '1900-01-01').getTime();
        const dateB = new Date(b.orderdate || '1900-01-01').getTime();
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
      setVendors(vendorsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order) return false;
      
      const matchesSearch = searchText === '' || 
        (order.user_name && order.user_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (order.desc && order.desc.toLowerCase().includes(searchText.toLowerCase())) ||
        (order.catalog && order.catalog.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesUser = userFilter === '' || order.user_name === userFilter;
      const matchesVendor = vendorFilter === '' || order.vendor_name === vendorFilter;
      const matchesCategory = categoryFilter === '' || order.category_name === categoryFilter;
      
      return matchesSearch && matchesUser && matchesVendor && matchesCategory;
    });
  }, [orders, searchText, userFilter, vendorFilter, categoryFilter]);

  console.log('Orders:', orders.length, 'Filtered:', filteredOrders.length);

  const columns: GridColDef[] = [
    {
      field: 'user_name',
      headerName: 'User',
      width: 120,
    },
    {
      field: 'vendor_name',
      headerName: 'Vendor',
      width: 150,
    },
    {
      field: 'category_name',
      headerName: 'Category',
      width: 120,
    },
    {
      field: 'catalog',
      headerName: 'Catalog',
      width: 130,
    },
    {
      field: 'qty',
      headerName: 'Qty',
      width: 80,
      type: 'number',
    },
    {
      field: 'unitprice',
      headerName: 'Unit Price',
      width: 100,
      type: 'number',
      valueFormatter: (value: any) => value ? `$${Number(value).toFixed(2)}` : '',
    },
    {
      field: 'orderdate',
      headerName: 'Order Date',
      width: 110,
      type: 'date',
      valueGetter: (params) => params ? new Date(params) : null,
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 200,
    },
    {
      field: 'desc',
      headerName: 'Description',
      width: 300,
      flex: 1,
      renderCell: (params) => {
        const desc = params.value as string;
        const displayText = desc && desc.length > 80 ? `${desc.substring(0, 80)}...` : desc;
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            height: '100%',
            py: 1
          }}>
            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
              {displayText}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'link',
      headerName: 'Link',
      width: 80,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%'
        }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(params.value as string, '_blank');
            }}
            disabled={!params.value}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleExport = () => {
    const headers = [
      'id', 'user_name', 'vendor_name', 'category_name', 'catalog', 'qty',
      'desc', 'unitprice', 'unit', 'link', 'orderdate', 'receiptdate',
      'comment', 'location'
    ];
    csvManager.exportToCSV(filteredOrders, 'orders_export.csv', headers);
  };

  const handleRowClick = (params: GridRowParams) => {
    setSelectedOrder(params.row as Order);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedOrder(null);
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Orders
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">
            Error loading data: {error}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Orders</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setImportOpen(true)}
          >
            Import
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => console.log('Add new order')}
          >
            Add Order
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search user, description, or catalog"
            sx={{ minWidth: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={userFilter}
              label="User"
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <MenuItem value="">All Users</MenuItem>
              {Array.from(new Set(orders.map(o => o.user_name))).map(user => (
                <MenuItem key={user} value={user}>{user}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Vendor</InputLabel>
            <Select
              value={vendorFilter}
              label="Vendor"
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <MenuItem value="">All Vendors</MenuItem>
              {vendors.map(vendor => (
                <MenuItem key={vendor.id} value={vendor.name}>{vendor.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.name}>{category.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(searchText || userFilter || vendorFilter || categoryFilter) && (
            <Button
              variant="outlined"
              onClick={() => {
                setSearchText('');
                setUserFilter('');
                setVendorFilter('');
                setCategoryFilter('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {searchText && (
            <Chip label={`Search: "${searchText}"`} onDelete={() => setSearchText('')} />
          )}
          {userFilter && (
            <Chip label={`User: ${userFilter}`} onDelete={() => setUserFilter('')} />
          )}
          {vendorFilter && (
            <Chip label={`Vendor: ${vendorFilter}`} onDelete={() => setVendorFilter('')} />
          )}
          {categoryFilter && (
            <Chip label={`Category: ${categoryFilter}`} onDelete={() => setCategoryFilter('')} />
          )}
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          onRowClick={handleRowClick}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            },
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'orderdate', sort: 'desc' }],
            },
          }}
          sx={{
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>

      <OrderDetail 
        order={selectedOrder}
        open={detailOpen}
        onClose={handleDetailClose}
      />

      <CsvImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entity="orders"
        onImportComplete={fetchData}
      />
    </Box>
  );
};

export default OrderList;