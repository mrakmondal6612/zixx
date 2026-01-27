
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';

const PrivacyPolicy = () => {
  const [contactInfo, setContactInfo] = useState({ address: '', phone: '', email: '' });

  // Load contact info from admin panel footer settings
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const candidates: string[] = [];
        const envBackend = (import.meta as any).env?.VITE_BACKEND_URL;
        if (envBackend) candidates.push(String(envBackend).replace(/\/$/, ''));
        const envFallback = (import.meta as any).env?.VITE_BACKEND_FALLBACK || (import.meta as any).env?.VITE_DEPLOYED_BACKEND;
        if (envFallback) candidates.push(String(envFallback).replace(/\/$/, ''));
        candidates.push('/api');

        let response: Response | null = null;
        for (const base of candidates) {
          const url = `${base.replace(/\/$/, '')}/admin/footer`;
          try {
            const r = await fetch(url, { cache: 'no-store', credentials: 'include', headers: { Accept: 'application/json' } });
            if (r.ok) {
              response = r;
              break;
            }
          } catch (e) {
            // Continue to next candidate
          }
        }
        if (response) {
          const json = await response.json().catch(() => null);
          if (json && json.contactInfo) {
            setContactInfo({
              address: json.contactInfo.address || '',
              phone: json.contactInfo.phone || '',
              email: json.contactInfo.email || 'wecare@zixx.in'
            });
          }
        }
      } catch (e) {
        // Use default fallback
        setContactInfo({ address: '', phone: '', email: 'wecare@zixx.in' });
      }
    };
    loadContactInfo();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="mb-6 text-gray-600">
              We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact us for support.
            </p>

            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-6 text-gray-600">
              We use the information we collect to provide, maintain, and improve our services, 
              process transactions, and communicate with you.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p className="mb-6 text-gray-600">
              We do not sell, trade, or otherwise transfer your personal information to third parties 
              without your consent, except as described in this policy.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="mb-6 text-gray-600">
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at {contactInfo.email}
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
