const P = '#625bd5', PH = '#514ac5', PTINT = '#f3f2ff', PRING = '#dfdcff';
const WARM = { border: '#eadbc5', borderStrong: '#e4d3bc', ink: '#211b16', muted: '#665a4a', eyebrow: '#a97935', surface: '#fffaf1', panel: 'rgba(249,239,224,0.8)' };
const lpFont = 'var(--cv-font-body)';

function Ic({ name, size = 16, sw = 2, style }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}
    dangerouslySetInnerHTML={{ __html: window.CV_LUCIDE[name] || '' }} />;
}

function Header() {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(247,241,231,0.92)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${WARM.borderStrong}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', padding: '12px 24px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src="../../assets/logo/careervivid-icon-128.png" alt="" style={{ width: 30, height: 30 }} />
          <span style={{ fontFamily: 'var(--cv-font-heading)', fontSize: 17, fontWeight: 700, color: WARM.ink }}>CareerVivid</span>
        </span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 13, fontWeight: 600, color: WARM.muted }}>
          <span>Resume</span><span>Job Tracker</span><span>Interviews</span><span>Extension</span><span>Pricing</span>
        </nav>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: WARM.ink }}>Sign in</span>
          <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: P, color: '#fff', fontFamily: lpFont, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 18px rgba(98,91,213,0.18)' }}>
            Start for free
          </button>
        </span>
      </div>
    </header>
  );
}

function MiniResumePreview() {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${WARM.border}`, background: 'rgba(255,255,255,0.9)', boxShadow: '0 24px 60px rgba(139,90,22,0.1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${WARM.border}` }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: WARM.eyebrow }}>My resumes</p>
          <p style={{ margin: '1px 0 0', fontSize: 15, fontWeight: 700, color: WARM.ink, fontFamily: 'var(--cv-font-heading)' }}>Resume workspace</p>
        </div>
        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 8, border: 'none', background: P, color: '#fff', fontFamily: lpFont, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 18px rgba(98,91,213,0.15)' }}>
          <Ic name="file-text" size={14} /> New resume
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 0 }}>
        <div style={{ padding: 14 }}>
          <div style={{ borderRadius: 10, border: `1px solid ${WARM.border}`, background: WARM.surface, padding: 12 }}>
            <div style={{ borderBottom: `1px solid ${WARM.border}`, paddingBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: WARM.ink }}>Jiawen Zhu</p>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: WARM.muted }}>Frontend Engineer</p>
            </div>
            {[['Profile', 'Product-minded engineer with 6 years shipping web apps at scale.'], ['Experience', 'Senior Engineer · Acme — led the design-system migration.'], ['Education', 'B.S. Computer Science, UCSD']].map(([label, copy]) => (
              <div key={label} style={{ marginTop: 9 }}>
                <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: WARM.eyebrow }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, lineHeight: 1.5, color: WARM.muted }}>{copy}</p>
              </div>
            ))}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {['HTML', 'CSS', 'JavaScript', 'React'].map((s) => (
                <span key={s} style={{ borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, background: '#f7fff8', color: '#137245' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
        <aside style={{ borderLeft: `1px solid ${WARM.border}`, background: WARM.panel, padding: 14 }}>
          <div style={{ borderRadius: 10, border: `1px solid ${WARM.border}`, background: 'rgba(255,255,255,0.9)', padding: 12 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: WARM.eyebrow }}>Create</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: WARM.ink }}>Paste your resume to start</p>
            <div style={{ marginTop: 9, borderRadius: 8, border: '1px dashed #d8c6ad', background: WARM.surface, padding: 10, fontSize: 10.5, fontWeight: 600, lineHeight: 1.6, color: '#8a7865' }}>
              Paste resume text, a LinkedIn export, or a job posting…
            </div>
            <button type="button" style={{ display: 'inline-flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, marginTop: 10, borderRadius: 8, border: 'none', background: P, color: '#fff', fontFamily: lpFont, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxSizing: 'border-box' }}>
              <Ic name="wand-2" size={14} /> Tailor to a job
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="cv-warm-grid" style={{ padding: '56px 24px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: 48, alignItems: 'center' }}>
        <div>
          <p className="cv-warm-eyebrow" style={{ margin: 0 }}>Job search workspace</p>
          <h1 style={{ margin: '14px 0 0', fontSize: 44, fontWeight: 700, lineHeight: 1.12, letterSpacing: 0, color: WARM.ink }}>
            Everything you need to land your next job — in one place.
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: 16, fontWeight: 500, lineHeight: 1.75, color: WARM.muted, maxWidth: 440 }}>
            Build standout resumes, track applications, prep for interviews, and autofill job forms in seconds. Your next job starts here.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: P, color: '#fff', fontFamily: lpFont, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 24px rgba(98,91,213,0.2)' }}>
              Start for free <Ic name="arrow-right" size={16} />
            </button>
            <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px', borderRadius: 12, background: '#fff', color: WARM.ink, border: `1px solid ${WARM.borderStrong}`, fontFamily: lpFont, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Ic name="app-window" size={16} /> Get the extension
            </button>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 26 }}>
            {[['Direct apply links', 'check-circle-2'], ['ATS-ready resumes', 'check-circle-2'], ['Chrome extension', 'check-circle-2']].map(([label, icon]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: WARM.muted }}>
                <Ic name={icon} size={14} style={{ color: '#15803d' }} />{label}
              </span>
            ))}
          </div>
        </div>
        <MiniResumePreview />
      </div>
    </section>
  );
}

