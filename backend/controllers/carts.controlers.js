const { CartModel } = require("../models/cart.model.js");

// Get All Cart Items
exports.getAllCartItems = async (req, res) => {
  const token = req.headers.authorization;
  try {
    const product = await CartModel.find({ userId: req.userid });
    return res.json({ data: product });
  } catch (error) {
    res.json({ msg: "Error", Error: error.message });
  }
}

// Get Cart Item by ID
exports.getCartItemById = async (req, res) => {
  try {
    const userId = req.userid;
    const cartId = req.params.id;
    const cartItem = await CartModel.findOne({ _id: cartId, userId });
    if (!cartItem) {
      return res.status(404).json({ msg: 'Cart item not found' });
    }
    res.json({ data: cartItem });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch cart item', error: err.message });
  }
}

// Add to Cart
exports.addToCart = async (req, res) => {
  let payload = req.body;
  const productId = req.body.productId;
  const userId = req.userid;

  try {
    // Enhanced duplicate detection: Check by variant if available, otherwise by size/color
    let duplicateQuery = {
      productId,
      userId,
      "variation": { 
        size: payload.variation?.size || payload.size,
        color: payload.variation?.color || payload.color
      }
    };

    // If variantId is provided, also check by variant ID for better accuracy
    if (payload.variantId) {
      duplicateQuery = {
        productId,
        userId,
        variantId: payload.variantId
      };
    }

    const existingProduct = await CartModel.findOne(duplicateQuery);
    if (existingProduct) {
      return res.status(409).json({ 
        msg: "Product variant already in cart",
        ok: false,
        cartItemId: existingProduct._id,
        error: "DUPLICATE_VARIANT"
      });
    }

    payload.userId = userId;
    
    // Validate required fields
    if (!payload.productId || !payload.price || !payload.Qty) {
      return res.status(400).json({ 
        msg: "Missing required fields: productId, price, Qty",
        ok: false 
      });
    }

    // Ensure afterQtyprice and total are calculated
    if (!payload.afterQtyprice) {
      payload.afterQtyprice = payload.price * payload.Qty;
    }
    if (!payload.total) {
      payload.total = payload.price * payload.Qty;
    }

    const newproduct = new CartModel(payload);
    await newproduct.save();
    
    return res.json({ 
      msg: "Product added to cart successfully", 
      ok: true, 
      data: newproduct,
      success: true 
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ 
      msg: "Error adding product to cart", 
      ok: false, 
      error: error.message 
    });
  }
}

// Remove from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const id = req.params.id;
    await CartModel.findByIdAndDelete({ _id: id });
    return res.json({ msg: "Product Removed" });
  } catch (error) {
    res.json({ msg: "Error", Error: error.message });
  }
}

// Update Cart Item Quantity
exports.updateCartItemQty = async (req, res) => {
  try {
    const id = req.params.id;
    const { Qty } = req.body;
    if (typeof Qty !== 'number' || Qty < 1) {
      return res.status(400).json({ msg: 'Invalid quantity' });
    }

    // Update Qty and keep other fields unchanged
    const updated = await CartModel.findByIdAndUpdate(
      { _id: id },
      { $set: { Qty: Qty, 'variation.quantity': Qty } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: 'Cart item not found' });
    }

    return res.json({ msg: 'Cart updated', data: updated });
  } catch (error) {
    res.status(500).json({ msg: 'Error', Error: error.message });
  }
}
