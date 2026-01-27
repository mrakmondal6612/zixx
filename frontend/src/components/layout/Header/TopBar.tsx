// components/TopBar.jsx
import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAuthContext } from '@/hooks/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const TopBar = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/women')) return 'women';
    if (location.pathname.includes('/men')) return 'men';
    if (location.pathname.includes('/kids')) return 'kids';
    return 'home';
  });

  const isMobile = useIsMobile();
  const { currentLanguage, t } = useLanguage();
  const { user, logout, loading } = useAuthContext();

  const isProfileComplete = useMemo(() => {
    if (!user) return true; // hide banner for logged-out users
    const u: any = user as any;
    const address = typeof u.address === 'string' ? (() => { try { return JSON.parse(u.address); } catch { return {}; } })() : (u.address || {});
    const required = [
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.gender,
      u.dob,
      address.city,
      address.state,
      address.country,
      address.zip,
      address.address_village,
    ];
    return required.every((v) => v !== undefined && v !== null && String(v).trim() !== '' && String(v).toLowerCase() !== 'n/a');
  }, [user]);

  // Allow dismissing the banner until next refresh (no persistence)
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  // languages is intentionally single-entry (English only)

  return (
    <div className="bg-[rgba(34,40,40,1)] w-full flex flex-col items-stretch justify-center px-3 md:px-6 lg:px-0">
      <div className="max-w-[1280px] w-full mx-auto flex min-h-[45px] items-center gap-2 md:gap-8 justify-between flex-wrap sm:flex-nowrap py-1">
        {/* Mobile Menu Toggle removed: Men/Women/Kids now live in MainNav drawer */}

        {/* Nav Links */}
  <nav className={`${isMobile ? 'hidden' : 'flex flex-row'} items-stretch text-sm font-bold text-center uppercase ml-72` }>
          {['women', 'men', 'kids'].map(tab => (
            <Link 
              key={tab}
              to={`/${tab}`}
              className={`flex-1 md:flex-none min-w-[80px] md:min-w-0 md:w-[114px] px-1 border-x border-transparent md:border-[#52505] transition-all duration-300 hover:scale-105 ${
                activeTab === tab 
                  ? 'bg-white text-black transform scale-105' 
                  : 'text-white hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <div className="font-bold leading-[21px] py-2 md:py-3 text-xs md:text-sm">{t(`header.${tab}`)}</div>
            </Link>
          ))}

          {/* Desktop-only tabs; mobile uses MainNav drawer quick links */}
        </nav>

        {/* Account + Location + Actions — Always Visible */}
  <div className="z-10 ml-auto flex items-center gap-1 md:gap-2.5 text-white">
          {/* Language selector removed per request */}

          {/* Track Order + Contact (visible for all) */}
          <>
            <Link to="/track-order" className="text-white text-xs md:text-sm font-normal leading-[19.5px] hover:underline ml-2">
              {t('header.trackOrder')}
            </Link>
            <Link to="/contact" className="text-white text-xs md:text-sm font-normal leading-[19.5px] hover:underline ml-2">
              {t('header.contactUs')}
            </Link>
          </>

          {/* User Dropdown */}
          {loading ? (
            <div className="text-xs md:text-sm font-normal leading-[19.5px] ml-2">{t('common.loading')}</div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-xs md:text-sm font-normal leading-[19.5px] hover:opacity-80 transition-opacity ml-2">
                <img
                  src={user.profile_pic || "/placeholder.svg"}
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover border border-gray-300 bg-white"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== "/placeholder.svg") {
                      target.src = "/placeholder.svg";
                    }
                  }}
                />
                <span className="hidden md:inline">
                  {user.first_name ? `${user.first_name} ${user.last_name}` : user.email?.split('@')[0] || 'Account'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg z-50" align="end">
                <DropdownMenuItem asChild>
                  <Link to="/account" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">
                    <User className="w-4 h-4" />
                    {t('header.myAccount')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wishlist" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer">
                    <User className="w-4 h-4" />
                    {t('header.wishlist')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/logout" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4" />
                    {t('header.signOut')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="text-white text-xs md:text-sm font-normal leading-[19.5px] hover:underline ml-2">
              {t('header.login')}
            </Link>
          )}
        </div>
      </div>
      {/* Global profile completion banner (visible for logged-in users until complete) */}
      {!loading && user && !isProfileComplete && !bannerDismissed && (
        <div className="w-full bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-sm mt-1 mb-2 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs md:text-sm">
              <strong>{t('header.completeProfile')}</strong> {t('header.completeProfileDesc')}
            </div>
            <Link
              to="/account#profile-form"
              className="text-xs md:text-sm font-semibold text-yellow-900 underline hover:no-underline whitespace-nowrap"
            >
              {t('header.updateNow')}
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="ml-2 text-xs md:text-sm text-yellow-900 hover:underline"
              aria-label="Dismiss"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
