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
import { Cellline, Organism } from '../../types';
import { dataManager } from '../../services/dataManager';
import { csvManager } from '../../services/csvManager';
import CelllineDetail from './CelllineDetail';
import CsvImport from '../Import/CsvImport';

const CelllineList: React.FC = () => {
  const [celllines, setCelllines] = useState<Cellline[]>([]);
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [organismFilter, setOrganismFilter] = useState('');
  const [selectedCellline, setSelectedCellline] = useState<Cellline | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [celllinesData, organismsData] = await Promise.all([
        dataManager.getCelllines(),
        dataManager.getOrganisms(),
      ]);
      
      console.log('Loaded celllines:', celllinesData.length);
      console.log('Loaded organisms:', organismsData.length);
      
      // Sort by date (latest first)
      const sortedCelllines = celllinesData.sort((a, b) => {
        const dateA = new Date(a.date || '1900-01-01').getTime();
        const dateB = new Date(b.date || '1900-01-01').getTime();
        return dateB - dateA;
      });
      
      setCelllines(sortedCelllines);
      setOrganisms(organismsData);
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

  const filteredCelllines = useMemo(() => {
    return celllines.filter(cellline => {
      if (!cellline) return false;
      
      const matchesSearch = searchText === '' || 
        (cellline.user_name && cellline.user_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (cellline.genotype && cellline.genotype.toLowerCase().includes(searchText.toLowerCase())) ||
        (cellline.refid && cellline.refid.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesUser = userFilter === '' || cellline.user_name === userFilter;
      const matchesOrganism = organismFilter === '' || cellline.organism_name === organismFilter;
      
      return matchesSearch && matchesUser && matchesOrganism;
    });
  }, [celllines, searchText, userFilter, organismFilter]);

  console.log('Celllines:', celllines.length, 'Filtered:', filteredCelllines.length);

  const columns: GridColDef[] = [
    {
      field: 'user_name',
      headerName: 'User',
      width: 120,
    },
    {
      field: 'organism_name',
      headerName: 'Organism',
      width: 120,
    },
    {
      field: 'refid',
      headerName: 'Reference ID',
      width: 130,
    },
    {
      field: 'date',
      headerName: 'Date',
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
      field: 'genotype',
      headerName: 'Info (View/Edit)',
      width: 300,
      flex: 1,
      renderCell: (params) => {
        const genotype = params.value as string;
        const displayText = genotype.length > 80 ? `${genotype.substring(0, 80)}...` : genotype;
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
      'id', 'user_name', 'organism_name', 'refid', 'genotype', 'date',
      'source', 'link', 'copies', 'leftcopies', 'parent', 'reference',
      'sequence', 'comment', 'location'
    ];
    csvManager.exportToCSV(filteredCelllines, 'celllines_export.csv', headers);
  };

  const handleRowClick = (params: GridRowParams) => {
    setSelectedCellline(params.row as Cellline);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedCellline(null);
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Cell Lines & Strains
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
        <Typography variant="h4">Cell Lines & Strains</Typography>
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
            onClick={() => console.log('Add new cellline')}
          >
            Add Cell Line
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
            placeholder="Search user, genotype, or reference ID"
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
              {Array.from(new Set(celllines.map(c => c.user_name))).map(user => (
                <MenuItem key={user} value={user}>{user}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Organism</InputLabel>
            <Select
              value={organismFilter}
              label="Organism"
              onChange={(e) => setOrganismFilter(e.target.value)}
            >
              <MenuItem value="">All Organisms</MenuItem>
              {organisms.map(organism => (
                <MenuItem key={organism.id} value={organism.name}>{organism.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(searchText || userFilter || organismFilter) && (
            <Button
              variant="outlined"
              onClick={() => {
                setSearchText('');
                setUserFilter('');
                setOrganismFilter('');
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
          {organismFilter && (
            <Chip label={`Organism: ${organismFilter}`} onDelete={() => setOrganismFilter('')} />
          )}
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredCelllines}
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
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
          sx={{
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>

      <CelllineDetail 
        cellline={selectedCellline}
        open={detailOpen}
        onClose={handleDetailClose}
      />

      <CsvImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entity="celllines"
        onImportComplete={fetchData}
      />
    </Box>
  );
};

export default CelllineList;