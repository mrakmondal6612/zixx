const mongoose = require("mongoose");
const { ProductModel } = require("../models/products.model");
const { ProductStat } = require("../models/productStat.model");

// ✅ Get all products
// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await ProductModel.find().populate("userId", "first_name last_name email role");
//     res.json({ data: products, ok: true });
//   } catch (error) {
//     res.status(500).send({ msg: "Error fetching all products", error: error.message });
//   }
// }

exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      gender,
      sizes, // CSV or repeated query param not supported here
      colors, // CSV
      priceMin,
      priceMax,
      featured,
      theme,
      search, // text search on title/description/brand
      sort, // price_asc | price_desc | newest | rating_desc | discount_desc
      saleOnly, // when 'true', only items with discount > 0
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (category) filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (subcategory) filter.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
    if (gender) filter.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
    if (theme) filter.theme = { $regex: new RegExp(theme, 'i') };
    if (featured === 'true') filter.featured = true;

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    // Only discounted products when saleOnly is true
    if (String(saleOnly).toLowerCase() === 'true') {
      filter.discount = { $gt: 0 };
    }

    if (sizes) {
      const arr = String(sizes)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length) filter.size = { $in: arr };
    }

    if (colors) {
      const arr = String(colors)
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (arr.length) filter.color = { $in: arr };
    }

    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }

    // Exclude child products by default from listings; include only parents or standalone items
    if (String(req.query.includeChildren).toLowerCase() !== 'true') {
      filter.parentProductId = null;
    }

    // Exclude inactive products by default unless includeInactive=true
    // Use $ne:false so legacy docs without isActive field are still included
    if (String(req.query.includeInactive).toLowerCase() !== 'true') {
      filter.isActive = { $ne: false };
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      rating_desc: { rating: -1 },
      discount_desc: { discount: -1 },
    };
    const sortSpec = sortMap[sort] || { createdAt: -1 };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .sort(sortSpec)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    res.status(200).json({ ok: true, data: items, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
};


// Get product by name 
exports.getProductByName = async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    // Log the incoming name for debugging
    // Case-insensitive, trimmed exact match
    let product = await ProductModel.findOne({ title: { $regex: `^${name}$`, $options: "i" } });
    if (product) {
      return res.json({ data: product, ok: true });
    }
    // Fallback: partial match (contains)
    const products = await ProductModel.find({ title: { $regex: name, $options: "i" } });
    if (!products || products.length === 0) {
      return res.status(404).json({ ok: false, message: "Product not found" });
    }
    // If only one product found, return as single object for backward compatibility
    if (products.length === 1) {
      return res.json({ data: products[0], ok: true });
    }
    // If multiple products found, return as array
    return res.json({ data: products, ok: true, multiple: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error fetching product by name", error: error.message });
  }
};

// ✅ Get products by uploader user ID (admin only)
exports.getProductsByUserId = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Access denied" });
    }

    const products = await ProductModel.find({ userId: req.params.userid }).populate("userId", "first_name last_name email");
    res.send({ data: products, ok: true });
  } catch (error) {
    res.status(500).send({ msg: "Error fetching products for user", error: error.message });
  }
}

// ✅ Get single product by ID
exports.getSingleProductById = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    res.send({ data: product, ok: true });
  } catch (error) {
    res.status(500).send({ msg: "Error fetching product", error: error.message });
  }
}

// ✅ Get categories By Gender
exports.getCategoriesByGender = async (req, res) => {
  const gender = req.params.gender.toLowerCase();
  try {
    const query = gender === "all" ? {} : { gender: { $regex: new RegExp(`^${gender}$`, "i") } };
    const products = await ProductModel.find(query);

    const categoriesMap = {};

    products.forEach(product => {
      const { category, subcategory, image } = product;
      if (!categoriesMap[category]) {
        categoriesMap[category] = {
          name: category,
          image: image[0],
          subcategories: new Set()
        };
      }
      categoriesMap[category].subcategories.add(subcategory);
    });

    const formatted = Object.values(categoriesMap).map(cat => ({
      name: cat.name,
      image: cat.image,
      subcategories: Array.from(cat.subcategories)
    }));

    res.send({ data: formatted, ok: true });
  } catch (error) {
    res.status(500).send({ msg: "Error fetching categories", error: error.message });
  }
}

