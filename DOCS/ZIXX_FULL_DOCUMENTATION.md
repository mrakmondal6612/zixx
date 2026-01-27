## ZIXX — Full Project Documentation (A → Z)

Version: 1.0
Date: 2025-09-27

This document provides a complete, non-technical friendly overview of the Zixx application, how to run it locally, what each part does, and detailed step-by-step instructions for users and admins: from login, browsing and buying a product, to uploading products and logging out.

If you are a non-technical client, use the "User guide" sections — they explain every action you will take in the website UI. Developer/ops sections are included later for the technical team.

---

## Table of contents

- Quick summary
- Project layout (folders and responsibilities)
- Quick start (local dev) — minimal steps
- Environment variables (short list)
- Features (high-level)
- Data & APIs (short reference)
- User guide (non-technical) — step-by-step flows
  - Account: register, login, logout
  - Browse & search products
  - Product details
  - Wishlist
  - Cart and checkout (payment flow)
  - Order tracking and history
  - Reviews
- Admin / Seller guide (non-technical) — content/upload flows
  - Accessing admin dashboard
  - Create / Edit product (upload images)
  - Manage orders (verify, ship, refund)
  - Manage banners, testimonials, footer
- Integrations (payments, images, email, sms)
- Troubleshooting & common fixes (for non-technical)
- Developer notes (short) and recommended next steps
- Appendix: important file locations / commands

---

## Quick summary

Zixx is an e-commerce platform built with a Node.js backend (Express + MongoDB) and modern React frontends (Vite). It supports customer accounts, product catalog, cart/checkout, payments (Razorpay), image uploads (Cloudinary), admin dashboards, and useful content pages (banners, testimonials, footer).

This document explains how the system is organized and how to perform every common user and admin task, described in plain, step-by-step instructions so a non-technical client can use the application or hand instructions to their team.

---

## Project layout (top-level)

- `backend/` — Express API, MongoDB models, authentication, payments, admin APIs, seed scripts
- `frontend/` — Public storefront (Vite + React + TypeScript + Tailwind)
- `admin_pannel/` — Admin dashboard client (React + MUI)
- `init/`, `seed/`, `scripts/` — helper and seeding utilities
- `DOCS/` — documentation (this file)

If you open the project root you will find these folders. The backend runs on a port (for example 8282). The frontend runs on another port (Vite dev server). In production they are deployed to real domains.

---

## Quick start (minimal steps) — for someone who can run programs

1. Install node and npm.
2. Open three terminals.
3. Backend server:

```bash
cd backend
npm install
# fill backend/.env with values (see env list below)
npm run server
```

4. Frontend (public site):

```bash
cd frontend
npm install
npm run dev
```

5. Admin UI (if you need admin dashboard locally):

```bash
cd admin_pannel
npm install
npm run dev
```

