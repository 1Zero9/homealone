import type { Metadata, Viewport } from 'next';
import { Inter, Barlow_Condensed } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Home Alone — Household Expense & Subscription Tracker',
  description: 'Simple records. Clearer days. Light-mode household expense and subscription tracking.',
  manifest: '/manifest.json',
  icons: {
    icon: '/home-alone-logo-mark.png',
    apple: '/home-alone-logo-mark.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Home Alone',
  },
};

export const viewport: Viewport = {
  themeColor: '#3155D9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
