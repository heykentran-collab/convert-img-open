'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Layers, Home } from 'lucide-react';

export default function StitcherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Stitcher Crash Error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-140px)] bg-[#0b0f17]">
      <div className="max-w-lg w-full bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Gặp sự cố khi ghép ảnh (Stitcher)</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {error?.message || 'Không thể render hoặc tổng hợp các layer ảnh. Danh sách ảnh ghép của bạn vẫn được lưu giữ an toàn.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
