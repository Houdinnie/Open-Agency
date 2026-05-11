import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atlas - Personal AI Agent',
  description: 'Eternal Employee - Your Personal Autonomous Business AI Agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}