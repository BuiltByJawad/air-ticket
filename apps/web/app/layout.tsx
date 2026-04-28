import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { WebVitals } from '@/components/shared/web-vitals';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Air Ticketing',
    template: '%s | Air Ticketing'
  },
  description: 'B2B air ticketing platform for agencies.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    title: 'Air Ticketing',
    description: 'B2B air ticketing platform for agencies.',
    url: '/',
    siteName: 'Air Ticketing'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Air Ticketing',
    description: 'B2B air ticketing platform for agencies.'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WebVitals />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
