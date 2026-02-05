import type { Metadata } from 'next';
import { Fraunces, Spline_Sans, Spline_Sans_Mono } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from './providers';

const bodyFont = Spline_Sans({
  variable: '--font-body',
  subsets: ['latin'],
});

const displayFont = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
});

const monoFont = Spline_Sans_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Glim | Text to Image Creator',
  description:
    'Craft typography-driven visuals with precise control over fonts, spacing, and layout.',
  keywords: [
    'text to image',
    'design tool',
    'typography',
    'visual creator',
    'font generator',
    'creative tool',
  ],
  authors: [{ name: 'Glim Team' }],
  creator: 'Glim',
  publisher: 'Glim',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://glim.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Glim | Text to Image Creator',
    description:
      'Craft typography-driven visuals with precise control over fonts, spacing, and layout.',
    url: 'https://glim.dev',
    siteName: 'Glim',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Glim - Text to Image Creator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glim | Text to Image Creator',
    description:
      'Craft typography-driven visuals with precise control over fonts, spacing, and layout.',
    images: ['/og-image.png'],
    creator: '@glimdev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="Glim" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#121826" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} antialiased`}
      >
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
