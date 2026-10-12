'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Wand2,
  Columns,
  Database,
  Settings,
} from 'lucide-react';
import { R2ConfigResponse } from '@/types/r2';
import { r2Fetch } from '@/lib/r2-api-client';
import { useI18n } from '@/lib/i18n-context';

export default function Navbar() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const [r2Config, setR2Config] = useState<R2ConfigResponse | null>(null);

  const navItems = [
    { href: '/converter', label: t.navbar.converter, icon: Layers },
    { href: '/studio', label: t.navbar.studio, icon: Wand2 },
    { href: '/stitcher', label: t.navbar.stitcher, icon: Columns },
    { href: '/cloud-explorer', label: t.navbar.explorer, icon: Database },
  ];

  const checkR2 = () => {
    r2Fetch('/api/r2/config')
      .then((res) => res.json())
      .then((data) => setR2Config(data))
      .catch(() => setR2Config(null));
  };

  useEffect(() => {
    checkR2();
    window.addEventListener('storage_settings_updated', checkR2);

    return () => {
      window.removeEventListener('storage_settings_updated', checkR2);
    };
  }, []);

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'vi' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/90 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
      <div
        className={`${
          pathname === '/studio' || pathname === '/stitcher' || pathname === '/converter'
            ? 'max-w-[1840px] px-3 sm:px-6 xl:px-8'
            : 'max-w-7xl px-4 sm:px-6'
        } mx-auto h-16 flex items-center justify-between transition-all duration-200`}
      >
        
        {/* Brand & Storage Status */}
        <div className="flex items-center gap-5">
          <Link href="/converter" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Volticen</span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">{t.navbar.brandSubtitle}</span>
              </div>
            </div>
          </Link>

          {/* Cloud Storage Indicator */}
          <div className="hidden lg:flex items-center">
            {r2Config?.configured ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-400">{t.navbar.cloudPrefix}</span>
                <span className="font-mono text-slate-200 font-medium">
                  {r2Config.bucketName}
                </span>
              </div>
            ) : (
              <Link
                href="/settings"
                title={locale === 'vi' ? 'Chưa kết nối Cloud Storage. Click để cấu hình trong Cài đặt' : 'Cloud Storage not connected. Click to configure in Settings'}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 text-xs text-amber-300 hover:text-amber-200 transition"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{t.navbar.cloudOffline}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'text-white bg-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-slate-200 transition shadow-sm"
            title={t.navbar.languageToggle}
          >
            <span>{locale === 'en' ? '🇬🇧' : '🇻🇳'}</span>
            <span className="font-mono uppercase text-[11px]">{locale}</span>
          </button>

          <Link
            href="/settings"
            className={`p-2 rounded-lg transition-colors ${
              pathname === '/settings'
                ? 'text-blue-400 bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title={t.common.settings}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </header>
  );
}
