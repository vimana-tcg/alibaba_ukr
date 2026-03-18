'use client';

import { useState } from 'react';

type LandingSection = {
  id: string;
  title: string;
  goal: string;
  component: string;
  content: string[];
};

type LandingResult = {
  state: {
    runId: string;
    brand: {
      companyName: string;
      industry: string;
      audience: string;
      offer: string;
      notes: string;
      keywords: string[];
      proofPoints: string[];
      sourceSummary: string;
    };
    designSystem: {
      direction: string;
      palette: {
        bg: string;
        surface: string;
        primary: string;
        accent: string;
        text: string;
      };
      typography: {
        heading: string;
        body: string;
      };
      uiNotes: string[];
    };
    sections: LandingSection[];
    copy: {
      heroBadge: string;
      heroTitle: string;
      heroSubtitle: string;
      primaryCta: string;
      secondaryCta: string;
      proofBar: string[];
    };
    integration: {
      runtime: string[];
      orchestration: string[];
      importers: string[];
      output: string[];
      isolationRules: string[];
    };
  };
  logs: Array<{
    id: string;
    name: string;
    responsibility: string;
    writes: string[];
    summary: string;
  }>;
  exportJson: string;
};

const INITIAL_FORM = {
  companyName: '',
  siteUrl: '',
  industry: '',
  audience: '',
  offer: '',
  notes: '',
};

export default function LandingLabPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LandingResult | null>(null);
  const integrationGroups = result ? ([
    { title: 'Runtime', items: result.state.integration.runtime },
    { title: 'Orchestration', items: result.state.integration.orchestration },
    { title: 'Importers', items: result.state.integration.importers },
    { title: 'Output', items: result.state.integration.output },
    { title: 'Isolation', items: result.state.integration.isolationRules },
  ]) : [];

  async function handleSubmit() {
    if (!form.companyName.trim()) {
      setError('Add a company name first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/landing-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error ?? 'Landing generation failed.');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page landing-lab-page">
      <div className="container">
        <section className="landing-lab-hero">
          <div>
            <span className="landing-lab-kicker">Free Multi-Agent Landing Stack</span>
            <h1 className="page-title" style={{ fontSize: 'clamp(34px, 5vw, 56px)', marginBottom: 14 }}>
              Landing Lab for synchronized design bots
            </h1>
            <p className="page-subtitle" style={{ maxWidth: 720, color: '#cbd5e1' }}>
              This module runs as a separate orchestration lane inside your platform. Each bot owns one slice of the landing workflow, so design, copy, structure, and import stay coordinated without stepping on each other.
            </p>
          </div>
          <div className="landing-lab-stack">
            {[
              'Ollama',
              'Open WebUI',
              'Next.js API',
              'Section JSON',
              'Future Playwright importer',
            ].map((item) => (
              <span key={item} className="landing-lab-chip">{item}</span>
            ))}
          </div>
        </section>

        <section className="landing-lab-grid">
          <div className="card landing-lab-form">
            <div className="widget-header">
              <h3>Launch a landing workflow</h3>
            </div>

            <div className="form-group">
              <label>Company Name</label>
              <input
                className="form-control"
                value={form.companyName}
                onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                placeholder="Corevia Flow"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Website URL</label>
                <input
                  className="form-control"
                  value={form.siteUrl}
                  onChange={(event) => setForm((current) => ({ ...current, siteUrl: event.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input
                  className="form-control"
                  value={form.industry}
                  onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                  placeholder="B2B manufacturing"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Audience</label>
                <input
                  className="form-control"
                  value={form.audience}
                  onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
                  placeholder="Procurement teams and distributors"
                />
              </div>
              <div className="form-group">
                <label>Offer</label>
                <input
                  className="form-control"
                  value={form.offer}
                  onChange={(event) => setForm((current) => ({ ...current, offer: event.target.value }))}
                  placeholder="AI-generated export landing pages"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="form-control"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={5}
                placeholder="Optional brand notes, positioning, design references, or workflow requirements."
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Running agents...' : 'Generate Landing Blueprint'}
            </button>
          </div>

          <div className="card landing-lab-sidebar">
            <div className="widget-header">
              <h3>Coordination rules</h3>
            </div>
            <div className="landing-lab-rule-list">
              {[
                'Each bot writes to a dedicated state slice.',
                'The UI renders only the final assembled JSON blueprint.',
                'Import, design, copy, and layout remain decoupled.',
                'The stack stays free by default through Ollama and local orchestration.',
              ].map((rule) => (
                <div key={rule} className="landing-lab-rule">
                  <span>•</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {result && (
          <>
            <section className="landing-preview" style={{ background: result.state.designSystem.palette.bg, color: result.state.designSystem.palette.text }}>
              <div className="landing-preview-surface" style={{ background: result.state.designSystem.palette.surface }}>
                <span className="landing-lab-kicker" style={{ background: 'rgba(15, 23, 42, 0.08)', color: result.state.designSystem.palette.primary }}>
                  {result.state.copy.heroBadge}
                </span>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', marginTop: 18, marginBottom: 16, lineHeight: 1.08 }}>
                  {result.state.copy.heroTitle}
                </h2>
                <p style={{ maxWidth: 760, fontSize: 17, lineHeight: 1.7, color: 'inherit', opacity: 0.88 }}>
                  {result.state.copy.heroSubtitle}
                </p>
                <div className="landing-lab-stack" style={{ marginTop: 24 }}>
                  {result.state.copy.proofBar.map((item) => (
                    <span key={item} className="landing-lab-chip" style={{ borderColor: `${result.state.designSystem.palette.primary}33` }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="landing-lab-grid" style={{ alignItems: 'start' }}>
              <div className="card">
                <div className="widget-header">
                  <h3>Section blueprint</h3>
                </div>
                <div className="landing-section-list">
                  {result.state.sections.map((section) => (
                    <div key={section.id} className="landing-section-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <strong>{section.title}</strong>
                        <span className="badge badge-blue">{section.component}</span>
                      </div>
                      <p style={{ margin: '10px 0', color: '#475569', fontSize: 14 }}>{section.goal}</p>
                      <div className="landing-lab-rule-list">
                        {section.content.map((item) => (
                          <div key={item} className="landing-lab-rule">
                            <span>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="widget-header">
                  <h3>Agent handoff log</h3>
                </div>
                <div className="landing-section-list">
                  {result.logs.map((log) => (
                    <div key={log.id} className="landing-section-card">
                      <strong>{log.name}</strong>
                      <p style={{ margin: '10px 0', color: '#475569', fontSize: 14 }}>{log.responsibility}</p>
                      <p style={{ marginBottom: 10, fontSize: 13, color: '#0f172a' }}>{log.summary}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {log.writes.map((item) => (
                          <span key={item} className="badge badge-gray">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="landing-lab-grid" style={{ alignItems: 'start' }}>
              <div className="card">
                <div className="widget-header">
                  <h3>Integration stack</h3>
                </div>
                {integrationGroups.map((group) => (
                  <div key={group.title} style={{ marginBottom: 22 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{group.title}</div>
                    <div className="landing-lab-rule-list">
                      {group.items.map((item) => (
                        <div key={item} className="landing-lab-rule">
                          <span>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="widget-header">
                  <h3>Export JSON</h3>
                </div>
                <pre className="landing-export">{result.exportJson}</pre>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
