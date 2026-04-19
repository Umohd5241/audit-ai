import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Audit AI | Startup Stress-Testing',
  description: 'High-stakes AI audit system to stress-test your startup assumptions.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-[#F7F8FA] text-[#1E293B] font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
