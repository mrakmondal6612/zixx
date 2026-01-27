import { ArrowBigUpDashIcon } from 'lucide-react';
import React from 'react'

export default function Newsletter() {
     const [email, setEmail] = React.useState('');
    
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
      };
  return (
    <div className='lg:px-16  '>
      <span className='bg-[#ffffff] rounded-[2rem] right-0 absolute ...'>
        <a href="#" aria-label="Instagram" className="hover:opacity-80">
                <ArrowBigUpDashIcon className="w-8 h-8" />
              </a>
      </span>
      <div className="bg-[#222828] md:px-12 py-8 px-2 rounded-[1.7rem]">
        <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 ">
          <div className="text-white md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold uppercase">STAY UPTO DATE ABOUT<br/>OUR LATEST OFFERS</h2>
          </div>
          <div className="md:w-1/2 max-w-md w-full">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="bg-white flex items-center overflow-hidden px-4 py-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white text-black font-medium py-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                Subscribe to Newsletter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
