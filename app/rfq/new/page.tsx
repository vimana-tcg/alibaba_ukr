'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

interface RfqItem { productName: string; hsCode: string; quantity: number; unit: string; }

function RfqForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vendorId = searchParams.get('vendorId') ?? '';
  const vendorName = searchParams.get('vendorName') ?? '';

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<RfqItem[]>([
    { productName: '', hsCode: '', quantity: 1, unit: 'MT' },
  ]);
  const [shipping, setShipping] = useState({
    destinationCountry: 'DE', incoterm: 'EXW', currency: 'USD', notes: '',
  });
  const [rfqNumber, setRfqNumber] = useState('');

  function addItem() {
    setItems(p => [...p, { productName: '', hsCode: '', quantity: 1, unit: 'MT' }]);
  }

  function updateItem(i: number, field: keyof RfqItem, value: string | number) {
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function removeItem(i: number) {
    setItems(p => p.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, items, ...shipping }),
      });
      const data = await res.json();
      if (data.rfqNumber) {
        setRfqNumber(data.rfqNumber);
        setStep(4);
      } else {
        alert(data.error ?? 'Failed to submit RFQ');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const INCOTERMS = [
    { value: 'EXW', label: 'EXW — Ex Works', desc: 'Buyer arranges all transport from factory.' },
    { value: 'FOB', label: 'FOB — Free on Board', desc: 'Seller loads goods on vessel at origin port.' },
    { value: 'CIF', label: 'CIF — Cost, Insurance, Freight', desc: 'Seller covers freight & insurance to destination port.' },
    { value: 'DAP', label: 'DAP — Delivered at Place', desc: 'Seller delivers to named destination, buyer pays duty.' },
    { value: 'DDP', label: 'DDP — Delivered Duty Paid', desc: 'Seller covers everything including customs clearance.' },
  ];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-header">
          <h1 className="page-title">📋 New RFQ</h1>
          <p className="page-subtitle">
            {vendorName ? `Requesting quote from ${vendorName}` : 'Request for Quotation'}
          </p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {['Products', 'Shipping Terms', 'Review & Submit', 'Done'].map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? '#16a34a' : step === i + 1 ? '#2563eb' : '#e5e7eb',
                color: step >= i + 1 ? '#fff' : '#9ca3af',
                fontWeight: 700, fontSize: 14,
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: step === i + 1 ? '#2563eb' : '#6b7280' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Products */}
        {step === 1 && (
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Products to Quote</h3>
            {items.map((item, i) => (
              <div key={i} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Item #{i + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕ Remove</button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Product Name *</label>
                    <input className="form-control" value={item.productName} placeholder="e.g. Sunflower Oil Crude"
                      onChange={e => updateItem(i, 'productName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>HS Code</label>
                    <input className="form-control" value={item.hsCode} placeholder="e.g. 1512.11.91"
                      onChange={e => updateItem(i, 'hsCode', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" className="form-control" value={item.quantity} min={1}
                      onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select className="form-control" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                      {['MT', 'KG', 'PCS', 'CBM', 'L', 'M2', 'SET'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginBottom: 20 }}>+ Add Product</button>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                disabled={items.every(i => !i.productName)}
                onClick={() => setStep(2)}
              >
                Next: Shipping Terms →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Shipping Terms */}
        {step === 2 && (
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Shipping Terms</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Destination Country</label>
                <select className="form-control" value={shipping.destinationCountry} onChange={e => setShipping(p => ({ ...p, destinationCountry: e.target.value }))}>
                  {[['DE','🇩🇪 Germany'],['PL','🇵🇱 Poland'],['FR','🇫🇷 France'],['NL','🇳🇱 Netherlands'],['IT','🇮🇹 Italy'],['GB','🇬🇧 United Kingdom'],['US','🇺🇸 United States'],['AT','🇦🇹 Austria'],['BE','🇧🇪 Belgium'],['SE','🇸🇪 Sweden'],['OTHER','Other']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select className="form-control" value={shipping.currency} onChange={e => setShipping(p => ({ ...p, currency: e.target.value }))}>
                  {['USD','EUR','GBP','PLN'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Incoterm</label>
              <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
                {INCOTERMS.map(t => (
                  <label key={t.value} style={{ display: 'flex', gap: 12, padding: '12px 14px', border: `1.5px solid ${shipping.incoterm === t.value ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: shipping.incoterm === t.value ? '#eff6ff' : '#fff' }}>
                    <input type="radio" name="incoterm" value={t.value} checked={shipping.incoterm === t.value}
                      onChange={() => setShipping(p => ({ ...p, incoterm: t.value }))} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Notes / Special Requirements</label>
              <textarea className="form-control" rows={3} value={shipping.notes}
                onChange={e => setShipping(p => ({ ...p, notes: e.target.value }))}
                placeholder="Packaging requirements, delivery timeline, certifications needed..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Review →</button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Review & Submit</h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Products</div>
              {items.map((item, i) => (
                <div key={i} style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 8, marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{item.productName}</span>
                  <span style={{ color: '#6b7280' }}>{item.quantity} {item.unit} {item.hsCode && `· ${item.hsCode}`}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 16px', background: '#f9fafb', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Shipping Terms</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: '#6b7280' }}>Destination:</span> <strong>{shipping.destinationCountry}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Incoterm:</span> <strong>{shipping.incoterm}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Currency:</span> <strong>{shipping.currency}</strong></div>
                {vendorName && <div><span style={{ color: '#6b7280' }}>Vendor:</span> <strong>{vendorName}</strong></div>}
              </div>
              {shipping.notes && <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>Notes: {shipping.notes}</div>}
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              The vendor will receive your RFQ and respond within 24–48 hours.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting...' : '✅ Submit RFQ'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>RFQ Submitted!</h2>
            <p style={{ color: '#6b7280', marginBottom: 8 }}>Reference: <strong>{rfqNumber}</strong></p>
            <p style={{ color: '#6b7280', marginBottom: 32 }}>The vendor will respond within 24–48 hours. You'll see updates in your dashboard.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a href="/dashboard" className="btn btn-primary">Go to Dashboard →</a>
              <button className="btn btn-outline" onClick={() => { setStep(1); setItems([{ productName: '', hsCode: '', quantity: 1, unit: 'MT' }]); }}>New RFQ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RfqNewPage() {
  return <Suspense><RfqForm /></Suspense>;
}
