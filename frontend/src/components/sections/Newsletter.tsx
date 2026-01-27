
import React from 'react';

export const Newsletter = () => {
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      {/* Features Section */}
      {/* <div className="w-full max-w-[1200px] px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-center text-center">
          <div className="flex flex-col items-center">
            <div className="bg-gray-200 rounded-full p-6 w-20 h-20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold uppercase">FREE AND FAST DELIVERY</h3>
            <p className="text-sm">Free delivery for all orders over $140</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-200 rounded-full p-6 w-20 h-20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold uppercase">24/7 CUSTOMER SERVICE</h3>
            <p className="text-sm">Friendly 24/7 customer support</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-200 rounded-full p-6 w-20 h-20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold uppercase">MONEY BACK GUARANTEE</h3>
            <p className="text-sm">We return money within 30 days</p>
          </div>
        </div>
      </div> */}
      
      {/* Newsletter Section */}
      <div className="w-full bg-[#222828] py-8 px-4 md:px-12 lg:px-16">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
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
    </>
  );
};
