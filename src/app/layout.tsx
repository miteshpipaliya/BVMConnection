import type { Metadata, Viewport } from 'next';
import './globals.css';
import './overrides.css';
export const metadata: Metadata = { title: 'BVMConnection — One Campus. Thousands of Connections.', description: 'A student social network for connecting across the BVM campus.', applicationName: 'BVMConnection' };
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#08090B' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
