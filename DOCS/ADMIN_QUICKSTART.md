# Zixx — Admin Quick Start (one page)

This one-page guide helps a non-technical admin get the site running and perform daily tasks: add a product, upload images, verify orders, and handle refunds.

Prerequisites (ask dev/team for these):

- Admin URL (for example: https://admin.zixx.in or http://localhost:8000)
- Admin account (email and password)
- Access to product images and content (images in JPG/PNG)

Daily checklist (first-time setup)

1. Login to admin panel.
2. Verify home banners and update if required.
3. Check new orders and process pending ones.
4. Add new products or bulk upload if you have many.
5. Monitor refunds and customer messages.

Step-by-step: Add a product (simplified)

1. Login to admin URL with admin account.
2. Go to Products → Add Product.
3. Fill product title, description, price, category, brand.
4. Upload product images (drag-and-drop). Recommended: 3–5 images, 1000×1000 px.
5. Set stock quantity and publish.
6. Verify product appears on storefront in the relevant category.

Step-by-step: Process an order

1. Go to Orders → New / Pending.
2. Click an order to open details.
3. Verify payment status (Paid / Unpaid). If Paid, proceed.
4. Pack the product and mark status as "Packed".
5. Ship the product and update tracking number + carrier.
6. Update order status to "Shipped". Customer will receive email automatically.

Step-by-step: Refund a payment

1. Open the order page.
2. Click Refund.
3. Enter refund amount (full or partial) and reason.
4. Confirm. Note: refunds are processed via the payment provider and may take a few days.

Tips & best practices

- Use consistent naming conventions for product titles and images.
- Always add at least one clear product image and 2–3 supporting images.
- For multiple products, prepare a CSV with title, price, category, SKU, stock and ask the dev team to bulk import.

Common problems and quick fixes

- Can't upload images: try smaller image files and check network.
- Orders show unpaid but payment was made: ask customer for transaction ID and time, then check payment gateway dashboard.
- Product not visible: ensure product is published and has stock > 0.

Who to contact

- For account issues or missing admin access: site owner / developer
- For payments/refunds issues: finance team and developer (they may need payment provider logs)

End of quick-start.
