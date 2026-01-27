const express = require("express");
const { authenticator } = require("../../middlewares/authenticator.middleware");
const { adminMiddleware } = require("../../middlewares/admin.middleware");
const { getAllOrders, verifyOrder, confirmOrderForDelivery, adminDeliverOrder, adminDeleteOrder, adminMarkPacked, adminUpdateCourier, adminUploadCourierLogo, adminCollectCODPayment, adminMarkOutForDelivery } = require("../../controllers/order.controlers");
const { upload, cloudinaryUploadMiddleware } = require("../../middlewares/cloudinaryUpload");
const { adminRefundOrder } = require("../../controllers/payments.controller");

const OrdersRouter = express.Router();

// Get all orders (admin only)
OrdersRouter.get("/orders", authenticator, adminMiddleware, getAllOrders);

// Verify an order (admin only)
OrdersRouter.patch("/orders/:id/verify", authenticator, adminMiddleware, verifyOrder);

// Confirm for delivery (mark as shipped) (admin only)
OrdersRouter.patch("/orders/:id/confirm", authenticator, adminMiddleware, confirmOrderForDelivery);

// Mark as packed (admin only)
OrdersRouter.patch("/orders/:id/pack", authenticator, adminMiddleware, adminMarkPacked);

// Update courier info (admin only)
OrdersRouter.patch("/orders/:id/courier", authenticator, adminMiddleware, adminUpdateCourier);

// Upload courier logo (admin only) - expects multipart/form-data with field "file"
OrdersRouter.post(
  "/orders/:id/courier/logo",
  authenticator,
  adminMiddleware,
  upload.single('file'),
  cloudinaryUploadMiddleware,
  adminUploadCourierLogo
);

// Mark as delivered (admin only)
OrdersRouter.patch("/orders/:id/deliver", authenticator, adminMiddleware, adminDeliverOrder);

// Collect COD payment (admin only)
OrdersRouter.patch("/orders/:id/cod/collect", authenticator, adminMiddleware, adminCollectCODPayment);

// Mark as out for delivery (admin only)
OrdersRouter.patch("/orders/:id/out-for-delivery", authenticator, adminMiddleware, adminMarkOutForDelivery);

// Initiate a refund for an order (admin only)
OrdersRouter.post("/orders/:id/refund", authenticator, adminMiddleware, adminRefundOrder);

// Delete an order (admin only)
OrdersRouter.delete("/orders/:id", authenticator, adminMiddleware, adminDeleteOrder);

module.exports = { OrdersRouter };
