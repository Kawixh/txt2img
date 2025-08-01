import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Glim | Text to Image Creator - Design Vibes ✨',
  description: 'Turn your words into fire visuals instantly. Create aesthetic text images with custom fonts, colors & backgrounds. No cap, just pure creative energy. 🔥',
  keywords: ['text to image', 'design tool', 'aesthetic', 'visual creator', 'font generator', 'creative tool', 'gen z', 'design vibes'],
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
    title: 'Glim | Text to Image Creator - Design Vibes ✨',
    description: 'Turn your words into fire visuals instantly. Create aesthetic text images with custom fonts, colors & backgrounds. No cap, just pure creative energy. 🔥',
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
    title: 'Glim | Text to Image Creator - Design Vibes ✨',
    description: 'Turn your words into fire visuals instantly. Create aesthetic text images with custom fonts, colors & backgrounds. No cap, just pure creative energy. 🔥',
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
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
