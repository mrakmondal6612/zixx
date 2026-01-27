import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Button,
  Typography,
  Rating,
  useTheme,
  useMediaQuery,
  TextField,
  Grid,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  Autocomplete,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import Header from "@components/Header";
import VariantManager from "./VariantManager";
import NewProductCard from "./NewProductCard";
import { 
  useGetProductsQuery,
  useUpdateAdminProductMutation,
  useDeleteAdminProductMutation,
  useAddAdminProductMutation,
  useUploadAdminProductImageMutation,
} from "@state/api";
import { Add as AddIcon, Search as SearchIcon, Clear as ClearIcon, FilterList as FilterIcon } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

// Data interactions now handled via RTK Query hooks.

const Product = ({ product, onDelete, onUpdate, isNonMobile = true }) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(product);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Calculate variant count
  const variantCount = product.variants?.length || 0;
  
  // Get colors and sizes from product or variants
  const colors = Array.isArray(product.color) ? product.color : (product.color ? [product.color] : []);
  const sizes = Array.isArray(product.size) ? product.size : (product.size ? [product.size] : []);

  // Calculate price range for variant products
  const getPriceRange = () => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.basePrice || 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return minPrice === maxPrice ? `₹${minPrice.toFixed(0)}` : `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`;
    }
    return `₹${(product.basePrice || product.price || 0).toFixed(0)}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Normalize fields to match backend expectations
    const payload = { ...editedProduct };
    // subcategory mapping
    payload.subcategory = editedProduct.subCategory ?? editedProduct.subcategory ?? "";
    delete payload.subCategory;
    // images: ensure array of strings in `images` for backend normalization
    if (Array.isArray(editedProduct.image)) {
      payload.images = editedProduct.image;
    } else if (typeof editedProduct.image === "string") {
      payload.images = editedProduct.image
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // size: array
    if (Array.isArray(editedProduct.size)) {
      payload.size = editedProduct.size;
    } else if (typeof editedProduct.size === "string") {
      payload.size = editedProduct.size
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // color: array (schema field is `color`)
    if (Array.isArray(editedProduct.colors)) {
      payload.color = editedProduct.colors;
    } else if (typeof editedProduct.colors === "string") {
      payload.color = editedProduct.colors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(editedProduct.color)) {
      payload.color = editedProduct.color;
    } else if (typeof editedProduct.color === "string") {
      payload.color = editedProduct.color
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // features: array of strings (optional)
    if (Array.isArray(editedProduct.features)) {
      payload.features = editedProduct.features
        .map((s) => String(s).trim())
        .filter(Boolean);
    } else if (typeof editedProduct.features === "string") {
      payload.features = editedProduct.features
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // Handle pricing fields
    if (payload.basePrice !== undefined) payload.basePrice = Number(payload.basePrice);
    if (payload.tax) {
      payload.tax = {
        type: payload.tax.type || 'free',
        value: Number(payload.tax.value) || 0
      };
    }
    if (payload.shippingCost) {
      payload.shippingCost = {
        type: payload.shippingCost.type || 'free',
        value: Number(payload.shippingCost.value) || 0
      };
    }
    if (payload.discount) {
      payload.discount = {
        type: payload.discount.type || 'percentage',
        value: Number(payload.discount.value) || 0
      };
    }
    // stock -> supply mapping
    if (editedProduct.stock !== undefined || editedProduct.supply !== undefined) {
      const supplyVal = editedProduct.stock ?? editedProduct.supply ?? 1;
      payload.supply = Number(supplyVal);
    }
    // Cleanup fields not used by backend
    delete payload.image; // backend derives legacy `image` from `images`
    delete payload.colors;

    onUpdate(product._id, payload);
    setIsEditing(false);
  };

  return (
    <Card
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? `${theme.palette.background.alt}` : `${theme.palette.background.Card}`,
        borderRadius: "0.75rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
          borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent sx={{ pb: 1, flex: 1 }}>
        {/* Header with Category and Product Type Badge */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5, gap: 1 }}>
          <Typography
            sx={{ 
              fontSize: isMobile ? 11 : 12, 
              fontWeight: 700, 
              textTransform: "uppercase", 
              color: theme.palette.mode === "dark" ? `#F6F1C1` : `#665F0F`,
              letterSpacing: "0.5px"
            }}
          >
            {product.category}
          </Typography>
          <Chip 
            label={product.isParentProduct ? `${variantCount} Variants` : "Single"}
            size="small"
            variant={product.isParentProduct ? "filled" : "outlined"}
            color={product.isParentProduct ? "primary" : "default"}
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        </Box>

        {/* Product Title */}
        <Typography
          variant="body2"
          sx={{ 
            fontWeight: 600, 
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: "2.4em",
            lineHeight: 1.2,
            color: theme.palette.mode === "dark" ? "#fff" : "#000",
          }}
        >
          {product.title}
        </Typography>

        {/* Image Container */}
        <Box sx={{ 
          textAlign: "center", 
          mb: 1.5,
          borderRadius: "0.5rem",
          overflow: "hidden",
          background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f5f5f5",
          position: "relative",
          paddingBottom: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "180px",
        }}>
          <img
            src={product.image?.[0]}
            alt={product.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "8px",
              position: "absolute",
              top: 0,
              left: 0,
            }}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/200?text=No+Image";
            }}
          />
        </Box>

        {/* Editing Mode */}
        {isEditing ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: isNonMobile ? '1fr 1fr' : '1fr', gap: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              name="title"
              label="Title"
              value={editedProduct.title}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              name="category"
              label="Category"
              value={editedProduct.category}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              name="subCategory"
              label="Sub Category"
              value={editedProduct.subCategory ?? editedProduct.subcategory ?? ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              name="theme"
              label="Theme"
              value={editedProduct.theme}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              name="brand"
              label="Brand"
              value={editedProduct.brand}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              name="gender"
              label="Gender"
              value={editedProduct.gender}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              name="basePrice"
              label="Base Price (₹)"
              type="number"
              value={editedProduct.basePrice || editedProduct.price}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              name="stock"
              label="Stock Quantity"
              type="number"
              value={editedProduct.stock ?? editedProduct.supply ?? ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              margin="dense"
              colspan={isNonMobile ? "auto" : "1"}
              name="description"
              label="Description"
              multiline
              rows={3}
              value={editedProduct.description}
              onChange={handleInputChange}
              variant="outlined"
            />
            <Box sx={{ gridColumn: isNonMobile ? '1 / -1' : 'auto', display: 'grid', gridTemplateColumns: isNonMobile ? '1fr 1fr' : '1fr', gap: 2 }}>
              <TextField
                fullWidth
                margin="dense"
                name="size"
                label="Sizes (comma-separated)"
                value={Array.isArray(editedProduct.size) ? editedProduct.size.join(", ") : (editedProduct.size ?? "")}
                onChange={(e) =>
                  setEditedProduct((prev) => ({
                    ...prev,
                    size: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  }))
                }
                variant="outlined"
                size="small"
                placeholder="e.g., S, M, L, XL"
              />
              <TextField
                fullWidth
                margin="dense"
                name="color"
                label="Colors (comma-separated)"
                value={Array.isArray(editedProduct.colors) ? editedProduct.colors.join(", ") : (editedProduct.color ?? editedProduct.colors ?? "")}
                onChange={(e) =>
                  setEditedProduct((prev) => ({
                    ...prev,
                    color: e.target.value.split(",").map((c) => c.trim()).filter(Boolean),
                  }))
                }
                variant="outlined"
                size="small"
                placeholder="e.g., Red, Blue, Black"
              />
            </Box>
            <TextField
              fullWidth
              margin="dense"
              name="image"
              label="Image URLs (comma-separated)"
              multiline
              rows={2}
              value={editedProduct.image.join(", ")}
              onChange={(e) =>
                setEditedProduct((prev) => ({
                  ...prev,
                  image: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                }))
              }
              variant="outlined"
            />
            <TextField
              fullWidth
              margin="dense"
              name="features"
              label="Features (one per line)"
              multiline
              rows={3}
              value={Array.isArray(editedProduct.features) ? editedProduct.features.join("\n") : (editedProduct.features ?? "")}
              onChange={(e) =>
                setEditedProduct((prev) => ({
                  ...prev,
                  features: e.target.value.split("\n").map((f) => f.trim()).filter(Boolean),
                }))
              }
              variant="outlined"
            />
            <Box sx={{ gridColumn: isNonMobile ? '1 / -1' : 'auto', display: 'grid', gridTemplateColumns: isNonMobile ? '1fr 1fr 1fr' : '1fr', gap: 2 }}>
              <TextField
                fullWidth
                margin="dense"
                name="tax"
                label="Tax (type, value)"
                value={editedProduct.tax ? `${editedProduct.tax.type}, ${editedProduct.tax.value}` : 'free, 0'}
                helperText="e.g., percentage, 18"
                onChange={(e) => {
                  const [type, value] = e.target.value.split(',').map(s => s.trim());
                  setEditedProduct(prev => ({
                    ...prev,
                    tax: { type: type || 'free', value: Number(value) || 0 }
                  }));
                }}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                margin="dense"
                name="shippingCost"
                label="Shipping (type, value)"
                value={editedProduct.shippingCost ? `${editedProduct.shippingCost.type}, ${editedProduct.shippingCost.value}` : 'free, 0'}
                helperText="e.g., fixed, 50"
                onChange={(e) => {
                  const [type, value] = e.target.value.split(',').map(s => s.trim());
                  setEditedProduct(prev => ({
                    ...prev,
                    shippingCost: { type: type || 'free', value: Number(value) || 0 }
                  }));
                }}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                margin="dense"
                name="discount"
                label="Discount (type, value)"
                value={editedProduct.discount ? (typeof editedProduct.discount === 'object' ? `${editedProduct.discount.type}, ${editedProduct.discount.value}` : `percentage, ${editedProduct.discount}`) : 'percentage, 0'}
                helperText="e.g., percentage, 10"
                onChange={(e) => {
                  const [type, value] = e.target.value.split(',').map(s => s.trim());
                  setEditedProduct(prev => ({
                    ...prev,
                    discount: { type: type || 'percentage', value: Number(value) || 0 }
                  }));
                }}
                variant="outlined"
                size="small"
              />
            </Box>
            <FormControl fullWidth margin="dense" sx={{ gridColumn: isNonMobile ? '1 / -1' : 'auto' }}>
              <InputLabel>Product Type</InputLabel>
              <Select
                name="isParentProduct"
                value={editedProduct.isParentProduct ? "yes" : "no"}
                onChange={(e) => setEditedProduct(prev => ({
                  ...prev,
                  isParentProduct: e.target.value === "yes"
                }))}
                variant="outlined"
              >
                <MenuItem value="no">Single Product</MenuItem>
                <MenuItem value="yes">Parent Product (with Variants)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : (
          <>
            {/* Price Section */}
            <Box sx={{ mb: 1.5, p: 1, bgcolor: theme.palette.mode === "dark" ? "rgba(166,146,246,0.1)" : "rgba(135,6,143,0.05)", borderRadius: "0.5rem" }}>
              <Typography variant="caption" sx={{ color: theme.palette.mode === "dark" ? "#A692F6" : "#87068F", fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}>
                Price
              </Typography>
              <Typography
                variant="h6"
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.mode === "dark" ? "#A692F6" : "#87068F",
                  fontSize: isMobile ? "1.1rem" : "1.25rem",
                }}
              >
                {getPriceRange()}
              </Typography>
            </Box>

            {/* Quick Info Grid */}
            <Grid container spacing={0.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Brand</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.9rem" }}>{product.brand || "General"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Gender</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.9rem" }}>{product.gender || "All"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Stock</Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500, 
                    fontSize: "0.9rem",
                    color: product.supply > 10 ? "success.main" : product.supply > 0 ? "warning.main" : "error.main"
                  }}
                >
                  {product.supply || 0} units
                </Typography>
              </Grid>
              {colors.length > 0 && (
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Colors</Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.25 }}>
                    {colors.slice(0, 3).map((color) => (
                      <Chip
                        key={color}
                        label={color}
                        size="small"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                        variant="outlined"
                      />
                    ))}
                    {colors.length > 3 && (
                      <Chip
                        label={`+${colors.length - 3}`}
                        size="small"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Sizes */}
            {sizes.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase", mb: 0.5 }}>Available Sizes</Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {sizes.map((size) => (
                    <Chip
                      key={size}
                      label={size}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Description Preview */}
            {product.description && (
              <Typography
                variant="caption"
                sx={{ 
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "text.secondary",
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  mb: 1.5,
                  mt: 0.5,
                }}
              >
                {product.description}
              </Typography>
            )}
          </>
        )}
      </CardContent>

      {/* Card Actions */}
      <CardActions sx={{ pt: 1, pb: 1, px: 1.5, gap: 0.5, justifyContent: isMobile ? "space-between" : "flex-end" }}>
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              variant="contained"
              color="success"
              size="small"
              sx={{ fontSize: isMobile ? "0.7rem" : "0.8rem", flex: isMobile ? 1 : "auto", minWidth: isMobile ? "auto" : "70px" }}
            >
              {isMobile ? "✓" : "Save"}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outlined"
              color="error"
              size="small"
              sx={{ fontSize: isMobile ? "0.7rem" : "0.8rem", flex: isMobile ? 1 : "auto", minWidth: isMobile ? "auto" : "70px" }}
            >
              {isMobile ? "✕" : "Cancel"}
            </Button>
          </>
        ) : (
          <>
            <Tooltip title={isExpanded ? "Show less details" : "Show more details"}>
              <Button 
                size="small" 
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{ 
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  fontSize: isMobile ? "0.7rem" : "0.8rem",
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                {isExpanded ? "Less" : "More"}
              </Button>
            </Tooltip>
            <Tooltip title="Edit product">
              <Button
                variant="outlined"
                size="small"
                sx={{ 
                  fontSize: isMobile ? "0.7rem" : "0.8rem",
                  color: theme.palette.mode === "dark" ? "#0AC2F5" : "#033645",
                  borderColor: theme.palette.mode === "dark" ? "#0AC2F5" : "#033645",
                  fontWeight: 600,
                  flex: isMobile ? 1 : "auto",
                  minWidth: isMobile ? "auto" : "65px",
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(10,194,245,0.1)" : "rgba(3,54,69,0.05)",
                  }
                }}
                onClick={() => setIsEditing(true)}
              >
                {isMobile ? "✎" : "Edit"}
              </Button>
            </Tooltip>
            <Tooltip title="Delete product">
              <Button
                variant="outlined"
                size="small"
                sx={{ 
                  fontSize: isMobile ? "0.7rem" : "0.8rem",
                  color: theme.palette.mode === "dark" ? "#F86262" : "#8F0606",
                  borderColor: theme.palette.mode === "dark" ? "#F86262" : "#8F0606",
                  fontWeight: 600,
                  flex: isMobile ? 1 : "auto",
                  minWidth: isMobile ? "auto" : "75px",
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(248,98,98,0.1)" : "rgba(143,6,6,0.05)",
                  }
                }}
                onClick={() => onDelete(product._id)}
              >
                {isMobile ? "🗑" : "Delete"}
              </Button>
            </Tooltip>
          </>
        )}
      </CardActions>

      {/* Expanded Details */}
      <Collapse
        in={isExpanded}
        timeout="auto"
        unmountOnExit
        sx={{ borderTop: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}` }}
      >
        <CardContent sx={{ pt: 2, pb: 2 }}>
          {/* Metadata Grid */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem" }}>Product ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all", color: "text.primary" }}>
                  {product._id}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem" }}>Theme</Typography>
                <Typography variant="body2">{product.theme || "General"}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem" }}>Subcategory</Typography>
                <Typography variant="body2">{product.subcategory}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem" }}>Product Type</Typography>
                <Chip 
                  label={product.isParentProduct ? `Parent (${variantCount} Variants)` : "Single Product"} 
                  color={product.isParentProduct ? "primary" : "default"}
                  size="small"
                  sx={{ height: 24 }}
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Pricing Section */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>
            💰 Pricing Breakdown
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1, bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderRadius: "0.5rem" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>Base Price</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.mode === "dark" ? "#A692F6" : "#87068F" }}>
                  ₹{Number(product.basePrice || product.price).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            {product.discount && (
              <Grid item xs={12} sm={6} md={6}>
                <Box sx={{ p: 1, bgcolor: theme.palette.mode === "dark" ? "rgba(248,98,98,0.1)" : "rgba(248,98,98,0.08)", borderRadius: "0.5rem" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>Discount</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#F86262" }}>
                    {typeof product.discount === 'object' ? (
                      product.discount.type === 'percentage' ? `-${product.discount.value}%` : `₹${product.discount.value}`
                    ) : `${product.discount}%`}
                  </Typography>
                </Box>
              </Grid>
            )}
            {product.tax && (
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1, bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderRadius: "0.5rem" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>Tax</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {product.tax.type === 'percentage' ? `${product.tax.value}%` : 'Free'}
                  </Typography>
                </Box>
              </Grid>
            )}
            {product.shippingCost && (
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1, bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderRadius: "0.5rem" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>Shipping</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {product.shippingCost.type === 'fixed' ? `₹${product.shippingCost.value}` : 'Free'}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12}>
              <Box sx={{ p: 1, bgcolor: theme.palette.mode === "dark" ? "rgba(166,146,246,0.15)" : "rgba(135,6,143,0.1)", borderRadius: "0.5rem", borderLeft: `4px solid #A692F6` }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>Final Price</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.mode === "dark" ? "#A692F6" : "#87068F" }}>
                  ₹{Math.ceil(Number(product.price))}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Features */}
          {product.features && (Array.isArray(product.features) ? product.features.length > 0 : String(product.features).trim()) && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>
                ✨ Features
              </Typography>
              <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {Array.isArray(product.features) ? (
                  product.features.map((feature, idx) => (
                    <Chip
                      key={idx}
                      label={feature}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: "0.8rem" }}
                    />
                  ))
                ) : (
                  <Typography variant="body2">{String(product.features)}</Typography>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* Variant Management Section */}
          {product.isParentProduct && product.variants && product.variants.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", fontSize: "0.85rem", color: "text.secondary" }}>
                🔄 Variants ({variantCount})
              </Typography>
              <Box sx={{ 
                maxHeight: "300px", 
                overflowY: "auto", 
                mb: 2,
                border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
                borderRadius: "0.5rem",
                p: 1,
              }}>
                {product.variants.map((variant, idx) => (
                  <Box 
                    key={variant._id || idx} 
                    sx={{ 
                      p: 1, 
                      mb: 1, 
                      bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                      borderRadius: "0.4rem",
                      "&:last-child": { mb: 0 },
                      fontSize: "0.85rem",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Box sx={{ flex: 1, minWidth: "150px" }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase", color: "text.secondary" }}>
                          Size / Color
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {variant.size} - {variant.color}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase", color: "text.secondary" }}>
                          Price
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.mode === "dark" ? "#A692F6" : "#87068F" }}>
                          ₹{Number(variant.basePrice).toFixed(0)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", fontSize: "0.7rem", textTransform: "uppercase", color: "text.secondary" }}>
                          Stock
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: variant.stock > 5 ? "success.main" : variant.stock > 0 ? "warning.main" : "error.main"
                          }}
                        >
                          {variant.stock}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {product.isParentProduct && (
            <>
              <Divider sx={{ my: 2 }} />
              <VariantManager parentProductId={product._id} />
            </>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

const Products = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetProductsQuery();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateAdminProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteAdminProductMutation();
  const [addProduct, { isLoading: isAdding }] = useAddAdminProductMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadAdminProductImageMutation();
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    basePrice: "",
    taxType: "free",
    taxValue: "",
    shippingType: "free",
    shippingValue: "",
    discountType: "percentage",
    discountValue: "",
    price: "",
    category: "",
    subcategory: "",
    gender: "",
    images: "",
    size: "",
    colors: "",
    stock: "1",
    brand: "",
    theme: "",
    features: "",
    isParentProduct: false,
  });
  const [imagesList, setImagesList] = useState([]); // [{url, from:'url'|'uploaded', caption:'', alt:''}]
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [focusIndex, setFocusIndex] = useState(null);
  const genderOptions = ["men", "women", "kid"];
  const categoryOptions = [
    "Shirt",
    "T-Shirt",
    "Jeans",
    "Shoes",
    "Accessories",
    "Jacket",
    "Hoodie",
    "Saree",
    "Kurta",
  ];

  // Calculate final price whenever pricing fields change
  const calculatePrice = (base, taxT, taxV, shipT, shipV, discT, discV) => {
    let finalPrice = Number(base) || 0;
    
    // Add tax
    if (taxT === 'percentage' && taxV > 0) {
      finalPrice += (finalPrice * Number(taxV)) / 100;
    }
    
    // Add shipping
    if (shipT === 'fixed' && shipV > 0) {
      finalPrice += Number(shipV);
    }
    
    // Subtract discount
    if (discV > 0) {
      if (discT === 'percentage') {
        finalPrice -= (finalPrice * Number(discV)) / 100;
      } else if (discT === 'fixed') {
        finalPrice -= Number(discV);
      }
    }
    
    // Round up to nearest integer (upper bound) if there are decimal points
    // Example: 199.52 -> 200, 199.11 -> 200, 199.82 -> 200
    finalPrice = Math.ceil(Math.max(0, finalPrice));
    
    return finalPrice;
  };

  const handleNewChange = (e) => {
    const { name, value } = e.target;
    if (name === 'images') {
      const urls = value.split(",").map((s) => s.trim()).filter(Boolean);
      const prevUploaded = imagesList.filter((i) => i.from === 'uploaded');
      const prevUrlMap = new Map(imagesList.filter((i)=>i.from==='url').map((i)=>[i.url, i]));
      const newUrlEntries = urls.map((u)=> prevUrlMap.get(u) || { url: u, from: 'url', caption: '', alt: '' });
      setImagesList([...newUrlEntries, ...prevUploaded]);
    }
    
    const updatedProduct = { ...newProduct, [name]: value };
    
    // Recalculate price if pricing fields changed
    if (['basePrice', 'taxType', 'taxValue', 'shippingType', 'shippingValue', 'discountType', 'discountValue'].includes(name)) {
      updatedProduct.price = calculatePrice(
        updatedProduct.basePrice,
        updatedProduct.taxType,
        updatedProduct.taxValue,
        updatedProduct.shippingType,
        updatedProduct.shippingValue,
        updatedProduct.discountType,
        updatedProduct.discountValue
      );
    }
    
    setNewProduct(updatedProduct);
  };

  const handleAddSubmit = async () => {
    try {
      const structured = imagesList.map((i, idx) => ({ url: i.url, caption: i.caption || "", alt: i.alt || "", order: idx }));
      const sizeArr = newProduct.size.split(",").map((s) => s.trim()).filter(Boolean);
      const colorArr = newProduct.colors.split(",").map((s) => s.trim()).filter(Boolean);
      const featuresArr = String(newProduct.features || "")
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
      
      const imagesDetailed = imagesList.map((i, idx) => ({
        url: i.url,
        caption: i.caption || "",
        alt: i.alt || "",
        order: idx,
        size: i.size || null,
        color: i.color || null,
        price: i.price !== undefined ? Number(i.price) : null,
        stock: i.stock !== undefined ? Number(i.stock) : null,
      }));

      const body = {
        title: newProduct.title.trim(),
        description: newProduct.description.trim(),
        basePrice: Number(newProduct.basePrice),
        tax: {
          type: newProduct.taxType,
          value: newProduct.taxValue === "" ? 0 : Number(newProduct.taxValue)
        },
        shippingCost: {
          type: newProduct.shippingType,
          value: newProduct.shippingValue === "" ? 0 : Number(newProduct.shippingValue)
        },
        discount: {
          type: newProduct.discountType,
          value: newProduct.discountValue === "" ? 0 : Number(newProduct.discountValue)
        },
        category: newProduct.category.trim(),
        subcategory: newProduct.subcategory.trim(),
        gender: newProduct.gender.trim(),
        images: structured, // backend accepts objects and normalizes
        imagesDetailed: imagesDetailed, // include per-image metadata for backend to create child products
        size: sizeArr,
        colors: colorArr, // required by controller validation
        color: colorArr,  // persisted by schema (field name is `color`)
        supply: newProduct.stock === "" ? 1 : Number(newProduct.stock),
        brand: newProduct.brand.trim() || undefined,
        theme: newProduct.theme.trim() || undefined,
        ...(featuresArr.length ? { features: featuresArr } : {}),
        // Variants support: mark as parent product if user selected this option
        isParentProduct: newProduct.isParentProduct,
      };
      
      await addProduct({ body }).unwrap();
      
      setToast({ open: true, severity: "success", message: newProduct.isParentProduct ? "Parent product created. You can now add variants." : "Product added." });
      setAddOpen(false);
      setNewProduct({
        title: "", description: "", basePrice: "", taxType: "free", taxValue: "",
        shippingType: "free", shippingValue: "", discountType: "percentage", discountValue: "",
        price: "", category: "", subcategory: "", gender: "",
        images: "", size: "", colors: "", stock: "1", brand: "", theme: "", features: "", isParentProduct: false,
      });
      setImagesList([]);
      refetch();
    } catch (error) {
      setToast({ open: true, severity: "error", message: error?.data?.msg || "Failed to add product." });
    }
  };

  const handleDeviceFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      try {
        const res = await uploadImage({ file }).unwrap();
        if (res?.url) setImagesList((prev)=> [...prev, { url: res.url, from: 'uploaded', caption: '', alt: '' }]);
      } catch (err) {
        setToast({ open: true, severity: "error", message: err?.data?.message || "Image upload failed" });
      }
    }
    // reset input value so same file can be selected again if needed
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverIndex(null);
    // Files
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) {
      for (const file of files) {
        try {
          const res = await uploadImage({ file }).unwrap();
          if (res?.url) setImagesList((prev)=> [...prev, { url: res.url, from: 'uploaded', caption: '', alt: '' }]);
        } catch (err) {
          setToast({ open: true, severity: "error", message: err?.data?.message || "Image upload failed" });
        }
      }
    }
    // URLs/text
    const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (uri) {
      const parts = uri.split(/\s|\n|,/).map((s) => s.trim()).filter(Boolean);
      if (parts.length) {
        const prevUploaded = imagesList.filter((i)=>i.from==='uploaded');
        const prevUrlMap = new Map(imagesList.filter((i)=>i.from==='url').map((i)=>[i.url, i]));
        const currentUrls = imagesList.filter((i)=>i.from==='url').map(i=>i.url);
        const merged = Array.from(new Set([...currentUrls, ...parts]));
        const newUrlEntries = merged.map((u)=> prevUrlMap.get(u) || { url: u, from: 'url', caption: '', alt: '' });
        const finalList = [...newUrlEntries, ...prevUploaded];
        setImagesList(finalList);
        setNewProduct((p) => ({ ...p, images: finalList.filter(i=>i.from==='url').map(i=>i.url).join(", ") }));
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index) => {
    setImagesList((prev) => {
      const arr = prev.slice();
      arr.splice(index, 1);
      const urls = arr.filter(i=>i.from==='url').map(i=>i.url).join(", ");
      setNewProduct((p)=> ({ ...p, images: urls }));
      return arr;
    });
  };

  const handleDragStart = (index) => setDragIndex(index);
  const handleTileDragEnter = (index) => setDragOverIndex(index);
  const handleTileDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setImagesList((prev) => {
      const arr = prev.slice();
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(index, 0, moved);
      const urls = arr.filter(i=>i.from==='url').map(i=>i.url).join(", ");
      setNewProduct((p)=> ({ ...p, images: urls }));
      return arr;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const updateImageMeta = (index, key, value) => {
    setImagesList((prev)=> {
      const arr = prev.slice();
      arr[index] = { ...arr[index], [key]: value };
      return arr;
    });
  };

  const handleTileKeyDown = (e, index) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        setImagesList((prev) => {
          const arr = prev.slice();
          const [moved] = arr.splice(index, 1);
          arr.splice(index - 1, 0, moved);
          const urls = arr.filter(i=>i.from==='url').map(i=>i.url).join(", ");
          setNewProduct((p)=> ({ ...p, images: urls }));
          return arr;
        });
        setFocusIndex(index - 1);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setImagesList((prev) => {
        if (index >= prev.length - 1) return prev;
        const arr = prev.slice();
        const [moved] = arr.splice(index, 1);
        arr.splice(index + 1, 0, moved);
        const urls = arr.filter(i=>i.from==='url').map(i=>i.url).join(", ");
        setNewProduct((p)=> ({ ...p, images: urls }));
        return arr;
      });
      setFocusIndex(Math.min(imagesList.length - 1, index + 1));
    }
  };

  const handleUrlsPaste = (e) => {
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;
    const parts = text.split(/\r?\n|,/).map((s)=>s.trim()).filter(Boolean);
    if (parts.length <= 1) return; // allow normal paste if single
    e.preventDefault();
    const prevUploaded = imagesList.filter((i)=>i.from==='uploaded');
    const prevUrlMap = new Map(imagesList.filter((i)=>i.from==='url').map((i)=>[i.url, i]));
    const currentUrls = imagesList.filter((i)=>i.from==='url').map(i=>i.url);
    const merged = Array.from(new Set([...currentUrls, ...parts]));
    const newUrlEntries = merged.map((u)=> prevUrlMap.get(u) || { url: u, from: 'url', caption: '', alt: '' });
    const finalList = [...newUrlEntries, ...prevUploaded];
    setImagesList(finalList);
    setNewProduct((p)=> ({ ...p, images: finalList.filter(i=>i.from==='url').map(i=>i.url).join(', ') }));
  };

  const products = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  
  // Enhanced search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  
  // Get unique values for filters
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const uniqueGenders = [...new Set(products.map(p => p.gender).filter(Boolean))];
  
  const q = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    // Text search
    const matchesSearch = !q || [
      p.title,
      p.category,
      p.subcategory,
      p.brand,
      p.theme,
      p.gender,
      Array.isArray(p.color) ? p.color.join(", ") : p.color,
      p._id
    ].some((field) => (field || "").toString().toLowerCase().includes(q));
    
    // Category filter
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    
    // Gender filter
    const matchesGender = !genderFilter || p.gender === genderFilter;
    
    // Stock filter
    const matchesStock = !stockFilter || 
      (stockFilter === "in-stock" && (p.supply > 0)) ||
      (stockFilter === "out-of-stock" && (p.supply <= 0)) ||
      (stockFilter === "low-stock" && (p.supply > 0 && p.supply <= 5));
    
    return matchesSearch && matchesCategory && matchesGender && matchesStock;
  });
  
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setGenderFilter("");
    setStockFilter("");
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;
    try {
      await deleteProduct({ id }).unwrap();
      setToast({ open: true, severity: "success", message: "Product deleted." });
      refetch();
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      setToast({ open: true, severity: "error", message: "Failed to delete product." });
    }
  };

  const handleUpdate = async (id, updatedProduct) => {
    try {
      await updateProduct({ id, body: updatedProduct }).unwrap();
      setToast({ open: true, severity: "success", message: "Product updated." });
      refetch();
    } catch (error) {
      console.error("❌ Error updating product:", error);
      setToast({ open: true, severity: "error", message: "Failed to update product." });
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading products.</p>;
  return (
    <Box
      sx={{
        m: { xs: 2, sm: 2.5, md: 2 },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
      <Header title="PRODUCTS" subtitle="See your list of products." count={products.length} />
        <Box display="flex" gap={1}>
          <Tooltip title="Add new product with variants" >
            <span>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => navigate("/products/add")}
                sx={{
                  backgroundColor: "#4caf50",
                  "&:hover": {
                    backgroundColor: "#43a047",
                  },
                }}
              >
                New Product
              </Button>
            </span>
          </Tooltip>
          {/* <Tooltip title="Add a new product (dialog)" >
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddOpen(true)}
              >
                Add Product
              </Button>
            </span>
          </Tooltip> */}
        </Box>
      </Box>

      {/* Enhanced Search and Filters */}
      <Box mt={{ xs: 2, md: 3 }} mb={{ xs: 1.5, md: 2 }}>
        <Card sx={{
          boxShadow: theme.palette.mode === 'dark' ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
          border: `1px solid ${theme.palette.mode === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
          p: { xs: 1.5, sm: 2, md: 2.5 },
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.alt : theme.palette.background.paper,
          borderRadius: "0.75rem",
        }}>
          <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
            <FilterIcon color="primary" />
            <Typography variant="h6" sx={{
              color: theme.palette.mode === 'dark' ? 'white' : 'black',
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.1rem" },
            }}>
              Search & Filter
            </Typography>
            {(searchQuery || categoryFilter || genderFilter || stockFilter) && (
              <Chip
                label="Clear All"
                variant="outlined"
                size="small"
                icon={<ClearIcon />}
                onDelete={clearFilters}
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by title, category, brand, theme, color, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Filter Row */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {uniqueCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={genderFilter}
                  label="Gender"
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <MenuItem value="">All Genders</MenuItem>
                  {uniqueGenders.map((gender) => (
                    <MenuItem key={gender} value={gender}>{gender}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={stockFilter}
                  label="Stock Status"
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <MenuItem value="">All Stock</MenuItem>
                  <MenuItem value="in-stock">In Stock</MenuItem>
                  <MenuItem value="low-stock">Low Stock (≤5)</MenuItem>
                  <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Active Filters */}
          {(categoryFilter || genderFilter || stockFilter) && (
            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
                Active filters:
              </Typography>
              {categoryFilter && (
                <Chip
                  label={`Category: ${categoryFilter}`}
                  size="small"
                  onDelete={() => setCategoryFilter("")}
                  color="primary"
                  variant="outlined"
                />
              )}
              {genderFilter && (
                <Chip
                  label={`Gender: ${genderFilter}`}
                  size="small"
                  onDelete={() => setGenderFilter("")}
                  color="primary"
                  variant="outlined"
                />
              )}
              {stockFilter && (
                <Chip
                  label={`Stock: ${stockFilter.replace('-', ' ')}`}
                  size="small"
                  onDelete={() => setStockFilter("")}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Card>
      </Box>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }} mt={2}>
        {filteredProducts.map((product) => (
          <Grid
            item
            xs={6}    // 2 cards on mobile (6/12 = 50%)
            sm={6}    // 2 cards on small tablets
            md={4}    // 3 cards on medium screens
            lg={4}    // 3 cards on large screens
            xl={4}    // 3 cards on extra large screens
            key={product._id}
            sx={{
              '& > div': {  // Target the Card component
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }
            }}
          >
            <NewProductCard
              product={product}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              isNonMobile={isNonMobile}
            />
          </Grid>
        ))}
        {filteredProducts.length === 0 && (
          <Grid item xs={12}>
            <Card sx={{ 
              p: 4, 
              textAlign: "center",
              bgcolor: theme.palette.mode === "dark" ? theme.palette.background.alt : theme.palette.background.paper,
              border: `1px dashed ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
            }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                🔍 No Products Found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {searchQuery ? "Try adjusting your search terms" : "No products available yet"}
              </Typography>
              {/* <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setAddOpen(true)}
                sx={{ mt: 2 }}
              >
                Add First Product
              </Button> */}
            </Card>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
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

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Add New Product
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Fill in required fields. Images can be added via URLs or uploaded from your device.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <TextField fullWidth required label="Title" name="title" value={newProduct.title} onChange={handleNewChange} helperText="Product title (required)" />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                required 
                multiline 
                rows={6} 
                label="Description" 
                name="description" 
                value={newProduct.description} 
                onChange={handleNewChange} 
                helperText="Supports formatting: Use **bold**, *italic*, and line breaks. Example: **Features:**\n• Premium quality\n• Durable material" 
                placeholder="Enter product description with formatting...&#10;&#10;Use **text** for bold&#10;Use *text* for italic&#10;Use • for bullet points&#10;Press Enter for new lines"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={categoryOptions}
                value={newProduct.category}
                onInputChange={(_, val) => setNewProduct((p)=>({ ...p, category: val }))}
                renderInput={(params) => (
                  <TextField {...params} required label="Category" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Subcategory" name="subcategory" value={newProduct.subcategory} onChange={handleNewChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={genderOptions}
                value={newProduct.gender}
                onInputChange={(_, val) => setNewProduct((p)=>({ ...p, gender: val }))}
                renderInput={(params) => (
                  <TextField {...params} required label="Gender (men/women/kid)" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>Pricing Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                required 
                label="Base Price (Rs.)" 
                name="basePrice" 
                type="number" 
                value={newProduct.basePrice} 
                onChange={handleNewChange}
                helperText="Original product price"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Final Price (Rs.)" 
                value={newProduct.price}
                disabled
                helperText="Auto-calculated & rounded up to nearest whole number"
                InputProps={{
                  style: { fontWeight: 'bold', color: '#1976d2' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tax Type</InputLabel>
                <Select
                  name="taxType"
                  value={newProduct.taxType}
                  label="Tax Type"
                  onChange={handleNewChange}
                >
                  <MenuItem value="free">Free (No Tax)</MenuItem>
                  <MenuItem value="percentage">Percentage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField 
                fullWidth 
                label="Tax %" 
                name="taxValue" 
                type="number" 
                value={newProduct.taxValue} 
                onChange={handleNewChange}
                disabled={newProduct.taxType === 'free'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Shipping</InputLabel>
                <Select
                  name="shippingType"
                  value={newProduct.shippingType}
                  label="Shipping"
                  onChange={handleNewChange}
                >
                  <MenuItem value="free">Free Shipping</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField 
                fullWidth 
                label="Amount (Rs.)" 
                name="shippingValue" 
                type="number" 
                value={newProduct.shippingValue} 
                onChange={handleNewChange}
                disabled={newProduct.shippingType === 'free'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  name="discountType"
                  value={newProduct.discountType}
                  label="Discount Type"
                  onChange={handleNewChange}
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed (Rs.)</MenuItem>
                  <MenuItem value="coupon">Coupon (at checkout)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField 
                fullWidth 
                label={newProduct.discountType === 'percentage' ? 'Discount %' : 'Discount (Rs.)'}
                name="discountValue" 
                type="number" 
                value={newProduct.discountValue} 
                onChange={handleNewChange}
                disabled={newProduct.discountType === 'coupon'}
                helperText={newProduct.discountType === 'coupon' ? 'Applied at checkout' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Stock (quantity)" name="stock" type="number" value={newProduct.stock} onChange={handleNewChange} helperText="Default 1. 0 means Out of Stock. Leave as 1 for parent products." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newProduct.isParentProduct}
                    onChange={(e) => setNewProduct((p) => ({ ...p, isParentProduct: e.target.checked }))}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Product with Variants</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Enable if this product has multiple size/color options</Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Images</Typography>
              <TextField fullWidth label="Image URLs (comma separated)" name="images" value={newProduct.images} onChange={handleNewChange} onPaste={handleUrlsPaste} helperText="Paste multiple URLs (commas or new lines). Drag to reorder below." />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Button variant="outlined" component="label" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload from device'}
                  <input hidden accept="image/*" multiple type="file" onChange={handleDeviceFiles} />
                </Button>
              </Box>
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                sx={{
                  mt: 1.5,
                  p: 2,
                  border: '2px dashed',
                  borderColor: isDragOver ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                  color: 'text.secondary',
                  bgcolor: isDragOver ? 'action.hover' : 'transparent',
                }}
              >
                Drag & drop images or URLs here
              </Box>
              {imagesList.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                  {imagesList.map((img, idx) => (
                    <Box
                      key={`img-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e)=> e.preventDefault()}
                      onDragEnter={() => handleTileDragEnter(idx)}
                      onDrop={() => handleTileDrop(idx)}
                      tabIndex={0}
                      onFocus={() => setFocusIndex(idx)}
                      onKeyDown={(e)=> handleTileKeyDown(e, idx)}
                      sx={{ width: 160, borderRadius: 1, border: '2px solid', borderColor: (dragOverIndex===idx? 'primary.main' : 'rgba(0,0,0,0.08)'), p: 1, outline: (focusIndex===idx? '2px solid rgba(25,118,210,0.6)' : 'none') }}
                    >
                      <Box sx={{ position: 'relative', width: '100%', height: 84, borderRadius: 1, overflow: 'hidden', bgcolor: '#f5f5f5' }}>
                        <Box sx={{ position: 'absolute', top: 2, left: 2, bgcolor: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: 1, px: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DragIndicatorIcon fontSize="small" />
                          <Typography variant="caption">Drag</Typography>
                        </Box>
                        <img src={img.url} alt={img.alt || 'preview'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton size="small" onClick={() => removeImage(idx)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                          <TextField size="small" placeholder="Caption" value={img.caption} onChange={(e)=> updateImageMeta(idx, 'caption', e.target.value)} sx={{ mt: 1 }} fullWidth />
                          <TextField size="small" placeholder="Alt text" value={img.alt} onChange={(e)=> updateImageMeta(idx, 'alt', e.target.value)} sx={{ mt: 1 }} fullWidth />
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                              <TextField size="small" placeholder="Size" value={img.size || ''} onChange={(e)=> updateImageMeta(idx, 'size', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField size="small" placeholder="Color" value={img.color || ''} onChange={(e)=> updateImageMeta(idx, 'color', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField size="small" placeholder="Price (Rs.)" type="number" value={img.price ?? ''} onChange={(e)=> updateImageMeta(idx, 'price', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField size="small" placeholder="Stock" type="number" value={img.stock ?? ''} onChange={(e)=> updateImageMeta(idx, 'stock', e.target.value)} fullWidth />
                            </Grid>
                          </Grid>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Sizes (comma separated)" name="size" value={newProduct.size} onChange={handleNewChange} helperText="Example: S, M, L, XL" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Colors (comma separated)" name="colors" value={newProduct.colors} onChange={handleNewChange} helperText="Example: red, blue, black" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Brand" name="brand" value={newProduct.brand} onChange={handleNewChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Theme" name="theme" value={newProduct.theme} onChange={handleNewChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features"
                name="features"
                value={newProduct.features}
                onChange={handleNewChange}
                helperText="Supports formatting: Use **bold**, *italic*, and line breaks. Each line will be a bullet point. Example: **Premium Quality**\n*Soft and comfortable*\nMachine washable"
                placeholder="Enter product features with formatting...&#10;&#10;Use **text** for bold&#10;Use *text* for italic&#10;Each new line becomes a bullet point&#10;&#10;Example:&#10;**100% Cotton**&#10;*Breathable* fabric&#10;Machine washable"
                multiline
                rows={5}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={isAdding || isUploading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSubmit}
            disabled={
              isAdding || isUploading ||
              !newProduct.title.trim() ||
              !newProduct.description.trim() ||
              !newProduct.category.trim() ||
              !newProduct.subcategory.trim() ||
              !newProduct.gender.trim() ||
              !newProduct.basePrice || Number(newProduct.basePrice) <= 0 ||
              (imagesList.length === 0) ||
              // For parent products, size/color are added later via variants
              // For regular products, size/color are required
              (!newProduct.isParentProduct && newProduct.size.split(',').map(s=>s.trim()).filter(Boolean).length === 0) ||
              (!newProduct.isParentProduct && newProduct.colors.split(',').map(s=>s.trim()).filter(Boolean).length === 0) ||
              !newProduct.brand.trim() ||
              !newProduct.theme.trim()
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
