import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import './App.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScrollToTop } from "./components/ScrollToTop";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import AntiInspect from "@/components/AntiInspect";

// Route-level code splitting
const Home = lazy(() => import('./pages/Home'));
const Buy = lazy(() => import('./pages/Buy'));
const Index = lazy(() => import('./pages/Index'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Brands = lazy(() => import('./pages/Brands'));
const Login = lazy(() => import('./pages/Login'));
const Logout = lazy(() => import('./pages/Logout'));
const Women = lazy(() => import('./pages/Women'));
const Men = lazy(() => import('./pages/Men'));
const Kids = lazy(() => import('./pages/Kids'));
const Signup = lazy(() => import('./pages/Signup'));
const Shop = lazy(() => import('./pages/Shop'));
const OnSale = lazy(() => import('./pages/OnSale'));
const NewArrivals = lazy(() => import('./pages/NewArrivals'));
const Contact = lazy(() => import('./pages/Contact'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Search = lazy(() => import('./pages/Search'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const ReturnsRefunds = lazy(() => import('./pages/ReturnsRefunds'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Clothes = lazy(() => import('./pages/Clothes'));
const Accessories = lazy(() => import('./pages/Accessories'));
const Collections = lazy(() => import('./pages/Collections'));
const FeaturedCollection = lazy(() => import('./pages/FeaturedCollection'));
const Product = lazy(() => import('./pages/Product'));
const SingleCartProduct = lazy(() => import('./pages/SingleCartProduct'));
const Admin = lazy(() => import('./pages/Admin'));
const Auth = lazy(() => import('./pages/Auth'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Account = lazy(() => import('./pages/Account'));
const Category = lazy(() => import('./pages/Category'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
            <Toaster />
            <ScrollToTop />
            <GlobalLoadingOverlay />
            <AntiInspect />
            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/cart/product/:id" element={<ProtectedRoute><SingleCartProduct /></ProtectedRoute>} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/women" element={<Women />} />
        <Route path="/men" element={<Men />} />
        <Route path="/kids" element={<Kids />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/on-sale" element={<OnSale />} />
        <Route path="/sale" element={<OnSale />} />
        <Route path="/new-arrivals" element={<NewArrivals />} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
        <Route path="/search" element={<Search />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="/returns" element={<ReturnsRefunds />} />
        <Route path="/webhooks" element={<Webhooks />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/clothes" element={<Clothes />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/featured-collection" element={<FeaturedCollection />} />
        {/* Shop submenu routes (desktop links use /categories/*) */}
        <Route path="/categories/clothes" element={<Clothes />} />
        <Route path="/categories/accessories" element={<Accessories />} />
        <Route path="/categories/collections" element={<Collections />} />
        <Route path="/categories/featured" element={<FeaturedCollection />} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/product" element={<Product />} />
        {/* Email verification */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* Category routes */}
        <Route path="/category/:category" element={<Category />} />
        <Route path="/category/:category/:subcategory" element={<Category />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
