import React from 'react';

export const Categories = () => {
  return (
    <section className="self-stretch flex w-full flex-col items-stretch mt-[132px] px-[26px] max-md:mt-10 max-md:px-5">
      <div className="flex min-h-[110px] w-[376px] max-w-full flex-col items-stretch max-md:ml-[9px]">
        <div className="flex items-center gap-4">
          <div className="self-stretch w-5 my-auto">
            <div className="rounded flex shrink-0 h-10 bg-[#DB4444]" />
          </div>
          <div className="text-[#DB4444] text-base font-semibold leading-none self-stretch my-auto">
            Categories
          </div>
        </div>
        <h2 className="text-black text-4xl font-semibold leading-none tracking-[1.44px] mt-5">
          Browse By Category
        </h2>
      </div>
      
      <div className="w-full mt-[73px] max-md:mt-10">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
          <div className="w-[23%] max-md:w-full">
            <div className="max-md:mt-10">
              <div className="bg-[rgba(252,234,231,1)] flex min-h-[306px] flex-col overflow-hidden justify-center">
                <img src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/9e77ed0a168b1cb473b7d2fbcb5c226196f8c854?placeholderIfAbsent=true" className="aspect-[1.06] object-contain w-[356px] max-w-[356px]" alt="Category 1" />
              </div>
              <div className="bg-[rgba(252,234,231,1)] flex min-h-[391px] flex-col overflow-hidden justify-center">
                <img src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/e09265ac0694d92ce1ba3d1c0951513e4caf212c?placeholderIfAbsent=true" className="aspect-[1.06] object-contain w-[356px] max-w-[356px]" alt="Category 2" />
              </div>
            </div>
          </div>
          
          <div className="w-[77%] ml-5 max-md:w-full max-md:ml-0">
            <div className="grow max-md:max-w-full max-md:mt-10">
              <div className="gap-0 flex max-md:flex-col max-md:items-stretch">
                <div className="w-[34%] max-md:w-full">
                  <img src="https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/7c3ed2298e5c8d26f7034b398a0c69e0cb6970ed?placeholderIfAbsent=true" className="aspect-[0.47] object-contain w-full min-h-[396px] grow" alt="Category 3" />
                </div>
                <div className="w-[66%] ml-5 max-md:w-full max-md:ml-0">
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/f6d53870e3572df7b20bfa4f39785f3ee897b250?placeholderIfAbsent=true',
                      'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/c76cdd09e5575ac5e8bbfcc0f47d1c92ce08b75d?placeholderIfAbsent=true',
                      'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/63fb3cd159653e4250bcad70c57622f2931e3ff2?placeholderIfAbsent=true',
                      'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/9cddc3286cde2fbb073d55d68426a432f23d092b?placeholderIfAbsent=true'
                    ].map((url, index) => (
                      <div key={index} className="bg-[rgba(252,234,231,1)] flex min-h-[306px] flex-col overflow-hidden justify-center">
                        <img src={url} className="aspect-[1.06] object-contain w-[356px] max-w-[356px]" alt={`Category ${index + 4}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-[#222828] text-center text-[40px] font-bold leading-[35px] mt-10">
        Indianwear Reimagined
      </h2>
    </section>
  );
};
