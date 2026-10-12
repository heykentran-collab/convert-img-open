import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MainContainer from '@/components/layout/MainContainer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Volticen Media Studio & Converter Suite',
  description:
    'Bộ công cụ tối ưu hóa hình ảnh, biên tập ảnh chụp màn hình và ghép ảnh đa tầng',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

import { I18nProvider } from '@/lib/i18n-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#0b0f17] text-slate-100 selection:bg-blue-600 selection:text-white">
        <I18nProvider>
          <Navbar />
          <MainContainer>{children}</MainContainer>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
