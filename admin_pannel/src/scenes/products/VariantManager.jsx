import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Snackbar,
  Alert,
  Chip,
  Grid,
  FormControlLabel,
  Switch,
  Divider,
  Rating,
  Card,
  CardMedia,
  CardActions,
  TextareaAutosize,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';

const VariantManager = ({ parentProductId, onClose }) => {
  const theme = useTheme();
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    sku: '',
    size: '',
    color: '',
    description: '',
    features: [],
    basePrice: '',
    taxType: 'percentage',
    taxValue: 0,
    shippingCost: 0,
    discountType: 'none',
    discountValue: 0,
    price: '',
    stock: '',
    rating: 0,
    isActive: true,
    images: [],
    variantAttributes: {},
  });

  // Fetch variants
  useEffect(() => {
    fetchVariants();
  }, [parentProductId]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const apiUrl = `${API_URL}/clients/products/${parentProductId}/variants`;
      const response = await axios.get(apiUrl, { 
        withCredentials: true,
        timeout: 10000 
      });
      setVariants(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Fetch variants error:', error);
      showSnackbar('Failed to load variants', 'error');
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (variant = null) => {
    if (variant) {
      setIsEditing(true);
      setEditingId(variant._id);
      setFormData({
        sku: variant.sku,
        size: variant.size || '',
        color: variant.color || '',
        description: variant.description || '',
        features: variant.features || [],
        basePrice: variant.basePrice,
        taxType: variant.taxType || 'percentage',
        taxValue: variant.taxValue || 0,
        shippingCost: variant.shippingCost || 0,
        discountType: variant.discountType || 'none',
        discountValue: variant.discountValue || 0,
        price: variant.price,
        stock: variant.stock,
        rating: variant.rating || 0,
        isActive: variant.isActive,
        images: variant.images || [],
        variantAttributes: variant.variantAttributes || {},
      });
    } else {
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        sku: '',
        size: '',
        color: '',
        description: '',
        features: [],
        basePrice: '',
        taxType: 'percentage',
        taxValue: 0,
        shippingCost: 0,
        discountType: 'none',
        discountValue: 0,
        price: '',
        stock: '',
        rating: 0,
        isActive: true,
        images: [],
        variantAttributes: {},
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      sku: '',
      size: '',
      color: '',
      description: '',
      features: [],
      basePrice: '',
      taxType: 'percentage',
      taxValue: 0,
      shippingCost: 0,
      discountType: 'none',
      discountValue: 0,
      price: '',
      stock: '',
      rating: 0,
      isActive: true,
      images: [],
      variantAttributes: {},
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (let file of files) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        const uploadUrl = `${API_URL}/clients/variants/upload`;
        console.log('Uploading to:', uploadUrl);
        
        const response = await axios.post(uploadUrl, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
          timeout: 30000,
        });

        console.log('Upload response:', response.data);
        
        const imageUrl = response.data?.url || response.data?.data?.url;
        
        if (!imageUrl) {
          showSnackbar('Upload successful but no URL returned', 'error');
          return;
        }

        const newImage = {
          url: imageUrl,
          caption: '',
          altText: '',
          order: formData.images.length,
        };

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
        
        showSnackbar('Image uploaded successfully', 'success');
      } catch (error) {
        console.error('Image upload error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to upload image';
        showSnackbar(errorMsg, 'error');
      }
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageMetadataChange = (index, field, value) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = {
        ...newImages[index],
        [field]: value
      };
      return {
        ...prev,
        images: newImages
      };
    });
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { name: '', description: '' }]
    }));
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index, field, value) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index] = {
        ...newFeatures[index],
        [field]: value
      };
      return {
        ...prev,
        features: newFeatures
      };
    });
  };

  const calculateFinalPrice = () => {
    let price = parseFloat(formData.basePrice) || 0;
    
    // Add shipping first (before tax calculation)
    price += parseFloat(formData.shippingCost) || 0;
    
    // Apply tax
    if (formData.taxType === 'percentage') {
      const baseForTax = parseFloat(formData.basePrice) || 0;
      price += baseForTax * (parseFloat(formData.taxValue) || 0) / 100;
    } else if (formData.taxType !== 'none') {
      price += parseFloat(formData.taxValue) || 0;
    }
    
    // Apply discount
    if (formData.discountType !== 'none') {
      if (formData.discountType === 'percentage') {
        price -= price * (parseFloat(formData.discountValue) || 0) / 100;
      } else {
        price -= parseFloat(formData.discountValue) || 0;
      }
    }
    
    return Math.max(0, price.toFixed(2));
  };

  const handleSaveVariant = async () => {
    try {
      if (!formData.sku || formData.sku.trim() === '') {
        showSnackbar('SKU is required', 'error');
        return;
      }
      if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
        showSnackbar('Base Price is required and must be greater than 0', 'error');
        return;
      }

      const payload = {
        sku: formData.sku.trim().toUpperCase(),
        size: String(formData.size || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .join(',') || null,
        color: String(formData.color || '')
          .split(',')
          .map(c => c.trim())
          .filter(Boolean)
          .join(',') || null,
        variantAttributes: formData.variantAttributes || {},
        basePrice: parseFloat(formData.basePrice),
        tax: {
          type: formData.taxType === 'none' ? 'free' : (formData.taxType || 'percentage'),
          value: formData.taxType === 'none' ? 0 : (parseFloat(formData.taxValue) || 0),
        },
        shippingCost: {
          type: (parseFloat(formData.shippingCost) || 0) > 0 ? 'fixed' : 'free',
          value: parseFloat(formData.shippingCost) || 0,
        },
        discount: {
          type: formData.discountType === 'none' ? 'percentage' : (formData.discountType || 'percentage'),
          value: formData.discountType === 'none' ? 0 : (parseFloat(formData.discountValue) || 0),
        },
        price: parseFloat(calculateFinalPrice()),
        stock: parseInt(formData.stock, 10) || 0,
        images: (formData.images || []).map((img, idx) => ({
          url: img.url,
          caption: img.caption || '',
          alt: img.altText || img.alt || '',
          order: Number.isFinite(img.order) ? img.order : idx,
        })),
        isActive: !!formData.isActive,
      };

      let response;
      const apiUrl = `${API_URL}/clients/products/${parentProductId}/variants`;
      
      if (isEditing) {
        response = await axios.put(
          `${apiUrl}/${editingId}`,
          payload,
          { withCredentials: true }
        );
        showSnackbar('Variant updated successfully', 'success');
      } else {
        response = await axios.post(
          apiUrl,
          payload,
          { withCredentials: true }
        );
        showSnackbar('Variant added successfully', 'success');
      }

      handleCloseDialog();
      fetchVariants();
    } catch (error) {
      console.error('Save variant error:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to save variant';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;

    try {
      const apiUrl = `${API_URL}/clients/products/${parentProductId}/variants/${variantId}`;
      await axios.delete(apiUrl, { withCredentials: true });
      showSnackbar('Variant deleted successfully', 'success');
      fetchVariants();
    } catch (error) {
      console.error('Delete variant error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete variant';
      showSnackbar(errorMessage, 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const genZGradient = theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(15,15,35,1) 0%, rgba(26,26,58,1) 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)';

  const accentGradient = 'linear-gradient(135deg, #ff006e 0%, #fb5607 45%, #ffbe0b 100%)';
  const successGradient = 'linear-gradient(135deg, #00f5a0 0%, #00d4ff 100%)';
  const dividerSx = { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' };

  return (
    <Box
      sx={{
        mt: 3,
        p: 2.25,
        borderRadius: '1.25rem',
        background: genZGradient,
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 10px 28px rgba(0,0,0,0.45)'
          : '0 10px 28px rgba(255,0,110,0.08)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: accentGradient,
          opacity: 0.85,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 900,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              background: accentGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Product Variants
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.mode === 'dark' ? '#fff' : '#0b0b14' }}>
            {variants.length} variants
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '0.9rem',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'}`,
                color: theme.palette.mode === 'dark' ? '#fff' : '#111',
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => handleOpenDialog()}
            sx={{
              background: successGradient,
              fontWeight: 900,
              borderRadius: '0.9rem',
              textTransform: 'none',
              px: 2,
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            Add Variant
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)' }}>
          Loading variants...
        </Typography>
      ) : variants.length === 0 ? (
        <Box
          sx={{
            borderRadius: '1rem',
            p: 2,
            border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(255,0,110,0.35)' : 'rgba(255,0,110,0.25)'}`,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.65)',
          }}
        >
          <Typography sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)' }}>
            No variants yet. Create one to enable product variations.
          </Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '1rem',
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: 'none',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255,0,110,0.14)'
                    : 'rgba(255,0,110,0.08)',
                }}
              >
                <TableCell sx={{ fontWeight: 900 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Color</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>Base</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>Final</TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 900 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variants.map((variant) => (
                <TableRow
                  key={variant._id}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(0,245,160,0.06)'
                        : 'rgba(0,245,160,0.05)',
                    },
                  }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800 }}>
                    {variant.sku}
                  </TableCell>
                  <TableCell>
                  {variant.size ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {String(variant.size).split(',').map((size, i) => (
                        <Chip 
                          key={i} 
                          label={size.trim()} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 24,
                            '& .MuiChip-label': { px: 1 }
                          }} 
                        />
                      ))}
                    </Box>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {variant.color ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {String(variant.color).split(',').map((color, i) => (
                        <Chip 
                          key={i} 
                          label={color.trim()} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 24,
                            '& .MuiChip-label': { px: 1 },
                            backgroundColor: color.trim().toLowerCase() === 'white' ? '#f5f5f5' : 
                                           color.trim().toLowerCase() === 'black' ? '#212121' : 
                                           color.trim().toLowerCase(),
                            color: ['white', 'yellow', 'pink', 'lightblue', 'lightgreen', 'orange', 'red'].includes(color.trim().toLowerCase()) ? '#000' : '#fff'
                          }} 
                        />
                      ))}
                    </Box>
                  ) : '-'}
                </TableCell>
                  <TableCell align="right">₹{variant.basePrice?.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ₹{variant.price?.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${variant.stock} units`}
                      color={variant.stock > 0 ? 'success' : 'error'}
                      size="small"
                      variant={theme.palette.mode === 'dark' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={variant.isActive ? 'Active' : 'Inactive'}
                      color={variant.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(variant)}
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '0.8rem',
                          background: theme.palette.mode === 'dark' ? 'rgba(0,245,160,0.12)' : 'rgba(0,245,160,0.10)',
                          color: '#00f5a0',
                          '&:hover': { transform: 'scale(1.06)' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteVariant(variant._id)}
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '0.8rem',
                          ml: 0.5,
                          background: theme.palette.mode === 'dark' ? 'rgba(255,0,110,0.12)' : 'rgba(255,0,110,0.10)',
                          color: '#ff006e',
                          '&:hover': { transform: 'scale(1.06)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1.25rem',
            overflow: 'hidden',
            background: genZGradient,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`,
          },
        }}
      >
        <DialogTitle sx={{
          background: theme.palette.mode === 'dark' ? 'rgba(255,0,110,0.10)' : 'rgba(255,0,110,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}>
          <Box>
            <Typography variant="caption" sx={{
              fontWeight: 900,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              background: accentGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {isEditing ? 'Edit Variant' : 'Add New Variant'}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.mode === 'dark' ? '#fff' : '#0b0b14' }}>
              {isEditing ? 'Update details' : 'Create a new variant'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleCloseDialog}
            sx={{
              width: 36,
              height: 36,
              borderRadius: '0.9rem',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'}`,
              color: theme.palette.mode === 'dark' ? '#fff' : '#111',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Variant Identification Section */}
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Variant Identification
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SKU (Unique)"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="e.g., PROD-RED-L-001"
                    helperText="Unique identifier for this specific variant"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Sizes"
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    placeholder="e.g., S, M, L, XL"
                    helperText="Separate multiple sizes with commas"
                  />
                  {formData.size && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {String(formData.size).split(',').map((size, i) => (
                        <Chip 
                          key={i} 
                          label={size.trim()} 
                          size="small"
                          onDelete={() => {
                            const sizes = String(formData.size).split(',').filter((_, idx) => idx !== i);
                            handleInputChange('size', sizes.join(', '));
                          }}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Colors"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="e.g., Red, Blue, Black"
                    helperText="Separate multiple colors with commas"
                  />
                  {formData.color && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {String(formData.color).split(',').map((color, i) => (
                        <Chip 
                          key={i} 
                          label={color.trim()} 
                          size="small"
                          onDelete={() => {
                            const colors = String(formData.color).split(',').filter((_, idx) => idx !== i);
                            handleInputChange('color', colors.join(', '));
                          }}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            <Divider sx={dividerSx} />

            {/* Pricing Details Section */}
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Pricing Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Base Price"
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                    inputProps={{ step: '0.01' }}
                    helperText="Original price before taxes/discounts"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tax Type</InputLabel>
                    <Select
                      value={formData.taxType}
                      label="Tax Type"
                      onChange={(e) => handleInputChange('taxType', e.target.value)}
                    >
                      <MenuItem value="none">No Tax</MenuItem>
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="fixed">Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {formData.taxType !== 'none' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tax Value"
                      type="number"
                      value={formData.taxValue}
                      onChange={(e) => handleInputChange('taxValue', e.target.value)}
                      inputProps={{ step: '0.01' }}
                      placeholder={formData.taxType === 'percentage' ? '5' : '100'}
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Shipping Cost"
                    type="number"
                    value={formData.shippingCost}
                    onChange={(e) => handleInputChange('shippingCost', e.target.value)}
                    inputProps={{ step: '0.01' }}
                    placeholder="0.00"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={formData.discountType}
                      label="Discount Type"
                      onChange={(e) => handleInputChange('discountType', e.target.value)}
                    >
                      <MenuItem value="none">No Discount</MenuItem>
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="fixed">Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {formData.discountType !== 'none' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Discount Value"
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => handleInputChange('discountValue', e.target.value)}
                      inputProps={{ step: '0.01' }}
                      placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    bgcolor: '#f0f0f0',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Final Price:
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        background: successGradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      ₹{calculateFinalPrice()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={dividerSx} />

            {/* Inventory Section */}
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Inventory
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Stock Quantity"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    helperText="Available units for this variant"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={dividerSx} />

            {/* Description Section */}
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Description & Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextareaAutosize
                    minRows={4}
                    placeholder="Variant-specific description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      borderRadius: '14px',
                      border: theme.palette.mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.14)'
                        : '1px solid rgba(0,0,0,0.10)',
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.75)',
                      color: theme.palette.mode === 'dark' ? '#fff' : '#111',
                      outline: 'none',
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={dividerSx} />

            {/* Features Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Features
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddFeature}
                >
                  Add Feature
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {formData.features.map((feature, index) => (
                  <Grid
                    container
                    spacing={2}
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: '1rem',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}`,
                      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.70)',
                    }}
                  >
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Feature Name"
                        value={feature.name}
                        onChange={(e) => handleFeatureChange(index, 'name', e.target.value)}
                        placeholder="e.g., Water Resistant"
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={feature.description}
                        onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                        placeholder="e.g., IP67 rated"
                      />
                    </Grid>
                    <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                {formData.features.length === 0 && (
                  <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                    No features added yet
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Rating Section */}
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Rating
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Rating
                  value={formData.rating}
                  onChange={(e, newValue) => handleInputChange('rating', newValue)}
                  size="large"
                />
                <Typography variant="body2" color="textSecondary">
                  {formData.rating} / 5 stars
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Images Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Images
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formData.images.length} images uploaded
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                >
                  Upload Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </Button>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                {formData.images.map((image, index) => (
                  <Card key={index} sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={image.url}
                      alt={image.altText || `Image ${index + 1}`}
                    />
                    <CardActions sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Caption"
                        value={image.caption || ''}
                        onChange={(e) => handleImageMetadataChange(index, 'caption', e.target.value)}
                        placeholder="Image caption"
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Alt Text"
                        value={image.altText || ''}
                        onChange={(e) => handleImageMetadataChange(index, 'altText', e.target.value)}
                        placeholder="Alt text for accessibility"
                      />
                      <Button
                        fullWidth
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => handleRemoveImage(index)}
                      >
                        Remove
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
              {formData.images.length === 0 && (
                <Typography color="textSecondary" sx={{ fontStyle: 'italic', mt: 2 }}>
                  No images uploaded yet
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Status Section */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="Variant is Active"
              />
              <Typography variant="caption" color="textSecondary">
                Inactive variants won't be displayed to customers
              </Typography>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: '0.9rem',
              fontWeight: 900,
              textTransform: 'none',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,0,110,0.45)' : 'rgba(255,0,110,0.35)',
              color: '#ff006e',
              '&:hover': {
                borderColor: '#ff006e',
                background: theme.palette.mode === 'dark' ? 'rgba(255,0,110,0.12)' : 'rgba(255,0,110,0.08)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveVariant}
            variant="contained"
            sx={{
              borderRadius: '0.9rem',
              fontWeight: 900,
              textTransform: 'none',
              background: successGradient,
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            {isEditing ? 'Update' : 'Add'} Variant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VariantManager;
