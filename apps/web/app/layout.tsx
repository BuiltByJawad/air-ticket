import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

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
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
