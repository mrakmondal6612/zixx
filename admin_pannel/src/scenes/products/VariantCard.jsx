import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  IconButton,
  useTheme,
  Chip,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const VariantCard = ({ variant, index, onUpdate, onRemove }) => {
  const theme = useTheme();

  // Image upload dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(null);

  // Size/Color input dialogs
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

  // Handle variant field change
  const handleVariantChange = (field, value) => {
    const updatedVariant = {
      ...variant,
      [field]: value,
    };
    onUpdate(updatedVariant);
  };

  // Handle image upload
  const handleImageUpload = (e, imgIndex) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const updatedImages = [...variant.images];
        updatedImages[imgIndex] = event.target.result;
        handleVariantChange("images", updatedImages);
      };
      reader.readAsDataURL(file);
    }
    setImageDialogOpen(false);
  };

  // Add size
  const handleAddSize = () => {
    if (sizeInput.trim()) {
      handleVariantChange("size", sizeInput.trim());
      setSizeInput("");
    }
  };

  // Remove size
  const handleRemoveSize = () => {
    handleVariantChange("size", "");
  };

  // Add color
  const handleAddColor = () => {
    if (colorInput.trim()) {
      handleVariantChange("color", colorInput.trim());
      setColorInput("");
    }
  };

  // Remove color
  const handleRemoveColor = () => {
    handleVariantChange("color", "");
  };

  // Calculate final price
  const calculateFinalPrice = () => {
    const basePrice = parseFloat(variant.basePrice) || 0;
    const discount = parseFloat(variant.discount) || 0;
    const tax = parseFloat(variant.tax) || 0;

    const discountedPrice = basePrice - (basePrice * discount) / 100;
    const finalPrice = discountedPrice + (discountedPrice * tax) / 100;
    return finalPrice.toFixed(2);
  };

  return (
    <Card
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        position: "relative",
      }}
    >
      {/* Remove Button */}
      <IconButton
        onClick={onRemove}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: theme.palette.error.main,
          color: "white",
          zIndex: 10,
          "&:hover": {
            backgroundColor: theme.palette.error.dark,
          },
        }}
      >
        <DeleteIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <CardContent sx={{ p: 3 }}>
        {/* Variant Header */}
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          Variant {index + 1}
        </Typography>

        {/* Product Images Section */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(100, 200, 255, 0.05)"
                : "rgba(100, 200, 255, 0.02)",
            borderRadius: "8px",
            border: `1px dashed ${theme.palette.primary.main}`,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Product Images
          </Typography>
          <Stack direction="row" spacing={2}>
            {[0, 1, 2].map((imgIndex) => (
              <Box
                key={imgIndex}
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: "8px",
                  border: `2px solid ${theme.palette.primary.main}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(100, 200, 255, 0.1)"
                      : "rgba(100, 200, 255, 0.05)",
                  overflow: "hidden",
                  position: "relative",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(100, 200, 255, 0.2)"
                        : "rgba(100, 200, 255, 0.1)",
                  },
                }}
                onClick={() => {
                  setImageIndex(imgIndex);
                  setImageDialogOpen(true);
                }}
              >
                {variant.images[imgIndex] ? (
                  <Box
                    component="img"
                    src={variant.images[imgIndex]}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: "center", color: "gray" }}>
                    <CloudUploadIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="caption">
                      Photo {imgIndex + 1}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Image Upload Dialog */}
        <Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
        >
          <DialogTitle>Upload Image</DialogTitle>
          <DialogContent>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, imageIndex)}
              style={{
                width: "100%",
                marginTop: "16px",
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImageDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Product Title & Description */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Title"
              value={variant.title}
              onChange={(e) => handleVariantChange("title", e.target.value)}
              placeholder="Enter variant title"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Description"
              value={variant.description}
              onChange={(e) =>
                handleVariantChange("description", e.target.value)
              }
              placeholder="Enter variant description"
              multiline
              rows={2}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Sizes, Stock, Colors */}
        <Box sx={{ mb: 3 }}>
          {/* Sizes */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary,
              }}
            >
              Sizes ✓
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
              {!!variant.size && (
                <Chip
                  label={variant.size}
                  onDelete={handleRemoveSize}
                  sx={{
                    backgroundColor: theme.palette.success.main,
                    color: "white",
                  }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                value={variant.size || sizeInput}
                onChange={(e) => {
                  setSizeInput(e.target.value);
                  handleVariantChange("size", e.target.value);
                }}
                placeholder="Size (e.g., S, M, L, XL)"
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleAddSize}
                sx={{
                  backgroundColor: theme.palette.success.main,
                }}
              >
                Set
              </Button>
            </Stack>
          </Box>

          {/* Stock */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Stock"
              type="number"
              value={variant.stock}
              onChange={(e) =>
                handleVariantChange("stock", parseInt(e.target.value) || 0)
              }
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                },
              }}
            />
          </Box>

          {/* Colors */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary,
              }}
            >
              Colors ✓
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
              {!!variant.color && (
                <Chip
                  label={variant.color}
                  onDelete={handleRemoveColor}
                  sx={{
                    backgroundColor: theme.palette.success.main,
                    color: "white",
                  }}
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                value={variant.color || colorInput}
                onChange={(e) => {
                  setColorInput(e.target.value);
                  handleVariantChange("color", e.target.value);
                }}
                placeholder="Color (e.g., Red, Blue, Black)"
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleAddColor}
                sx={{
                  backgroundColor: theme.palette.success.main,
                }}
              >
                Set
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Pricing Details */}
        <Box
          sx={{
            p: 2,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(76, 175, 80, 0.05)"
                : "rgba(76, 175, 80, 0.02)",
            borderRadius: "8px",
            border: `1px solid ${theme.palette.success.main}`,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Pricing Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Price Rs."
                type="number"
                value={variant.basePrice}
                onChange={(e) =>
                  handleVariantChange("basePrice", e.target.value)
                }
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Shipping Rs."
                type="number"
                value={variant.shippingPrice}
                onChange={(e) =>
                  handleVariantChange("shippingPrice", e.target.value)
                }
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <Box
                sx={{
                  p: 1.5,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(76, 175, 80, 0.15)"
                      : "rgba(76, 175, 80, 0.08)",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "gray" }}>
                  Final Price Rs.
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.success.main,
                  }}
                >
                  {calculateFinalPrice()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Discount %"
                type="number"
                value={variant.discount}
                onChange={(e) =>
                  handleVariantChange("discount", e.target.value)
                }
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tax %"
                type="number"
                value={variant.tax}
                onChange={(e) => handleVariantChange("tax", e.target.value)}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VariantCard;
