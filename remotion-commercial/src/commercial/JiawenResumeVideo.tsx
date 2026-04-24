import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ─── Design System (aligned with site aesthetic) ─────────────────────────────
const pal = {
  bg: '#06090F',
  bgSoft: '#0D1421',
  panel: 'rgba(10, 18, 32, 0.85)',
  border: 'rgba(100, 140, 255, 0.18)',
  borderActive: 'rgba(100, 140, 255, 0.45)',
  text: '#F0F4FF',
  textMuted: '#7A8FBB',
  blue: '#5B9BFF',
  blueSoft: '#93BFFF',
  indigo: '#818CF8',
  teal: '#34D399',
  gold: '#FBBF24',
};

const displayFont = '"Manrope", "Avenir Next", "Helvetica Neue", sans-serif';
const bodyFont = '"Noto Sans", "Segoe UI", sans-serif';

const cardBase: React.CSSProperties = {
  border: `1px solid ${pal.border}`,
  background: 'linear-gradient(160deg, rgba(15,26,50,0.92) 0%, rgba(8,14,28,0.90) 100%)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.38)',
  backdropFilter: 'blur(22px)',
};

// ─── Animated Background ──────────────────────────────────────────────────────
const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const sweep = interpolate(frame, [0, durationInFrames], [-160, 160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at 12% 25%, rgba(91,155,255,0.13), transparent 35%),
          radial-gradient(circle at 85% 20%, rgba(129,140,248,0.12), transparent 30%),
          radial-gradient(circle at 50% 80%, rgba(52,211,153,0.07), transparent 32%),
          linear-gradient(135deg, ${pal.bg} 0%, #080E1E 55%, #0B1328 100%)
        `,
      }}
    >
      {/* sweeping glow */}
      <div
        style={{
          position: 'absolute',
          inset: -200,
          background:
            'conic-gradient(from 200deg, rgba(91,155,255,0.06), rgba(129,140,248,0.04), rgba(52,211,153,0.04), rgba(91,155,255,0.06))',
          filter: 'blur(80px)',
          transform: `translateX(${sweep}px) rotate(${interpolate(frame, [0, durationInFrames], [0, 14])}deg)`,
        }}
      />
      {/* floating particles */}
      {new Array(24).fill(true).map((_, i) => {
        const x = ((i * 283) % width) + 18;
        const y = ((i * 139) % height) + 18;
        const size = 2 + (i % 3);
        const drift = interpolate(frame, [0, durationInFrames], [0, -60 - i * 1.4]);
        const opacity = 0.1 + (i % 5) * 0.025;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y + drift,
              width: size,
              height: size,
              borderRadius: '50%',
              background: i % 3 === 0 ? pal.blue : i % 3 === 1 ? pal.indigo : pal.teal,
              opacity,
              boxShadow: `0 0 ${size * 7}px ${i % 3 === 0 ? 'rgba(91,155,255,0.5)' : 'rgba(129,140,248,0.4)'}`,
            }}
          />
        );
      })}
      {/* subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.18) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Reusable Pill ────────────────────────────────────────────────────────────
const Kicker: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      ...cardBase,
      display: 'inline-flex',
      borderRadius: 999,
      padding: '11px 18px',
      color: pal.blue,
      fontFamily: bodyFont,
      textTransform: 'uppercase',
      letterSpacing: 2.4,
      fontWeight: 700,
      fontSize: 15,
    }}
  >
    {label}
  </div>
);

// ─── MetricPill ───────────────────────────────────────────────────────────────
const MetricPill: React.FC<{ label: string; value: string; tone?: 'blue' | 'teal' | 'gold' }> = ({
  label,
  value,
  tone = 'blue',
}) => {
  const color = tone === 'teal' ? pal.teal : tone === 'gold' ? pal.gold : pal.blue;
  return (
    <div style={{ ...cardBase, borderRadius: 22, padding: '18px 22px', minWidth: 160 }}>
      <div
        style={{
          fontFamily: bodyFont,
          textTransform: 'uppercase',
          letterSpacing: 1.8,
          fontSize: 12,
          color: pal.textMuted,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: displayFont,
          fontSize: 36,
          fontWeight: 800,
          color,
          letterSpacing: -1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
};

// ─── Window Shell ─────────────────────────────────────────────────────────────
const WindowShell: React.FC<
  React.PropsWithChildren<{ title: string; width: number; height: number; style?: React.CSSProperties }>
> = ({ title, width, height, style, children }) => (
  <div style={{ ...cardBase, width, height, borderRadius: 32, overflow: 'hidden', ...style }}>
    <div
      style={{
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        borderBottom: `1px solid ${pal.border}`,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#FF6B6B', '#FBBF24', '#34D399'].map((c) => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 16,
          fontWeight: 700,
          color: pal.text,
          letterSpacing: 0.1,
        }}
      >
        {title}
      </div>
      <div style={{ width: 52 }} />
    </div>
    <div style={{ padding: 22, height: height - 62 }}>{children}</div>
  </div>
);

// ─── Personal Bar (replaces BrandBar for personal use) ────────────────────────
const PersonalBar: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 44,
      left: 52,
      right: 52,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* avatar circle */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #5B9BFF 0%, #818CF8 100%)',
          border: `2px solid ${pal.borderActive}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: displayFont,
          fontWeight: 800,
          fontSize: 22,
          color: '#fff',
          boxShadow: '0 0 24px rgba(91,155,255,0.3)',
        }}
      >
        JZ
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: -0.6,
            color: pal.text,
          }}
        >
          Jiawen (Evan) Zhu
        </span>
        <span
          style={{
            fontFamily: bodyFont,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: 2.4,
            color: pal.textMuted,
          }}
        >
          Full-Stack Engineer · UI/UX · AI Platform Builder
        </span>
      </div>
    </div>
    <div
      style={{
        ...cardBase,
        borderRadius: 999,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: pal.teal,
          boxShadow: '0 0 14px rgba(52,211,153,0.85)',
        }}
      />
      <span
        style={{
          fontFamily: bodyFont,
          color: pal.text,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        Open to Opportunities
      </span>
    </div>
  </div>
);

// ─── SceneText (same pattern as commercial) ───────────────────────────────────
type SceneTextProps = {
  kicker: string;
  title: string;
  body: string;
  frame: number;
  duration: number;
  maxWidth?: number;
};
const SceneText: React.FC<SceneTextProps> = ({ kicker, title, body, frame, duration, maxWidth = 700 }) => {
  const intro = spring({ frame, fps: 30, config: { damping: 18, stiffness: 140, mass: 0.8 } });
  const outStart = duration - 22;
  const outro = frame > outStart ? interpolate(frame, [outStart, duration], [1, 0]) : 1;
  const translateY = interpolate(intro * outro, [0, 1], [44, 0]);
  const opacity = Math.max(0, Math.min(1, intro * outro));

  return (
    <div
      style={{
        width: maxWidth,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <Kicker label={kicker} />
      <div
        style={{
          fontFamily: displayFont,
          fontWeight: 800,
          fontSize: 72,
          lineHeight: 1.02,
          letterSpacing: -2.2,
          color: pal.text,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 27,
          lineHeight: 1.5,
          letterSpacing: -0.2,
          color: pal.textMuted,
        }}
      >
        {body}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 1 · Hero — who is Evan and what does he do? (frames 0-150)
// ════════════════════════════════════════════════════════════════════════════════
const HeroScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const cardIn = spring({ frame, fps: 30, config: { damping: 16, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ padding: '148px 68px 72px' }}>
      <PersonalBar />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.08fr 0.92fr',
          gap: 40,
          alignItems: 'center',
          flex: 1,
        }}
      >
        <SceneText
          kicker="Available Now · Champaign, IL"
          title="Engineer who builds AI platforms people actually use."
          body="6+ years shipping full-stack products. From Firebase architecture to React UI systems — always focused on impact, not just code."
          frame={frame}
          duration={duration}
          maxWidth={720}
        />

        {/* right side: stat cards */}
        <div
          style={{
            display: 'grid',
            gap: 18,
            transform: `translateY(${interpolate(cardIn, [0, 1], [60, 0])}px)`,
            opacity: cardIn,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <MetricPill label="Years Experience" value="6+" tone="blue" />
            <MetricPill label="Enterprise Clients" value="12" tone="teal" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <MetricPill label="Efficiency Gained" value="+30%" tone="gold" />
            <MetricPill label="ATS Score" value="98/100" tone="blue" />
          </div>
          <div
            style={{
              ...cardBase,
              borderRadius: 24,
              padding: 24,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ fontFamily: bodyFont, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: pal.textMuted }}>
              Currently Building
            </div>
            <div style={{ fontFamily: displayFont, fontSize: 32, fontWeight: 800, color: pal.text }}>
              CareerVivid · AI Career Platform
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 20, lineHeight: 1.45, color: pal.textMuted }}>
              Scaling from 0 → 500+ active users. Firebase, React, GCP. Full ownership.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 2 · Skills — Tech Stack showcase (frames 150-300)
// ════════════════════════════════════════════════════════════════════════════════
const SkillsScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const stacks = [
    { group: 'Frontend', items: ['React', 'Vite', 'Tailwind CSS', 'Figma', 'a11y / UI Systems'] },
    { group: 'Backend & Cloud', items: ['Node.js', 'Firebase / GCP', 'Cloud Functions', 'Python', 'CI/CD'] },
    { group: 'Architecture', items: ['Event-Driven Design', 'NoSQL / SQL', 'Notification APIs', 'WebSockets', 'System Design'] },
  ];

  return (
    <AbsoluteFill style={{ padding: '148px 68px 72px' }}>
      <PersonalBar />
      <div style={{ display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: 44, alignItems: 'center', flex: 1 }}>
        <SceneText
          kicker="Tech Stack"
          title="Precise tools. Proven results."
          body="End-to-end capability across frontend, backend, and cloud — with a design sensibility to match."
          frame={frame}
          duration={duration}
          maxWidth={580}
        />

        <div style={{ display: 'grid', gap: 18 }}>
          {stacks.map((stack, groupIdx) => {
            const groupIn = spring({
              fps: 30,
              frame: frame - groupIdx * 12,
              config: { damping: 17, stiffness: 130 },
            });
            return (
              <WindowShell key={stack.group} title={stack.group} width={860} height={165}
                style={{
                  transform: `translateX(${interpolate(groupIn, [0, 1], [80, 0])}px)`,
                  opacity: groupIn,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 6 }}>
                  {stack.items.map((skill, skillIdx) => (
                    <div
                      key={skill}
                      style={{
                        background: skillIdx === 0 ? 'rgba(91,155,255,0.14)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${skillIdx === 0 ? pal.borderActive : pal.border}`,
                        color: skillIdx === 0 ? pal.blueSoft : pal.text,
                        borderRadius: 14,
                        padding: '8px 16px',
                        fontFamily: displayFont,
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </WindowShell>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 3 · Experience — impact numbers (frames 300-450)
// ════════════════════════════════════════════════════════════════════════════════
const ExperienceScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const roles = [
    {
      company: 'CareerVivid LLC',
      role: 'Founder & Web Experience Consultant',
      dates: 'Sep 2025 – Present',
      highlight: 'Built scalable AI platform on Firebase. 25% user engagement lift across 500+ users.',
      tone: 'blue' as const,
    },
    {
      company: 'Fantuan 饭团',
      role: 'Full-Stack Developer & Tech Consultant',
      dates: 'Sep 2022 – Feb 2024',
      highlight: '12 enterprise clients. 30% operational efficiency gain. 35% fewer UI bugs.',
      tone: 'teal' as const,
    },
    {
      company: 'Human Kinetics',
      role: 'Web & Content Developer · Graphic Designer',
      dates: 'Jan 2019 – May 2021',
      highlight: '40% faster page loads. 15% faster project delivery through better QA workflows.',
      tone: 'gold' as const,
    },
  ];

  const accentFor = (tone: 'blue' | 'teal' | 'gold') =>
    tone === 'teal' ? pal.teal : tone === 'gold' ? pal.gold : pal.blue;

  return (
    <AbsoluteFill style={{ padding: '148px 68px 72px' }}>
      <PersonalBar />
      <div style={{ display: 'grid', gridTemplateColumns: '1.04fr 0.96fr', gap: 44, alignItems: 'center', flex: 1 }}>
        <div style={{ display: 'grid', gap: 22 }}>
          {roles.map((role, index) => {
            const roleIn = spring({ fps: 30, frame: frame - index * 14, config: { damping: 17, stiffness: 125 } });
            return (
              <div
                key={role.company}
                style={{
                  ...cardBase,
                  borderRadius: 28,
                  padding: 26,
                  display: 'grid',
                  gap: 10,
                  transform: `translateX(${interpolate(roleIn, [0, 1], [-70, 0])}px)`,
                  opacity: roleIn,
                  borderLeft: `3px solid ${accentFor(role.tone)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: displayFont, fontWeight: 800, fontSize: 30, color: pal.text }}>
                      {role.role}
                    </div>
                    <div style={{ fontFamily: bodyFont, fontSize: 18, color: accentFor(role.tone), marginTop: 4 }}>
                      {role.company}
                    </div>
                  </div>
                  <div
                    style={{
                      ...cardBase,
                      borderRadius: 999,
                      padding: '8px 14px',
                      fontFamily: bodyFont,
                      fontSize: 13,
                      color: pal.textMuted,
                      letterSpacing: 0.3,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {role.dates}
                  </div>
                </div>
                <div style={{ fontFamily: bodyFont, fontSize: 22, lineHeight: 1.45, color: pal.textMuted }}>
                  {role.highlight}
                </div>
              </div>
            );
          })}
        </div>

        <SceneText
          kicker="Experience"
          title="Impact across every team I've joined."
          body="From early-stage startup to enterprise-grade client work — with a track record in delivery, quality, and scale."
          frame={frame}
          duration={duration}
          maxWidth={600}
        />
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 4 · CTA — Let's connect (frames 450-600)
// ════════════════════════════════════════════════════════════════════════════════
const CtaScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const intro = spring({ frame, fps: 30, config: { damping: 18, stiffness: 120 } });
  const pulseOpacity = 0.6 + 0.4 * Math.sin((frame / 15) * Math.PI);

  const tags = ['Full-Stack Engineer', 'AI Platform Builder', 'React / Firebase / GCP', 'Open to Relocation'];

  return (
    <AbsoluteFill style={{ padding: '140px 90px 80px', justifyContent: 'space-between', alignItems: 'center' }}>
      <PersonalBar />
      <div
        style={{
          width: 1300,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          alignItems: 'center',
          textAlign: 'center',
          transform: `translateY(${interpolate(intro, [0, 1], [48, 0])}px)`,
          opacity: intro,
        }}
      >
        <Kicker label="Let's Work Together" />
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 90,
            lineHeight: 0.96,
            letterSpacing: -3.2,
            fontWeight: 800,
            color: pal.text,
          }}
        >
          Build the resume.{'\n'}Master the interview.{'\n'}Land the role.
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 30,
            lineHeight: 1.45,
            color: pal.textMuted,
            maxWidth: 940,
          }}
        >
          BS in Computer Science · San Francisco State University.<br />
          6+ years shipping real products. Ready to bring that energy to your team.
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {tags.map((tag, i) => (
            <div
              key={tag}
              style={{
                ...cardBase,
                borderRadius: 999,
                padding: '14px 20px',
                fontFamily: bodyFont,
                fontSize: 20,
                color: i === 0 ? pal.blueSoft : pal.text,
                borderColor: i === 1 ? pal.borderActive : pal.border,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>

      {/* bottom bar */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div
          style={{
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: 32,
            color: pal.text,
            letterSpacing: -0.5,
          }}
        >
          zhujiawen519@gmail.com
        </div>
        <div
          style={{
            ...cardBase,
            borderRadius: 999,
            padding: '18px 26px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: pal.teal,
              boxShadow: `0 0 16px rgba(52,211,153,${pulseOpacity})`,
            }}
          />
          <span style={{ fontFamily: bodyFont, fontSize: 21, color: pal.text, fontWeight: 700 }}>
            linkedin.com/in/jiawenzhu
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// ROOT COMPOSITION — 20 seconds / 600 frames @ 30fps
// ════════════════════════════════════════════════════════════════════════════════
export const JiawenResumeVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ width: '100%', height: '100%' }}>
      <AnimatedBackground />

      {/* Scene 1 · Hero — 0-150 */}
      <Sequence from={0} durationInFrames={150}>
        <HeroScene frame={frame} duration={150} />
      </Sequence>

      {/* Scene 2 · Skills — 150-300 */}
      <Sequence from={150} durationInFrames={150}>
        <SkillsScene frame={frame - 150} duration={150} />
      </Sequence>

      {/* Scene 3 · Experience — 300-450 */}
      <Sequence from={300} durationInFrames={150}>
        <ExperienceScene frame={frame - 300} duration={150} />
      </Sequence>

      {/* Scene 4 · CTA — 450-600 */}
      <Sequence from={450} durationInFrames={150}>
        <CtaScene frame={frame - 450} duration={150} />
      </Sequence>

      {/* vignette overlay */}
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 220px rgba(0,0,0,0.20)' }} />
    </AbsoluteFill>
  );
};
