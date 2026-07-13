const P = '#625bd5', PH = '#514ac5', PSOFT = '#eef0ff', PRING = '#dfe2ff', PTINT = '#f3f2ff';
const wsFont = 'var(--cv-font-body)';

function Ic({ name, size = 16, sw = 2, style }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}
    dangerouslySetInnerHTML={{ __html: window.CV_LUCIDE[name] || '' }} />;
}

/* ---------- Sidebar ---------- */
function NavItem({ item, active, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 36, padding: '0 10px', borderRadius: 8,
        border: `1px solid ${active ? PRING : 'transparent'}`, background: active ? PSOFT : 'transparent',
        color: active ? P : h ? 'var(--cv-neutral-900)' : '#64748b', cursor: 'pointer', fontFamily: wsFont,
        fontSize: 13, fontWeight: 600, textAlign: 'left', transition: 'all 120ms cubic-bezier(0.2,0,0,1)', boxSizing: 'border-box' }}>
      <Ic name={item.icon} size={16} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      {item.badge ? <span style={{ borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: PTINT, color: P }}>{item.badge}</span> : null}
    </button>
  );
}

function WorkspaceSidebar({ view, setView }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'resumes', label: 'My Resumes', icon: 'file-text', disabled: true },
    { id: 'pipeline', label: 'Career Pipeline', icon: 'kanban-square', badge: '12' },
    { id: 'studio', label: 'Interview Studio', icon: 'mic' },
  ];
  const brandItems = [
    { id: 'portfolio', label: 'Portfolio', icon: 'globe', disabled: true },
    { id: 'whiteboard', label: 'Whiteboard', icon: 'pen-line', disabled: true },
    { id: 'jobs', label: 'Job Market', icon: 'briefcase', disabled: true },
  ];
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 224, flexShrink: 0, padding: 12, background: '#fff', borderRight: '1px solid var(--cv-border-subtle)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 12px' }}>
        <img src="../../assets/logo/careervivid-icon-128.png" alt="" style={{ width: 26, height: 26 }} />
        <span style={{ fontFamily: 'var(--cv-font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--cv-neutral-900)' }}>CareerVivid</span>
      </div>
      <p style={{ margin: '2px 4px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cv-neutral-400)' }}>Workspace</p>
      {items.map((it) => <NavItem key={it.id} item={it} active={view === it.id} onClick={() => !it.disabled && setView(it.id)} />)}
      <p style={{ margin: '14px 4px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cv-neutral-400)' }}>Brand</p>
      {brandItems.map((it) => <NavItem key={it.id} item={it} active={false} onClick={() => {}} />)}
      <div style={{ flex: 1 }}></div>
      <div style={{ padding: 10, borderRadius: 10, border: '1px solid var(--cv-border-product)', background: 'var(--cv-neutral-25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
          <span style={{ color: 'var(--cv-neutral-900)' }}>AI credits</span>
          <span style={{ color: 'var(--cv-neutral-500)' }}>34/100</span>
        </div>
        <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: 'var(--cv-neutral-200)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '34%', borderRadius: 999, background: P }}></div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 6px 2px' }}>
        <img src="../../assets/avatars/careervivid-rabbit-glasses.jpg" alt="" style={{ width: 30, height: 30, borderRadius: 999, objectFit: 'cover', boxShadow: '0 0 0 2px #fff' }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--cv-neutral-900)' }}>Jiawen Zhu</p>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--cv-neutral-400)' }}>Free plan</p>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Shared bits ---------- */
function PrimaryBtn({ icon, children, small }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: small ? 32 : 36, padding: small ? '0 12px' : '0 14px', borderRadius: 8, border: 'none',
        background: h ? PH : P, color: '#fff', fontFamily: wsFont, fontSize: small ? 12 : 13, fontWeight: 700, cursor: 'pointer', transition: 'background 120ms', whiteSpace: 'nowrap' }}>
      {icon ? <Ic name={icon} size={small ? 14 : 16} /> : null}{children}
    </button>
  );
}

function StatCard({ label, value, icon, toneBg, toneFg, delta }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--cv-border-product)', borderRadius: 16, padding: 16, boxShadow: 'var(--cv-shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b' }}>{label}</p>
          <p style={{ margin: '6px 0 0', fontFamily: 'var(--cv-font-heading)', fontSize: 28, fontWeight: 800, lineHeight: 1.1, color: 'var(--cv-neutral-900)' }}>{value}</p>
          {delta ? <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--cv-neutral-500)' }}>{delta}</p> : null}
        </div>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 12, background: toneBg, color: toneFg, flexShrink: 0 }}>
          <Ic name={icon} size={17} />
        </span>
      </div>
    </div>
  );
}

