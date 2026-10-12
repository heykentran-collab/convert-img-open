'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
      <div className={`${pathname === '/converter' || pathname === '/stitcher' || pathname === '/studio' ? 'max-w-[1840px] px-3 sm:px-6 xl:px-8' : 'max-w-7xl px-4'} mx-auto flex flex-col sm:flex-row items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Volticen Media Studio</span>
          <span>&bull;</span>
          <span>Feature-based Workspace Architecture</span>
        </div>
        <div className="font-mono text-[11px] text-slate-600">
          Next.js App Router &bull; TypeScript &bull; Cloudflare R2
        </div>
      </div>
    </footer>
  );
}
