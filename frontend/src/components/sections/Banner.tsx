import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type BannerAlignment =
  | 'left'
  | 'center'
  | 'right'
  | 'top-left-corner'
  | 'top-right-corner'
  | 'bottom-left-corner'
  | 'bottom-right-corner'
  | 'middle-bottom'
  | 'middle-up';

interface BannerProps {
  imageUrl: string;
  heading: string;
  description: string;
  linkText: string;
  linkUrl: string;
  align?: BannerAlignment;
  // New: visual variant (optional)
  variant?: 'classic' | 'pro';
  // New: overlay intensity
  overlay?: 'light' | 'medium' | 'dark';
  // New: CTA style
  cta?: 'brand' | 'neutral';
  // New: container corner radius
  radius?: 'none' | 'xl' | '2xl' | 'full';
  // New: hover animation
  hover?: 'none' | 'zoom';
  // Optional: extra classes to override container sizing (e.g., heights)
  containerClassName?: string;
  // Optional: extra classes for the <img> (e.g., object-contain, h-auto)
  imageClassName?: string;
  // Optional: hide base overlay entirely
  hideOverlay?: boolean;
  // Optional: hide the side gradient overlay
  hideSideGradient?: boolean;
  // Optional: hide the bottom gradient overlay
  hideBottomGradient?: boolean;
  // Optional: extra classes for CTA Link/Anchor (e.g., w-full)
  ctaClassName?: string;
}

export const Banner: React.FC<BannerProps> = ({
  imageUrl,
  heading,
  description,
  linkText,
  linkUrl,
  align = 'left',
  variant = 'pro',
  overlay = 'medium',
  cta = 'brand',
  radius = 'xl',
  hover = 'zoom',
  containerClassName,
  imageClassName,
  hideOverlay,
  hideSideGradient,
  hideBottomGradient,
  ctaClassName,
}) => {
  const [src, setSrc] = useState(imageUrl);
  // Sync internal image src whenever prop changes (fixes stale image after updates)
  useEffect(() => {
    setSrc(imageUrl);
  }, [imageUrl]);
  const alignmentClasses: Record<BannerAlignment, string> = {
    left: 'items-start text-left justify-center',
    center: 'items-center text-center justify-center',
    right: 'items-end text-right justify-center',
    'top-left-corner': 'items-start text-left justify-start',
    'top-right-corner': 'items-end text-right justify-start',
    'bottom-left-corner': 'items-start text-left justify-end',
    'bottom-right-corner': 'items-end text-right justify-end',
    'middle-bottom': 'items-center text-center justify-end',
    'middle-up': 'items-center text-center justify-start',
  };

  // Choose gradient direction based on alignment for better focus
  const sideGradient = (() => {
    switch (align) {
      case 'left':
      case 'top-left-corner':
      case 'bottom-left-corner':
        return 'from-black/55 to-transparent'; // left -> right
      case 'right':
      case 'top-right-corner':
      case 'bottom-right-corner':
        return 'from-black/55 to-transparent md:bg-gradient-to-l md:from-black/55 md:to-transparent';
      case 'middle-bottom':
        return 'from-black/45 to-transparent';
      default:
        return 'from-black/45 to-transparent';
    }
  })();

  const radiusClass = {
    none: 'rounded-none',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-[28px]',
  }[radius];

  const hoverClass = hover === 'zoom' ? 'group-hover:scale-[1.04]' : '';

  // Overlay opacity map
  const overlayBase = {
    light: 'bg-black/20 md:bg-black/15',
    medium: 'bg-black/30 md:bg-black/20',
    dark: 'bg-black/40 md:bg-black/30',
  }[overlay];
  const overlayBottom = {
    light: 'from-black/25',
    medium: 'from-black/35',
    dark: 'from-black/45',
  }[overlay];

  return (
    <section className="mb-16">
      <div className={`group relative w-full h-[320px] md:h-[480px] lg:h-[560px] ${radiusClass} overflow-hidden shadow-sm ${containerClassName ?? ''}`}>
        <img
          src={src}
          alt={heading}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${hoverClass} ${imageClassName ?? ''}`}
          loading="lazy"
          onError={() => {
            if (src !== '/placeholder.svg') setSrc('/placeholder.svg');
          }}
        />
        {/* Base readability overlay */}
        {!hideOverlay && (
          <div className={`absolute inset-0 ${overlayBase}`} />
        )}
        {/* Alignment-aware side gradient */}
        {!hideSideGradient && (
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${sideGradient}`} />
        )}
        {/* Subtle bottom gradient for depth */}
        {!hideBottomGradient && (
          <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t ${overlayBottom} to-transparent`} />
        )}
        <div
          className={`absolute inset-0 flex flex-col p-6 md:p-10 lg:p-14 ${alignmentClasses[align]}`}
        >
          <div className={`max-w-[720px] ${variant === 'pro' ? 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-7 lg:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.25)]' : ''}`}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] mb-3 md:mb-4">
              {heading}
            </h2>
            <p className="text-white/90 text-base md:text-lg leading-relaxed mb-5 md:mb-7 max-w-prose">
              {description}
            </p>
            {/^https?:\/\//i.test(linkUrl) ? (
              <a
                href={linkUrl}
                className={`inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold shadow-lg transition-colors border ${cta === 'brand' ? 'bg-[#D92030] text-white hover:bg-[#c41c2a] border-transparent' : 'bg-white/90 text-black hover:bg-white border-white/70'} ${ctaClassName ?? ''}`}
                rel="noopener noreferrer"
              >
                {linkText}
              </a>
            ) : (
              <Link
                to={linkUrl}
                className={`inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold shadow-lg transition-colors border ${cta === 'brand' ? 'bg-[#D92030] text-white hover:bg-[#c41c2a] border-transparent' : 'bg-white/90 text-black hover:bg-white border-white/70'} ${ctaClassName ?? ''}`}
              >
                {linkText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