/* ---------- Pipeline (Kanban) ---------- */
const pipelineData = [
  { status: 'To Apply', dot: '#6b7280', jobs: [
    { t: 'Product Designer', c: 'Linear', pr: 'Medium', prep: 1, due: 'Jul 10' },
    { t: 'Design Engineer', c: 'Vercel', pr: 'Low', prep: 0, noDesc: true },
  ]},
  { status: 'Applied', dot: '#3b82f6', jobs: [
    { t: 'Senior Frontend Engineer', c: 'Figma', pr: 'High', match: 86, prep: 3, due: 'Jul 8' },
    { t: 'Full-stack Engineer', c: 'Notion', pr: 'Medium', match: 74, prep: 2 },
    { t: 'Software Engineer II', c: 'Stripe', pr: 'Medium', match: 68, prep: 1, due: 'Jul 14' },
  ]},
  { status: 'Interviewing', dot: '#eab308', jobs: [
    { t: 'Frontend Engineer', c: 'Airbnb', pr: 'High', match: 91, prep: 5, due: 'Jul 7' },
  ]},
  { status: 'Offered', dot: '#22c55e', jobs: [
    { t: 'UI Engineer', c: 'Datadog', pr: 'Medium', match: 82, prep: 5 },
  ]},
  { status: 'Rejected', dot: '#ef4444', jobs: [
    { t: 'Staff Engineer', c: 'Coinbase', pr: 'Low', prep: 2 },
  ]},
];

