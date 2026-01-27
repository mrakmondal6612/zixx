
import React, { useState } from 'react';

export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  const bannerImages = [
    "https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/d5b391a024519f0a274f617aaa8e815af74b7883?placeholderIfAbsent=true",
    "https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/4aced3c27c234d70267aacc0142add1478e2c868?placeholderIfAbsent=true",
    "https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/7087fa7cadbd89e8fc148d4f01d42317d99eaccb?placeholderIfAbsent=true",
    "https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/a3eb5973361b70df8423fb8187c106fa1cccf9ee?placeholderIfAbsent=true"
  ];

  return (
    <section className="flex flex-col relative min-h-[200px] md:min-h-[588px] w-full max-w-[1181rem] items-center mt-[15px] md:mt-[33px] pt-[150px] md:pt-[556px] pb-[18px] px-[20px] md:px-[70px]">
      <img
        src={bannerImages[currentSlide]}
        className="absolute h-full w-full object-cover inset-0"
        alt="Hero banner"
      />
      <div className="relative flex items-center gap-3 mt-auto">
        {bannerImages.map((_, index) => (
          <button 
            key={index}
            className={`${index === currentSlide ? 'bg-white' : 'bg-[rgba(255,255,255,0.5)]'} self-stretch flex w-3 shrink-0 h-3 my-auto rounded-[50%]`}
            aria-label={`Slide ${index + 1}`}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </section>
  );
};
