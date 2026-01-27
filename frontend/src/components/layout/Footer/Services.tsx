import React, { useEffect, useState } from 'react'
import { Truck, Star, Facebook, Twitter, Instagram, Linkedin, Headset, ShieldCheckIcon } from 'lucide-react';

const DEFAULT_SERVICES = [
  { icon: 'Truck', title: 'FREE AND FAST DELIVERY', description: 'Free delivery for all orders over ₹140' },
  { icon: 'Headset', title: '24/7 CUSTOMER SERVICE', description: 'Friendly 24/7 customer support' },
  { icon: 'ShieldCheckIcon', title: 'MONEY BACK GUARANTEE', description: 'We return money within 30 days' }
];

const ICON_MAP = {
  Truck,
  Headset,
  ShieldCheckIcon,
  Star,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
};

export default function Services() {
  const [services, setServices] = useState(DEFAULT_SERVICES);

  useEffect(() => {
    const load = async () => {
      try {
        const candidates = [];
        const envBackend = (import.meta as any).env?.VITE_BACKEND_URL;
        if (envBackend) candidates.push(String(envBackend).replace(/\/$/, ''));
  const envFallback = (import.meta as any).env?.VITE_BACKEND_FALLBACK || (import.meta as any).env?.VITE_DEPLOYED_BACKEND;
        if (envFallback) candidates.push(String(envFallback).replace(/\/$/, ''));
        candidates.push('/api');

        let res = null;
        let lastErr = null;
        for (const base of candidates) {
          const url = `${base.replace(/\/$/, '')}/admin/footer`;
          try {
            const r = await fetch(url, { cache: 'no-store', credentials: 'include', headers: { Accept: 'application/json' } });
            if (r.ok) { res = r; break; }
            else lastErr = new Error(`Non-OK ${r.status}`);
          } catch (e) { lastErr = e; }
        }
        if (!res) return;
        const json = await res.json();
        if (json && Array.isArray(json.services) && json.services.length > 0) {
          setServices(json.services.map(s => ({ icon: s.icon || '', title: s.title || '', description: s.description || '' })));
        }
      } catch (e) {
        // ignore, keep defaults
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="bg-background py-16">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const isUrl = typeof service.icon === 'string' && service.icon.startsWith('http');
              const Icon = ICON_MAP[service.icon] || ICON_MAP['Truck'];
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                    {isUrl ? (
                      // render uploaded image
                      <img src={service.icon} alt={service.title} className="w-8 h-8 object-contain" />
                    ) : (
                      <Icon className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
