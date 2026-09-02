import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tally — Your household, in balance.',
  description: 'Track household expenses, income, and subscriptions — and keep your budget in balance.',
  manifest: '/manifest.json',
  icons: {
    icon: '/home-alone-logo-mark.png',
    apple: '/home-alone-logo-mark.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tally',
  },
};

export const viewport: Viewport = {
  themeColor: '#256B4F',
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
    <html lang="en" className={inter.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
