import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';

const ShippingPolicy = () => {
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
              email: json.contactInfo.email || 'contact@zixxapp.com'
            });
          }
        }
      } catch (e) {
        // Use default fallback
        setContactInfo({ address: '', phone: '', email: 'contact@zixxapp.com' });
      }
    };
    loadContactInfo();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Shipping Policy</h1>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mb-4">Order Processing</h2>
            <p className="mb-6 text-gray-600">
              Orders are typically processed within 1–2 business days (Monday–Saturday, excluding public holidays). 
              During peak periods or special promotions, processing may take a little longer. You’ll receive an email 
              confirmation once your order has been placed and another when it ships with tracking information.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Estimated Delivery Time</h2>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Metro cities: 2–5 business days after dispatch</li>
              <li>Other locations in India: 3–7 business days after dispatch</li>
              <li>Remote/Out-of-delivery areas: Additional 2–4 business days</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">Shipping Fees</h2>
            <p className="mb-6 text-gray-600">
              We offer free shipping on eligible orders as per ongoing offers displayed on our website. 
              Any applicable shipping charges will be shown at checkout before you confirm your order.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Order Tracking</h2>
            <p className="mb-6 text-gray-600">
              Once your order ships, you’ll receive a tracking link via email/SMS. You can also track your order from the 
              <strong> Track Order</strong> section when logged in. Please allow up to 24 hours for the tracking information to update.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Address & Delivery Attempts</h2>
            <p className="mb-6 text-gray-600">
              Please ensure your shipping address and contact information are accurate at checkout. Our courier partners 
            </p>

            <h2 className="text-2xl font-semibold mb-4">Undelivered or Lost Packages</h2>
            <p className="mb-6 text-gray-600">
              In the rare event your package is lost or undelivered, contact us within 7 days of the last tracking update at
              <a href={`mailto:${contactInfo.email}`} className="text-black underline"> {contactInfo.email}</a> with your order ID.
              We will coordinate with the courier to resolve the issue at the earliest.
            </p>

            <h2 className="text-2xl font-semibold mb-4">International Shipping</h2>
            <p className="mb-6 text-gray-600">
              At this time, we primarily ship within India. For any special international shipping requests, please write to
              <a href={`mailto:${contactInfo.email}`} className="text-black underline"> {contactInfo.email}</a> before placing an order.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Delivery Delays</h2>
            <p className="text-gray-600">
              External factors (weather, strikes, remote area constraints, or courier network issues) can cause delays. We appreciate 
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingPolicy;
