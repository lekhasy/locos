import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'locos',
  description: 'AI-powered posting tool for independent fashion shops',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