function ProductIndex() {
  const products = [
    { icon: 'file-text', title: 'AI Resume Builder', desc: 'ATS-optimized resumes with smart templates and one-click PDF export.' },
    { icon: 'kanban-square', title: 'Job Tracker', desc: 'A Kanban pipeline from Applied to Offer, with notes and follow-ups.' },
    { icon: 'mic', title: 'Interview Studio', desc: 'Real-time AI voice coach with 1,200+ verified company guides.' },
    { icon: 'globe', title: 'Portfolio Builder', desc: 'Turn your resume into a personal site with a shareable link.' },
    { icon: 'app-window', title: 'Chrome Extension', desc: 'Save roles, analyze fit, and autofill applications where you apply.' },
    { icon: 'pen-line', title: 'AI Whiteboard', desc: 'Describe a system in plain English — get a diagram on your canvas.' },
  ];
  return (
    <section style={{ padding: '48px 24px', borderTop: `1px solid ${WARM.borderStrong}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p className="cv-warm-eyebrow" style={{ margin: 0 }}>The workspace</p>
        <h2 style={{ margin: '10px 0 0', fontSize: 28, fontWeight: 650, color: WARM.ink }}>Designed around the moments job seekers repeat.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24 }}>
          {products.map((pr) => (
            <div key={pr.title} className="cv-warm-card" style={{ padding: 18 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: PTINT, color: P }}>
                <Ic name={pr.icon} size={18} />
              </span>
              <h3 style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 700, color: WARM.ink, fontFamily: lpFont }}>{pr.title}</h3>
              <p style={{ margin: '5px 0 0', fontSize: 13, fontWeight: 500, lineHeight: 1.65, color: WARM.muted }}>{pr.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ padding: '52px 24px 64px', borderTop: `1px solid ${WARM.borderStrong}` }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 30, fontWeight: 650, color: WARM.ink }}>Create one workspace for the whole search.</h2>
        <p style={{ margin: '12px 0 0', fontSize: 14, fontWeight: 500, lineHeight: 1.8, color: WARM.muted }}>Start free, then choose the AI help that matches your search.</p>
        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, marginTop: 20, padding: '0 22px', borderRadius: 12, border: 'none', background: P, color: '#fff', fontFamily: lpFont, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 24px rgba(98,91,213,0.2)' }}>
          Start for free <Ic name="arrow-right" size={16} />
        </button>
      </div>
      <footer style={{ maxWidth: 1200, margin: '48px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: `1px solid ${WARM.borderStrong}`, fontSize: 12, fontWeight: 600, color: WARM.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src="../../assets/logo/careervivid-icon-128.png" alt="" style={{ width: 20, height: 20 }} /> © 2026 CareerVivid
        </span>
        <span style={{ display: 'flex', gap: 18 }}><span>Privacy</span><span>Terms</span><span>Contact</span><span>Blog</span></span>
      </footer>
    </section>
  );
}

function Landing() {
  return (
    <div className="cv-warm-page" style={{ fontFamily: lpFont }} data-screen-label="landing">
      <Header />
      <Hero />
      <ProductIndex />
      <FinalCTA />
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<Landing />);