function PipelineCard({ j }) {
  const [h, setH] = React.useState(false);
  const prTone = j.pr === 'High' ? { background: '#fff1f2', color: '#be123c' } : j.pr === 'Low' ? { background: '#f3f4f6', color: '#4b5563' } : { background: '#fffbeb', color: '#b45309' };
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ borderRadius: 6, border: `1px solid ${h ? '#c8c3ff' : 'var(--cv-border-product)'}`, background: h ? 'rgba(243,242,255,0.4)' : '#fff', padding: '8px 10px', boxShadow: 'var(--cv-shadow-card)', cursor: 'pointer', transition: 'all 120ms' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, flexShrink: 0, borderRadius: 6, background: 'var(--cv-neutral-100)', color: 'var(--cv-neutral-500)' }}><Ic name="briefcase" size={15} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: '19px', color: 'var(--cv-neutral-950)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: wsFont }}>{j.t}</h4>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--cv-neutral-500)' }}>{j.c}</p>
            </div>
            <span style={{ color: 'var(--cv-neutral-400)', opacity: h ? 1 : 0.6 }}><Ic name="arrow-up-right" size={13} /></span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4, fontSize: 10, fontWeight: 700, color: 'var(--cv-neutral-500)' }}>
            <span style={{ borderRadius: 4, padding: '2px 6px', ...prTone }}>{j.pr}</span>
            {j.noDesc ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, borderRadius: 4, padding: '2px 6px', background: '#fffbeb', color: '#b45309' }}><Ic name="alert-circle" size={11} />No description</span> : null}
            {j.match != null ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#2563eb' }}><Ic name="check-circle-2" size={11} />{j.match}%</span> : null}
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Ic name="calendar-clock" size={11} />Prep {j.prep}/5</span>
            {j.due ? <span style={{ marginLeft: 'auto', color: 'var(--cv-neutral-700)' }}>{j.due}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineView() {
  return (
    <div style={{ padding: 20, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--cv-neutral-900)' }}>Career Pipeline</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: '#64748b' }}>Organize and manage your job application pipeline.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', borderRadius: 10, background: 'rgba(249,250,251,0.8)', border: '1px solid var(--cv-border-product)', color: 'var(--cv-neutral-400)', fontSize: 12, fontWeight: 600 }}>
            <Ic name="search" size={15} /> Search jobs…
          </div>
          <PrimaryBtn icon="plus">Add job</PrimaryBtn>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0, overflowX: 'auto' }}>
        {pipelineData.map((col) => (
          <div key={col.status} style={{ minWidth: 244, width: 244, flexShrink: 0, borderRadius: 8, border: '1px solid var(--cv-border-product)', background: 'rgba(249,250,251,0.8)', padding: 10, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 2px' }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: col.dot, flexShrink: 0 }}></span>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--cv-neutral-700)', flex: 1 }}>{col.status}</p>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cv-neutral-400)' }}>{col.jobs.length}</span>
            </div>
            {col.jobs.map((j) => <PipelineCard key={j.t} j={j} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function DashboardView({ setView }) {
  const tools = [
    { icon: 'file-text', bg: PTINT, fg: P, title: 'AI Resume Builder', desc: 'Create ATS-optimized resumes with smart templates.', cta: 'New resume' },
    { icon: 'mic', bg: '#fff6f6', fg: '#b64a5a', title: 'Interview Studio', desc: 'Practice with a real-time AI voice coach.', cta: 'Start practice', view: 'studio' },
    { icon: 'kanban-square', bg: '#eff6ff', fg: '#2563eb', title: 'Job Tracker', desc: 'Kanban pipeline from Applied to Offer.', cta: 'Open pipeline', view: 'pipeline' },
    { icon: 'globe', bg: '#eef9f2', fg: '#15803d', title: 'Portfolio Builder', desc: 'Turn your resume into a personal site.', cta: 'Build portfolio' },
  ];
  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--cv-neutral-900)' }}>Welcome back, Jiawen</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: '#64748b' }}>Here's your job search at a glance.</p>
        </div>
        <PrimaryBtn icon="sparkles">Tailor resume</PrimaryBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Active applications" value={12} icon="briefcase" toneBg="#eff6ff" toneFg="#2563eb" delta="3 added this week" />
        <StatCard label="Interviews scheduled" value={2} icon="calendar-clock" toneBg="#fffbeb" toneFg="#b45309" delta="Next: Airbnb, Jul 7" />
        <StatCard label="Practice sessions" value={9} icon="mic" toneBg="#fff6f6" toneFg="#b64a5a" delta="Avg score 78" />
        <StatCard label="Offers" value={1} icon="trophy" toneBg="#eef9f2" toneFg="#15803d" delta="Datadog · reviewing" />
      </div>
      <h2 style={{ margin: '22px 0 10px', fontSize: 16, fontWeight: 700, color: 'var(--cv-neutral-900)' }}>Your tools</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {tools.map((tool) => (
          <div key={tool.title} style={{ background: '#fff', border: '1px solid var(--cv-border-product)', borderRadius: 12, padding: 16, boxShadow: 'var(--cv-shadow-card)', display: 'flex', flexDirection: 'column' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 12, background: tool.bg, color: tool.fg }}><Ic name={tool.icon} size={17} /></span>
            <h3 style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--cv-neutral-950)', fontFamily: wsFont }}>{tool.title}</h3>
            <p style={{ margin: '4px 0 12px', fontSize: 12, fontWeight: 500, lineHeight: 1.55, color: '#64748b', flex: 1 }}>{tool.desc}</p>
            <button type="button" onClick={() => tool.view && setView(tool.view)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 32, borderRadius: 8, background: PSOFT, color: P, border: `1px solid ${PRING}`, fontFamily: wsFont, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {tool.cta} <Ic name="arrow-right" size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Interview Studio ---------- */
const studioGuides = [
  { c: 'Google', d: 'High', topics: ['Algorithms', 'System design'], meta: '5 stages · 120 questions' },
  { c: 'Stripe', d: 'High', topics: ['APIs', 'Integrations'], meta: '4 stages · 84 questions' },
  { c: 'Airbnb', d: 'Medium', topics: ['Frontend', 'Behavioral'], meta: '4 stages · 76 questions' },
  { c: 'Figma', d: 'Medium', topics: ['Design eng', 'Prototyping'], meta: '3 stages · 58 questions' },
  { c: 'Notion', d: 'Medium', topics: ['Product sense', 'Coding'], meta: '3 stages · 51 questions' },
  { c: 'Datadog', d: 'Low', topics: ['Systems', 'Debugging'], meta: '3 stages · 44 questions' },
];
const guideTones = [
  { bg: '#f3f2ff', fg: '#625bd5', ring: '#dfdcff' },
  { bg: '#eef0ff', fg: '#7069dc', ring: '#dfe2ff' },
  { bg: '#f7f1ff', fg: '#7c5fd6', ring: '#eadfff' },
  { bg: '#f5f7ff', fg: '#5c62d6', ring: '#e0e5ff' },
];

function GuideCard({ g, i }) {
  const [h, setH] = React.useState(false);
  const tone = guideTones[i % 4];
  const dTone = g.d === 'High' ? { background: '#fff1f2', color: '#be123c', ring: '#fecdd3' } : g.d === 'Low' ? { background: '#eef9f2', color: '#15803d', ring: '#cfe8d5' } : { background: '#fffbeb', color: '#b45309', ring: '#fde68a' };
  return (
    <article onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, border: `1px solid ${h ? PRING : 'var(--cv-border-product)'}`, background: h ? '#fbfbff' : '#fff', padding: 16, boxShadow: h ? '0 8px 24px rgba(98,91,213,0.08)' : 'var(--cv-shadow-card)', transform: h ? 'translateY(-2px)' : 'none', transition: 'all 200ms cubic-bezier(0.2,0,0,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, flexShrink: 0, borderRadius: 8, background: tone.bg, color: tone.fg, boxShadow: `0 0 0 1px ${tone.ring}`, fontFamily: 'var(--cv-font-heading)', fontSize: 15, fontWeight: 800 }}>{g.c[0]}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--cv-neutral-950)', fontFamily: wsFont }}>{g.c}</h3>
            <span style={{ borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', background: dTone.background, color: dTone.color, boxShadow: `0 0 0 1px ${dTone.ring}` }}>{g.d}</span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--cv-neutral-500)' }}>{g.meta}</p>
        </div>
      </div>
      <div style={{ margin: '12px 0 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {g.topics.map((t) => (
          <span key={t} style={{ borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: h ? PTINT : 'var(--cv-neutral-100)', color: h ? P : 'var(--cv-neutral-600)', transition: 'all 120ms' }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="button" style={{ display: 'inline-flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, borderRadius: 8, background: PSOFT, color: P, border: `1px solid ${PRING}`, fontFamily: wsFont, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Ic name="swords" size={14} /> Start quest
        </button>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1px solid var(--cv-border-product)', background: '#fff', color: 'var(--cv-neutral-400)' }}><Ic name="sparkles" size={14} /></span>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1px solid var(--cv-border-product)', background: '#fff', color: 'var(--cv-neutral-400)' }}><Ic name="external-link" size={14} /></span>
      </div>
    </article>
  );
}

function StudioView() {
  const [cat, setCat] = React.useState('All');
  const cats = ['All', 'Big Tech', 'Startups', 'Finance', 'System design'];
  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: PTINT, color: P, boxShadow: '0 0 0 1px #dfdcff' }}><Ic name="building-2" size={16} /></span>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--cv-neutral-900)' }}>Practice from real company guides</h1>
            <p style={{ margin: '1px 0 0', fontSize: 12, fontWeight: 500, color: '#64748b' }}>Verified stages, topics, and sample questions — turned into a company-style mock interview.</p>
          </div>
        </div>
        <div style={{ display: 'flex', borderRadius: 12, border: '1px solid var(--cv-border-product)', background: 'rgba(255,255,255,0.8)', boxShadow: 'var(--cv-shadow-card)' }}>
          {[['1,214', 'companies'], ['38,410', 'questions'], ['4,932', 'stages']].map(([v, l], i) => (
            <div key={l} style={{ padding: '8px 16px', textAlign: 'center', borderLeft: i ? '1px solid var(--cv-border-product)' : 'none' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--cv-neutral-900)', fontVariantNumeric: 'tabular-nums' }}>{v}</p>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cv-neutral-400)' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, height: 46, padding: '0 14px', borderRadius: 12, background: 'rgba(249,250,251,0.8)', border: '1px solid var(--cv-border-product)' }}>
          <Ic name="search" size={17} style={{ color: 'var(--cv-neutral-400)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--cv-neutral-400)' }}>Search Google, Stripe, OpenAI, system design…</span>
          <kbd style={{ marginLeft: 'auto', borderRadius: 6, border: '1px solid var(--cv-border-product)', background: '#fff', padding: '1px 7px', fontFamily: wsFont, fontSize: 11, fontWeight: 700, color: 'var(--cv-neutral-400)' }}>/</kbd>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {cats.map((c) => {
          const active = c === cat;
          return (
            <button key={c} type="button" onClick={() => setCat(c)}
              style={{ borderRadius: 999, padding: '6px 12px', fontFamily: wsFont, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 120ms',
                background: active ? '#030712' : '#fff', color: active ? '#fff' : 'var(--cv-neutral-600)',
                border: active ? '1px solid #030712' : '1px solid var(--cv-border-product)' }}>{c}</button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {studioGuides.map((g, i) => <GuideCard key={g.c} g={g} i={i} />)}
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, border: '1px solid var(--cv-border-product)', background: '#fff', padding: '9px 16px', fontFamily: wsFont, fontSize: 12, fontWeight: 700, color: 'var(--cv-neutral-700)', cursor: 'pointer', boxShadow: 'var(--cv-shadow-card)' }}>
          Show more companies <span style={{ color: 'var(--cv-neutral-400)', fontWeight: 600 }}>(1,208 more)</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Shell ---------- */
function Workspace() {
  const [view, setView] = React.useState('pipeline');
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: wsFont, background: 'var(--cv-neutral-50)' }} data-screen-label={view}>
      <WorkspaceSidebar view={view} setView={setView} />
      <main style={{ flex: 1, minWidth: 0 }}>
        {view === 'dashboard' ? <DashboardView setView={setView} /> : view === 'studio' ? <StudioView /> : <PipelineView />}
      </main>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<Workspace />);
