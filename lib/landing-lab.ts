type LandingAgentId =
  | 'intake'
  | 'research'
  | 'design-system'
  | 'section-planner'
  | 'copywriter'
  | 'assembler';

type LandingBrief = {
  companyName: string;
  siteUrl?: string;
  industry?: string;
  audience?: string;
  offer?: string;
  notes?: string;
};

type BrandProfile = {
  companyName: string;
  industry: string;
  audience: string;
  offer: string;
  notes: string;
  keywords: string[];
  proofPoints: string[];
  sourceSummary: string;
};

type DesignSystem = {
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

type LandingSection = {
  id: string;
  title: string;
  goal: string;
  component: string;
  content: string[];
};

type LandingCopy = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  proofBar: string[];
};

type IntegrationBlueprint = {
  runtime: string[];
  orchestration: string[];
  importers: string[];
  output: string[];
  isolationRules: string[];
};

type RenderedLandingSection = {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  items: string[];
  component: string;
};

type RenderedLanding = {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    proofBar: string[];
  };
  sections: RenderedLandingSection[];
  theme: {
    direction: string;
    bg: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    headingFont: string;
    bodyFont: string;
  };
};

type LandingState = {
  runId: string;
  brief: LandingBrief;
  brand?: BrandProfile;
  designSystem?: DesignSystem;
  sections?: LandingSection[];
  copy?: LandingCopy;
  integration?: IntegrationBlueprint;
};

export type LandingAgentLog = {
  id: LandingAgentId;
  name: string;
  responsibility: string;
  writes: string[];
  summary: string;
};

export type LandingRunResult = {
  state: Required<Pick<LandingState, 'brand' | 'designSystem' | 'sections' | 'copy' | 'integration'>> & {
    runId: string;
  };
  logs: LandingAgentLog[];
  exportJson: string;
  renderedLanding: RenderedLanding;
  exportTsx: string;
};

type AgentResult = {
  state: LandingState;
  log: LandingAgentLog;
};

type OllamaMessage = {
  role: 'system' | 'user';
  content: string;
};

const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5-coder:7b';
const DEFAULT_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';

function buildRunId() {
  return `landing-${Date.now().toString(36)}`;
}

function toTitleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function takeSentences(value: string, maxLength = 900) {
  return value.slice(0, maxLength).trim();
}

