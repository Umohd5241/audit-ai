import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'THE EQUALS | Startup Stress-Testing',
  description: 'High-stakes AI audit system to stress-test your startup assumptions.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`bg-[#F7F8FA] text-[#1E293B] antialiased ${inter.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
