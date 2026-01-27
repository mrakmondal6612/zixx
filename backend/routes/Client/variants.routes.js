const express = require("express");
const { authenticator } = require("../../middlewares/authenticator.middleware");
const { adminMiddleware } = require("../../middlewares/admin.middleware");
const { upload, cloudinaryUploadMiddleware } = require("../../middlewares/cloudinaryUpload");
const {
  addVariant,
  getVariantsByParent,
  getVariantById,
  updateVariant,
  deleteVariant,
  getVariantBySku,
  getProductWithVariants,
} = require("../../controllers/variants.controller");

const VariantsRouter = express.Router();

// Image upload for variants
VariantsRouter.post(
  "/variants/upload",
  authenticator,
  adminMiddleware,
  upload.single("file"),
  cloudinaryUploadMiddleware,
  (req, res) => {
    try {
      // cloudinaryUploadMiddleware stores the URL in req.body.imageUrl
      const imageUrl = req.body?.imageUrl || req.body?.profile_pic;
      
      if (!imageUrl) {
        return res.status(400).json({ ok: false, message: "Image upload failed - no URL returned" });
      }
      
      res.status(200).json({ 
        ok: true, 
        url: imageUrl,
        data: { url: imageUrl }
      });
    } catch (error) {
      console.error('Variant upload error:', error);
      res.status(500).json({ ok: false, message: error.message });
    }
  }
);

// Admin routes for variant management
VariantsRouter.post("/products/:parentProductId/variants", authenticator, adminMiddleware, addVariant);
VariantsRouter.get("/products/:parentProductId/variants", getVariantsByParent);
VariantsRouter.get("/products/:parentProductId/variants/:variantId", getVariantById);
VariantsRouter.put("/products/:parentProductId/variants/:variantId", authenticator, adminMiddleware, updateVariant);
VariantsRouter.delete("/products/:parentProductId/variants/:variantId", authenticator, adminMiddleware, deleteVariant);

// Client routes
VariantsRouter.get("/variants/sku/:sku", getVariantBySku);
VariantsRouter.get("/products/with-variants/:id", getProductWithVariants);

module.exports = { VariantsRouter };
