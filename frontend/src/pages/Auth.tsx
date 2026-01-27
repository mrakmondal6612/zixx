import React, { useState } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { toast } from 'sonner';
import { useAuthContext } from '@/hooks/AuthProvider';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import { apiUrl } from '@/lib/api';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [dobInputType, setDobInputType] = useState<'text' | 'date'>('text');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // OTP state
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailRequestId, setEmailRequestId] = useState('');
  const [emailVerifyToken, setEmailVerifyToken] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneRequestId, setPhoneRequestId] = useState('');
  const [phoneVerifyToken, setPhoneVerifyToken] = useState('');
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const { user, login, setRole, setUser } = useAuthContext();
  const [authContent, setAuthContent] = React.useState<{ title?: string; description?: string; bannerImage?: string }>({});
  const location = useLocation();
  const navigate = useNavigate();

  // cooldown tickers
  React.useEffect(() => {
    if (emailCooldown <= 0) return;
    const t = setInterval(() => setEmailCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [emailCooldown]);
  React.useEffect(() => {
    if (phoneCooldown <= 0) return;
    const t = setInterval(() => setPhoneCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [phoneCooldown]);

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

  // Use a ref to track if the OAuth effect has already run
  const effectRun = React.useRef(false);

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setPhone('');
    setGender('');
    setDob('');
    setDobInputType('text');
    // reset otp states
    setEmailOtpCode(''); setEmailRequestId(''); setEmailVerifyToken(''); setEmailCooldown(0);
    setPhoneOtpCode(''); setPhoneRequestId(''); setPhoneVerifyToken(''); setPhoneCooldown(0);
  };

  // Fetch auth page content (login/signup) from backend
  React.useEffect(() => {
    const page = isLogin ? 'login' : 'signup';
    let mounted = true;
    (async () => {
      try {
        const url = apiUrl(`/auth-pages/${page}`);
        console.log('Fetching auth content from:', url);
        const res = await fetch(url, { credentials: 'include' });
        console.log('Auth content response status:', res.status);
        if (!res.ok) {
          console.log('Auth content response not ok:', await res.text().catch(() => 'no body'));
          return;
        }
        const json = await res.json().catch(() => ({}));
        console.log('Auth content response:', json);
        if (!mounted) return;
        if (json && json.ok && json.data) {
          setAuthContent({ 
            title: json.data.title || '', 
            description: json.data.description || '', 
            bannerImage: json.data.bannerImage || ''
          });
        }
      } catch (e) {
        console.error('Error fetching auth content:', e);
      }
    })();
    return () => { mounted = false; };
  }, [isLogin]);

  // Reset verification if user edits email/phone after verifying
  React.useEffect(() => { setEmailVerifyToken(''); setEmailOtpCode(''); setEmailRequestId(''); }, [email]);
  React.useEffect(() => { setPhoneVerifyToken(''); setPhoneOtpCode(''); setPhoneRequestId(''); }, [phone]);

  // OTP handlers
  const sendEmailOtp = async () => {
    try {
      const res = await fetch(apiUrl('/clients/otp/email/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.msg || 'Failed to send email OTP');
      setEmailRequestId(data.data.requestId);
      setEmailCooldown(data.data.cooldownSec || 60);
      toast.success('OTP sent', { description: 'Check your email for the code.' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email OTP', { duration: 5000 });
    }
  };
  const verifyEmailOtp = async () => {
    try {
      const res = await fetch(apiUrl('/clients/otp/email/verify'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ requestId: emailRequestId, code: emailOtpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.msg || 'Invalid OTP');
      
      // Set the verification token to mark email as verified
      setEmailVerifyToken(data.data?.token);
      
      // Clear the OTP code after successful verification
      setEmailOtpCode('');
      
      toast.success('Email verified', { description: 'Your email has been verified successfully!' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to verify email OTP', { duration: 5000 });
    }
  };
  const sendPhoneOtp = async () => {
    try {
      const res = await fetch(apiUrl('/clients/otp/phone/send'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.msg || 'Failed to send phone OTP');
      setPhoneRequestId(data.data.requestId);
      setPhoneCooldown(data.data.cooldownSec || 60);
      toast.success('OTP sent', { description: 'Check your phone for the code.' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to send phone OTP', { duration: 5000 });
    }
  };
  const verifyPhoneOtp = async () => {
    try {
      const res = await fetch(apiUrl('/clients/otp/phone/verify'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ requestId: phoneRequestId, code: phoneOtpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.msg || 'Invalid OTP');
      setPhoneVerifyToken(data.data.token);
      toast.success('Phone verified', { description: 'Your phone number has been verified.' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to verify phone OTP', { duration: 5000 });
    }
  };

  // Handle token returned from OAuth redirect
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const provider = params.get('provider');
    const ok = params.get('ok');
    const next = params.get('next');

    // Only proceed if we have all required parameters
    if (!token || provider !== 'google' || ok !== '1') return;

    if (!effectRun.current) {
      effectRun.current = true;
      
      const processOAuth = async () => {
        try {
          // Store the token in localStorage for persistence
          try {
            localStorage.setItem('token', token);
            localStorage.setItem('isLoggedIn', '1');
          } catch (e) {
            console.error('Failed to store auth data:', e);
          }
          
          // Fetch user data with the token
          const res = await fetch(apiUrl('/clients/user/me'), {
            credentials: 'include',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
          });
          
          if (!res.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          const data = await res.json().catch(() => ({}));
          
          if (data && data.user) {
            // Update auth state
            setUser(data.user);
            if (data.user.role) {
              setRole(data.user.role);
            }
            
            // Show success message
            toast.success('Successfully logged in with Google!', { duration: 3000 });
            
            // Decide post-login redirect based on completeness (ignore any prior skip)
            const redirectPath = next || (location.state as any)?.from?.pathname || '/';
            const needsProfile = !isProfileComplete(data.user);
            const target = needsProfile ? '/account?first=1&completeProfile=1' : redirectPath;
            navigate(target, { 
              replace: true,
              state: { from: location.state?.from },
            });
          }
        } catch (error: any) {
          toast.error(error?.message || 'Failed to complete Google login', { duration: 5000 });
          
          // Redirect to login page on error
          navigate('/auth', { 
            replace: true,
            state: { 
              error: 'login_failed',
              from: location.state?.from || { pathname: '/' },
            },
          });
        }
      };
      
      processOAuth();
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Clear the URL parameters after processing
      if (window.location.search) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    };
  }, [location.search, location.state, navigate, setRole, setUser, toast]);

  // Early return after all hooks are called to prevent hooks inconsistency
  if (user) return <Navigate to="/" replace />;

  const handleGoogleSignIn = () => {
    try {
      // Get the current path to return to after login
      const from = (location.state as any)?.from?.pathname || '/';
      
      // Use current origin so OAuth always returns to the active domain (e.g., https://zixx.in)
      const frontendBase = window.location.origin;
      const returnTo = `${frontendBase}${from}`;
      console.log(returnTo);
      // Build the OAuth URL with the correct returnTo parameter
      const oauthUrl = `${apiUrl('/clients/auth/google')}?returnTo=${encodeURIComponent(returnTo)}`;
      
      // Clear any existing auth data before starting new OAuth flow
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        sessionStorage.clear();
      } catch (e) {}
      
      // Redirect to the OAuth URL - force full page reload to clear any state
      window.location.replace(oauthUrl);
    } catch (error) {
      toast.error('Failed to start Google sign-in. Please try again.', { duration: 5000 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        // use centralized login from AuthProvider (sets token, fetches user)
        if (typeof login === 'function') {
          const from = (location.state as any)?.from?.pathname || '/';
          await login(email, password, from);
          // fetch fresh user to ensure we have latest state
          let u: any = null;
          try {
            const res = await fetch(apiUrl('/clients/user/me'), { credentials: 'include' });
            const d = await res.json().catch(() => ({}));
            u = d?.user || user;
          } catch {
            u = user;
          }
          const needsProfile = !isProfileComplete(u);
          const target = needsProfile ? '/account?first=1&completeProfile=1' : from;
          toast.success('Logged in successfully.');
          navigate(target, { replace: true });
        } else {
          throw new Error('Login function not available');
        }
      } else {
        // Register flow
        const payload = {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email,
          password,
          phone: Number(phone),
          gender,
          dob,
          emailVerifyToken,
          // phoneVerifyToken is temporarily not required; omit for now
        };
          const res = await fetch(apiUrl('/clients/register'), {
          credentials: 'include', 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data?.msg || 'Registration failed');
        toast.success('Account created.');
        setIsLogin(true);
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.msg || 'An error occurred. Please try again.';
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <ScrollToTop />
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] py-8 px-2">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col justify-center px-8 py-10 md:py-16">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
              {(authContent.title && authContent.title.trim()) ? authContent.title : (isLogin ? 'Welcome Back' : 'Welcome')} <span className="text-2xl">👋</span>
            </h1>
            <p className="mb-8 text-gray-700 text-lg">{(authContent.description && authContent.description.trim()) ? authContent.description : "Join us now to be a part of Zixx's family."}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  <Input placeholder="Middle Name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                  <Input placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              )}
              {/* Email with OTP controls */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input type="email" placeholder="Email ID *" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {!isLogin && (
                    <Button type="button" onClick={sendEmailOtp} disabled={!email || !!emailVerifyToken || emailCooldown > 0}>
                      {emailVerifyToken ? 'Verified' : emailCooldown > 0 ? `Resend (${emailCooldown}s)` : 'Send OTP'}
                    </Button>
                  )}
                </div>
                {!isLogin && emailRequestId && !emailVerifyToken && (
                  <div className="flex gap-2">
                    <Input type="text" placeholder="Email OTP" value={emailOtpCode} onChange={(e) => setEmailOtpCode(e.target.value)} />
                    <Button type="button" onClick={verifyEmailOtp} disabled={!emailOtpCode}>Verify</Button>
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLogin ? 'Password' : 'Choose New Password *'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                >
                  <span>{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
              {!isLogin && (
                <>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password *"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Input
                    type={dobInputType}
                    placeholder="Please enter your birthdate *"
                    value={dob}
                    onFocus={() => setDobInputType('date')}
                    onBlur={() => {
                      if (!dob) setDobInputType('text');
                    }}
                    onChange={(e) => setDob(e.target.value)}
                    inputMode="numeric"
                    required
                  />
                  {/* Phone (OTP temporarily disabled) */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input type="tel" placeholder="+91 Mobile Number *" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="font-medium">Gender</span>
                    {['male', 'female', 'other'].map((g) => (
                      <label key={g} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={() => setGender(g)}
                          required
                          className="accent-red-600"
                        />{' '}
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </label>
                    ))}
                  </div>
                </>
              )}
              <Button
                type="submit"
                className="w-full bg-[#D92030] hover:bg-[#b81a27] text-white text-lg font-semibold rounded-md py-2 mt-2"
                disabled={loading || (!isLogin && (!emailVerifyToken || password !== confirmPassword))}
              >
                {loading ? 'Loading...' : isLogin ? 'Sign in' : (!emailVerifyToken ? 'Verify email to Register' : 'REGISTER')}
              </Button>
              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-2 text-gray-400">Or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 bg-[#f5f6fa] hover:bg-gray-200 border border-gray-200 text-gray-700 font-medium rounded-md py-2"
                onClick={handleGoogleSignIn}
              >
                <FaGoogle className="w-5 h-5" /> Sign in with Google
              </Button>
              <div className="text-center text-sm mt-4">
                {isLogin ? (
                  <>
                    Don't have an account?{' '}
                    <button type="button" className="text-blue-600 hover:underline" onClick={toggleMode}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already a customer?{' '}
                    <button type="button" className="text-blue-600 hover:underline" onClick={toggleMode}>
                      Login
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#181818] h-[600px] rounded-2xl overflow-hidden shadow-xl m-4">
            <img
              src={(authContent.bannerImage && authContent.bannerImage.trim()) ? authContent.bannerImage : 'https://wintrackinc.com/cdn/shop/articles/pexels-olly-853151_2223d0ec-5853-4769-91e3-b38e2d748494.jpg?v=1738776038&width=2080'}
              alt={authContent.title || 'Auth banner'}
              className="rounded-2xl object-cover w-full h-[99.5%] max-h-[800px] shadow-xl"
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Auth;
