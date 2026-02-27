import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EdgeScanner - Stock Scanner & Analytics',
  description: 'Professional stock scanner and analytics platform with real-time data, gap analysis, and watchlists.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#080a12] text-white antialiased`}>
        <Sidebar />
        {/* Main content: offset by sidebar on desktop, offset by topbar on mobile */}
        <main className="lg:ml-[220px] pt-14 lg:pt-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