// Helper function to calculate final price
const calculateFinalPrice = (basePrice, tax, shippingCost, discount) => {
  let finalPrice = Number(basePrice);
  
  // Add tax
  if (tax && tax.type === 'percentage' && tax.value > 0) {
    finalPrice += (finalPrice * tax.value) / 100;
  }
  
  // Add shipping cost
  if (shippingCost && shippingCost.type === 'fixed' && shippingCost.value > 0) {
    finalPrice += Number(shippingCost.value);
  }
  
  // Subtract discount
  if (discount && discount.value > 0) {
    if (discount.type === 'percentage') {
      finalPrice -= (finalPrice * discount.value) / 100;
    } else if (discount.type === 'fixed') {
      finalPrice -= Number(discount.value);
    }
    // For coupon type, discount is applied at checkout, not here
  }
  
  // Round up to nearest integer (upper bound)
  // Example: 199.52 -> 200, 199.11 -> 200, 199.82 -> 200
  return Math.ceil(Math.max(0, finalPrice));
};

// ✅ Add product
exports.addProduct = async (req, res) => {
  try {
    console.log("📝 addProduct called with body:", {
      title: req.body.title,
      brand: req.body.brand,
      basePrice: req.body.basePrice,
      variantCount: req.body.variants?.length || 0
    });

    const user = req.user;
    if (!user || user.role !== "admin") {
      console.log("❌ Access denied - no user or not admin");
      return res.status(403).json({ ok: false, message: "Access denied" });
    }
    
    // Validate required fields
    if (!req.body.title || !req.body.description || !req.body.basePrice) {
      console.log("❌ Missing required fields:", {
        title: !!req.body.title,
        description: !!req.body.description,
        basePrice: !!req.body.basePrice
      });
      return res.status(400).send({ msg: "Title, description, and base price are required" });
    }
    if (!req.body.category || !req.body.subcategory || !req.body.gender) {
      console.log("❌ Missing category/subcategory/gender");
      return res.status(400).send({ msg: "Category, subcategory, and gender are required" });
    }

    // Handle new variant structure from ProductAddForm
    let variants = req.body.variants || [];
    const isParentProduct = req.body.isParentProduct || variants.length > 0;

    console.log("📦 Processing variants:", variants.length);

    // If variants are provided (from ProductAddForm), process them
    if (Array.isArray(variants) && variants.length > 0) {
      // Extract sizes and colors from all variants
      const sizesSet = new Set();
      const colorsSet = new Set();
      let totalStock = 0;
      const processedVariants = [];

      for (const variant of variants) {
        console.log("🔍 Processing variant:", {
          title: variant.title,
          basePrice: variant.basePrice,
          sizes: variant.sizes?.length,
          colors: variant.colors?.length,
          stock: variant.stock,
          imageCount: variant.images?.length
        });

        // Validate variant
        if (!variant.basePrice || variant.basePrice <= 0) {
          console.log("❌ Invalid base price:", variant.basePrice);
          return res.status(400).send({ msg: "Each variant must have a base price > 0" });
        }
        // This admin flow treats each submitted variant card as ONE variant group.
        // Accept either `size`/`color` or legacy `sizes`/`colors` arrays (use first item).
        const variantSize =
          (typeof variant.size === 'string' && variant.size.trim())
            ? variant.size.trim()
            : (Array.isArray(variant.sizes) && variant.sizes[0])
              ? String(variant.sizes[0]).trim()
              : null;
        const variantColor =
          (typeof variant.color === 'string' && variant.color.trim())
            ? variant.color.trim()
            : (Array.isArray(variant.colors) && variant.colors[0])
              ? String(variant.colors[0]).trim()
              : null;

        if (!variantSize) {
          return res.status(400).send({ msg: "Each variant must have a size" });
        }
        if (!variantColor) {
          return res.status(400).send({ msg: "Each variant must have a color" });
        }

        // Extract images
        const variantImages = Array.isArray(variant.images) 
          ? variant.images.filter(img => img && typeof img === 'string').map((url, idx) => ({
              url,
              caption: variant.title || "",
              alt: variant.description || "",
              order: idx,
              size: null,
              color: null,
              price: null,
              stock: null
            }))
          : [];

        // Add sizes and colors to set
        sizesSet.add(variantSize);
        colorsSet.add(variantColor);
        totalStock += Number(variant.stock) || 0;

        // Get base price for this variant
        const variantBasePrice = Number(variant.basePrice);

        // Calculate final price for variant using helper function
        const variantTax = {
          type: 'percentage',
          value: Number(variant.tax) || 0
        };
        const variantShipping = {
          type: 'fixed',
          value: Number(variant.shippingPrice) || 0
        };
        const variantDiscount = {
          type: 'percentage',
          value: Number(variant.discount) || 0
        };
        const finalPrice = calculateFinalPrice(variantBasePrice, variantTax, variantShipping, variantDiscount);

        // Create exactly one processed variant per submitted variant card
        const processedVariant = {
          sku: `${req.body.brand || 'PROD'}-${variantSize}-${variantColor}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
          title: variant.title || req.body.title,
          description: variant.description || req.body.description,
          size: variantSize,
          color: variantColor,
          variantAttributes: variant.variantAttributes || {},
          basePrice: variantBasePrice,
          tax: {
            type: 'percentage',
            value: Number(variant.tax) || 0
          },
          shippingCost: {
            type: (Number(variant.shippingPrice) || 0) > 0 ? 'fixed' : 'free',
            value: Number(variant.shippingPrice) || 0
          },
          discount: {
            type: 'percentage',
            value: Number(variant.discount) || 0
          },
          price: finalPrice,
          stock: Number(variant.stock) || 0,
          images: variantImages,
          isActive: true
        };

        processedVariants.push(processedVariant);
      }

      // Prepare main product payload with processed variants
      const tax = req.body.tax || { type: 'free', value: 0 };
      const shippingCost = req.body.shippingCost || { type: 'free', value: 0 };
      const discount = req.body.discount || { type: 'percentage', value: 0 };
      const basePrice = Number(req.body.basePrice);

      // Calculate final price for parent product
      const calculatedPrice = calculateFinalPrice(basePrice, tax, shippingCost, discount);

      // Normalize features
      let featuresArr = undefined;
      if (typeof req.body.features === 'string') {
        featuresArr = req.body.features
          .split(/\r?\n|,/)
          .map((s) => String(s).trim())
          .filter(Boolean);
      } else if (Array.isArray(req.body.features)) {
        featuresArr = req.body.features
          .map((s) => (typeof s === 'string' ? s : String(s?.text || '')).trim())
          .filter(Boolean);
      }

      const payload = {
        title: req.body.title,
        description: req.body.description,
        brand: req.body.brand || "General",
        gender: req.body.gender,
        category: req.body.category,
        subcategory: req.body.subcategory,
        theme: req.body.theme || "General",
        ...(featuresArr ? { features: featuresArr } : {}),
        basePrice,
        tax,
        shippingCost,
        discount,
        price: calculatedPrice,
        isParentProduct: true,
        variants: processedVariants,
        size: Array.from(sizesSet),
        color: Array.from(colorsSet),
        supply: totalStock,
        image: processedVariants[0]?.images?.map(img => img.url) || [],
        images: processedVariants[0]?.images || [],
        userId: user._id || user.userid,
      };

      const newProduct = new ProductModel(payload);
      await newProduct.save();

      return res.send({ 
        msg: "Product with variants added successfully", 
        ok: true, 
        data: newProduct 
      });
    }

    // Original logic for non-variant products (backward compatibility)
    if (!req.body.isParentProduct) {
      if (!req.body.size || !Array.isArray(req.body.size) || req.body.size.length === 0) {
        return res.status(400).send({ msg: "At least one size is required", ok: false, data: req.body.size });
      }
      if (!req.body.colors || !Array.isArray(req.body.colors) || req.body.colors.length === 0) {
        return res.status(400).send({ msg: "At least one color is required", ok: false, data: req.body.colors });
      }
    }

    // Normalize features (optional): accept string (CSV/newline) or array
    let featuresArr = undefined;
    if (typeof req.body.features === 'string') {
      featuresArr = req.body.features
        .split(/\r?\n|,/)
        .map((s) => String(s).trim())
        .filter(Boolean);
    } else if (Array.isArray(req.body.features)) {
      featuresArr = req.body.features
        .map((s) => (typeof s === 'string' ? s : String(s?.text || '')).trim())
        .filter(Boolean);
    }

    // Normalize images (support array of strings or array of objects)
    const inboundImagesDetailed = Array.isArray(req.body.imagesDetailed) ? req.body.imagesDetailed : null;
    const inboundImages = Array.isArray(req.body.images) ? req.body.images : null;
    let structured = [];
    if (inboundImagesDetailed && inboundImagesDetailed.length) {
      structured = inboundImagesDetailed
        .filter((it) => it && typeof it.url === 'string' && it.url.trim())
        .map((it, idx) => ({
          url: String(it.url).trim(),
          caption: String(it.caption || ""),
          alt: String(it.alt || ""),
          order: Number.isFinite(it.order) ? it.order : idx,
          // Preserve per-image metadata for parent product child creation
          size: it.size || null,
          color: it.color || null,
          price: it.price !== undefined && it.price !== null ? Number(it.price) : null,
          stock: it.stock !== undefined && it.stock !== null ? Number(it.stock) : null,
        }))
        .sort((a, b) => a.order - b.order)
        .map((it, idx) => ({ ...it, order: idx }));
    } else if (inboundImages && inboundImages.length) {
      // Could be array of strings or objects
      structured = inboundImages
        .map((it, idx) => {
          if (typeof it === 'string') return { url: it.trim(), caption: "", alt: "", order: idx, size: null, color: null, price: null, stock: null };
          if (it && typeof it.url === 'string') return { url: it.url.trim(), caption: String(it.caption || ""), alt: String(it.alt || ""), order: Number.isFinite(it.order) ? it.order : idx, size: it.size || null, color: it.color || null, price: it.price !== undefined && it.price !== null ? Number(it.price) : null, stock: it.stock !== undefined && it.stock !== null ? Number(it.stock) : null };
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order)
        .map((it, idx) => ({ ...it, order: idx }));
    }
    if (!structured.length) {
      return res.status(400).send({ msg: "At least one image is required" });
    }
    const legacyUrls = structured.map((i) => i.url);

    // Parse pricing fields
    const tax = req.body.tax || { type: 'free', value: 0 };
    const shippingCost = req.body.shippingCost || { type: 'free', value: 0 };
    const discount = req.body.discount || { type: 'percentage', value: 0 };
    const basePrice = Number(req.body.basePrice);

    // Calculate final price
    const calculatedPrice = calculateFinalPrice(basePrice, tax, shippingCost, discount);

    const payload = {
      ...req.body,
      ...(featuresArr ? { features: featuresArr } : {}),
      basePrice,
      tax,
      shippingCost,
      discount,
      price: calculatedPrice, // Store calculated final price
      image: legacyUrls, // legacy flat URLs
      images: structured, // structured with metadata
      userId: user._id || user.userid,
    };
    delete payload.imagesDetailed;

    const newProduct = new ProductModel(payload);
    await newProduct.save();
    // Populate embedded variants from per-image metadata when provided for parent products
    if (payload.isParentProduct && Array.isArray(structured) && structured.length) {
      try {
        const sizesSet = new Set(Array.isArray(newProduct.size) ? newProduct.size : []);
        const colorsSet = new Set(Array.isArray(newProduct.color) ? newProduct.color : []);
        const skuBase = newProduct._id.toString().slice(-6).toUpperCase();
        let idx = 0;
        for (const imgMeta of structured) {
          if (imgMeta && imgMeta.size && imgMeta.color && imgMeta.price != null && imgMeta.stock != null) {
            idx += 1;
            const variant = {
              sku: `${skuBase}-${String(idx).padStart(3, '0')}`,
              size: imgMeta.size,
              color: imgMeta.color,
              variantAttributes: {},
              basePrice: Number(imgMeta.price) || basePrice,
              tax: payload.tax,
              shippingCost: payload.shippingCost,
              discount: payload.discount,
              price: Number(imgMeta.price) || calculatedPrice,
              stock: Number(imgMeta.stock) || 0,
              images: [
                {
                  url: imgMeta.url,
                  caption: imgMeta.caption || '',
                  alt: imgMeta.alt || '',
                  order: 0,
                  size: imgMeta.size,
                  color: imgMeta.color,
                  price: imgMeta.price,
                  stock: imgMeta.stock,
                },
              ],
              isActive: true,
            };
            newProduct.variants.push(variant);
            sizesSet.add(imgMeta.size);
            colorsSet.add(imgMeta.color);
          }
        }
        newProduct.size = Array.from(sizesSet);
        newProduct.color = Array.from(colorsSet);
        newProduct.supply = (newProduct.variants || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        await newProduct.save();
      } catch (e) {
        console.warn('Failed to populate variants from images:', e?.message || e);
      }
    }
    // If this is a parent product and images include per-image metadata (size/color/price/stock),
    // create child product entries for each image that has metadata.
    if (payload.isParentProduct && Array.isArray(structured) && structured.length) {
      try {
        const children = [];
        for (const imgMeta of structured) {
          // require at least size/color/price/stock to create a child product
          if (imgMeta.size && imgMeta.color && imgMeta.price != null && imgMeta.stock != null) {
            const childPayload = {
              title: `${payload.title} - ${imgMeta.color || ''} ${imgMeta.size || ''}`.trim(),
              description: payload.description,
              brand: payload.brand,
              gender: payload.gender,
              category: payload.category,
              subcategory: payload.subcategory,
              parentProductId: newProduct._id,
              isParentProduct: false,
              basePrice: Number(imgMeta.price) || payload.basePrice,
              price: Number(imgMeta.price) || payload.price,
              tax: payload.tax,
              shippingCost: payload.shippingCost,
              discount: payload.discount,
              image: [imgMeta.url],
              images: [{ url: imgMeta.url, caption: imgMeta.caption || '', alt: imgMeta.alt || '', order: imgMeta.order || 0, size: imgMeta.size, color: imgMeta.color, price: imgMeta.price, stock: imgMeta.stock }],
              size: imgMeta.size ? [imgMeta.size] : [],
              color: imgMeta.color ? [imgMeta.color] : [],
              supply: Number(imgMeta.stock) || 0,
              userId: newProduct.userId,
            };
            children.push(childPayload);
          }
        }
        if (children.length) {
          // Insert children
          const inserted = await ProductModel.insertMany(children);
          // Optionally, update parent product to mark it as having children (no-op since isParentProduct flag exists)
        }
      } catch (e) {
        console.warn('Failed to create child products for parent:', e?.message || e);
      }
    }

    res.send({ msg: "Product Added Successfully", ok: true, data: newProduct });
  } catch (error) {
    console.error('❌ Error in addProduct:', error);
    console.error('Stack:', error.stack);
    console.error('Message:', error.message);
    res.status(500).send({ 
      msg: "Error adding product", 
      error: error.message,
      details: error.errors ? Object.keys(error.errors) : undefined
    });
  }
}

// Get products by gender men
exports.getProductsByGenderMen = async (req, res) => {
  
  try {
    const products = await ProductModel.find({ gender: { $regex: /^men$/i } });
    res.send({ data: products, count: products.length, ok: true });
  } catch (error) {
    res.status(500).send({ msg: "Error", error: error.message });
  }
}

// Get products by gender women
exports.getProductsByGenderWomen = async (req, res) => {
  try {
    const products = await ProductModel.find({ gender: { $regex: /^women$/i } });
    res.send({ data: products, count: products.length, ok: true });
  } catch (error) {
    res.status(500).send({ msg: "Error", error: error.message });
  }
}

// Get products by gender kids
exports.getProductsByGenderKids = async (req, res) => {
  try {
    const products = await ProductModel.find({ gender: { $regex: /^kid$/i } });
    res.send({ data: products, count: products.length, ok: true });
  } catch (error) {
    res.status(500).send({ msg: "Error", error: error.message });
  }
}

// Get products by subcategory
exports.getProductsBySubcategory = async (req, res) => {
  if (!req.params.subcategory) {
    return res.status(400).send({ msg: "Subcategory is required" });
  }
  try {
    const products = await ProductModel.find({
      gender: { $regex: /^men$/i },
      subcategory: req.params.subcategory
    });
    res.send({ data: products, count: products.length, ok: true });
  } catch (error) {
    res.status(500).send({ msg: "Error fetching subcategory", error: error.message });
  }
}

// Update product
exports.updateProduct = async (req, res) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Access denied" });
  }
  if (!req.params.id) {
    return res.status(400).send({ msg: "Product ID is required" });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ msg: "Invalid Product ID" });
  }

  try {
    // Normalize images on update if provided
    let updateData = { ...req.body };
    
    // Normalize size if provided (split by comma if it's a string)
    if (Object.prototype.hasOwnProperty.call(updateData, 'size')) {
      if (typeof updateData.size === 'string') {
        updateData.size = updateData.size
          .split(',')
          .map((s) => String(s).trim())
          .filter(Boolean);
      }
    }
    
    // Normalize color if provided (split by comma if it's a string)
    if (Object.prototype.hasOwnProperty.call(updateData, 'color')) {
      if (typeof updateData.color === 'string') {
        updateData.color = updateData.color
          .split(',')
          .map((c) => String(c).trim())
          .filter(Boolean);
      }
    }
    
    // Normalize features if provided
    if (Object.prototype.hasOwnProperty.call(updateData, 'features')) {
      if (typeof updateData.features === 'string') {
        updateData.features = updateData.features
          .split(/\r?\n|,/)
          .map((s) => String(s).trim())
          .filter(Boolean);
      } else if (Array.isArray(updateData.features)) {
        updateData.features = updateData.features
          .map((s) => (typeof s === 'string' ? s : String(s?.text || '')).trim())
          .filter(Boolean);
      }
    }
    const inboundImagesDetailedU = Array.isArray(req.body.imagesDetailed) ? req.body.imagesDetailed : null;
    const inboundImagesU = Array.isArray(req.body.images) ? req.body.images : null;
    if (inboundImagesDetailedU || inboundImagesU) {
      let structuredU = [];
      if (inboundImagesDetailedU && inboundImagesDetailedU.length) {
        structuredU = inboundImagesDetailedU
          .filter((it) => it && typeof it.url === 'string' && it.url.trim())
          .map((it, idx) => ({
            url: String(it.url).trim(),
            caption: String(it.caption || ""),
            alt: String(it.alt || ""),
            order: Number.isFinite(it.order) ? it.order : idx,
          }))
          .sort((a, b) => a.order - b.order)
          .map((it, idx) => ({ ...it, order: idx }));
      } else if (inboundImagesU && inboundImagesU.length) {
        structuredU = inboundImagesU
          .map((it, idx) => {
            if (typeof it === 'string') return { url: it.trim(), caption: "", alt: "", order: idx };
            if (it && typeof it.url === 'string') return { url: it.url.trim(), caption: String(it.caption || ""), alt: String(it.alt || ""), order: Number.isFinite(it.order) ? it.order : idx };
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => a.order - b.order)
          .map((it, idx) => ({ ...it, order: idx }));
      }
      updateData.image = structuredU.map((i) => i.url);
      updateData.images = structuredU;
      delete updateData.imagesDetailed;
    }
    
    // Recalculate price if pricing fields are updated
    const currentProduct = await ProductModel.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).send({ ok: false, msg: "Product not found" });
    }
    
    const basePrice = updateData.basePrice !== undefined ? Number(updateData.basePrice) : currentProduct.basePrice;
    const tax = updateData.tax || currentProduct.tax;
    const shippingCost = updateData.shippingCost || currentProduct.shippingCost;
    const discount = updateData.discount || currentProduct.discount;
    
    // Calculate and update final price
    updateData.price = calculateFinalPrice(basePrice, tax, shippingCost, discount);
    
    const updated = await ProductModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).send({ ok: false, msg: "Product not found" });
    }
    res.send({ msg: "Product updated", ok: true, data: updated });
  } catch (error) {
    res.status(500).send({ ok: false, msg: "Server error", error: error.message });
  }
}

// Delete product
exports.deleteProduct = async (req, res) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Access denied" });
  }
  const { id } = req.params;
  if (!id) {
    return res.status(400).send({ ok: false, msg: "Product ID is required" });
  }
  try{
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ ok: false, msg: "Invalid Product ID" });
    }
  } catch (error) {
      return res.status(400).send({ ok: false, msg: "Invalid Product ID format" });
    }
  try {
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).send({ ok: false, msg: "Product not found" });
    }
  } catch (error) {
    return res.status(500).send({ ok: false, msg: "Error fetching product", error: error.message });
  }
  try {
    const deleted = await ProductModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).send({ ok: false, msg: "Product not found" });
    }
    res.send({ msg: "Product deleted", ok: true, data: deleted });
  } catch (error) {
    res.status(500).send({ ok: false, msg: "Server error", error: error.message });
  }
}

