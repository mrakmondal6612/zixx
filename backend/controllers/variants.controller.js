const mongoose = require("mongoose");
const { ProductModel } = require("../models/products.model");

// ✅ Add a new variant to a parent product
exports.addVariant = async (req, res) => {
  try {
    const { parentProductId } = req.params;
    const { sku, size, color, variantAttributes, basePrice, tax, shippingCost, discount, price, stock, images } = req.body;

    // Validate parent product exists and is a parent product
    const parentProduct = await ProductModel.findById(parentProductId);
    if (!parentProduct) {
      return res.status(404).json({ ok: false, message: "Parent product not found" });
    }

    if (!parentProduct.isParentProduct) {
      return res.status(400).json({ ok: false, message: "Product is not a parent product" });
    }

    // Check if SKU is unique across all products
    const existingSku = await ProductModel.findOne({
      "variants.sku": sku
    });
    if (existingSku) {
      return res.status(400).json({ ok: false, message: "SKU already exists" });
    }

    // Create new variant object
    const newVariant = {
      sku,
      size: size || null,
      color: color || null,
      variantAttributes: variantAttributes || {},
      basePrice: Number(basePrice) || parentProduct.basePrice,
      tax: tax || parentProduct.tax,
      shippingCost: shippingCost || parentProduct.shippingCost,
      discount: discount || parentProduct.discount,
      price: Number(price) || parentProduct.price,
      stock: Number(stock) || 0,
      images: images || [],
      isActive: true,
    };

    // Add variant to parent product
    parentProduct.variants.push(newVariant);

    // Update parent product's size and color arrays if not already present
    if (size && !parentProduct.size.includes(size)) {
      parentProduct.size.push(size);
    }
    if (color && !parentProduct.color.includes(color)) {
      parentProduct.color.push(color);
    }

    // Update parent product's supply (sum of all variants)
    parentProduct.supply = parentProduct.variants.reduce((sum, v) => sum + v.stock, 0);

    await parentProduct.save();

    res.status(201).json({
      ok: true,
      message: "Variant added successfully",
      data: parentProduct
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error adding variant",
      error: error.message
    });
  }
};

// ✅ Get all variants of a parent product
exports.getVariantsByParent = async (req, res) => {
  try {
    const { parentProductId } = req.params;

    const parentProduct = await ProductModel.findById(parentProductId);
    if (!parentProduct) {
      return res.status(404).json({ ok: false, message: "Parent product not found" });
    }

    res.status(200).json({
      ok: true,
      data: parentProduct.variants || [],
      total: parentProduct.variants?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error fetching variants",
      error: error.message
    });
  }
};

// ✅ Get single variant by ID
exports.getVariantById = async (req, res) => {
  try {
    const { parentProductId, variantId } = req.params;

    const parentProduct = await ProductModel.findById(parentProductId);
    if (!parentProduct) {
      return res.status(404).json({ ok: false, message: "Parent product not found" });
    }

    const variant = parentProduct.variants.find(v => v._id.toString() === variantId);
    if (!variant) {
      return res.status(404).json({ ok: false, message: "Variant not found" });
    }

    res.status(200).json({
      ok: true,
      data: variant
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error fetching variant",
      error: error.message
    });
  }
};

