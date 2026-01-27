import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ image, title, category, price, id }) => {
  return (
    <Link to={`/product/${id}`} className="w-full bg-white mx-auto pb-[17px] max-md:mt-[15px] cursor-pointer transform transition-transform duration-300 hover:scale-105">
      <div className="bg-[rgba(255,235,231,1)] flex items-center justify-center max-md:mr-[5px]">
        <img
          src={image}
          className="aspect-[0.89] object-contain w-full max-w-[355px] self-stretch min-w-60 flex-1 shrink basis-[0%] max-h-[474px] my-auto"
          alt={title}
        />
      </div>
      <div className="flex flex-col text-[15px] text-[#58595B] font-normal px-2.5">
        <div className="text-[#58595B] text-sm font-bold leading-[1.1] border-b-[var(--color-black-13,rgba(0,0,0,0.13)] pt-[7px] pb-[4px] border-b-[1px] border-solid">
          {title}
        </div>
        <div className="text-[#737577] text-[15px] font-normal leading-[22.5px]">
          {category}
        </div>
        <div className="text-[#58595B] text-[15px] font-normal leading-[22.5px]">
          {price}
        </div>
      </div>
    </Link>
  );
};

export const NewArrivals = () => {
  const products = [
    {
      id: 'new-1',
      image: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/639ea10294150931c436ba9a4b2f0e7af3d89ef1?placeholderIfAbsent=true',
      title: 'Looney Tunes: Super Genius',
      category: 'Oversized T-Shirts',
      price: '₹ 1299'
    },
    {
      id: 'new-2',
      image: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/742a7fa671fcc9bd7fc20b29aca893d6c6b08df0?placeholderIfAbsent=true',
      title: 'Solids: Pristin',
      category: 'Men Joggers',
      price: '₹ 1699'
    },
    {
      id: 'new-3',
      image: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/1333128ba1905776d285bd7cf9593004cfeda25f?placeholderIfAbsent=true',
      title: 'Jurassic World: Dino Park',
      category: 'Oversized T-Shirts',
      price: '₹ 1049'
    },
    {
      id: 'new-4',
      image: 'https://cdn.builder.io/api/v1/image/assets/70ad6d2d96f744648798836a6706b9db/900b60ad07e2ffb6286d5bdfcf42caeb7a8548a1?placeholderIfAbsent=true',
      title: 'Batman: Wayne Industries',
      category: 'Oversized Shirts',
      price: '₹ 1499'
    }
  ];

  return (
    <section className="w-full mt-10">
      <h2 className="text-[#222828] text-center text-[28px] font-bold leading-[35px] mb-8">
        New Arrivals
      </h2>
      <div className="self-stretch flex w-full flex-col items-stretch pl-[7px] max-md:pl-5">
        <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
          {products.map((product, index) => (
            <div key={index} className="w-3/12 max-md:w-full max-md:ml-0">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
        <Link to="/shop" className="text-neutral-50 self-center rounded bg-[rgba(217,32,48,1)] gap-2.5 text-base font-medium mt-6 px-12 py-4 hover:bg-[rgba(217,32,48,0.9)] transition-colors">
          View All Products
        </Link>
      </div>
    </section>
  );
};
