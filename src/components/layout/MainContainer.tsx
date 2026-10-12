'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith('/studio');
  const isStitcher = pathname?.startsWith('/stitcher');
  const isConverter = pathname?.startsWith('/converter');

  return (
    <main
      className={`flex-1 w-full mx-auto transition-all duration-200 ${
        isStudio
          ? 'max-w-[1920px] px-2 sm:px-4 pt-2.5 pb-6 min-h-[calc(100vh-140px)] flex flex-col'
          : isStitcher || isConverter
          ? 'max-w-[1840px] px-3 sm:px-6 xl:px-8 py-5'
          : 'max-w-7xl px-4 sm:px-6 py-6'
      }`}
    >
      {children}
    </main>
  );
}
