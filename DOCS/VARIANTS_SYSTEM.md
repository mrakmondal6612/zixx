# Product Variants System Documentation

## Overview

The ZIXX app now supports a comprehensive product variants system that allows you to manage multiple variants (like different sizes, colors, storage options) under a single product while maintaining separate pricing, images, stock, and identification.

## Key Concepts

### Parent Product vs Child Variants

- **Parent Product**: The main product displayed to customers. It can have multiple variants.
- **Child Variants**: Different combinations of attributes (e.g., size, color) with separate pricing, images, and stock.

### Benefits

1. **Unified Shopping Experience**: Customers see one product page with dynamic options
2. **Flexible Attributes**: Support for size, color, storage, material, or any custom attribute
3. **Independent Pricing**: Each variant can have different prices
4. **Separate Stock Tracking**: Stock is managed per variant
5. **Unique Identification**: Each variant has its own SKU for order and inventory tracking

## Data Structure

### Product Schema

```javascript
{
  // Parent product information
  title: String,
  description: String,
  brand: String,
  category: String,
  subcategory: String,

  // Parent product flag
  isParentProduct: Boolean,

  // Default/fallback pricing
  basePrice: Number,
  price: Number,
  tax: { type: String, value: Number },
  shippingCost: { type: String, value: Number },
  discount: { type: String, value: Number },

  // Default images
  images: Array<{ url, caption, alt, order }>,

  // Available sizes and colors (aggregated from variants)
  size: [String],
  color: [String],

  // Total supply (sum of all variant stock)
  supply: Number,

  // Child variants array
  variants: [
    {
      _id: ObjectId,
      sku: String,           // Unique SKU for tracking
      size: String,          // e.g., "M", "L", "XL"
      color: String,         // e.g., "Red", "Blue"
      variantAttributes: {},  // Additional attributes

      // Variant-specific pricing
      basePrice: Number,
      price: Number,
      tax: { type, value },
      shippingCost: { type, value },
      discount: { type, value },

      // Variant-specific stock
      stock: Number,

      // Variant-specific images
      images: Array<{ url, caption, alt, order }>,

      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    }
  ]
}
```

## Frontend Implementation

### Customer-Facing Features

1. **Dynamic Variant Selection**

   - Select size and color on the product page
   - Images update based on selected variant
   - Price updates based on selected variant
   - Stock availability updates in real-time

2. **Visual Feedback**

   - Selected variant is highlighted
   - Out-of-stock variants are disabled
   - SKU is displayed for reference

3. **Cart Integration**
   - Exact variant is stored in cart (with SKU)
   - Variant-specific pricing is applied
   - Stock quantity matches variant stock

### Key Files Modified

- **`/frontend/src/pages/Product.tsx`**
  - Added `selectedVariant` state
  - Added `findMatchingVariant()` helper function
  - Updated image display to show variant images
  - Updated pricing display to show variant pricing
  - Updated cart addition to include variant information

## Backend Implementation

### API Endpoints

#### Variant Management (Admin Only)

**Add Variant**

```
POST /api/clients/products/{parentProductId}/variants
Payload: {
  sku: String (required, unique),
  size: String,
  color: String,
  variantAttributes: Object,
  basePrice: Number,
  tax: { type, value },
  shippingCost: { type, value },
  discount: { type, value },
  price: Number (required),
  stock: Number,
  images: Array,
  isActive: Boolean
}
```

**Get All Variants of Parent Product**

```
GET /api/clients/products/{parentProductId}/variants
Response: { ok: true, data: [variants], total: Number }
```

**Get Single Variant**

```
GET /api/clients/products/{parentProductId}/variants/{variantId}
Response: { ok: true, data: variant }
```

**Update Variant**

```
PUT /api/clients/products/{parentProductId}/variants/{variantId}
Payload: (same as Add Variant)
```

**Delete Variant**

```
DELETE /api/clients/products/{parentProductId}/variants/{variantId}
Response: { ok: true, message: "Variant deleted successfully" }
```

**Get Variant by SKU (Client)**

```
GET /api/clients/variants/sku/{sku}
Response: { ok: true, data: { variant, parentProduct } }
```

### Key Files Modified/Created

- **`/backend/models/products.model.js`**

  - Added `variantSchema`
  - Added `parentProductId` field
  - Added `isParentProduct` flag
  - Added `variants` array

