 import { Star } from 'lucide-react';
 import React from 'react'
 import { apiUrl } from '@/lib/api';

export default function Testimonials() {
  const fallback = [
    { name: 'Sarah M.', rating: 5, text: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations." },
    { name: 'Alex K.', rating: 5, text: "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions." },
    { name: 'James L.', rating: 5, text: "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends." },
  ];
  const [items, setItems] = React.useState<Array<{ name?: string; rating: number; text: string; profilePic?: string | null; email?: string | null }>>([]);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(apiUrl('/clients/testimonials?limit=9'), { credentials: 'include' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (mounted && Array.isArray(data?.testimonials)) {
          const mapped = data.testimonials.map((t: any) => ({ 
            name: t.user ? `${t.user.first_name} ${t.user.last_name}`.trim() : t.name || 'Anonymous', 
            rating: t.rating || 5, 
            text: t.text,
            profilePic: t.user?.profile_pic || null,
            email: t.user?.email || null
          }));
          setItems(mapped);
        }
      } catch {}
      finally { if (mounted) setLoaded(true); }
    })();
    return () => { mounted = false; };
  }, []);
  // Hide entire section if loaded and no testimonials
  if (loaded && items.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Customer Testimonials Section */}
      <div className="bg-background py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-6xl font-extrabold text-center mb-12 text-foreground">OUR HAPPY CUSTOMERS</h2>
          {!loaded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {fallback.map((testimonial, index) => (
                <div key={index} className={`p-6 rounded-lg border ${index === 0 ? 'border-primary' : 'border-border'}`}>
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                      <div className="text-gray-500 font-semibold">
                        {testimonial.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground">{testimonial.name}</span>
                      <div className="w-5 h-5 bg-green-500 rounded-full ml-2 inline-flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{testimonial.text}</p>
                </div>
              ))}
            </div>
          )}
          {loaded && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {items.map((testimonial, index) => (
                <div key={index} className={`p-6 rounded-lg border ${index === 0 ? 'border-primary' : 'border-border'}`}>
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                      {testimonial.profilePic ? (
                        <img 
                          src={testimonial.profilePic} 
                          alt={testimonial.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`text-gray-500 font-semibold ${testimonial.profilePic ? 'hidden' : ''}`}>
                        {testimonial.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground">{testimonial.name}</span>
                      <div className="w-5 h-5 bg-green-500 rounded-full ml-2 inline-flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{testimonial.text}</p>
                </div>
              ))}
            </div>
          )}
          {loaded && items.length === 0 && (
            <div className="text-center text-muted-foreground">No testimonials yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
