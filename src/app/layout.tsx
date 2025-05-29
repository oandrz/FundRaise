import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { OrderProvider } from '@/components/OrderContext';
import { AppHeader } from '@/components/AppHeader';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FundRaising Mission Trip Batam',
  description: 'Order food easily with Sheet Eats!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <OrderProvider>
          <AppHeader />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="py-6 text-center text-sm text-muted-foreground border-t">
            © {new Date().getFullYear()} Sheet Eats. All rights reserved.
          </footer>
        </OrderProvider>
        <Toaster />
      </body>
    </html>
  );
}