- **`/backend/models/cart.model.js`**

  - Added `variantId` field
  - Added `sku` field for variant tracking

- **`/backend/models/order.model.js`**

  - Added `variantId`, `sku`, and `variantDetails` to `orderItems`

- **`/backend/controllers/variants.controller.js`** (NEW)

  - Handles all variant CRUD operations

- **`/backend/routes/Client/variants.routes.js`** (NEW)
  - Defines all variant-related routes

## Admin Panel Implementation

### Variant Manager Component

The admin panel now includes a comprehensive variant management interface:

**Location**: `/admin_pannel/src/scenes/products/VariantManager.jsx`

**Features**:

- View all variants in a table format
- Add new variants with all required fields
- Edit existing variants
- Delete variants
- Visual indicators for stock and status
- Form validation

### Using the Variant Manager

1. **In Admin Products List**:

   - Find the product you want to manage
   - Expand the product card (click "Show More")
   - Scroll down to the "Variant Manager" section
   - Click "Add Variant" to create new variants

2. **Adding a Variant**:

   - Fill in all required fields:
     - **SKU**: Unique identifier (e.g., `PROD-RED-M-001`)
     - **Size**: Optional (e.g., `M`, `L`, `XL`)
     - **Color**: Optional (e.g., `Red`, `Blue`)
     - **Base Price**: Original price before discounts
     - **Price**: Final selling price
     - **Stock**: Number of units available
   - Toggle "Active" to enable/disable the variant
   - Click "Add Variant"

3. **Editing a Variant**:

   - Click the Edit icon on any variant in the table
   - Modify the fields as needed
   - Click "Update Variant"

4. **Deleting a Variant**:
   - Click the Delete icon on any variant
   - Confirm the deletion

## Cart and Order Processing

### Cart Behavior

When a product with variants is added to cart:

1. The exact variant is stored (via `variantId` and `sku`)
2. Variant-specific pricing is used
3. Variant-specific images are displayed in cart

### Order Processing

Orders now include:

- Variant information (size, color, SKU)
- Variant-specific pricing
- Reference to the specific variant

Example order item:

```javascript
{
  productId: "...",
  variantId: "...",
  sku: "PROD-RED-M-001",
  productName: "Classic T-Shirt",
  quantity: 2,
  price: 499.99,
  variantDetails: {
    size: "M",
    color: "Red",
    attributes: {}
  }
}
```

## Migration Guide

### Converting Existing Products

If you want to enable variants for existing products:

1. **Via Admin Panel**:

   - Go to Products section
   - Find the product to convert
   - Click "Edit"
   - Change "Product Type" to "Yes - Enable Variants"
   - Save the product
   - Expand the product card and add variants

2. **Considerations**:
   - Current product-level size/color arrays will become default options
   - Initial stock will be assigned from `supply` field
   - Pricing will remain the same for all variants initially

## Best Practices

1. **SKU Format**: Use a consistent format like `{PRODUCT}-{COLOR}-{SIZE}-{NUMBER}`
2. **Pricing**: Ensure variant prices make sense in relation to base price
3. **Stock Management**: Regularly update variant stock as items are sold
4. **Active Status**: Disable variants that are no longer available
5. **Images**: Upload variant-specific images for better UX
6. **Attributes**: Use consistent naming for sizes and colors across variants

## Troubleshooting

### Problem: Variant images not showing

**Solution**:

- Ensure images array is populated with valid URLs
- Check that URLs are publicly accessible
- Frontend will fallback to product images if variant images are missing

### Problem: Wrong price showing in cart

**Solution**:

- Verify variant pricing is correct in admin
- Check that selected variant's price is being used
- Clear browser cache

### Problem: Stock not decreasing after order

**Solution**:

- Ensure order fulfillment system updates variant stock
- Check database for stock values directly

## Future Enhancements

Potential improvements for the variants system:

1. **Bulk Variant Upload**: CSV import for variants
2. **Variant Groups**: Group related variants (e.g., all sizes of one color)
3. **Variant Templates**: Save and reuse variant configurations
4. **Stock Rules**: Automatic stock notifications and reorder rules
5. **Analytics**: Track which variants are most popular
6. **Bundles**: Combine multiple variants into a bundle

## Support

For issues or questions regarding the variants system:

1. Check this documentation
2. Review the API endpoints
3. Examine the admin panel VariantManager component
4. Check browser console for errors
5. Review server logs for API errors
