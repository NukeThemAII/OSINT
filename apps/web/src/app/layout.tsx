import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';

const bodyFont = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] });
const monoFont = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['500', '700'] });

export const metadata: Metadata = {
  title: 'Investor Intel / Iran Conflict Monitor',
  description: 'Operator-grade OSINT and investor intelligence dashboard scaffold.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} font-[family-name:var(--font-body)] text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
