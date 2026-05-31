import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flow Bhopal · Urban Intelligence',
  description: 'AI-powered mobility intelligence for Bhopal.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
