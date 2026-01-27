import React, { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, Heart, LogOut } from 'lucide-react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useAuthContext } from "@/hooks/AuthProvider";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Account = () => {
  const { toast } = useToast();
  const { user, token, setUser } = useAuthContext();
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const isProfileComplete = (u: any): boolean => {
    if (!u) return false;
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
  };
  type Address = {
    personal_address?: string;
    shoping_address?: string;
    billing_address?: string;
    address_village?: string;
    landmark?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };

  const [formData, setFormData] = useState({
    first_name: "N/A",
    middle_name: "N/A",
    last_name: "N/A",
    email: "N/A",
    phone: "N/A",
    gender: "N/A",
    dob: "N/A",
    personal_address: "N/A",
    shoping_address: "N/A",
    billing_address: "N/A",
    address_village: "N/A",
    landmark: "N/A",
    city: "N/A",
    state: "N/A",
    country: "N/A",
    zip: "N/A",
  });
  const [profilePic, setProfilePic] = useState<string>("");
  const [previewPic, setPreviewPic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (user) {
      const u: any = user as any;
      let addressObj = u.address;
      if (typeof addressObj === 'string') {
        try {
          addressObj = JSON.parse(addressObj);
        } catch {
          addressObj = {};
        }
      }
      setFormData({
        first_name: u.first_name || "N/A",
        middle_name: u.middle_name || "N/A",
        last_name: u.last_name || "N/A",
        email: u.email || "N/A",
        phone: u.phone?.toString() || "N/A",
        gender: u.gender || "N/A",
        dob: u.dob || "N/A",
        personal_address: addressObj?.personal_address ?? "N/A",
        shoping_address: addressObj?.shoping_address ?? "N/A",
        billing_address: addressObj?.billing_address ?? "N/A",
        address_village: addressObj?.address_village ?? "N/A",
        landmark: addressObj?.landmark ?? "N/A",
        city: addressObj?.city ?? "N/A",
        state: addressObj?.state ?? "N/A",
        country: addressObj?.country ?? "N/A",
        zip: addressObj?.zip ?? "N/A",
      });
      setProfilePic(u.profile_pic || "");
      setPreviewPic(u.profile_pic || "");
      if (!isProfileComplete(u) && !bannerDismissed) {
        setShowCompleteBanner(true);
      }
      try {
        const url = new URL(window.location.href);
        const hadFirst = url.searchParams.has('first');
        const hadComplete = url.searchParams.has('completeProfile');
        if (hadFirst || hadComplete) {
          url.searchParams.delete('first');
          url.searchParams.delete('completeProfile');
          window.history.replaceState({}, document.title, url.toString());
        }
      } catch {}
    }
  }, [user, bannerDismissed]);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };


  const [uploading, setUploading] = useState(false);
  
    const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  
  const [accountStats, setAccountStats] = useState({
    wishlistCount: 0,
    ordersCount: 0,
    cartCount: 0,
    reviewsCount: 0
  });
  const [accountLoading, setAccountLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('profile_pic', file);
  const res = await fetch(apiUrl('/clients/user/me'), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: form,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setUser(data.user);
        setProfilePic(file as any);
        setPreviewPic(data.user.profile_pic || URL.createObjectURL(file));
      } else {
        alert(data.msg || 'Image upload failed');
      }
    } catch (err) {
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append('first_name', formData.first_name);
      form.append('middle_name', formData.middle_name);
      form.append('last_name', formData.last_name);
      form.append('email', formData.email);
      form.append('phone', formData.phone);
      form.append('gender', formData.gender);
      form.append('dob', formData.dob);
      form.append('personal_address', formData.personal_address ?? '');
      form.append('shoping_address', formData.shoping_address ?? '');
      form.append('billing_address', formData.billing_address ?? '');
      form.append('address_village', formData.address_village ?? '');
      form.append('landmark', formData.landmark ?? '');
      form.append('city', formData.city ?? '');
      form.append('state', formData.state ?? '');
      form.append('country', formData.country ?? '');
      form.append('zip', formData.zip ?? '');
      if (profilePic && typeof profilePic !== 'string') {
        form.append('profile_pic', profilePic);
      }
      const res = await fetch(apiUrl('/clients/user/me'), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: form,
        credentials: 'include',
      });
      if (res.status === 401) {
        alert('Please sign in to update your profile.');
        window.location.href = '/auth';
        return;
      }
      const data = await res.json();
      if (data.ok && data.user) {
        setUser(data.user);
        setFormData({
          first_name: data.user.first_name || "N/A",
          middle_name: data.user.middle_name || "N/A",
          last_name: data.user.last_name || "N/A",
          email: data.user.email || "N/A",
          phone: data.user.phone?.toString() || "N/A",
          gender: data.user.gender || "N/A",
          dob: data.user.dob || "N/A",
          personal_address: data.user.address?.personal_address ?? "N/A",
          shoping_address: data.user.address?.shoping_address ?? "N/A",
          billing_address: data.user.address?.billing_address ?? "N/A",
          address_village: data.user.address?.address_village ?? "N/A",
          landmark: data.user.address?.landmark ?? "N/A",
          city: data.user.address?.city ?? "N/A",
          state: data.user.address?.state ?? "N/A",
          country: data.user.address?.country ?? "N/A",
          zip: data.user.address?.zip ?? "N/A",
        });
        try { localStorage.removeItem('profileSetupSkipped'); } catch {}
        setShowCompleteBanner(false);
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('first');
          url.searchParams.delete('completeProfile');
          window.history.replaceState({}, document.title, url.toString());
        } catch {}
        alert('Profile updated!');
      } else {
        alert(data.msg || 'Update failed');
      }
    } catch (err) {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const errors: {[key: string]: string} = {};
    
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchAccountStats = async () => {
    setAccountLoading(true);
    try {
      const authHeaders = getAuthHeaders();
      const [wishlistRes, ordersRes, cartRes] = await Promise.all([
        fetch(apiUrl('/clients/user/wishlist'), { 
          credentials: 'include',
          headers: authHeaders
        }),
        fetch(apiUrl('/clients/user/orders'), { 
          credentials: 'include',
          headers: authHeaders
        }),
        fetch(apiUrl('/clients/user/getcart'), { 
          credentials: 'include',
          headers: authHeaders
        })
      ]);

      // Debug: Log response status for Google OAuth users
      console.log('Account Stats API Status:', {
        wishlist: wishlistRes.status,
        orders: ordersRes.status,
        cart: cartRes.status,
        user: user?.email,
        authProvider: (user as any)?.authProvider
      });

      const wishlistData = await wishlistRes.json().catch(() => ({ wishlist: [] }));
      const ordersData = await ordersRes.json().catch(() => ({ orders: [] }));
      const cartData = await cartRes.json().catch(() => ({ data: [] }));

      // Debug: Log actual data received
      console.log('Account Stats Data:', {
        wishlistData,
        ordersData,
        cartData
      });

      setAccountStats({
        wishlistCount: (Array.isArray(wishlistData?.wishlist) ? wishlistData.wishlist.length : 0) || 0,
        ordersCount: (Array.isArray(ordersData?.orders) ? ordersData.orders.length : 0) || 0,
        cartCount: (Array.isArray(cartData?.data) ? cartData.data.length : 0) || 0,
        reviewsCount: 0 // Can be implemented later
      });
      setLastRefresh(new Date());
    } catch (error) {
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccountStats();
    }
  }, [user]);

  const handleEmailVerification = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      toast({
        title: 'Sending verification email',
        description: 'Please wait...',
      });
      
      const response = await fetch(apiUrl('/clients/user/resend-verification'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to send verification email');
      }
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the verification link.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send verification email',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setPasswordLoading(true);
    try {
      const response = await fetch(apiUrl('/clients/user/change-password'), {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        alert('Password updated successfully!');
        // Clear form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
      } else {
        if (response.status === 401) {
          setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        } else {
          alert(data.msg || 'Failed to update password');
        }
      }
    } catch (error) {
      alert('Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        {showCompleteBanner && (
          <div className="mb-6 p-4 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 flex items-center justify-between">
            <div>
              <p className="font-semibold">Complete your profile</p>
              <p className="text-sm">Please fill in your personal details and address to continue shopping and checkout smoothly.</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="#profile-form" className="px-3 py-2 rounded-md bg-[#D92030] text-white hover:bg-[#BC1C2A]">Update Now</a>
              <button
                onClick={() => { setShowCompleteBanner(false); setBannerDismissed(true); }}
                className="px-3 py-2 rounded-md border border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="space-y-4">
            <Card className="bg-[#D92030] text-white hover:bg-[#BC1C2A] transition-colors">
              <CardContent className="p-4">
                <Link to="/account" className="flex items-center gap-3">
                  <User size={20} />
                  <span className="font-medium">Account Details</span>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <Link to="/orders" className="flex items-center gap-3">
                  <ShoppingBag size={20} />
                  <span className="font-medium">Orders</span>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <Link to="/wishlist" className="flex items-center gap-3">
                  <Heart size={20} />
                  <span className="font-medium">Wishlist</span>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <Link to="/logout" className="flex items-center gap-3 text-gray-500">
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </Link>
              </CardContent>
            </Card>
          </aside>


          {/* Main Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form id="profile-form" onSubmit={handleSave} encType="multipart/form-data">
                  <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
                    <div className="relative w-28 h-28">
                      <img
                        src={previewPic || user?.profile_pic || "/placeholder.svg"}
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border"
                        style={{ opacity: uploading ? 0.5 : 1 }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== "/placeholder.svg") {
                            target.src = "/placeholder.svg";
                          }
                        }}
                      />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-full">
                          <svg className="animate-spin h-8 w-8 text-[#D92030]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 bg-[#D92030] text-white rounded-full p-1 hover:bg-[#BC1C2A]"
                        onClick={() => fileInputRef.current?.click()}
                        title="Change profile picture"
                        disabled={uploading}
                      >
                        <span className="text-xs">Edit</span>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleProfilePicChange}
                        disabled={uploading}
                      />
                    </div>
                  </div>
                  
                  {/* Personal Information - First Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      <input
                        type="text"
                        name="middle_name"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.middle_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        name="gender"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={formData.dob}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-8">
                    <Button className="bg-[#D92030] hover:bg-[#BC1C2A]" type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Personal Information'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Address Details Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Address Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Personal Address</label>
                      <textarea
                        name="personal_address"
                        rows={2}
                        placeholder="House, Street, Area"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.personal_address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shopping Address</label>
                      <textarea
                        name="shoping_address"
                        rows={2}
                        placeholder="House, Street, Area"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.shoping_address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                      <textarea
                        name="billing_address"
                        rows={2}
                        placeholder="House, Street, Area"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.billing_address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g., Kolkata"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="e.g., West Bengal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="e.g., India"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        name="zip"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.zip}
                        onChange={handleInputChange}
                        placeholder="e.g., 700001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address (Village)</label>
                      <input
                        type="text"
                        name="address_village"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.address_village}
                        onChange={handleInputChange}
                        placeholder="Village / Locality"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                      <input
                        type="text"
                        name="landmark"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="Near ..."
                      />
                    </div>
                  </div>
                  <div className="mt-8">
                    <Button className="bg-[#D92030] hover:bg-[#BC1C2A]" type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Address Details'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Details Section */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Account Details</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchAccountStats}
                    disabled={accountLoading}
                    className="text-[#D92030] border-[#D92030] hover:bg-[#D92030] hover:text-white"
                  >
                    {accountLoading ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : (
                      '🔄'
                    )}
                    Refresh
                  </Button>
                </div>
                {lastRefresh && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {lastRefresh.toLocaleString()}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Statistics Cards */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Wishlist Items</p>
                        <p className="text-2xl font-bold text-blue-900">{accountStats.wishlistCount}</p>
                      </div>
                      <div className="text-blue-500 text-2xl">❤️</div>
                    </div>
                    <Link to="/wishlist" className="text-xs text-blue-600 hover:underline mt-2 block">
                      View Wishlist →
                    </Link>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Total Orders</p>
                        <p className="text-2xl font-bold text-green-900">{accountStats.ordersCount}</p>
                      </div>
                      <div className="text-green-500 text-2xl">📦</div>
                    </div>
                    <Link to="/orders" className="text-xs text-green-600 hover:underline mt-2 block">
                      View Orders →
                    </Link>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Cart Items</p>
                        <p className="text-2xl font-bold text-purple-900">{accountStats.cartCount}</p>
                      </div>
                      <div className="text-purple-500 text-2xl">🛒</div>
                    </div>
                    <Link to="/cart" className="text-xs text-purple-600 hover:underline mt-2 block">
                      View Cart →
                    </Link>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Account Status</p>
                        <p className="text-lg font-bold text-orange-900">
                          {user?.isActive ? '✅ Active' : '❌ Inactive'}
                        </p>
                      </div>
                      <div className="text-orange-500 text-2xl">👤</div>
                    </div>
                  </div>
                </div>
                
                {/* Account Information */}
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Email Verified</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          user?.emailVerified ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {user?.emailVerified ? '✅ Verified' : '❌ Not Verified'}
                        </span>
                        {!user?.emailVerified && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleEmailVerification}
                            className="text-xs px-2 py-1 h-6"
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Member Since</span>
                      <span className="text-sm text-gray-600">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Last Updated</span>
                      <span className="text-sm text-gray-600">
                        {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">User ID</span>
                      <span className="text-sm text-gray-600 font-mono">
                        {user?._id ? `...${user._id.slice(-8)}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent ${
                          passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your current password"
                        required
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent ${
                          passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your new password"
                        required
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">Password must be at least 6 characters long</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent ${
                          passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your new password"
                        required
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button 
                      type="submit"
                      className="bg-[#D92030] hover:bg-[#BC1C2A]" 
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Account;