// ✅ Update a variant
exports.updateVariant = async (req, res) => {
  try {
    const { parentProductId, variantId } = req.params;
    const { sku, size, color, variantAttributes, basePrice, tax, shippingCost, discount, price, stock, images, isActive } = req.body;

    const parentProduct = await ProductModel.findById(parentProductId);
    if (!parentProduct) {
      return res.status(404).json({ ok: false, message: "Parent product not found" });
    }

    const variant = parentProduct.variants.find(v => v._id.toString() === variantId);
    if (!variant) {
      return res.status(404).json({ ok: false, message: "Variant not found" });
    }

    // Check if new SKU is unique (excluding current variant)
    if (sku && sku !== variant.sku) {
      const existingSku = await ProductModel.findOne({
        _id: { $ne: parentProductId },
        "variants.sku": sku
      });
      if (existingSku) {
        return res.status(400).json({ ok: false, message: "SKU already exists" });
      }
    }

    // Update variant fields
    if (sku) variant.sku = sku;
    if (size !== undefined) variant.size = size || null;
    if (color !== undefined) variant.color = color || null;
    if (variantAttributes) variant.variantAttributes = variantAttributes;
    if (basePrice !== undefined) variant.basePrice = Number(basePrice);
    if (tax !== undefined) variant.tax = tax;
    if (shippingCost !== undefined) variant.shippingCost = shippingCost;
    if (discount !== undefined) variant.discount = discount;
    if (price !== undefined) variant.price = Number(price);
    if (stock !== undefined) variant.stock = Number(stock);
    if (images !== undefined) variant.images = images;
    if (isActive !== undefined) variant.isActive = isActive;

    // Update parent product's size and color arrays
    if (size && !parentProduct.size.includes(size)) {
      parentProduct.size.push(size);
    }
    if (color && !parentProduct.color.includes(color)) {
      parentProduct.color.push(color);
    }

    // Update parent product's supply
    parentProduct.supply = parentProduct.variants.reduce((sum, v) => sum + v.stock, 0);

    await parentProduct.save();

    res.status(200).json({
      ok: true,
      message: "Variant updated successfully",
      data: parentProduct
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error updating variant",
      error: error.message
    });
  }
};

// ✅ Delete a variant
exports.deleteVariant = async (req, res) => {
  try {
    const { parentProductId, variantId } = req.params;

    const parentProduct = await ProductModel.findById(parentProductId);
    if (!parentProduct) {
      return res.status(404).json({ ok: false, message: "Parent product not found" });
    }

    const variantIndex = parentProduct.variants.findIndex(v => v._id.toString() === variantId);
    if (variantIndex === -1) {
      return res.status(404).json({ ok: false, message: "Variant not found" });
    }

    // Remove variant
    parentProduct.variants.splice(variantIndex, 1);

    // Update parent product's supply
    parentProduct.supply = parentProduct.variants.reduce((sum, v) => sum + v.stock, 0);

    // Recalculate available sizes and colors
    const sizes = new Set();
    const colors = new Set();
    parentProduct.variants.forEach(v => {
      if (v.size) sizes.add(v.size);
      if (v.color) colors.add(v.color);
    });
    parentProduct.size = Array.from(sizes);
    parentProduct.color = Array.from(colors);

    await parentProduct.save();

    res.status(200).json({
      ok: true,
      message: "Variant deleted successfully",
      data: parentProduct
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error deleting variant",
      error: error.message
    });
  }
};

// ✅ Get variant by SKU (useful for cart operations)
exports.getVariantBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const parentProduct = await ProductModel.findOne({ "variants.sku": sku });
    if (!parentProduct) {
      return res.status(404).json({ ok: false, message: "Variant with this SKU not found" });
    }

    const variant = parentProduct.variants.find(v => v.sku === sku);

    res.status(200).json({
      ok: true,
      data: {
        variant,
        parentProduct: {
          _id: parentProduct._id,
          title: parentProduct.title,
          description: parentProduct.description,
          brand: parentProduct.brand,
          category: parentProduct.category
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error fetching variant by SKU",
      error: error.message
    });
  }
};

// ✅ Get product with all variants (for product detail page)
exports.getProductWithVariants = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ ok: false, message: "Product not found" });
    }

    // If this is a child product (variant), fetch parent
    if (product.parentProductId) {
      const parentProduct = await ProductModel.findById(product.parentProductId);
      return res.status(200).json({
        ok: true,
        data: parentProduct,
        isVariant: true
      });
    }

    // If this is a parent product, return with variants
    res.status(200).json({
      ok: true,
      data: product,
      isParent: product.isParentProduct,
      variantCount: product.variants?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error fetching product with variants",
      error: error.message
    });
  }
};
