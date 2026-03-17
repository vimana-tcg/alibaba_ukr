'use client';

import { useState } from 'react';

interface HsResult { hsCode: string; descriptionEn: string; }
interface DutyResult {
  hs_code: string; hs_description: string; product_value: number;
  freight_cost: number; insurance_cost: number; cif_value: number;
  trade_agreement: string; duty_rate_pct: number; duty_amount: number;
  vat_rate_pct: number; vat_amount: number; total_landed_cost: number;
  dcfta_saving: number; requires_eur1: boolean; notes: string[];
}

export default function CalculatorPage() {
  const [hsSearch, setHsSearch] = useState('');
  const [hsResults, setHsResults] = useState<HsResult[]>([]);
  const [selectedHs, setSelectedHs] = useState<HsResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<DutyResult | null>(null);
  const [form, setForm] = useState({
    productValue: 10000, freightCost: 500, insuranceCost: 50,
    originCountry: 'UA', destinationCountry: 'DE',
  });

  async function onHsSearch(q: string) {
    setHsSearch(q);
    if (q.length < 2) { setHsResults([]); return; }
    const res = await fetch(`/api/compliance/hs-search?q=${encodeURIComponent(q)}&limit=8`);
    setHsResults(await res.json());
  }

  function selectHs(hs: HsResult) {
    setSelectedHs(hs);
    setHsSearch(`${hs.hsCode} — ${hs.descriptionEn}`);
    setHsResults([]);
  }

  async function calculate() {
    if (!selectedHs) return;
    setCalculating(true);
    setResult(null);
    const params = new URLSearchParams({
      hs_code: selectedHs.hsCode,
      origin: form.originCountry,
      destination: form.destinationCountry,
      value: String(form.productValue),
      freight: String(form.freightCost),
      insurance: String(form.insuranceCost),
    });
    try {
      const res = await fetch(`/api/compliance/duty-estimate?${params}`);
      setResult(await res.json());
    } catch {
      alert('Calculation failed. Please try again.');
    } finally {
      setCalculating(false);
    }
  }

  const canCalculate = selectedHs && form.productValue > 0 && form.destinationCountry;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">🧮 Import Duty Calculator</h1>
          <p className="page-subtitle">
            Calculate estimated import duties, VAT and landed costs for Ukrainian products.
            Ukraine–EU DCFTA preferential rates applied automatically.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Form */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Enter Product Details</h3>

            <div className="form-group">
              <label>HS Code</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={hsSearch}
                  onChange={e => onHsSearch(e.target.value)}
                  className="form-control"
                  placeholder="Search by HS code or product description..."
                />
                {hsResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 50, maxHeight: 240, overflowY: 'auto' }}>
                    {hsResults.map(r => (
                      <div key={r.hsCode} onClick={() => selectHs(r)}
                        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        <span className="cert-chip">{r.hsCode}</span>
                        {r.descriptionEn}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedHs && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#eff6ff', borderRadius: 6, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="cert-chip">{selectedHs.hsCode}</span>
                  {selectedHs.descriptionEn}
                </div>
              )}
            </div>

            <div className="form-row">
              {[
                { label: 'Product Value (USD)', key: 'productValue', step: 100 },
                { label: 'Freight Cost (USD)', key: 'freightCost', step: 50 },
                { label: 'Insurance (USD)', key: 'insuranceCost', step: 10 },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}</label>
                  <input
                    type="number" min={0} step={f.step} className="form-control"
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country of Origin</label>
                <select className="form-control" value={form.originCountry} onChange={e => setForm(p => ({ ...p, originCountry: e.target.value }))}>
                  <option value="UA">🇺🇦 Ukraine</option>
                </select>
              </div>
              <div className="form-group">
                <label>Destination Country</label>
                <select className="form-control" value={form.destinationCountry} onChange={e => setForm(p => ({ ...p, destinationCountry: e.target.value }))}>
                  <option value="">— Select —</option>
                  {[['DE','🇩🇪 Germany'],['PL','🇵🇱 Poland'],['FR','🇫🇷 France'],['NL','🇳🇱 Netherlands'],['IT','🇮🇹 Italy'],['GB','🇬🇧 United Kingdom'],['US','🇺🇸 United States'],['AT','🇦🇹 Austria'],['BE','🇧🇪 Belgium'],['SE','🇸🇪 Sweden']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              disabled={!canCalculate || calculating}
              onClick={calculate}
            >
              {calculating ? 'Calculating...' : '⚡ Calculate Duties'}
            </button>
          </div>

          {/* Results */}
          {result ? (
            <div>
              <div style={{
                padding: '16px 20px', borderRadius: '12px 12px 0 0',
                background: result.trade_agreement === 'EU-DCFTA' ? '#f0fdf4' : '#eff6ff',
                border: `1px solid ${result.trade_agreement === 'EU-DCFTA' ? '#bbf7d0' : '#bfdbfe'}`,
                borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${result.trade_agreement === 'EU-DCFTA' ? 'badge-green' : 'badge-blue'}`}>
                    {result.trade_agreement}
                  </span>
                  {result.requires_eur1 && <span className="badge badge-gold">EUR.1 Required</span>}
                </div>
                <span style={{ fontSize: 13, color: '#6b7280' }}><strong>{result.hs_code}</strong> — {result.hs_description}</span>
              </div>

              <div className="card" style={{ borderRadius: '0 0 12px 12px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Cost Breakdown (USD)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <tbody>
                    {[
                      { label: 'Product Value', val: result.product_value, normal: true },
                      { label: 'Freight', val: result.freight_cost, normal: true },
                      { label: 'Insurance', val: result.insurance_cost, normal: true },
                      { label: 'CIF Value (Customs Base)', val: result.cif_value, subtotal: true },
                      { label: `Import Duty (${result.duty_rate_pct}%)`, val: result.duty_amount, zero: result.duty_amount === 0 },
                      { label: `VAT (${result.vat_rate_pct}%)`, val: result.vat_amount, normal: true },
                    ].map(row => (
                      <tr key={row.label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '9px 0', color: row.subtotal ? '#374151' : '#6b7280', fontWeight: row.subtotal ? 600 : 400 }}>{row.label}</td>
                        <td style={{ padding: '9px 0', textAlign: 'right', color: row.zero ? '#16a34a' : '#111827', fontWeight: row.subtotal ? 700 : 400 }}>
                          {fmt(row.val)}
                          {row.zero && <span className="badge badge-green" style={{ marginLeft: 6 }}>FREE 🎉</span>}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f9fafb', fontWeight: 800, fontSize: 16 }}>
                      <td style={{ padding: '12px 0' }}>TOTAL LANDED COST</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: '#2563eb' }}>{fmt(result.total_landed_cost)}</td>
                    </tr>
                  </tbody>
                </table>

                {result.dcfta_saving > 0 && (
                  <div style={{ marginTop: 16, padding: 14, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>💰</span>
                    <div>
                      <strong>DCFTA Saving: {fmt(result.dcfta_saving)}</strong>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Saved vs MFN rate thanks to EU-Ukraine DCFTA</div>
                    </div>
                  </div>
                )}

                {result.notes.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ℹ️ Notes</div>
                    <ul style={{ fontSize: 13, color: '#6b7280', paddingLeft: 16, lineHeight: 1.7 }}>
                      {result.notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨 Print</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
              <p style={{ color: '#6b7280', marginBottom: 24 }}>Enter product details to calculate import duties and landed cost.</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { icon: '💡', title: 'EU-Ukraine DCFTA', text: 'Most Ukrainian goods enter the EU at 0% duty with a valid EUR.1 certificate.' },
                  { icon: '🏷', title: 'HS Code?', text: 'Search your product above. It determines which duty rate applies.' },
                ].map(t => (
                  <div key={t.title} style={{ padding: 14, background: '#f9fafb', borderRadius: 8, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.icon} {t.title}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{t.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
