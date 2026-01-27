import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  IconButton,
  useTheme,
  Divider,
  Stack,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import Header from "@components/Header";
import VariantCard from "./VariantCard";
import { useAddAdminProductMutation } from "@state/api";

const ProductAddForm = ({ onSubmit, onCancel }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  // Get token from Redux or localStorage
  const reduxToken = useSelector((state) => state.auth?.token);
  const token = reduxToken || (typeof window !== 'undefined' ? localStorage.getItem("token") : null);
  const [addProduct, { isLoading: isAdding }] = useAddAdminProductMutation();
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  // Main product form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    features: "",
    category: "",
    subcategory: "",
    gender: "",
    brand: "",
    theme: "",
  });

  // Variants state
  const [variants, setVariants] = useState([]);

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Category options (can be fetched from API)
  const categories = ["Men", "Women", "Kids", "Accessories"];
  const subCategories = {
    Men: ["Shirts", "T-Shirts", "Pants", "Jeans", "Shoes", "Jackets", "Hoodies", "Sweaters"],
    Women: ["Dresses", "Tops", "T-Shirts", "Pants", "Jeans", "Skirts", "Shoes", "Jackets"],
    Kids: ["Shirts", "T-Shirts", "Pants", "Shoes", "Jackets", "Dresses"],
    Accessories: ["Bags", "Belts", "Hats", "Scarves", "Watches", "Sunglasses"],
  };
  const genders = ["Male", "Female", "Unisex"];
  const themes = ["Casual", "Formal", "Sports", "Party", "Ethnic", "Designer"];

  // Handle main form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Add new variant
  const handleAddVariant = () => {
    const newVariant = {
      id: Date.now(),
      title: "",
      description: "",
      images: [null, null, null],
      size: "",
      stock: 0,
      color: "",
      basePrice: 0,
      finalPrice: 0,
      shippingPrice: 0,
      discount: 0,
      tax: 0,
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  // Update variant
  const handleUpdateVariant = (id, updatedVariant) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? updatedVariant : v))
    );
  };

  // Remove variant
  const handleRemoveVariant = (id) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Product title is required";
    if (!formData.description.trim())
      newErrors.description = "Product description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subcategory) newErrors.subcategory = "Subcategory is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (variants.length === 0)
      newErrors.variants = "At least one variant is required";
    
    // Validate each variant has images, sizes, and colors
    variants.forEach((v, idx) => {
      if (!v.images || v.images.filter(img => img !== null).length === 0) {
        newErrors[`variant_${idx}_images`] = `Variant ${idx + 1} needs at least one image`;
      }
      if (!v.size || !String(v.size).trim()) {
        newErrors[`variant_${idx}_size`] = `Variant ${idx + 1} needs a size`;
      }
      if (!v.color || !String(v.color).trim()) {
        newErrors[`variant_${idx}_color`] = `Variant ${idx + 1} needs a color`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        // First, upload all images to Cloudinary
        console.log("📤 Uploading images to Cloudinary...");
        const uploadedVariants = await Promise.all(
          variants.map(async (v) => {
            // Upload images and get URLs
            const uploadedImages = await Promise.all(
              v.images
                .filter(img => img !== null)
                .map(async (imageData) => {
                  // Check if already a URL (starts with http)
                  if (imageData.startsWith('http')) {
                    return imageData;
                  }
                  
                  // Upload base64 image
                  try {
                    const formData = new FormData();
                    // Convert base64 to blob
                    const arr = imageData.split(',');
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    const n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    for (let i = 0; i < n; i++) {
                      u8arr[i] = bstr.charCodeAt(i);
                    }
                    const blob = new Blob([u8arr], { type: mime });
                    
                    formData.append('image', blob);
                    
                    const uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_SERVER}/admin/products/upload`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                      body: formData,
                    });
                    
                    if (!uploadResponse.ok) {
                      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
                    }
                    
                    const uploadedData = await uploadResponse.json();
                    console.log("✅ Image uploaded:", uploadedData.url);
                    return uploadedData.url;
                  } catch (uploadError) {
                    console.error("❌ Image upload error:", uploadError);
                    throw uploadError;
                  }
                })
            );

            return {
              title: v.title,
              description: v.description,
              images: uploadedImages,
              size: String(v.size || '').trim(),
              stock: v.stock,
              color: String(v.color || '').trim(),
              basePrice: parseFloat(v.basePrice),
              shippingPrice: parseFloat(v.shippingPrice),
              discount: parseFloat(v.discount),
              tax: parseFloat(v.tax),
            };
          })
        );

        console.log("✅ All images uploaded, creating product...");

        const body = {
          title: formData.title,
          description: formData.description,
          features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : [],
          category: formData.category,
          subcategory: formData.subcategory,
          gender: formData.gender,
          brand: formData.brand,
          theme: formData.theme,
          basePrice: uploadedVariants[0]?.basePrice || 0, // Use first variant's base price
          isParentProduct: true,
          variants: uploadedVariants,
          images: uploadedVariants[0]?.images || [],
        };

        console.log("📝 Submitting product with URLs:", body);

        await addProduct({ body }).unwrap();
        
        setToast({ 
          open: true, 
          severity: "success", 
          message: "Product with variants created successfully!" 
        });
        
        setTimeout(() => {
          navigate("/products");
        }, 1500);
      } catch (error) {
        console.error("❌ Error:", error);
        
        // Better error message
        let errorMsg = "Failed to create product";
        
        if (error?.data?.msg) {
          errorMsg = error.data.msg;
        } else if (error?.data?.error) {
          errorMsg = error.data.error;
        } else if (error?.message) {
          errorMsg = error.message;
        } else if (error?.status === 401 || error?.status === 403) {
          errorMsg = "Session expired. Please log in again.";
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
        
        setToast({ 
          open: true, 
          severity: "error", 
          message: errorMsg 
        });
      }
    }
  };

  const handleCancel = () => {
    navigate("/products");
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Header title="ADD NEW PRODUCT" subtitle="Create a new product with variants" />

      <Card
        sx={{
          mt: 3,
          backgroundColor: theme.palette.background.paper,
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Product Title */}
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Product Title
          </Typography>
          <TextField
            fullWidth
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter product title"
            error={!!errors.title}
            helperText={errors.title}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />

          {/* Product Description & Features */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Product Description
              </Typography>
              <TextField
                fullWidth
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Features
              </Typography>
              <TextField
                fullWidth
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="Enter key features"
                multiline
                rows={4}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Category, Subcategory, Gender */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="category"
                label="Category"
                value={formData.category}
                onChange={handleInputChange}
                error={!!errors.category}
                helperText={errors.category || "Enter category (e.g., Men, Women, Kids)"}
                placeholder="e.g., Men"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="subcategory"
                label="Sub-Category"
                value={formData.subcategory}
                onChange={handleInputChange}
                error={!!errors.subcategory}
                helperText={errors.subcategory || "Enter subcategory (e.g., Shirts, Jeans)"}
                placeholder="e.g., Shirts"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  label="Gender"
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  {genders.map((gen) => (
                    <MenuItem key={gen} value={gen}>
                      {gen}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Brand & Theme */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Enter brand name"
                label="Brand"
                error={!!errors.brand}
                helperText={errors.brand}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  name="theme"
                  value={formData.theme}
                  onChange={handleInputChange}
                  label="Theme"
                >
                  <MenuItem value="">Select Theme</MenuItem>
                  {themes.map((thm) => (
                    <MenuItem key={thm} value={thm}>
                      {thm}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Variants Section */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                p: 2,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(100, 200, 255, 0.1)"
                    : "rgba(100, 200, 255, 0.05)",
                borderRadius: "8px",
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                }}
              >
                Add Product Variants
              </Typography>
              <IconButton
                onClick={handleAddVariant}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: "white",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                <AddIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Box>

            {errors.variants && (
              <Typography color="error" sx={{ mb: 2 }}>
                {errors.variants}
              </Typography>
            )}

            {/* Variants Grid */}
            <Grid container spacing={3}>
              {variants.map((variant, index) => (
                <Grid item xs={12} md={6} key={variant.id}>
                  <VariantCard
                    variant={variant}
                    index={index}
                    onUpdate={(updatedVariant) =>
                      handleUpdateVariant(variant.id, updatedVariant)
                    }
                    onRemove={() => handleRemoveVariant(variant.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
              mt: 4,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isAdding}
              sx={{
                borderRadius: "8px",
                px: 4,
                py: 1.5,
                textTransform: "capitalize",
                fontSize: "16px",
                fontWeight: 600,
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                "&:hover": {
                  backgroundColor: theme.palette.error.main,
                  color: "white",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isAdding}
              sx={{
                borderRadius: "8px",
                px: 4,
                py: 1.5,
                textTransform: "capitalize",
                fontSize: "16px",
                fontWeight: 600,
                backgroundColor: theme.palette.success.main,
                color: "white",
                "&:hover": {
                  backgroundColor: theme.palette.success.dark,
                },
              }}
            >
              {isAdding ? "Creating..." : "Add Product"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductAddForm;
