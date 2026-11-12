import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'BVMConnection — One Campus. Thousands of Connections.', description: 'A community space for the BVM campus.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
