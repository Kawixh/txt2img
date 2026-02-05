import type { Metadata } from 'next';
import { DM_Mono, Fraunces, Newsreader } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from './providers';

const fontBody = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

const fontDisplay = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '600', '700'],
});

const fontMono = DM_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
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
        <meta name="theme-color" content="#f7f1e7" />
      </head>
      <body
        className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable} antialiased font-sans`}
      >
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
