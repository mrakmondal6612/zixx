import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { CodeBlock } from '@/components/ui/code-block';

const Webhooks = () => {
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
              email: json.contactInfo.email || 'dev@zixxapp.com'
            });
          }
        }
      } catch (e) {
        // Use default fallback
        setContactInfo({ address: '', phone: '', email: 'dev@zixxapp.com' });
      }
    };
    loadContactInfo();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Webhooks</h1>

          <div className="prose prose-lg max-w-none">
            <p className="mb-6 text-gray-600">
              Set up webhooks to receive real-time notifications about events in your ZIXX store.
              Webhooks are HTTP callbacks that are triggered when specific events occur.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Available Events</h2>
            <div className="mb-8 overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">order.created</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Triggered when a new order is placed</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">order.updated</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Triggered when an order is updated (status change, etc.)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">payment.succeeded</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Triggered when a payment is successfully processed</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">payment.failed</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Triggered when a payment fails</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">refund.processed</td>
                    <td className="px-6 py-4 text-sm text-gray-500">Triggered when a refund is processed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Setting Up a Webhook</h2>
            <p className="mb-4 text-gray-600">
              To set up a webhook, send a POST request to our API endpoint with your webhook URL and the events you want to subscribe to.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Create a Webhook</h3>
            <div className="mb-6">
              <CodeBlock language="bash">
                {`curl -X POST https://api.zixxapp.com/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-webhook-url.com/endpoint",
    "events": ["order.created", "payment.succeeded"],
    "description": "Order and payment notifications"
  }'`}
              </CodeBlock>
            </div>

            <h3 className="text-xl font-semibold mb-3">Webhook Payload Example</h3>
            <div className="mb-6">
              <CodeBlock language="json">
                {`{
  "id": "evt_123456789",
  "event": "order.created",
  "created_at": "2023-06-15T10:00:00Z",
  "data": {
    "order_id": "ord_123456",
    "amount": 2999,
    "currency": "INR",
    "status": "processing",
    "customer": {
      "id": "cus_123",
      "email": "customer@example.com"
    }
  }
}`}
              </CodeBlock>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Webhook Security</h2>
            <p className="mb-4 text-gray-600">
              For security, we recommend verifying the webhook signature in your endpoint to ensure the request is coming from ZIXX.
            </p>

            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Verifying Webhook Signatures</h3>
              <p className="text-blue-700">
                Each webhook request includes a <code className="bg-blue-100 px-1 rounded">X-ZIXX-Signature</code> header.
                Verify this signature using your webhook secret to ensure the request is legitimate.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Retries</h2>
            <p className="mb-4 text-gray-600">
              If your endpoint returns a non-2xx status code, we'll retry the webhook delivery with exponential backoff for up to 3 days.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="text-gray-600">
              For any questions about webhooks, please contact our support team at
              <a href={`mailto:${contactInfo.email}`} className="text-black underline"> {contactInfo.email}</a>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Webhooks;
