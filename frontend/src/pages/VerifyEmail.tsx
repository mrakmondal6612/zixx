import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiUrl, getAuthHeaders } from '@/lib/api';
import { useAuthContext } from '@/hooks/AuthProvider';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser } = useAuthContext();

  // Check for email and requestId in URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const requestIdParam = searchParams.get('requestId');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    if (requestIdParam) {
      setRequestId(requestIdParam);
    }
  }, [searchParams]);

  // Handle cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Validate OTP format
    if (!otp || otp.length < 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Your session has expired. Please log in again.');
      }

      // Verify the OTP
      const verifyResponse = await fetch(apiUrl('/clients/otp/email/verify'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          code: otp.trim(),
          requestId: requestId || undefined,
          email: email || undefined
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        // If the OTP was already used but recently, we can still proceed
        if (verifyData.msg?.includes('already been used')) {
          // We'll let the flow continue to try to verify the email
        } else {
          throw new Error(verifyData.msg || 'Verification failed. Please try again.');
        }
      }

      let userData = verifyData.data?.user;
      
      // If we have user data from OTP verification, update the user state
      if (userData && setUser) {
        setUser(userData);
        try {
          localStorage.setItem('userData', JSON.stringify(userData));
        } catch (e) {
          console.error('Error updating localStorage:', e);
        }
      }
      
      // If email is already marked as verified in the OTP response, we're done
      if (userData?.emailVerified) {
        return { user: userData };
      }
      
      // Otherwise, mark email as verified via the verify-email endpoint
      const response = await fetch(apiUrl('/clients/user/verify-email'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: email || userData?.email || undefined
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to verify email');
      }
      
      // Ensure we have the latest user data
      if (data.user) {
        userData = data.user;
      }

      // Update user data in context and localStorage with the verified user data
      const verifiedUser = data.user || userData;
      
      if (verifiedUser && setUser) {
        // Update the auth context with the verified user data
        setUser(verifiedUser);
        
        // Update localStorage for persistence
        try {
          localStorage.setItem('userData', JSON.stringify(verifiedUser));
        } catch (e) {}
        
        // Show success message
        toast({
          title: 'Email Verified',
          description: 'Your email has been successfully verified!',
          variant: 'default',
        });
        
        // Redirect to account page after a short delay
        setTimeout(() => {
          navigate('/account', { replace: true });
        }, 1500);
      } else {
        // If we don't have user data, try to fetch it
        try {
          const userResponse = await fetch(apiUrl('/clients/user/me'), {
            headers: getAuthHeaders()
          });
          
          if (userResponse.ok) {
            const currentUser = await userResponse.json();
            if (setUser) {
              setUser(currentUser);
              localStorage.setItem('userData', JSON.stringify(currentUser));
            }
          }
          
          toast({
            title: 'Success',
            description: 'Email verified successfully!',
          });
          navigate('/account', { replace: true });
        } catch (fetchError) {
          toast({
            title: 'Success',
            description: 'Email verified successfully! Please refresh the page to see the updated status.',
          });
          navigate('/account', { replace: true });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch(apiUrl('/clients/user/resend-verification'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email || undefined,
          requestId: requestId || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to resend OTP');
      }
      
      // Update requestId if a new one was provided in the response
      if (data.requestId) {
        setRequestId(data.requestId);
      } else if (data.data?.requestId) {
        // Some endpoints might nest the requestId in a data object
        setRequestId(data.data.requestId);
      }

      setResendCooldown(60); // 1 minute cooldown
      toast({
        title: 'OTP Sent',
        description: 'A new OTP has been sent to your email address.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-gray-600">Enter the 6-digit code sent to {email || 'your email'}</p>
          
          {error && (
            <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="otp" className="sr-only">
                Verification Code
              </label>
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-xl tracking-widest"
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                autoComplete="one-time-code"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
