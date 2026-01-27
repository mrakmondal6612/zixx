import { Box, Card, CardContent, Typography, Button, Grid, Chip, TextField, IconButton, Dialog } from "@mui/material";
import { useEffect, useState } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import VariantManager from "./VariantManager";

const NewProduct = ({ product, onDelete, onUpdate, isNonMobile = true }) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [variantManagerOpen, setVariantManagerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const variantCount = product?.variants?.length || 0;
  const colors = Array.isArray(product?.color)
    ? product.color
    : product?.color
      ? String(product.color)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const sizes = Array.isArray(product?.size)
    ? product.size
    : product?.size
      ? String(product.size)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const getInitialEditedProduct = () => ({
    ...product,
    title: product?.title ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    subcategory: product?.subcategory ?? product?.subCategory ?? "",
    gender: product?.gender ?? "",
    brand: product?.brand ?? "",
    theme: product?.theme ?? "",
    basePrice: product?.basePrice ?? (product?.price ? (product.price - (product.shippingCharge || 0)) : ""),
    shippingCharge: product?.shippingCharge ?? (product?.price && product?.basePrice ? (product.price - product.basePrice) : ""),
    stock: product?.supply ?? product?.stock ?? "",
    size: Array.isArray(product?.size)
      ? product.size
      : product?.size
        ? String(product.size)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    color: Array.isArray(product?.color)
      ? product.color
      : product?.color
        ? String(product.color)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    images: Array.isArray(product?.images)
      ? product.images.map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
      : Array.isArray(product?.image)
        ? product.image.filter(Boolean)
        : typeof product?.image === "string"
          ? product.image
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
    features: Array.isArray(product?.features)
      ? product.features.map((f) => String(f))
      : product?.features
        ? String(product.features)
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
  });

  const [editedProduct, setEditedProduct] = useState(getInitialEditedProduct());

  useEffect(() => {
    setEditedProduct(getInitialEditedProduct());
    setSelectedImage(null);
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const payload = { ...editedProduct };

    payload.subcategory = editedProduct.subcategory ?? editedProduct.subCategory ?? "";
    delete payload.subCategory;

    // Handle base price and shipping charge calculation
    const basePrice = payload.basePrice === "" || payload.basePrice === null || payload.basePrice === undefined
      ? 0
      : Number(payload.basePrice);
    
    const shippingCharge = payload.shippingCharge === "" || payload.shippingCharge === null || payload.shippingCharge === undefined
      ? 0
      : Number(payload.shippingCharge);
    
    payload.price = basePrice + shippingCharge; // Calculate final price
    payload.basePrice = basePrice; // Save base price separately

    // Handle stock/supply
    payload.supply = payload.stock === "" || payload.stock === null || payload.stock === undefined
      ? 0
      : Math.max(0, Math.floor(Number(payload.stock))); // Ensure stock is a non-negative integer
    delete payload.stock;

    payload.size = Array.isArray(payload.size)
      ? payload.size
      : typeof payload.size === "string"
        ? payload.size.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    payload.color = Array.isArray(payload.color)
      ? payload.color
      : typeof payload.color === "string"
        ? payload.color.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

    payload.features = Array.isArray(payload.features)
      ? payload.features.map((s) => String(s).trim()).filter(Boolean)
      : typeof payload.features === "string"
        ? payload.features.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean)
        : [];

    payload.images = Array.isArray(payload.images)
      ? payload.images.map((u) => String(u).trim()).filter(Boolean)
      : typeof payload.images === "string"
        ? payload.images.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean)
        : [];

    delete payload.image;

    onUpdate(product._id, payload);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedProduct(getInitialEditedProduct());
    setIsEditing(false);
  };

  // Gen-Z color palette
  const genZGradient = theme.palette.mode === "dark" 
    ? "linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%)" 
    : "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)";

  const accentGradient = "linear-gradient(135deg, #ff006e 0%, #fb5607 50%, #ffbe0b 100%)";
  const successGradient = "linear-gradient(135deg, #00f5a0 0%, #00d4ff 100%)";
  const errorGradient = "linear-gradient(135deg, #ff006e 0%, #ff4757 100%)";

  return (
    <Card
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "0.6rem",
        overflow: "hidden",
        boxShadow: isEditing
          ? "0 2px 10px -2px rgba(0, 0, 0, 0.1)"
          : "0 1px 4px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.03)"}`,
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: isEditing
            ? "0 3px 12px -1px rgba(0, 0, 0, 0.1)"
            : "0 2px 8px rgba(0, 0, 0, 0.06)",
        },
      }}
    >
      <CardContent sx={{ 
        p: isMobile ? '12px' : isTablet ? '16px' : '20px',
        '&.MuiCardContent-root': {
          padding: isMobile ? '12px' : isTablet ? '16px' : '20px',
          '&:last-child': {
            pb: isMobile ? '12px' : isTablet ? '16px' : '20px'
          }
        }
      }}>
        {/* Product Image Section */}
        {!isEditing && (product.images?.length > 0 || product.image?.length > 0) && (
          <Box sx={{ mb: 2, borderRadius: "0.6rem", overflow: "hidden" }}>
            <Box
              component="img"
              src={
                selectedImage ||
                (product.images && product.images[0]?.url) ||
                (product.image && product.image[0]) ||
                "https://via.placeholder.com/300x300?text=No+Image"
              }
              alt={product.title || "Product"}
              sx={{
                width: "100%",
                height: isMobile ? 160 : isTablet ? 180 : 200,
                objectFit: "cover",
                borderRadius: "0.6rem",
                transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "&:hover": {
                  transform: "scale(1.03)",
                },
              }}
            />
            {/* Image Thumbnails */}
            {((product.images && product.images.length > 1) || (product.image && product.image.length > 1)) && (
              <Box sx={{ display: "flex", gap: 0.5, p: 0.75, overflowX: "auto", pb: 1 }}>
                
                {(product.image || []).map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    sx={{
                      width: 40,
                      height: 40,
                      minWidth: 40,
                      borderRadius: "0.4rem",
                      overflow: "hidden",
                      cursor: "pointer",
                      opacity: selectedImage === img ? 1 : 0.6,
                      border: `1.5px solid ${selectedImage === img ? "#00f5a0" : "transparent"}`,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        opacity: 1,
                        transform: "scale(1.08)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "0.4rem",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Header - Modern Gen-Z Style */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          mb: 2.5, 
          pb: 2, 
          borderBottom: `2px dashed ${theme.palette.mode === "dark" ? "rgba(255, 0, 110, 0.15)" : "rgba(255, 0, 110, 0.1)"}`,
          gap: 1,
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          <Chip 
            label={product.isParentProduct ? `${variantCount} variants` : "Single"}
            sx={{ 
              background: successGradient, 
              color: "white", 
              fontWeight: 700, 
              fontSize: "0.75rem",
              height: 28,
            }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              flex: isMobile ? "1 0 100%" : 1,
              background: accentGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: isMobile ? "1.1rem" : "1.3rem",
            }}
          >
            Product
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleStartEdit}
              sx={{ 
                background: theme.palette.mode === "dark" ? "rgba(0, 245, 160, 0.1)" : "rgba(0, 245, 160, 0.08)",
                color: "#00f5a0",
                transition: "all 0.3s ease",
                "&:hover": { 
                  background: theme.palette.mode === "dark" ? "rgba(0, 245, 160, 0.2)" : "rgba(0, 245, 160, 0.15)",
                  transform: "scale(1.1)"
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(product._id)}
              sx={{ 
                background: theme.palette.mode === "dark" ? "rgba(255, 0, 110, 0.1)" : "rgba(255, 0, 110, 0.08)",
                color: "#ff006e",
                transition: "all 0.3s ease",
                "&:hover": { 
                  background: theme.palette.mode === "dark" ? "rgba(255, 0, 110, 0.2)" : "rgba(255, 0, 110, 0.15)",
                  transform: "scale(1.1)"
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Edit Mode */}
        {isEditing ? (
          <Box sx={{
            borderRadius: "1rem",
            border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"}`,
            background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.65)",
            p: isMobile ? 1.25 : 1.75,
          }}>
            <Box sx={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 1.25 }}>
              <TextField fullWidth label="ID" value={product._id} disabled size="small" />
              <TextField fullWidth label="Title" name="title" value={editedProduct.title} onChange={handleInputChange} size="small" />

              <TextField 
                fullWidth 
                label="Category" 
                name="category" 
                value={editedProduct.category} 
                onChange={handleInputChange} 
                size="small" 
                inputProps={{ list: 'categories' }}
              />
              <datalist id="categories">
                <option value="Men's Fashion" />
                <option value="Women's Fashion" />
                <option value="Electronics" />
                <option value="Home & Living" />
                <option value="Beauty" />
                <option value="Sports" />
              </datalist>
              <TextField 
                fullWidth 
                label="Subcategory" 
                name="subcategory" 
                value={editedProduct.subcategory} 
                onChange={handleInputChange} 
                size="small" 
              />

              <TextField fullWidth label="Gender" name="gender" value={editedProduct.gender} onChange={handleInputChange} size="small" />
              <TextField fullWidth label="Brand" name="brand" value={editedProduct.brand} onChange={handleInputChange} size="small" />

              <TextField fullWidth label="Theme" name="theme" value={editedProduct.theme} onChange={handleInputChange} size="small" />
              <TextField 
                fullWidth 
                label="Base Price (₹)" 
                name="basePrice" 
                type="number" 
                value={editedProduct.basePrice} 
                onChange={handleInputChange} 
                size="small" 
                inputProps={{ min: 0, step: '0.01' }}
              />
              <TextField 
                fullWidth 
                label="Shipping Charge (₹)" 
                name="shippingCharge" 
                type="number" 
                value={editedProduct.shippingCharge || ''} 
                onChange={handleInputChange} 
                size="small"
                inputProps={{ min: 0, step: '0.01' }}
              />
              <TextField 
                fullWidth 
                label="Final Price (₹)" 
                value={(
                  (Number(editedProduct.basePrice) || 0) + 
                  (Number(editedProduct.shippingCharge) || 0)
                ).toFixed(2)} 
                disabled 
                size="small" 
              />

              <TextField 
                fullWidth 
                label="Stock" 
                name="stock" 
                type="number" 
                value={editedProduct.stock} 
                onChange={handleInputChange} 
                size="small" 
                inputProps={{ min: 0, step: 1 }}
              />
              <TextField
                fullWidth
                label="Sizes (comma-separated)"
                name="size"
                value={Array.isArray(editedProduct.size) ? editedProduct.size.join(", ") : (editedProduct.size ?? "")}
                onChange={(e) => setEditedProduct((prev) => ({
                  ...prev,
                  size: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                }))}
                size="small"
              />

              <TextField
                fullWidth
                label="Colors (comma-separated)"
                name="color"
                value={Array.isArray(editedProduct.color) ? editedProduct.color.join(", ") : (editedProduct.color ?? "")}
                onChange={(e) => setEditedProduct((prev) => ({
                  ...prev,
                  color: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                }))}
                size="small"
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Image URLs (comma/newline separated)"
                name="images"
                value={Array.isArray(editedProduct.images) ? editedProduct.images.join("\n") : (editedProduct.images ?? "")}
                onChange={(e) => setEditedProduct((prev) => ({
                  ...prev,
                  images: e.target.value.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean),
                }))}
                size="small"
                sx={{ gridColumn: isMobile ? "1" : "1 / -1" }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={editedProduct.description}
                onChange={handleInputChange}
                size="small"
                sx={{ gridColumn: isMobile ? "1" : "1 / -1" }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Features (one per line)"
                name="features"
                value={Array.isArray(editedProduct.features) ? editedProduct.features.join("\n") : (editedProduct.features ?? "")}
                onChange={(e) => setEditedProduct((prev) => ({
                  ...prev,
                  features: e.target.value.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean),
                }))}
                size="small"
                sx={{ gridColumn: isMobile ? "1" : "1 / -1" }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexDirection: isMobile ? "column" : "row" }}>
              <Button
                variant="contained"
                onClick={handleSave}
                fullWidth
                sx={{
                  background: successGradient,
                  fontWeight: 800,
                  py: 1.1,
                  borderRadius: "0.9rem",
                  "&:hover": { transform: "translateY(-1px)" },
                }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancelEdit}
                fullWidth
                sx={{
                  fontWeight: 800,
                  py: 1.1,
                  borderRadius: "0.9rem",
                  borderColor: theme.palette.mode === "dark" ? "rgba(255,0,110,0.45)" : "rgba(255,0,110,0.35)",
                  color: "#ff006e",
                  "&:hover": {
                    borderColor: "#ff006e",
                    background: theme.palette.mode === "dark" ? "rgba(255,0,110,0.12)" : "rgba(255,0,110,0.08)",
                  },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Title Section */}
            <Box sx={{ 
              mb: 2, 
              p: isMobile ? 1 : 1.5, 
              background: theme.palette.mode === "dark" ? "rgba(0, 245, 160, 0.08)" : "rgba(0, 245, 160, 0.05)",
              borderRadius: "0.8rem",
              border: `1.5px solid ${theme.palette.mode === "dark" ? "rgba(0, 245, 160, 0.15)" : "rgba(0, 245, 160, 0.1)"}`,
              transition: "all 0.3s ease"
            }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#00f5a0", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>📝 Product Title</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, fontSize: isMobile ? "0.9rem" : "0.95rem", color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                {product.title}
              </Typography>
            </Box>

            {/* Description Section */}
            <Box sx={{ 
              mb: 2, 
              p: isMobile ? 1 : 1.5, 
              background: theme.palette.mode === "dark" ? "rgba(251, 86, 7, 0.08)" : "rgba(251, 86, 7, 0.05)",
              borderRadius: "0.8rem",
              border: `1.5px solid ${theme.palette.mode === "dark" ? "rgba(251, 86, 7, 0.15)" : "rgba(251, 86, 7, 0.1)"}`,
            }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#fb5607", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.4px" }}>📄 Description</Typography>
              <Typography variant="body2" sx={{ mt: 0.25, fontSize: isMobile ? "0.8rem" : "0.85rem", lineHeight: 1.4, color: theme.palette.mode === "dark" ? "#bbb" : "#555" }}>
                {product.description?.substring(0, isMobile ? 80 : 120)}{product.description?.length > (isMobile ? 80 : 120) ? "..." : ""}
              </Typography>
            </Box>

            {/* Info Grid - Responsive */}
            <Grid container spacing={isMobile ? 0.75 : 1} sx={{ mb: 2 }}>
              {[
                { label: "👔 Brand", value: product.brand || "General", color: "#00f5a0" },
                { label: "👥 Gender", value: product.gender || "All", color: "#00d4ff" },
                { label: "🏷️ Category", value: product.category, color: "#ffbe0b" },
              ].map((item, idx) => (
                <Grid item xs={isMobile ? 6 : 4} key={idx}>
                  <Box sx={{ 
                    p: isMobile ? 0.5 : 0.75, 
                    background: theme.palette.mode === "dark" 
                      ? "rgba(255, 255, 255, 0.04)" 
                      : "rgba(0, 0, 0, 0.01)",
                    borderRadius: "0.5rem",
                    border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    cursor: "default",
                    "&:hover": {
                      background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
                      transform: "translateY(-2px)"
                    }
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.6rem", color: item.color }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: isMobile ? "0.85rem" : "0.9rem", mt: 0.25, color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}

              {/* Colors */}
              {colors.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 1, 
                    background: theme.palette.mode === "dark" ? "rgba(255, 200, 100, 0.08)" : "rgba(255, 200, 100, 0.05)",
                    borderRadius: "0.6rem",
                    border: `1px dashed ${theme.palette.mode === "dark" ? "rgba(255, 200, 100, 0.2)" : "rgba(255, 200, 100, 0.1)"}`
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.65rem", color: "#ffc864" }}>🎨 Colors</Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                      {colors.map((c) => (
                        <Chip 
                          key={c} 
                          label={c} 
                          size="small" 
                          sx={{ 
                            background: theme.palette.mode === "dark" ? "rgba(255, 200, 100, 0.2)" : "rgba(255, 200, 100, 0.15)",
                            color: "#ffc864",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 22
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 1, 
                    background: theme.palette.mode === "dark" ? "rgba(0, 212, 255, 0.08)" : "rgba(0, 212, 255, 0.05)",
                    borderRadius: "0.6rem",
                    border: `1px dashed ${theme.palette.mode === "dark" ? "rgba(0, 212, 255, 0.2)" : "rgba(0, 212, 255, 0.1)"}`
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.65rem", color: "#00d4ff" }}>📏 Sizes</Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                      {sizes.map((s) => (
                        <Chip 
                          key={s}
                          label={s}
                          size="small"
                          sx={{
                            background: theme.palette.mode === "dark" ? "rgba(0, 212, 255, 0.2)" : "rgba(0, 212, 255, 0.15)",
                            color: "#00d4ff",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 22
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Stock */}
            <Grid item xs={12}>
              <Box sx={{ 
                p: 1, 
                background: product.supply > 5 
                  ? theme.palette.mode === "dark" ? "rgba(0, 245, 160, 0.08)" : "rgba(0, 245, 160, 0.05)"
                  : theme.palette.mode === "dark" ? "rgba(255, 0, 110, 0.08)" : "rgba(255, 0, 110, 0.05)",
                borderRadius: "0.6rem",
                border: `1px solid ${product.supply > 5 
                  ? (theme.palette.mode === "dark" ? "rgba(0, 245, 160, 0.2)" : "rgba(0, 245, 160, 0.1)")
                  : (theme.palette.mode === "dark" ? "rgba(255, 0, 110, 0.2)" : "rgba(255, 0, 110, 0.1)")}`
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: isMobile ? 0.25 : 0.5,
                    fontSize: isMobile ? "0.85rem" : isTablet ? "0.95rem" : "1rem",
                    lineHeight: 1.3,
                    color: theme.palette.text.primary,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: isMobile ? '2.2em' : '2.4em',
                  }}
                >
                  {product.supply > 5 ? "✅ In Stock" : "⚠️ Low Stock"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: product.supply > 5 ? "#00f5a0" : "#ff006e",
                    fontSize: isMobile ? "0.75rem" : isTablet ? "0.8rem" : "0.875rem",
                    lineHeight: 1.3,
                  }}
                >
                  {product.supply || 0} units
                </Typography>
              </Box>
            </Grid>
            
            {/* Variant Management Section */}
            {product.isParentProduct && product.variants?.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 1.5, 
                  background: theme.palette.mode === "dark" ? "rgba(100, 100, 255, 0.08)" : "rgba(100, 100, 255, 0.05)",
                  borderRadius: "0.6rem",
                  border: `1px solid ${theme.palette.mode === "dark" ? "rgba(100, 100, 255, 0.15)" : "rgba(100, 100, 255, 0.1)"}`
                }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setVariantManagerOpen(true)}
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderRadius: '0.5rem',
                      px: 1.5,
                      py: 0.5,
                      color: theme.palette.mode === 'dark' ? '#aab4ff' : '#4a5aff',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(100, 100, 255, 0.3)' : 'rgba(100, 100, 255, 0.5)'
                    }}
                  >
                    Manage Variants
                  </Button>
                </Box>
              </Grid>
            )}
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsEditing(true)}
                  startIcon={<EditIcon fontSize="small" />}
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: '0.5rem',
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => onDelete(product._id)}
                  startIcon={<DeleteIcon fontSize="small" />}
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: '0.5rem',
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  Delete
                </Button>
              </Box>
              
              {variantCount > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setVariantManagerOpen(true)}
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '0.5rem',
                    px: 1.5,
                    py: 0.5,
                    background: 'linear-gradient(135deg, #4a5aff 0%, #6a11cb 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3a4aee 0%, #5a0bcb 100%)',
                    },
                  }}
                >
                  {variantCount} Variants
                </Button>
              )}
            </Box>
          </>
        )}
      </CardContent>
      
      <Dialog
        open={variantManagerOpen}
        onClose={() => setVariantManagerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <VariantManager
            parentProductId={product._id}
            onClose={() => setVariantManagerOpen(false)}
          />
        </Box>
      </Dialog>
    </Card>
  );
};

export default NewProduct;
