import React, { useEffect, useRef } from 'react';

interface Props {
  image: string;
  index: number;
  isActive: boolean;
  onActivate: (index: number) => void;
  size?: 'small' | 'normal';
}

export const Thumbnail: React.FC<Props> = ({ image, index, isActive, onActivate, size = 'normal' }) => {
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      ref.current.focus({ preventScroll: true });
    }
  }, [isActive]);

  return (
    <button
      ref={ref}
      onClick={() => onActivate(index)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(index); } }}
      aria-pressed={isActive}
      aria-label={`View image ${index + 1}`}
      className={`relative flex-shrink-0 ${size === 'small' ? 'w-16 h-16 md:w-18 md:h-18' : 'w-20 h-20 md:w-24 md:h-24'} rounded-xl overflow-hidden group/thumb ${
        isActive
          ? 'ring-2 ring-purple-500 ring-offset-2 shadow-lg transform scale-105'
          : 'border border-white/20 hover:ring-2 hover:ring-purple-400 hover:ring-offset-1 hover:shadow-md transform hover:scale-105'
      } transition-all duration-300`}
    >
      <img loading="lazy" src={image} alt={`thumbnail ${index + 1}`} className="w-full h-full object-contain bg-white" />
    </button>
  );
};

export default Thumbnail;
