import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
} from '@mui/icons-material';
import { dataManager } from '../../services/dataManager';

interface CsvImportProps {
  open: boolean;
  onClose: () => void;
  entity: 'celllines' | 'orders' | 'oligos' | 'plasmids';
  onImportComplete: () => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any[];
}

const CsvImport: React.FC<CsvImportProps> = ({ open, onClose, entity, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = {
    celllines: ['id', 'user_id', 'organism_id', 'refid', 'genotype', 'date', 'source', 'link', 'copies', 'leftcopies', 'parent', 'reference', 'sequence', 'comment', 'location'],
    orders: ['id', 'user_id', 'vendor_id', 'category_id', 'catalog', 'qty', 'desc', 'unitprice', 'unit', 'link', 'orderdate', 'receiptdate', 'comment', 'location'],
    oligos: ['id', 'user_id', 'organism_id', 'refid', 'desc', 'seq', 'date', 'source', 'link', 'reference', 'usefulseq', 'comment', 'location', 'length', 'meltingtemp', 'gc'],
    plasmids: ['id', 'user_id', 'organism_id', 'refid', 'genotype', 'date', 'source', 'link', 'replicates', 'leftover', 'parent', 'reference', 'sequence', 'resistance', 'temperature', 'copynumber', 'comment', 'location']
  };

  const requiredFields = {
    celllines: ['refid', 'user_id', 'organism_id'],
    orders: ['catalog', 'user_id', 'vendor_id', 'category_id'],
    oligos: ['refid', 'user_id', 'organism_id'],
    plasmids: ['refid', 'user_id', 'organism_id']
  };

  const handleClose = () => {
    setFile(null);
    setValidationResult(null);
    setImporting(false);
    setImportComplete(false);
    setImportError(null);
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    setImportError(null);
    validateFile(selectedFile);
  };

  const validateFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          setValidationResult({
            isValid: false,
            errors: ['File is empty'],
            warnings: [],
            data: []
          });
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const expectedCols = expectedHeaders[entity];
        const requiredCols = requiredFields[entity];
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Check for required columns
        const missingRequired = requiredCols.filter(col => !headers.includes(col));
        if (missingRequired.length > 0) {
          errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
        }
        
        // Check for unexpected columns
        const unexpectedCols = headers.filter(col => !expectedCols.includes(col));
        if (unexpectedCols.length > 0) {
          warnings.push(`Unexpected columns will be ignored: ${unexpectedCols.join(', ')}`);
        }
        
        // Parse data rows
        const data: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          
          headers.forEach((header, index) => {
            if (expectedCols.includes(header)) {
              row[header] = values[index] || '';
            }
          });
          
          // Validate required fields for this row
          const missingValues = requiredCols.filter(col => !row[col] || row[col].trim() === '');
          if (missingValues.length > 0) {
            errors.push(`Row ${i + 1}: Missing required values for ${missingValues.join(', ')}`);
          }
          
          data.push(row);
        }
        
        setValidationResult({
          isValid: errors.length === 0,
          errors,
          warnings,
          data
        });
        
      } catch (error) {
        setValidationResult({
          isValid: false,
          errors: ['Failed to parse CSV file'],
          warnings: [],
          data: []
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!validationResult || !validationResult.isValid) return;
    
    setImporting(true);
    setImportError(null);
    
    try {
      // Filter out rows that don't have required data
      const requiredCols = requiredFields[entity];
      const validRows = validationResult.data.filter(row => {
        return requiredCols.every(col => row[col] && row[col].trim() !== '');
      });
      
      if (validRows.length === 0) {
        throw new Error('No valid rows found to import');
      }
      
      // Use bulk import for better performance
      await dataManager.bulkImport(entity, validRows);
      
      setImportComplete(true);
      setTimeout(() => {
        onImportComplete();
        handleClose();
      }, 2000);
      
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const getEntityDisplayName = () => {
    const names = {
      celllines: 'Celllines',
      orders: 'Orders', 
      oligos: 'Oligos',
      plasmids: 'Plasmids'
    };
    return names[entity];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Import {getEntityDisplayName()} from CSV</Typography>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {importComplete ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Import Completed Successfully!
            </Typography>
            <Typography color="text.secondary">
              Your data has been imported and saved to GitHub.
            </Typography>
          </Box>
        ) : (
          <>
            {/* File Upload Area */}
            <Box
              sx={{
                border: 2,
                borderColor: dragActive ? 'primary.main' : 'grey.300',
                borderStyle: 'dashed',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: dragActive ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                mb: 3
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {file ? file.name : 'Drag and drop your CSV file here'}
              </Typography>
              <Typography color="text.secondary">
                or click to browse files
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </Box>

            {/* Expected Format Info */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Expected CSV Format for {getEntityDisplayName()}:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {expectedHeaders[entity].join(', ')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Required fields: <strong>{requiredFields[entity].join(', ')}</strong>
              </Typography>
            </Alert>

            {importError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {importError}
              </Alert>
            )}

            {/* Validation Results */}
            {validationResult && (
              <Box sx={{ mb: 3 }}>
                {validationResult.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Validation Errors:
                    </Typography>
                    {validationResult.errors.map((error, index) => (
                      <Typography key={index} variant="body2">
                        • {error}
                      </Typography>
                    ))}
                  </Alert>
                )}

                {validationResult.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Warnings:
                    </Typography>
                    {validationResult.warnings.map((warning, index) => (
                      <Typography key={index} variant="body2">
                        • {warning}
                      </Typography>
                    ))}
                  </Alert>
                )}

                {validationResult.isValid && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" />
                      <Typography>
                        File validation passed! Ready to import {validationResult.data.length} rows.
                      </Typography>
                    </Box>
                  </Alert>
                )}

                {/* Preview of data */}
                {validationResult.data.length > 0 && validationResult.isValid && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Preview (first 5 rows):
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {expectedHeaders[entity].map(header => (
                              <TableCell key={header}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {header}
                                  {requiredFields[entity].includes(header) && (
                                    <Chip label="Required" size="small" color="primary" />
                                  )}
                                </Box>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {validationResult.data.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              {expectedHeaders[entity].map(header => (
                                <TableCell key={header}>
                                  {row[header] || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}

            {importing && (
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Importing data...</Typography>
                <LinearProgress />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          {importComplete ? 'Close' : 'Cancel'}
        </Button>
        {validationResult?.isValid && !importing && !importComplete && (
          <Button 
            onClick={handleImport} 
            variant="contained"
            startIcon={<CloudUpload />}
          >
            Import {validationResult.data.length} Rows
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CsvImport;