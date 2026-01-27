
import React from 'react';
import { TopBar } from './TopBar';
import { MainNav } from './MainNav';

export const Header = () => {
  return (
    <div className="sticky top-0 z-30 w-full">
      <header className="w-full bg-white border-b border-solid border-[rgba(139,139,139,1)]">
        {/* Centered container to keep header responsive and aligned with page content */}
        <div className="max-w-[1540px] mx-auto w-full flex flex-col">
          <TopBar />
          <MainNav />
        </div>
      </header>
    </div>
  );
};
