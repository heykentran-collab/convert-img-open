'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Global Error:', error);
  }, [error]);

  return (
    <html lang="vi" className="dark h-full">
      <body className="min-h-full flex items-center justify-center bg-[#0b0f17] text-slate-100 p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Đã xảy ra sự cố nghiêm trọng</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Hệ thống gặp lỗi không mong muốn ở cấp độ ứng dụng. Vui lòng thử tải lại hoặc khôi phục phiên làm việc.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              Thử lại ngay
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