Notes: the site will print a local URL (like http://localhost:8080 or http://localhost:5173). Use that in your browser.

---

## Important environment variables (short list)

Create `backend/.env` with values. Important ones:

- PORT — backend port (e.g. 8282)
- MONGODB_URI — connection string to your MongoDB
- SESSION_SECRET — secret for sessions
- FRONTEND_URL / FRONTEND_DEV_URL — frontend origin(s) (for cookies & CORS)
- ADMIN_CLIENT_URL — admin client URL
- CLD_CLOUD_NAME, CLD_API_KEY, CLD_API_SECRET — Cloudinary keys
- RAZORPAY_KEY_ID, RAZORPAY_SECRET, RAZORPAY_WEBHOOK_SECRET — Razorpay keys
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM — email
- AUTO_SEED — set to true to seed demo data on startup

If you need a `.env.example`, ask the technical team to create it from these variables.

---

## Features (high-level)

- Customer registration and login (email/password). OTP support for phone login may be available.
- Product catalog: categories, brands, filters, product pages with multiple images.
- Cart: add/remove items, quantity update, view subtotal.
- Checkout and payment via Razorpay.
- Orders: order history, tracking updates, admin-managed delivery status.
- Wishlist, Reviews, Testimonials
- Admin tools: product management, banners, sales dashboard, transactions, refunds
- Image uploads handled through Cloudinary (fast CDN hosting)

---

## Data & API (brief reference)

The backend exposes API routes under `/api`. Common route groups:

- Public client routes (frontend): `/api/clients/...` (products, cart, orders, payments, auth)
- Admin routes: `/api/admin/...` (product management, orders, dashboards)

For non-technical clients: you don't need to call these APIs directly — use the UI. The mapping exists so developers can integrate or automate tasks if needed.

---

## User guide (non-technical, step-by-step)

This section explains how a normal website user (customer) will use the system. Each flow is written for a non-technical person.

Note: exact labels vary slightly between UI versions. If you can't find a button, look for similar text: "Sign in", "Login", "My account", "Cart", "Checkout".

### Create an account (Register)

1. Open the storefront URL in your browser (the public website). You will typically see "Sign up" / "Register" or "Create account" in the header or a profile menu.
2. Click "Register".
3. Fill required fields:
   - Full name (first and last name)
   - Email address
   - Password (choose a secure password)
   - Phone number (if requested)
4. Press the "Register" or "Create account" button.
5. You will usually receive a confirmation message. Some deployments may require email verification — check your inbox for a confirmation link.

What to expect: after registration you may be automatically logged in. If not, use the Login flow below.

### Login (Sign in)

1. Click "Login" or the profile icon in the header.
2. Enter email and password (or use OTP/Google login if offered).
3. Click "Sign in". If everything is correct you'll land on the homepage or your account page.

Troubleshooting: if password isn't accepted, use "Forgot password" to reset.

### Browsing & Searching for products

1. Use the search box (usually at the top) to type product names or categories (for example "black shoes").
2. Use filters on the listing page to narrow results: brand, price range, size, color.
3. Click a product card to open the product details page.

Tip: sort or filter by "Featured" or "Top rated" if you want popular products.

### Product details page

1. On the product page you will see:
   - Product title, price, discount (if any)
   - Product images (click thumbnails to change main image)
   - Size / color options
   - Description and features
   - Customer reviews and average rating
2. Choose desired size/color and quantity.
3. Optional: click "Add to Wishlist" if you want to save the product for later.
4. Click "Add to Cart" to add the chosen variant to your shopping cart.

### Wishlist

1. The wishlist is a private list of products you want to keep for later.
2. Add items using the "Add to Wishlist" button on product pages or listing cards.
3. Access your wishlist from the header (often under your account menu) and move items to cart from there.

### Cart, Checkout & Payment (Buy a product)

Cart:

1. Click the cart icon (usually in the header) to open the cart overview.
2. Review items, adjust quantities, or remove items.
3. Click "Proceed to Checkout".

Checkout:

1. Enter or select shipping address. You may be able to select a saved address from your account or add a new one.
2. Choose shipping options if available (standard, express).
3. Choose payment method — Razorpay or other methods available in the UI.

Payment via Razorpay (normal card / UPI / wallet flow):

1. Choose Razorpay at payment step and click "Pay".
2. A secure payment window will open (Razorpay widget). Follow on-screen steps to complete payment (card details, UPI approval, or netbanking).
3. After successful payment you will see a confirmation page and receive a confirmation email.

What to expect after ordering:

- The order will appear in your "My Orders" or "Order History" page with a status (e.g., Pending → Packed → Shipped → Delivered).
- You can use the order details page to track shipping number if the admin has added tracking information.

### Order tracking and order history

1. Open "My Account" and navigate to "Orders" or "Order History".
2. Click an order to view details: products, totals, shipping address, payment status, and tracking number (if available).

### Reviews (leave product feedback)

1. Visit the purchased product's detail page.
2. Scroll to the reviews section and click "Write a review".
3. Enter star rating and a short comment, then submit.

### Logout

1. Click your profile icon or account menu in the header.
2. Click "Logout" or "Sign out". You will be redirected to the homepage as a visitor.

---

## Admin / Seller guide (non-technical)

This section explains how to use the admin dashboard to manage products, images, and orders. If you are a non-technical admin or seller, these steps assume you can use the admin UI in a browser.

### Accessing the admin dashboard

1. Use the admin URL provided to you (for local testing it may be `http://localhost:3000` or `http://localhost:8000` for the admin app).
2. Log in using your admin credentials (email/password). The admin login may be separate from the storefront login.

If you don't have an admin account, request one from the project owner or set up a temporary admin account using the backend seed or `init` scripts (technical step).

### Create a new product (upload images)

1. In the admin dashboard, find the "Products" or "Catalog" section.
2. Click "Create Product" or "Add New".
3. Fill product information:
   - Title
   - Description
   - Brand
   - Category and Subcategory
   - Price and Discount (if any)
   - Sizes and Colors (type or select options)
   - Stock / Supply (how many units available)
4. Upload images:
   - Look for an "Upload Images" button or drag-and-drop area.
   - Click it and pick image files from your computer (jpg/png). You can upload multiple images.
   - The admin UI uploads images and stores them in Cloudinary — the UI will show thumbnails after upload.
   - Optionally set image order (main image, gallery order) and alt text or captions.
5. Save the product by clicking "Publish" or "Save".

Tips:

- Use good-quality product images (white background, multiple angles).
- Fill product features bullet points to help customers.

### Edit product

1. Open the product list and find the product to update.
2. Click "Edit".
3. Make changes and save.

### Manage orders (admin flow)

1. Go to "Orders" in the admin dashboard.
2. Find a new order (status: Pending or Unverified).
3. Verify payment (if needed) and update order status to "Packed" → "Shipped" → "Delivered" depending on fulfillment.
4. Add tracking number and carrier details when shipping, so customers can track their order.

Refunds:

1. On the order page click "Refund".
2. Enter partial or full amount and confirm. This will trigger refund logic in the payments system (admin must have required payment provider credentials configured).

### Manage banners, testimonials, footer

1. Find the "Content" or "Site Content" section in admin.
2. Use "Banners" to upload new homepage banners (images + link + caption).
3. Use "Testimonials" to add customer quotes (name, text, picture).
4. Footer content can be edited under "Footer" (addresses, links, services).

---

## Integrations (short, non-technical)

- Cloudinary: hosts and resizes images. When you upload a product image in the admin UI, it will be stored in Cloudinary and served from a fast CDN.
- Razorpay: payment provider used at checkout. Customers enter card/UPI details in a secure popup and Razorpay handles the payment.
- SMTP (email): order confirmations and password resets are sent by email.
- Twilio (optional): used for OTP or SMS messages when enabled.

All of these are configured by the technical team via environment variables in the backend server. As an admin you just use the UI.

---

## Troubleshooting (non-technical)

Problem: I can't log in

- Check if your email and password are correct.
- Use "Forgot password" to reset.
- If you still can't log in, contact the site admin to confirm your account is active.

Problem: Payment failed

- Ensure your card/UPI has sufficient funds.
- Try another payment method if available.
- If payment was charged but order not confirmed, contact support with payment details (date, amount, last 4 card digits).

Problem: Images won't upload

- Check your internet connection.
- Try smaller images (below 5–10 MB) and JPEG/PNG format.
- If problems persist, contact the admin for Cloudinary quota or backend errors.

Problem: I don't see my new product on the storefront

- Confirm the product is "Published" in admin.
- Check if your product is assigned to the right category and has stock > 0.

If none of these help, collect a screenshot and send it to the technical team or site admin.

---

## Developer notes (short)

- Backend entry: `backend/index.js` — handles CORS, sessions, Cloudinary, routes.
- Client routes: `/api/clients/...` and admin routes `/api/admin/...`.
- Models live in `backend/models/` (user, product, order, transaction, etc.).
- Seed scripts: `backend/seed/autoSeed.js` and `init/` helpers.

Quality and maintenance recommended:

- Add an `.env.example` to the repo listing required env vars.
- Add API documentation (OpenAPI / Postman collection) for integrators.
- Add unit/integration tests for auth, order creation, and webhook handling.

---

## Recommended next steps for the client

1. Prepare admin account(s) and email addresses for support and order management.
2. Provide product images and CSV of products (title, description, price, category, stock) to the admin to bulk upload.
3. Configure and verify payment gateway credentials in the backend (ask the developer to set `RAZORPAY_*` values).
4. Test a complete checkout flow on a staging environment (not production) — confirm email notifications and order creation.

---

## Appendix: important file locations and useful commands

- Backend entry: `backend/index.js`
- Backend models: `backend/models/*.js`
- Backend controllers: `backend/controllers/*.js`
- Frontend app: `frontend/src/`
- Admin app: `admin_pannel/src/`

Commands (developer):

```bash
# Backend
cd backend
npm install
npm run server

# Frontend
cd frontend
npm install
npm run dev

# Admin panel
cd admin_pannel
npm install
npm run dev
```

---


End of document.
