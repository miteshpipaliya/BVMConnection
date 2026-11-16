import type { Metadata, Viewport } from 'next';
import './globals.css';
import './overrides.css';
import './campus.css';
export const metadata: Metadata = { title: 'CampusConnect — Your Campus. Your People.', description: 'CampusConnect: the private BVM student social community for sharing moments, finding friends and building together.', applicationName: 'CampusConnect' };
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#080a0e' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
