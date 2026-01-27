
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/AuthProvider";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, ShoppingCart, ChevronDown, MapPin, Shield } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export const MainNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { user, token } = useAuth();
  // Admin panel base URL: prefer env var with safe fallbacks
  const adminUrl = (() => {
    const raw = (import.meta as any).env?.VITE_ADMIN_PANEL_URL;
    try {
      const parsed = new URL(raw);
      return parsed.origin;
    } catch {
      return raw;
    }
  })();
  
  // Get token from context or localStorage fallback
  const getToken = () => {
    if (token) return token;
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  };
  
  // Handoff token via query so admin can bootstrap localStorage (use `token` key)
  const adminHref = adminUrl
    ? (getToken() ? `${adminUrl}/?token=${encodeURIComponent(getToken() || '')}` : adminUrl)
    : '/admin';
  
  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isMobile && isMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original || '';
      };
    }
    return () => {};
  }, [isMenuOpen, isMobile]);

  // Close any expanded submenus when drawer closes
  useEffect(() => {
    if (!isMenuOpen) {
      setShopOpen(false);
    }
  }, [isMenuOpen]);

  // Auto-expand Shop submenu by default on gender routes while drawer is open on mobile
  useEffect(() => {
    if (!isMobile || !isMenuOpen) return;
    const path = location.pathname.toLowerCase();
    const genders = ['men', 'women', 'kids'];
    const shouldOpen = genders.some((g) =>
      path.startsWith(`/${g}`) || path.startsWith(`/categories/${g}`)
    );
    setShopOpen(shouldOpen);
  }, [location.pathname, isMenuOpen, isMobile]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
  // Navigate to search page with query parameter using SPA navigation
  navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Check if current route is cart to highlight the cart icon
  const isCartPage = location.pathname === '/cart';
  const isWishlistPage = location.pathname === '/wishlist';
  const isActiveCategory = (slug: string) => {
    const p = location.pathname.toLowerCase();
    return p.startsWith(`/${slug}`) || p.startsWith(`/categories/${slug}`);
  };

  return (
    <div className="self-center w-full">
        <div className="max-w-[1331px] mx-auto flex items-center justify-between responsive-padding-x mt-[13px] relative">
  {isMobile ? null : (
          /* Logo Section - Only show in desktop */
          <div className="flex items-center flex-shrink-0">
            <Link to="/">
              <img 
                src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/7cca860fedc8680dd550e361a158b91fff3bb621?placeholderIfAbsent=true" 
                className="aspect-[1.02] object-contain w-8 xs:w-10 md:w-14 shrink-0" 
                alt="Logo" 
              />
            </Link>
            <Link to="/" className="text-[rgba(33,33,33,1)] text-lg xs:text-xl md:text-[32px] font-bold ml-2 md:ml-4">
              ZIXX
            </Link>
          </div>
        )}

        {isMobile ? (
          <>
            {/* Logo on the left */}
            <div className="flex-1">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/7cca860fedc8680dd550e361a158b91fff3bb621?placeholderIfAbsent=true" 
                  className="w-8 object-contain" 
                  alt="Logo" 
                />
                <span className="text-lg font-bold">ZIXX</span>
              </Link>
            </div>
            
            {/* Search Bar in Center */}
            <form onSubmit={handleSearch} className="bg-[rgba(240,240,240,1)] flex w-[140px] max-w-[60%] gap-2 overflow-hidden rounded-[62px] px-3 py-2">
              <img 
                src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/6b478e42f8403dc6f5eae99c7cf3bb374642f221?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-4 shrink-0" 
                alt="Search" 
              />
              <input 
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none w-full text-sm text-black placeholder:text-gray-500"
              />
            </form>

            {/* Menu button on the right */}
              <div className="flex-1 flex justify-end">
              <button onClick={toggleMenu} className="text-[rgba(33,33,33,1)] z-50" aria-label="Menu">
                <Menu size={24} />
              </button>
            </div>
            
          </>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 xl:gap-8 justify-center flex-1 max-w-none">
            
            {/* Navigation Menu */}
            {/* <NavigationMenu className="hidden md:block">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm lg:text-base text-black">Shop</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/categories/featured"
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium">
                              Featured Collection
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Check out our latest arrivals and exclusive items
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link to="/categories/clothes" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Clothes</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            T-shirts, Hoodies, Joggers and more
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link to="/categories/accessories" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Accessories</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Bags, Caps, Socks and Essentials
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link to="/categories/collections" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Collections</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Themed collections and limited editions
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/sale" className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-2 lg:px-4 py-2 text-sm lg:text-base text-black hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  )}>
                    On Sale
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/new-arrivals" className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-2 lg:px-4 py-2 text-sm lg:text-base text-black hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  )}>
                    New Arrivals
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/brands" className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-2 lg:px-4 py-2 text-sm lg:text-base text-black hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  )}>
                    Brands
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
             */}
            {/* Search Bar - Responsive */}
            <form onSubmit={handleSearch} className="bg-[rgba(240,240,240,1)] flex w-full max-w-[150px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[420px] xl:max-w-[520px] gap-2 sm:gap-3 overflow-hidden rounded-[62px] px-3 sm:px-4 py-2 sm:py-3">
              <img 
                src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/6b478e42f8403dc6f5eae99c7cf3bb374642f221?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-4 sm:w-5 shrink-0" 
                alt="Search" 
              />
              <input 
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none w-full text-sm sm:text-base text-black placeholder:text-gray-500"
              />
            </form>
            
            {/* Icons Section */}
            <div className="flex gap-2 sm:gap-3 lg:gap-3.5 items-center flex-shrink-0">
              <Link to="/account" aria-label="Login/Account" className={location.pathname === '/auth' ? "relative after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-[#D92030] after:rounded-full" : ""}>
                <User size={20} className="sm:w-6 sm:h-6 hover:opacity-80 transition-opacity" />
              </Link>
              <Link to="/cart" aria-label="Shopping cart" className={isCartPage ? "relative after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-[#D92030] after:rounded-full" : ""}>
                <ShoppingCart size={20} className={`sm:w-6 sm:h-6 hover:opacity-80 transition-opacity ${isCartPage ? 'opacity-70' : ''}`} />
              </Link>
              <Link to="/wishlist" aria-label="Wishlist" className={isWishlistPage ? "relative after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-[#D92030] after:rounded-full" : ""}>
                <img 
                  src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/ac715f0dd7f9aaef44ddb1306739d29ec63e93de?placeholderIfAbsent=true" 
                  className="aspect-[1] object-contain w-5 sm:w-6 shrink-0 hover:opacity-80 transition-opacity" 
                  alt="Wishlist" 
                />
              </Link>
              {user?.role === 'admin' && (
                <a
                  href={adminHref}
                  onClick={(e) => {
                    e.preventDefault();
                    if (adminUrl && adminUrl !== '/admin') {
                      // External admin panel - open in new tab
                      window.open(adminHref, '_blank', 'noopener,noreferrer');
                    } else {
                      // Internal admin page - navigate in same window
                      navigate(adminHref);
                    }
                  }}
                  aria-label="Admin panel"
                  rel="noopener noreferrer"
                >
                  <User size={20} className="sm:w-6 sm:h-6 hover:opacity-80 transition-opacity text-red-600" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile menu: slide-in drawer with backdrop */}
  {isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
              isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <aside
            className={`fixed top-0 left-0 z-50 h-full w-[85%] max-w-[360px] bg-white shadow-xl transform transition-transform duration-300 ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <img 
                    src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/7cca860fedc8680dd550e361a158b91fff3bb621?placeholderIfAbsent=true" 
                    className="w-7 h-7 object-contain" 
                    alt="Logo" 
                  />
                  <span className="text-lg font-bold">ZIXX</span>
                </Link>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-md hover:bg-gray-100 active:bg-gray-200"
              >
                <X size={22} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex flex-col h-[calc(100%-60px)]">
              {/* Quick category links */}
              <div className="p-3 border-b">
                <div className="flex gap-2">
                  <Link
                    to="/men"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex-1 text-center rounded-full py-2 px-4 font-semibold ring-1 shadow-sm transition-colors",
                      isActiveCategory('men')
                        ? "bg-black text-white ring-black"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 ring-gray-200"
                    )}
                  >
                    Men
                  </Link>
                  <Link
                    to="/women"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex-1 text-center rounded-full py-2 px-4 font-semibold ring-1 shadow-sm transition-colors",
                      isActiveCategory('women')
                        ? "bg-black text-white ring-black"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 ring-gray-200"
                    )}
                  >
                    Women
                  </Link>
                  <Link
                    to="/kids"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex-1 text-center rounded-full py-2 px-4 font-semibold ring-1 shadow-sm transition-colors",
                      isActiveCategory('kids')
                        ? "bg-black text-white ring-black"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 ring-gray-200"
                    )}
                  >
                    Kids
                  </Link>
                </div>
              </div>

              {/* <nav className="p-2 flex-1 overflow-y-auto">
                <ul className="flex flex-col">
                  <li>
                    <button
                      type="button"
                      className="w-full group flex items-center justify-between px-3 py-3 text-left text-base font-medium rounded-lg transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      onClick={() => setShopOpen(prev => !prev)}
                      aria-expanded={shopOpen}
                      aria-controls="mobile-shop-submenu"
                    >
                      Shop
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      id="mobile-shop-submenu"
                      aria-hidden={!shopOpen}
                      className={cn(
                        "ml-2 border-l pl-3 transition-all duration-300",
                        shopOpen ? "mt-1 mb-2" : "mt-0 mb-0"
                      )}
                    >
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300",
                          shopOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                        )}
                      >
                        <ul className="space-y-1">
                          <li>
                            <Link
                              to="/categories/featured"
                              className="block px-2 py-2 rounded-md text-[15px] hover:bg-gray-50 active:bg-gray-100"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Featured Collection
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/categories/clothes"
                              className="block px-2 py-2 rounded-md text-[15px] hover:bg-gray-50 active:bg-gray-100"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Clothes
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/categories/accessories"
                              className="block px-2 py-2 rounded-md text-[15px] hover:bg-gray-50 active:bg-gray-100"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Accessories
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/categories/collections"
                              className="block px-2 py-2 rounded-md text-[15px] hover:bg-gray-50 active:bg-gray-100"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Collections
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link
                      to="/sale"
                      className="group flex items-center justify-between px-3 py-3 text-base rounded-lg transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      On Sale
                      <span className="text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/new-arrivals"
                      className="group flex items-center justify-between px-3 py-3 text-base rounded-lg transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      New Arrivals
                      <span className="text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/brands"
                      className="group flex items-center justify-between px-3 py-3 text-base rounded-lg transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Brands
                      <span className="text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                </ul>
              </nav> */}
            </div>
          </aside>
        </>
      )}

      {/* Bottom Navigation Bar for Mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-2 py-1 safe-area-inset-bottom">
          <div className="flex items-center justify-between max-w-[500px] mx-auto">
            <Link to="/" className="flex flex-col items-center p-2 flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-5 h-5 mb-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/wishlist" className={`flex flex-col items-center p-2 flex-1 ${isWishlistPage ? 'text-[#D92030]' : ''}`}>
              <img 
                src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/ac715f0dd7f9aaef44ddb1306739d29ec63e93de?placeholderIfAbsent=true" 
                className="w-5 h-5 mb-1" 
                alt="Wishlist" 
              />
              <span className="text-xs">Wishlist</span>
            </Link>
            <Link to="/cart" className={`flex flex-col items-center p-2 flex-1 ${isCartPage ? 'text-[#D92030]' : ''}`}>
              <ShoppingCart size={20} className="mb-1" />
              <span className="text-xs">Cart</span>
            </Link>
            <Link to="/account" className="flex flex-col items-center p-2 flex-1">
              <User size={20} className="mb-1" />
              <span className="text-xs">Account</span>
            </Link>
            {user?.role === 'admin' && (
              <a
                href={adminHref}
                onClick={(e) => {
                  e.preventDefault();
                  if (adminUrl && adminUrl !== '/admin') {
                    // External admin panel - open in new tab
                    window.open(adminHref, '_blank', 'noopener,noreferrer');
                  } else {
                    // Internal admin page - navigate in same window
                    navigate(adminHref);
                  }
                }}
                className="flex flex-col items-center p-2 flex-1"
                rel="noopener noreferrer"
              >
                <Shield size={20} className="mb-1 text-red-600" />
                <span className="text-xs">Admin</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
