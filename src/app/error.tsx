'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root App Error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
      <div className="max-w-md w-full bg-slate-900/90 border border-red-500/20 rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Đã xảy ra lỗi không mong muốn</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {error?.message || 'Một tiến trình đã gặp sự cố trong quá trình hiển thị giao diện. Dữ liệu của bạn có thể vẫn còn trong bộ nhớ tạm.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700/60"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
