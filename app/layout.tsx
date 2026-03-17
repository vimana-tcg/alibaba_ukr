import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Corevia Flow — Ukrainian B2B Marketplace',
  description: 'Connect with verified Ukrainian manufacturers. Export-ready, KYC-verified, EU DCFTA compliant.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <footer style={{ borderTop: '1px solid #e5e7eb', marginTop: 80, padding: '32px 0', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
          <div className="container">
            🇺🇦 Corevia Flow — Connecting Ukrainian manufacturers with global buyers
          </div>
        </footer>
      </body>
    </html>
  );
}
