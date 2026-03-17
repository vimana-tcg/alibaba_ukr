'use client';
import { useState } from 'react';
import Link from 'next/link';

const STEPS = ['Fetching website...', 'AI extracting data...', 'Translating to 50 languages...', 'Saving to platform...'];

export default function VendorImportPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<{ slug: string; companyNameEn: string; productsCount: number; translationsCount: number } | null>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!url) return;
    setLoading(true); setError(''); setResult(null); setStep(0);

    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4000);

    try {
      const res = await fetch('/api/vendor/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      clearInterval(timer);
      if (data.success) { setResult(data.vendor ? { ...data.vendor, productsCount: data.productsCount, translationsCount: data.translationsCount } : null); setStep(4); }
      else setError(data.error ?? 'Something went wrong');
    } catch {
      clearInterval(timer);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>

        <div className="page-header">
          <h1 className="page-title">🤖 AI Website Importer</h1>
          <p className="page-subtitle">
            Paste any manufacturer website URL. AI will extract company info, products,
            and instantly translate everything into <strong>50 languages</strong>.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-control"
              style={{ flex: 1, fontSize: 15 }}
              placeholder="https://manufacturer-website.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={loading || !url}
              style={{ flexShrink: 0 }}
            >
              {loading ? '⏳ Processing...' : '🚀 Import'}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
            Works with any website — company pages, product catalogues, landing pages.
          </div>
        </div>

        {/* Progress */}
        {loading && step >= 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Processing...</div>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: i < STEPS.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ fontSize: 18 }}>
                  {i < step ? '✅' : i === step ? '⏳' : '⬜'}
                </span>
                <span style={{ fontSize: 14, color: i <= step ? '#111827' : '#9ca3af', fontWeight: i === step ? 600 : 400 }}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {/* Success */}
        {result && (
          <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{result.companyNameEn}</h2>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
              <span className="badge badge-green">✅ Profile created</span>
              <span className="badge badge-blue">📦 {result.productsCount} products</span>
              <span className="badge badge-gold">🌍 {result.translationsCount} languages</span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href={`/manufacturer/${result.slug}`} className="btn btn-primary">
                View Profile →
              </Link>
              <button className="btn btn-outline" onClick={() => { setResult(null); setUrl(''); setStep(-1); }}>
                Import Another
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        {!loading && !result && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
            {[
              { icon: '🕷️', title: 'Jina AI scrapes', text: 'Free web scraper extracts all text content from the website' },
              { icon: '🧠', title: 'Claude AI structures', text: 'Extracts company name, products, contacts, categories' },
              { icon: '🌍', title: '50 languages', text: 'Instantly translated for buyers in DE, FR, CN, JP, AR and 45 more' },
              { icon: '📊', title: 'Auto-published', text: 'Profile goes live immediately with SEO-optimized pages' },
            ].map(item => (
              <div key={item.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{item.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