async function fetchSiteSummary(siteUrl?: string) {
  if (!siteUrl) return '';

  try {
    const response = await fetch(siteUrl, {
      signal: AbortSignal.timeout(9000),
      headers: {
        'User-Agent': 'CoreviaLandingLab/1.0',
      },
    });

    if (!response.ok) {
      return '';
    }

    const html = await response.text();
    const cleanText = stripHtml(html);
    return takeSentences(cleanText);
  } catch {
    return '';
  }
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function callOllamaJson<T>(
  messages: OllamaMessage[],
  fallback: T,
): Promise<T> {
  try {
    const response = await fetch(`${DEFAULT_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        stream: false,
        format: 'json',
        messages,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const parsed = safeJsonParse<T>(data.message?.content ?? '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function choosePalette(industry: string) {
  const normalized = industry.toLowerCase();

  if (normalized.includes('tech') || normalized.includes('software')) {
    return {
      direction: 'Precision SaaS',
      palette: {
        bg: '#07111f',
        surface: '#0e1b2d',
        primary: '#3b82f6',
        accent: '#22c55e',
        text: '#e2e8f0',
      },
      typography: { heading: 'Space Grotesk', body: 'Manrope' },
      uiNotes: [
        'Use bold metric cards above the fold.',
        'Prefer clean grids with deep contrast surfaces.',
        'Keep CTAs sharp and businesslike.',
      ],
    };
  }

  if (normalized.includes('food') || normalized.includes('agro')) {
    return {
      direction: 'Premium origin story',
      palette: {
        bg: '#f7f4ea',
        surface: '#fffdf7',
        primary: '#166534',
        accent: '#b45309',
        text: '#1f2937',
      },
      typography: { heading: 'Fraunces', body: 'Instrument Sans' },
      uiNotes: [
        'Lead with provenance and certifications.',
        'Blend editorial sections with structured export facts.',
        'Use warm neutrals instead of flat white.',
      ],
    };
  }

  return {
    direction: 'Industrial confidence',
    palette: {
      bg: '#f3f7fb',
      surface: '#ffffff',
      primary: '#0f4c81',
      accent: '#f97316',
      text: '#111827',
    },
    typography: { heading: 'Sora', body: 'Plus Jakarta Sans' },
    uiNotes: [
      'Balance strong hero statements with operational proof.',
      'Use section dividers and darker proof bands.',
      'Anchor the layout on export capability and reliability.',
    ],
  };
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function toSentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeForTemplate(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function renderLandingModel(
  state: Required<Pick<LandingState, 'brand' | 'designSystem' | 'sections' | 'copy' | 'integration'>> & { runId: string },
): RenderedLanding {
  return {
    hero: {
      badge: state.copy.heroBadge,
      title: state.copy.heroTitle,
      subtitle: state.copy.heroSubtitle,
      primaryCta: state.copy.primaryCta,
      secondaryCta: state.copy.secondaryCta,
      proofBar: state.copy.proofBar,
    },
    sections: state.sections.map((section) => ({
      id: section.id,
      eyebrow: section.component,
      heading: section.title,
      body: toSentenceCase(section.goal),
      items: section.content,
      component: section.component,
    })),
    theme: {
      direction: state.designSystem.direction,
      bg: state.designSystem.palette.bg,
      surface: state.designSystem.palette.surface,
      primary: state.designSystem.palette.primary,
      accent: state.designSystem.palette.accent,
      text: state.designSystem.palette.text,
      headingFont: state.designSystem.typography.heading,
      bodyFont: state.designSystem.typography.body,
    },
  };
}

function buildTsxExport(
  state: Required<Pick<LandingState, 'brand' | 'designSystem' | 'sections' | 'copy' | 'integration'>> & { runId: string },
  renderedLanding: RenderedLanding,
) {
  const heroProof = renderedLanding.hero.proofBar
    .map((item) => `'${escapeForTemplate(item)}'`)
    .join(', ');
  const sectionsLiteral = renderedLanding.sections.map((section) => `{
    id: '${escapeForTemplate(section.id)}',
    eyebrow: '${escapeForTemplate(section.eyebrow)}',
    heading: '${escapeForTemplate(section.heading)}',
    body: '${escapeForTemplate(section.body)}',
    component: '${escapeForTemplate(section.component)}',
    items: [${section.items.map((item) => `'${escapeForTemplate(item)}'`).join(', ')}],
  }`).join(',\n  ');

  return `export default function GeneratedLandingPage() {
  const theme = {
    bg: '${escapeForTemplate(renderedLanding.theme.bg)}',
    surface: '${escapeForTemplate(renderedLanding.theme.surface)}',
    primary: '${escapeForTemplate(renderedLanding.theme.primary)}',
    accent: '${escapeForTemplate(renderedLanding.theme.accent)}',
    text: '${escapeForTemplate(renderedLanding.theme.text)}',
  };

  const heroProof = [${heroProof}];
  const sections = [
  ${sectionsLiteral}
  ];

  return (
    <main style={{ background: theme.bg, color: theme.text, minHeight: '100vh', padding: '32px 0 80px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
        <section style={{
          background: \`linear-gradient(135deg, \${theme.surface}, #ffffff)\`,
          borderRadius: 28,
          padding: '56px 40px',
          boxShadow: '0 24px 60px rgba(15,23,42,.12)',
          border: '1px solid rgba(148,163,184,.18)',
        }}>
          <div style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: 999, background: \`\${theme.primary}18\`, color: theme.primary, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>
            ${escapeForTemplate(renderedLanding.hero.badge)}
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', lineHeight: 1.02, margin: '18px 0 14px' }}>
            ${escapeForTemplate(renderedLanding.hero.title)}
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, maxWidth: 760, opacity: .86 }}>
            ${escapeForTemplate(renderedLanding.hero.subtitle)}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <a href="#contact" style={{ background: theme.primary, color: '#fff', padding: '14px 22px', borderRadius: 14, fontWeight: 700 }}>
              ${escapeForTemplate(renderedLanding.hero.primaryCta)}
            </a>
            <a href="#workflow" style={{ background: '#fff', color: theme.primary, padding: '14px 22px', borderRadius: 14, border: \`1px solid \${theme.primary}33\`, fontWeight: 700 }}>
              ${escapeForTemplate(renderedLanding.hero.secondaryCta)}
            </a>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            {heroProof.map((item) => (
              <span key={item} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148,163,184,.2)', background: '#fff', fontSize: 13, fontWeight: 600 }}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section id="workflow" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 24 }}>
          {sections.map((section) => (
            <article key={section.id} style={{ background: '#fff', borderRadius: 22, padding: 24, border: '1px solid rgba(148,163,184,.18)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.accent }}>
                {section.eyebrow}
              </div>
              <h2 style={{ margin: '12px 0 10px', fontSize: 24 }}>{section.heading}</h2>
              <p style={{ color: '#475569', lineHeight: 1.7 }}>{section.body}</p>
              <ul style={{ margin: '16px 0 0', paddingLeft: 18, color: '#334155', lineHeight: 1.8 }}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section id="contact" style={{ marginTop: 24, background: theme.primary, color: '#fff', borderRadius: 24, padding: '32px 28px' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .72 }}>Ready to launch</div>
          <h2 style={{ fontSize: 30, margin: '10px 0 12px' }}>Import ${escapeForTemplate(state.brand.companyName)} into your landing workflow</h2>
          <p style={{ maxWidth: 680, lineHeight: 1.7, opacity: .88 }}>
            This export was generated from the Landing Lab blueprint. Each agent keeps its own responsibility, so you can swap copy, layout, or import logic without breaking the rest of the system.
          </p>
        </section>
      </div>
    </main>
  );
}
`;
}

function extractKeywords(source: string, companyName: string, offer: string, industry: string) {
  const combined = `${companyName} ${offer} ${industry} ${source}`.toLowerCase();
  const tokens = combined.match(/[a-z0-9-]{4,}/g) ?? [];
  const filtered = tokens.filter((token) => ![
    'with', 'that', 'from', 'this', 'your', 'have', 'been', 'will',
    'into', 'their', 'they', 'more', 'than', 'export', 'global',
  ].includes(token));
  return dedupe(filtered).slice(0, 8).map(toTitleCase);
}

async function runIntakeAgent(state: LandingState): Promise<AgentResult> {
  const brief = state.brief;
  const sourceSummary = await fetchSiteSummary(brief.siteUrl);
  const brand: BrandProfile = {
    companyName: brief.companyName.trim(),
    industry: brief.industry?.trim() || 'B2B manufacturing',
    audience: brief.audience?.trim() || 'procurement leads and distribution partners',
    offer: brief.offer?.trim() || 'high-converting landing page generation',
    notes: brief.notes?.trim() || '',
    keywords: extractKeywords(
      sourceSummary,
      brief.companyName,
      brief.offer ?? '',
      brief.industry ?? '',
    ),
    proofPoints: [],
    sourceSummary,
  };

  return {
    state: { ...state, brand },
    log: {
      id: 'intake',
      name: 'Intake Agent',
      responsibility: 'Normalizes client input into a safe shared brief.',
      writes: ['brand.companyName', 'brand.industry', 'brand.audience', 'brand.offer', 'brand.keywords', 'brand.sourceSummary'],
      summary: `Prepared a clean brief for ${brand.companyName} and captured import context without touching downstream agent outputs.`,
    },
  };
}

async function runResearchAgent(state: LandingState): Promise<AgentResult> {
  const brand = state.brand!;
  const fallbackProof = [
    'Fast import into a B2B workflow',
    'Reusable landing sections for multiple clients',
    'Separate agent scopes to avoid prompt collisions',
  ];

  const fallback = {
    proofPoints: fallbackProof,
    sourceSummary: brand.sourceSummary || `${brand.companyName} serves ${brand.audience} with ${brand.offer}.`,
  };

  const researched = await callOllamaJson(fallback.sourceSummary ? [
    {
      role: 'system',
      content: 'Return JSON only. Extract concise B2B proof points and a short source summary.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        companyName: brand.companyName,
        audience: brand.audience,
        offer: brand.offer,
        sourceSummary: brand.sourceSummary,
        format: {
          proofPoints: ['string'],
          sourceSummary: 'string',
        },
      }),
    },
  ] : [], fallback);

  const nextBrand: BrandProfile = {
    ...brand,
    proofPoints: dedupe(researched.proofPoints ?? fallbackProof).slice(0, 4),
    sourceSummary: researched.sourceSummary?.trim() || fallback.sourceSummary,
  };

  return {
    state: { ...state, brand: nextBrand },
    log: {
      id: 'research',
      name: 'Research Agent',
      responsibility: 'Pulls source facts and proof so the design bot does not invent business claims.',
      writes: ['brand.proofPoints', 'brand.sourceSummary'],
      summary: `Compiled proof points from imported context and left design/copy scopes untouched.`,
    },
  };
}

async function runDesignSystemAgent(state: LandingState): Promise<AgentResult> {
  const brand = state.brand!;
  const fallback = choosePalette(brand.industry);

  const designSystem = await callOllamaJson<DesignSystem>([
    {
      role: 'system',
      content: 'Return JSON only. Create a landing-page design system for a B2B company. Keep it practical and implementation-ready.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        companyName: brand.companyName,
        industry: brand.industry,
        audience: brand.audience,
        keywords: brand.keywords,
        proofPoints: brand.proofPoints,
        fallback,
      }),
    },
  ], fallback);

  return {
    state: { ...state, designSystem },
    log: {
      id: 'design-system',
      name: 'Design System Agent',
      responsibility: 'Defines colors, typography, and visual direction without editing copy or section order.',
      writes: ['designSystem.direction', 'designSystem.palette', 'designSystem.typography', 'designSystem.uiNotes'],
      summary: `Created a reusable visual system in an isolated design scope.`,
    },
  };
}

async function runSectionPlannerAgent(state: LandingState): Promise<AgentResult> {
  const brand = state.brand!;
  const fallback: LandingSection[] = [
    {
      id: 'hero',
      title: 'Hero',
      goal: 'Explain the offer fast and establish trust.',
      component: 'HeroSplit',
      content: [brand.offer, ...brand.proofPoints.slice(0, 2)],
    },
    {
      id: 'proof-bar',
      title: 'Proof Bar',
      goal: 'Surface credibility in seconds.',
      component: 'MetricRibbon',
      content: brand.proofPoints,
    },
    {
      id: 'solution',
      title: 'Solution',
      goal: 'Show how the platform solves the client workflow.',
      component: 'FeatureGrid',
      content: [
        'Import site or brief',
        'Generate structured layout',
        'Export production-ready landing sections',
      ],
    },
    {
      id: 'process',
      title: 'Workflow',
      goal: 'Show coordinated bot execution with clear ownership.',
      component: 'TimelineBand',
      content: [
        'Research agent enriches context',
        'Design agent builds visual direction',
        'Copywriter and assembler finalize output',
      ],
    },
    {
      id: 'cta',
      title: 'Call to Action',
      goal: 'Drive the next business action.',
      component: 'CtaPanel',
      content: ['Book a demo', 'Import a new company', 'Launch a landing page'],
    },
  ];

  const sections = await callOllamaJson<LandingSection[]>([
    {
      role: 'system',
      content: 'Return JSON only. Plan a lean B2B landing page as an array of sections.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        companyName: brand.companyName,
        audience: brand.audience,
        offer: brand.offer,
        proofPoints: brand.proofPoints,
        fallback,
      }),
    },
  ], fallback);

  return {
    state: { ...state, sections },
    log: {
      id: 'section-planner',
      name: 'Section Planner Agent',
      responsibility: 'Maps the page into components and ordering, separate from copy and visual tokens.',
      writes: ['sections'],
      summary: `Planned the landing structure so the assembler can render from a stable schema.`,
    },
  };
}

async function runCopywriterAgent(state: LandingState): Promise<AgentResult> {
  const brand = state.brand!;
  const fallback: LandingCopy = {
    heroBadge: 'Free AI Landing Stack',
    heroTitle: `${brand.companyName} turns imported business data into launch-ready landing pages`,
    heroSubtitle: `Built for ${brand.audience}. Free local agents collaborate through isolated roles so one bot can improve the page without breaking another bot's work.`,
    primaryCta: 'Generate Landing Blueprint',
    secondaryCta: 'View Agent Workflow',
    proofBar: brand.proofPoints,
  };

  const copy = await callOllamaJson<LandingCopy>([
    {
      role: 'system',
      content: 'Return JSON only. Write concise, polished B2B landing copy.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        companyName: brand.companyName,
        audience: brand.audience,
        offer: brand.offer,
        proofPoints: brand.proofPoints,
        fallback,
      }),
    },
  ], fallback);

  return {
    state: { ...state, copy },
    log: {
      id: 'copywriter',
      name: 'Copywriter Agent',
      responsibility: 'Writes the message layer while respecting the section plan and design boundaries.',
      writes: ['copy.heroBadge', 'copy.heroTitle', 'copy.heroSubtitle', 'copy.primaryCta', 'copy.secondaryCta', 'copy.proofBar'],
      summary: `Prepared conversion-focused copy without mutating layout or design state.`,
    },
  };
}

async function runAssemblerAgent(state: LandingState): Promise<AgentResult> {
  const integration: IntegrationBlueprint = {
    runtime: [
      'Ollama for local LLM execution',
      'Open WebUI as optional operator dashboard',
      'Next.js route handlers for orchestration endpoints',
    ],
    orchestration: [
      'Intake agent owns brief normalization',
      'Research agent owns imported facts only',
      'Design system agent owns visual tokens only',
      'Section planner owns component ordering only',
      'Copywriter owns messaging only',
      'Assembler exports a shared JSON blueprint',
    ],
    importers: [
      'Fetch-based site import is enabled now',
      'Playwright and Cheerio can be added later as worker-side importers',
      'screenshot-to-code can plug in as an optional reference ingester',
    ],
    output: [
      'Section JSON for deterministic rendering',
      'Prompt pack for local coding agents',
      'Shared logs for bot coordination and auditability',
    ],
    isolationRules: [
      'Each agent writes to a dedicated state slice.',
      'Agents never overwrite another agent output directly.',
      'The UI consumes the final assembled schema only.',
    ],
  };

  return {
    state: { ...state, integration },
    log: {
      id: 'assembler',
      name: 'Assembler Agent',
      responsibility: 'Packages the final blueprint and integration contract for the rest of the platform.',
      writes: ['integration'],
      summary: 'Assembled a production-friendly blueprint with explicit isolation rules so the landing bots can collaborate safely.',
    },
  };
}

export async function runLandingLab(brief: LandingBrief): Promise<LandingRunResult> {
  let state: LandingState = {
    runId: buildRunId(),
    brief,
  };

  const logs: LandingAgentLog[] = [];
  const pipeline = [
    runIntakeAgent,
    runResearchAgent,
    runDesignSystemAgent,
    runSectionPlannerAgent,
    runCopywriterAgent,
    runAssemblerAgent,
  ];

  for (const agent of pipeline) {
    const result = await agent(state);
    state = result.state;
    logs.push(result.log);
  }

  const finalState = {
    runId: state.runId,
    brand: state.brand!,
    designSystem: state.designSystem!,
    sections: state.sections!,
    copy: state.copy!,
    integration: state.integration!,
  };
  const renderedLanding = renderLandingModel(finalState);
  const exportTsx = buildTsxExport(finalState, renderedLanding);

  return {
    state: finalState,
    logs,
    exportJson: JSON.stringify(finalState, null, 2),
    renderedLanding,
    exportTsx,
  };
}
