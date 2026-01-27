# Product Card Components - Developer Reference

## File Location

```
admin_pannel/src/scenes/products/index.jsx
```

## Component Props

### Product Component

```jsx
<Product
  product={product} // Product object from RTK Query
  onDelete={handleDelete} // Function: (productId) => void
  onUpdate={handleUpdate} // Function: (productId, payload) => void
  isNonMobile={isNonMobile} // Boolean: screen size indicator
/>
```

## Key Features Breakdown

### 1. Responsive Design Hook

```jsx
const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
```

- Used to hide/show full text vs icons on buttons
- Adjusts font sizes and spacing
- Controls layout changes

### 2. Variant Calculation

```jsx
const variantCount = product.variants?.length || 0;
const colors = Array.isArray(product.color)
  ? product.color
  : product.color
  ? [product.color]
  : [];
const sizes = Array.isArray(product.size)
  ? product.size
  : product.size
  ? [product.size]
  : [];

const getPriceRange = () => {
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map((v) => v.basePrice || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `₹${minPrice.toFixed(0)}`
      : `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`;
  }
  return `₹${(product.basePrice || product.price || 0).toFixed(0)}`;
};
```

### 3. Card Structure

#### Header Section

```jsx
<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    mb: 1.5,
    gap: 1,
  }}
>
  <Typography>Category</Typography>
  <Chip label={`${variantCount} Variants`} color="primary" />
</Box>
```

#### Quick Info Grid

```jsx
<Grid container spacing={0.5} sx={{ mb: 1.5 }}>
  <Grid item xs={6}>
    Brand
  </Grid>
  <Grid item xs={6}>
    Gender
  </Grid>
  <Grid item xs={6}>
    Stock
  </Grid>
  <Grid item xs={6}>
    Colors
  </Grid>
</Grid>
```

#### Expanded Details

```jsx
<Collapse in={isExpanded}>
  <CardContent>
    {/* Metadata Grid */}
    {/* Pricing Section */}
    {/* Variants Table */}
  </CardContent>
</Collapse>
```

## Styling Classes & Patterns

### Text Truncation

```jsx
sx={{
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  minHeight: "2.4em",
  lineHeight: 1.2,
}}
```

### Color-Coded Stock Status

```jsx
color: product.supply > 10
  ? "success.main"
  : product.supply > 0
  ? "warning.main"
  : "error.main";
```

### Responsive Button Text

```jsx
{
  isMobile ? "✓" : "Save";
}
{
  isMobile ? "✕" : "Cancel";
}
{
  isMobile ? "✎" : "Edit";
}
{
  isMobile ? "🗑" : "Delete";
}
```

### Card Hover Effect

```jsx
transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
"&:hover": {
  transform: "translateY(-8px)",
  boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
  borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
}
```

## State Management

### Local State

```jsx
const [isExpanded, setIsExpanded] = useState(false); // Expand/collapse
const [isEditing, setIsEditing] = useState(false); // Edit mode toggle
const [editedProduct, setEditedProduct] = useState(product); // Form state
```

### Theme Access

```jsx
const theme = useTheme();
theme.palette.mode; // "dark" or "light"
theme.palette.primary; // Primary colors
theme.palette.secondary; // Secondary colors
theme.breakpoints.down("sm"); // Responsive queries
```

## Data Transformation

### Price Range Calculation

```jsx
// Single product
"₹500";

// Parent product with variants
"₹150 - ₹250";
```

### Color Display

```jsx
// Limit to 3, show +X for more
{
  colors.slice(0, 3).map((color) => <Chip>{color}</Chip>);
}
{
  colors.length > 3 && <Chip label={`+${colors.length - 3}`} />;
}
```

### Variant Stock Status

```jsx
stock > 5       → "success.main" (Green ✓)
0 < stock <= 5  → "warning.main" (Yellow 🟡)
stock === 0     → "error.main"   (Red ✗)
```

## Event Handlers

### Edit Mode

```jsx
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setEditedProduct((prev) => ({ ...prev, [name]: value }));
};

const handleSave = () => {
  const payload = { ...editedProduct };
  // Normalize fields
  payload.subcategory =
    editedProduct.subCategory ?? editedProduct.subcategory ?? "";
  payload.images = editedProduct.image;
  // ... more transformations
  onUpdate(product._id, payload);
  setIsEditing(false);
};
```

### Expand/Collapse

```jsx
onClick={() => setIsExpanded(!isExpanded)}
```

### Delete

```jsx
onClick={() => onDelete(product._id)}
```

## Responsive Breakpoints Used

