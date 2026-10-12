'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Wand2, Image, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error('Studio Canvas Crash Error:', error);
  }, [error]);

  const handleHardReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-140px)] bg-[#0b0f17]">
      <div className="max-w-lg w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
          <Wand2 className="w-3.5 h-3.5" />
          {t.studio.engineExceptionTitle}
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">{t.studio.crashTitle}</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {error?.message
            ? t.studio.crashErrorDetail.replace('{error}', error.message)
            : t.studio.crashDefaultDesc}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {t.studio.tryRecoverCanvas}
          </button>
          <button
            onClick={handleHardReload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700 cursor-pointer"
          >
            {t.studio.reloadSession}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-400">
          <Link
            href="/converter"
            className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
          >
            <Image className="w-3.5 h-3.5" />
            {t.studio.backToConverter}
          </Link>
          <span>•</span>
          <Link
            href="/"
            className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            {t.studio.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
