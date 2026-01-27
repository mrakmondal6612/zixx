
import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';

const TermsOfUse = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="mb-6 text-gray-600">
              By accessing and using this website, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Use License</h2>
            <p className="mb-6 text-gray-600">
              Permission is granted to temporarily download one copy of the materials on ZIXX's 
              website for personal, non-commercial transitory viewing only.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
            <p className="mb-6 text-gray-600">
              The materials on ZIXX's website are provided on an 'as is' basis. ZIXX makes no 
              warranties, expressed or implied, and hereby disclaims and negates all other warranties.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Limitations</h2>
            <p className="mb-6 text-gray-600">
              In no event shall ZIXX or its suppliers be liable for any damages (including, without 
              limitation, damages for loss of data or profit, or due to business interruption).
            </p>

            <h2 className="text-2xl font-semibold mb-4">Revisions</h2>
            <p className="text-gray-600">
              ZIXX may revise these terms of service for its website at any time without notice. 
              By using this website, you are agreeing to be bound by the then current version of these terms.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfUse;