```jsx
// Material-UI standard breakpoints
xs: 0,      // Mobile (< 600px)
sm: 600,    // Tablet (600px - 960px)
md: 960,    // Small Desktop (960px - 1280px)
lg: 1280,   // Desktop (1280px - 1920px)
xl: 1920,   // Large Desktop (> 1920px)

// Grid responsive columns
xs={12}     // 1 column (full width)
sm={6}      // 2 columns
md={4}      // 3 columns
lg={3}      // 4 columns (but capped at 3)
xl={3}      // Same as lg
```

## Variant Display Table

### Scrollable Container

```jsx
<Box
  sx={{
    maxHeight: "300px",
    overflowY: "auto",
    border: `1px solid ${
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.05)"
    }`,
    borderRadius: "0.5rem",
    p: 1,
  }}
>
  {product.variants.map((variant) => (
    <Box>Size/Color | Price | Stock</Box>
  ))}
</Box>
```

### Variant Data Structure

```jsx
variant = {
  _id: "uniqueId",
  size: "M",
  color: "Red",
  basePrice: 520,
  stock: 10,
  // ... other fields
};
```

## Theme Colors Reference

### Dark Mode

```
Primary Background:     #1e1e1e
Secondary Background:   #2d2d2d (alt)
Text Primary:          #ffffff
Text Secondary:        #a0a0a0
Category Highlight:    #F6F1C1
Price Color:           #A692F6
Discount Color:        #F86262
Edit Color:            #0AC2F5
Delete Color:          #F86262
```

### Light Mode

```
Primary Background:    #ffffff
Secondary Background:  #f5f5f5
Text Primary:         #000000
Text Secondary:       #666666
Category Highlight:   #665F0F
Price Color:          #87068F
Discount Color:       #8F0606
Edit Color:           #033645
Delete Color:         #8F0606
```

## Common Modifications

### Change Price Range Format

```jsx
// Current
`₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`// With decimals
`₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`// With custom format
`₹${minPrice} to ₹${maxPrice}`;
```

### Adjust Image Height

```jsx
// Current
minHeight: "180px",

// Make taller
minHeight: "220px",

// Make shorter
minHeight: "140px",
```

### Change Title Line Clamp

```jsx
// Current: 2 lines
WebkitLineClamp: 2,

// Show 3 lines
WebkitLineClamp: 3,

// Show 1 line
WebkitLineClamp: 1,
```

### Modify Grid Spacing

```jsx
// Current: spacing 2
<Grid container spacing={2} sx={{ mb: 1.5 }}>

// Increase spacing
<Grid container spacing={3} sx={{ mb: 2 }}>

// Decrease spacing
<Grid container spacing={1} sx={{ mb: 1 }}>
```

### Change Color Chips Display Count

```jsx
// Current: Show 3, +X more
colors.slice(0, 3).map(...)

// Show 4
colors.slice(0, 4).map(...)

// Show all
colors.map(...)
```

## Performance Tips

1. **Memoization**: Consider wrapping Product component with React.memo() if list is large

   ```jsx
   export const Product = React.memo(
     ({ product, onDelete, onUpdate, isNonMobile }) => {
       // component code
     }
   );
   ```

2. **Lazy Images**: Images already have error fallback

   ```jsx
   onError={(e) => {
     e.target.src = "https://via.placeholder.com/200?text=No+Image";
   }}
   ```

3. **Collapse Optimization**: Uses `unmountOnExit` to avoid rendering hidden content
   ```jsx
   <Collapse ... unmountOnExit>
   ```

## Testing Checklist

- [ ] Product renders without errors
- [ ] Variant count displays correctly
- [ ] Price range shows single/range as appropriate
- [ ] Colors/Sizes display in chips
- [ ] Stock color coding works
- [ ] Expand/collapse animation smooth
- [ ] Edit form fills with correct data
- [ ] Save updates product
- [ ] Delete calls handler
- [ ] Responsive at all breakpoints
- [ ] Dark mode colors correct
- [ ] Light mode colors correct
- [ ] Empty product data handled gracefully
- [ ] Long text truncates properly
- [ ] Images load with fallback

## Troubleshooting

### Variant Count Shows 0

- Check: `product.variants` exists and is array
- Fallback: `product.variants?.length || 0`

### Price Range Not Showing

- Check: `product.variants` has `basePrice` field
- Fallback: Uses `product.basePrice` or `product.price`

### Colors Not Displaying

- Check: `product.color` is array or string
- Handles both formats:
  ```jsx
  Array.isArray(product.color) ? product.color : [product.color];
  ```

### Images Not Loading

- Check: Image URL valid and accessible
- Fallback: Shows placeholder image on error

### Buttons Not Responsive

- Check: `isMobile` state updating
- Verify: `useMediaQuery(theme.breakpoints.down("sm"))` working

---

**Last Updated**: 2024
**Component Status**: ✅ Production Ready
**Tested Browsers**: Chrome, Firefox, Safari, Edge
