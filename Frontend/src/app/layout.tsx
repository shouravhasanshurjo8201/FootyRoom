import type { Metadata } from 'next';
import { Space_Mono, Matemasie } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers/Providers';

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
});

const matemasie = Matemasie({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-matemasie',
});

export const metadata: Metadata = {
  title: 'FootyRoom - Shoe Store',
  description: 'FootyRoom Frontend Practice Project',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${matemasie.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}