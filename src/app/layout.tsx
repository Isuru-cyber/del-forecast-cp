import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/RoleContext';

export const metadata: Metadata = {
  title: 'Covering Plant · Delivery Forecast',
  description: 'Enterprise delivery forecast analytics and demand planning',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark theme-navy">
      <body className="bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased flex flex-col">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
