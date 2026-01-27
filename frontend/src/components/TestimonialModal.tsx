import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onSubmit: (payload: { rating: number; text: string; name?: string }) => Promise<void> | void;
  onSkip: () => void;
  userName?: string;
};

const TestimonialModal: React.FC<Props> = ({ open, onSubmit, onSkip, userName }) => {
  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState<string>("");
  const [name, setName] = useState<string>(userName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Create a container for portal to avoid z-index/stacking issues
  const container = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'testimonial-modal-root');
    return el;
  }, []);

  useEffect(() => {
    if (!container || typeof document === 'undefined') return;
    document.body.appendChild(container);
    return () => {
      try { document.body.removeChild(container); } catch {}
    };
  }, [container]);

  useEffect(() => { setName(userName || ""); }, [userName]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onSkip]);
  if (!open || !container) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!text.trim()) {
      setError('Please write a short feedback.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ rating, text, name });
    } catch (e: any) {
      setError(e?.message || 'Failed to submit testimonial');
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="testimonial-title"
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4"
    >
      <div onClick={onSkip} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-gradient-to-br from-white to-gray-50 w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 id="testimonial-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            Share your experience
          </h3>
          <button onClick={onSkip} className="text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors">
            ×
          </button>
        </div>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Before you logout, could you leave us a quick testimonial? Your feedback helps us improve and serve you better.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">👤</span>
              Your Name (optional)
            </label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all duration-200 bg-white/80"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">⭐</span>
              Rating
            </label>
            <div className="flex items-center gap-2 mb-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                    // keyboard accessibility: Enter/Space to select, arrows to move
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setRating(star);
                      return;
                    }
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      setRating((prev) => Math.max(1, (prev > 0 ? prev : star) - 1));
                      return;
                    }
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      setRating((prev) => Math.min(5, (prev > 0 ? prev : star) + 1));
                      return;
                    }
                  }}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  aria-pressed={rating === star}
                  role="button"
                  tabIndex={0}
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                  className={`text-2xl transform transition-transform duration-200 hover:scale-125 active:scale-110 focus:scale-125 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-1 rounded ${
                    // when no rating selected (rating === 0) show muted/gray stars
                    rating > 0 ? (star <= rating ? 'text-yellow-400' : 'text-gray-300') : 'text-gray-300/80'
                  }`}
                >
                  ⭐
                </button>
              ))}
              <span className={`ml-2 text-sm font-medium ${rating > 0 ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                {rating > 0 ? `${rating} Star${rating > 1 ? 's' : ''}` : 'No rating selected'}
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">💬</span>
              Your Feedback
            </label>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="What did you like? What could be better? Your thoughts help us improve..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D92030] focus:border-transparent transition-all duration-200 resize-vertical bg-white/80"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onSkip} 
              disabled={loading}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#D92030] to-[#BC1C2A] hover:from-[#BC1C2A] hover:to-[#A01829] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="text-lg">🚀</span>
                  Submit & Logout
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, container);
};

export default TestimonialModal;
