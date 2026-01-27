
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { apiUrl, getAuthHeaders } from '@/lib/api';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState({ address: '', phone: '', email: '' });

  // Load contact info from the same backend source as Footer
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
        let lastError: any = null;
        for (const base of candidates) {
          const url = `${base.replace(/\/$/, '')}/admin/footer`;
          try {
            const r = await fetch(url, { cache: 'no-store', credentials: 'include', headers: { Accept: 'application/json' } });
            if (r.ok) {
              response = r;
              break;
            } else {
              lastError = new Error(`Non-OK status ${r.status} from ${url}`);
            }
          } catch (e) {
            lastError = e;
          }
        }
        if (!response) {
          // nothing available, leave defaults
          console.error('Failed to fetch contact info from any backend candidate', lastError);
          return;
        }
        const json = await response.json().catch(() => null);
        if (json && json.contactInfo) {
          setContactInfo({
            address: json.contactInfo.address || '',
            phone: json.contactInfo.phone || '',
            email: json.contactInfo.email || ''
          });
        }
      } catch (e) {
        console.error('Failed loading contact info', e);
      }
    };
    loadContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({ title: 'Missing fields', description: 'Please fill out all fields.' });
      return;
    }
    const emailOk = /.+@.+\..+/.test(formData.email);
    if (!emailOk) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(apiUrl('/clients/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Request failed (${res.status})`);
      }
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        if (data?.sent) {
          toast({ title: 'Message sent', description: 'Thanks! We will get back to you shortly.' });
        } else {
          toast({ title: 'Message received', description: 'We received your message. Notifications are not yet configured.' });
        }
      } else {
        throw new Error(data?.error || 'Unexpected response');
      }
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err?.message || 'Something went wrong. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#D92030] to-[#BC1C2A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">We're here to help and answer any questions you might have.</p>
        </div>
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
              <p className="text-gray-600">Fill out the form and our team will get back to you within 24 hours.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all"
                  placeholder="How can we help?"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all"
                  placeholder="Tell us more about your needs..."
                  required
                ></textarea>
              </div>
              
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#D92030] to-[#BC1C2A] hover:from-[#BC1C2A] hover:to-[#A31822] text-white py-3 px-6 rounded-lg font-medium text-base transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 bg-red-50 p-3 rounded-full text-[#D92030]">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Our Location</h3>
                    <p className="text-gray-600 mt-1">
                      {contactInfo.address ? (
                        contactInfo.address.split(/\n|,\s*/).map((line, i) => (
                          <React.Fragment key={i}>{line}{i < contactInfo.address.split(/\n|,\s*/).length - 1 && <br />}</React.Fragment>
                        ))
                      ) : (
                        <>
                          1, Khan Road Mankundu<br />
                          Hooghly - 720012<br />
                          West Bengal, India
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 bg-red-50 p-3 rounded-full text-[#D92030]">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone Number</h3>
                    {contactInfo.phone ? (
                      contactInfo.phone.split(/[,\n]/).map((p, i) => (
                        <p key={i} className="text-gray-600 mt-1">{p.trim()}</p>
                      ))
                    ) : (
                      <>
                        <p className="text-gray-600 mt-1">+91 015-8436-9999</p>
                        <p className="text-gray-600">+91 98765 43210</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 bg-red-50 p-3 rounded-full text-[#D92030]">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Address</h3>
                    {contactInfo.email ? (
                      contactInfo.email.split(/[,\n]/).map((e, i) => (
                        <p key={i} className="text-gray-600 mt-1">{e.trim()}</p>
                      ))
                    ) : (
                      <>
                        <p className="text-gray-600 mt-1">contact@zixxapp.com</p>
                        <p className="text-gray-600">support@zixxapp.com</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 bg-red-50 p-3 rounded-full text-[#D92030]">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Working Hours</h3>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p className="flex justify-between"><span>Monday - Friday:</span> <span>9:00 AM - 6:00 PM</span></p>
                      <p className="flex justify-between"><span>Saturday:</span> <span>10:00 AM - 4:00 PM</span></p>
                      <p className="flex justify-between"><span>Sunday:</span> <span>Closed</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Map Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Attempt to load Google Maps iframe. Many ad-blockers and privacy extensions will block requests
                  to Google's maps JS and generate console errors like "ERR_BLOCKED_BY_CLIENT". To improve UX
                  we detect iframe load/callback and show a graceful fallback when blocked. */}
              <MapEmbedFallback address={contactInfo.address || 'Khan Road Mankundu, Hooghly, West Bengal 712123'} />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;

// --- MapEmbedFallback component ---
type MapEmbedFallbackProps = { address: string };

const MapEmbedFallback: React.FC<MapEmbedFallbackProps> = ({ address }) => {
  const [blocked, setBlocked] = React.useState(false);
  const [coords, setCoords] = React.useState<{ lat?: string; lon?: string }>({});
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  // Try to geocode the address via Nominatim (OpenStreetMap) to get precise lat/lon.
  // Using a non-Google geocoder avoids loading Google's Maps JS API and is less likely
  // to be blocked by privacy extensions. If geocoding fails we fall back to the
  // simple google.com/maps?q=... embed URL.
  useEffect(() => {
    let mounted = true;
    const doGeocode = async () => {
      if (!address || address.trim().length === 0) return;
      try {
        const q = encodeURIComponent(address);
        // Public Nominatim endpoint. Keep requests light (limit=1).
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) return;
        const arr = await r.json().catch(() => null);
        if (!arr || !Array.isArray(arr) || arr.length === 0) return;
        const first = arr[0];
        if (mounted && first && first.lat && first.lon) {
          setCoords({ lat: String(first.lat), lon: String(first.lon) });
        }
      } catch (e) {
        // geocoding failed — we'll fall back to the query-based embed
        console.debug('Nominatim geocode failed', e);
      }
    };
    doGeocode();
    return () => {
      mounted = false;
    };
  }, [address]);

  useEffect(() => {
    // Track whether the iframe has fired the load event
    const loadedRef = { current: false } as { current: boolean };

    const onLoad = () => {
      loadedRef.current = true;
      setBlocked(false);
    };

    // Attach listener when iframe node is available
    const node = iframeRef.current;
    if (node) node.addEventListener('load', onLoad);

    // If load hasn't happened within 5s, assume it's blocked
    const timeout = setTimeout(() => {
      if (!loadedRef.current) setBlocked(true);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      if (node) node.removeEventListener('load', onLoad);
    };
  }, [coords]);

  const query = encodeURIComponent(address);
  const mapsUrl = coords.lat && coords.lon
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=16/${coords.lat}/${coords.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;

  // Prefer OpenStreetMap embed when we have precise coords (avoids Google JS API entirely)
  const embedSrc = coords.lat && coords.lon
    ? // bbox: [lon-0.01, lat-0.01, lon+0.01, lat+0.01]
      `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
        `${Number(coords.lon) - 0.01},${Number(coords.lat) - 0.01},${Number(coords.lon) + 0.01},${Number(coords.lat) + 0.01}`
      )}&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : `https://www.google.com/maps?q=${query}&output=embed`;

  if (blocked) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-gray-700">Map preview blocked by browser extension or network policy.</p>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-[#D92030] text-white rounded-md">Open in Maps</a>
        <div className="mt-4 text-sm text-gray-700">
          <p className="font-medium">Address</p>
          <p>{address}</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={embedSrc}
      width="100%"
      height="300"
      style={{ border: 0 }}
      allowFullScreen={true}
      loading="lazy"
      title="Our Location"
      className="rounded-b-lg"
    />
  );
};

