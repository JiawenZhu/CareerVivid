import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ─── Neo-Brutalist Design Tokens ─────────────────────────────────────────────
const nb = {
  cream: '#FAFAF2',
  black: '#0A0A0A',
  yellow: '#F5E642',
  blue: '#1D4ED8',
  blueLight: '#DBEAFE',
  red: '#E11D48',
  redLight: '#FFE4E6',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  white: '#FFFFFF',
  gray: '#F3F4F6',
  borderW: 4,
};

const displayFont = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const bodyFont = '"Helvetica Neue", Arial, sans-serif';

// Core shadow utility
const shadow = (offset = 8): React.CSSProperties => ({
  boxShadow: `${offset}px ${offset}px 0px ${nb.black}`,
});

const border: React.CSSProperties = {
  border: `${nb.borderW}px solid ${nb.black}`,
};

// ─── Animated Background ──────────────────────────────────────────────────────
const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const hueShift = interpolate(frame, [0, durationInFrames], [0, 15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: nb.cream,
        // Subtle halftone-like grid lines for brutalist texture
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }}
    />
  );
};

// ─── Brutalist Card ───────────────────────────────────────────────────────────
const BCard: React.FC<
  React.PropsWithChildren<{
    bg?: string;
    style?: React.CSSProperties;
    shadowOffset?: number;
  }>
> = ({ children, bg = nb.white, style, shadowOffset = 8 }) => (
  <div
    style={{
      background: bg,
      ...border,
      ...shadow(shadowOffset),
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Tag Chip ─────────────────────────────────────────────────────────────────
const Tag: React.FC<{ label: string; bg?: string; color?: string }> = ({
  label,
  bg = nb.yellow,
  color = nb.black,
}) => (
  <div
    style={{
      background: bg,
      border: `3px solid ${nb.black}`,
      boxShadow: '4px 4px 0px #0A0A0A',
      padding: '8px 18px',
      fontFamily: displayFont,
      fontSize: 20,
      fontWeight: 900,
      color,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </div>
);

// ─── Thick Kicker Bar ─────────────────────────────────────────────────────────
const KickerBar: React.FC<{ label: string; bg?: string }> = ({
  label,
  bg = nb.yellow,
}) => (
  <div
    style={{
      display: 'inline-block',
      background: bg,
      ...border,
      padding: '10px 22px',
      fontFamily: displayFont,
      fontSize: 18,
      fontWeight: 900,
      color: nb.black,
      textTransform: 'uppercase',
      letterSpacing: 2,
    }}
  >
    {label}
  </div>
);

// ─── Personal Header Bar ──────────────────────────────────────────────────────
const HeaderBar: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 40,
      left: 52,
      right: 52,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    {/* Name block */}
    <BCard
      bg={nb.black}
      shadowOffset={0}
      style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 18 }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: nb.yellow,
          border: `3px solid ${nb.yellow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: displayFont,
          fontSize: 20,
          fontWeight: 900,
          color: nb.black,
        }}
      >
        JZ
      </div>
      <div>
        <div
          style={{
            fontFamily: displayFont,
            fontWeight: 900,
            fontSize: 26,
            color: nb.white,
            letterSpacing: 0.2,
          }}
        >
          Jiawen (Evan) Zhu
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 13,
            color: nb.yellow,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
          }}
        >
          Full-Stack Engineer · AI Builder
        </div>
      </div>
    </BCard>

    {/* Status pill */}
    <BCard
      bg={nb.green}
      shadowOffset={5}
      style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10 }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: nb.white,
          border: `2px solid ${nb.black}`,
        }}
      />
      <span
        style={{
          fontFamily: displayFont,
          fontSize: 18,
          fontWeight: 900,
          color: nb.white,
          textTransform: 'uppercase',
        }}
      >
        Open to Opportunities
      </span>
    </BCard>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 1 · Hero — 0-150 frames (0-5s)
// ════════════════════════════════════════════════════════════════════════════════
const HeroScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const pop = spring({ frame, fps: 30, config: { damping: 12, stiffness: 130 } });
  const slideIn = spring({ frame: frame - 8, fps: 30, config: { damping: 14, stiffness: 120 } });
  const cardPop = spring({ frame: frame - 16, fps: 30, config: { damping: 11, stiffness: 110 } });

  return (
    <AbsoluteFill style={{ padding: '140px 68px 72px' }}>
      <HeaderBar />
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center', flex: 1 }}>
        {/* Left — headline */}
        <div
          style={{
            transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
            opacity: pop,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <KickerBar label="Available Now · Champaign, IL" bg={nb.yellow} />
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 82,
              lineHeight: 0.95,
              letterSpacing: -2,
              color: nb.black,
              textTransform: 'uppercase',
            }}
          >
            Full-Stack
            <br />
            <span style={{ color: nb.blue }}>Engineer</span>
            <br />& AI Builder.
          </div>
          <div
            style={{
              fontFamily: bodyFont,
              fontSize: 26,
              lineHeight: 1.5,
              color: '#333',
              maxWidth: 600,
            }}
          >
            6+ years shipping scalable platforms. From zero to 500+ users. I build things that work.
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {['React', 'Firebase', 'Node.js', 'GCP', 'UI/UX'].map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>
        </div>

        {/* Right — stat grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            transform: `translateX(${interpolate(slideIn, [0, 1], [120, 0])}px) scale(${0.9 + cardPop * 0.1})`,
            opacity: cardPop,
          }}
        >
          {[
            { label: 'Years Exp', value: '6+', bg: nb.yellow },
            { label: 'Clients', value: '12', bg: nb.blueLight },
            { label: 'Efficiency↑', value: '30%', bg: nb.greenLight },
            { label: 'ATS Score', value: '98', bg: nb.purpleLight },
          ].map((stat) => (
            <BCard key={stat.label} bg={stat.bg} shadowOffset={10} style={{ padding: '30px 28px' }}>
              <div
                style={{
                  fontFamily: bodyFont,
                  fontSize: 15,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: nb.black,
                  marginBottom: 10,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 62,
                  fontWeight: 900,
                  color: nb.black,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
            </BCard>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 2 · Skills — 150-300 (5-10s)
// ════════════════════════════════════════════════════════════════════════════════
const SkillsScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const titleIn = spring({ frame, fps: 30, config: { damping: 14 } });

  const groups = [
    {
      label: 'Frontend & UI',
      bg: nb.yellow,
      items: ['React', 'Vite', 'Tailwind CSS', 'Figma', 'a11y', 'State Management'],
    },
    {
      label: 'Backend & Cloud',
      bg: nb.blueLight,
      items: ['Node.js', 'Firebase', 'GCP', 'Cloud Functions', 'Python', 'CI/CD'],
    },
    {
      label: 'Architecture',
      bg: nb.greenLight,
      items: ['Event-Driven Design', 'System Design', 'NoSQL · SQL', 'WebSockets', 'Novu API'],
    },
  ];

  return (
    <AbsoluteFill style={{ padding: '140px 68px 72px' }}>
      <HeaderBar />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, flex: 1 }}>
        {/* Title row */}
        <div
          style={{
            transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
            opacity: titleIn,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <KickerBar label="Tech Stack" bg={nb.blue} />
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 70,
              letterSpacing: -2,
              color: nb.black,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            Precise tools. Proven results.
          </div>
        </div>

        {/* Skill columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, flex: 1 }}>
          {groups.map((g, gi) => {
            const colIn = spring({ fps: 30, frame: frame - gi * 14, config: { damping: 13, stiffness: 115 } });
            return (
              <BCard
                key={g.label}
                bg={g.bg}
                shadowOffset={12}
                style={{
                  padding: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  transform: `translateY(${interpolate(colIn, [0, 1], [80, 0])}px)`,
                  opacity: colIn,
                }}
              >
                <div
                  style={{
                    fontFamily: displayFont,
                    fontWeight: 900,
                    fontSize: 28,
                    color: nb.black,
                    textTransform: 'uppercase',
                    borderBottom: `3px solid ${nb.black}`,
                    paddingBottom: 14,
                  }}
                >
                  {g.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {g.items.map((skill, si) => (
                    <div
                      key={skill}
                      style={{
                        fontFamily: bodyFont,
                        fontSize: 24,
                        fontWeight: si === 0 ? 800 : 600,
                        color: nb.black,
                        paddingLeft: 8,
                        borderLeft: si === 0 ? `5px solid ${nb.black}` : `2px solid rgba(0,0,0,0.25)`,
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </BCard>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 3 · Experience — 300-450 (10-15s)
// ════════════════════════════════════════════════════════════════════════════════
const ExperienceScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const titleIn = spring({ frame, fps: 30, config: { damping: 14 } });

  const roles = [
    {
      company: 'CareerVivid LLC',
      role: 'Founder & Web Experience Consultant',
      dates: '2025–Now',
      stat: '+25% engagement · 500+ users',
      bg: nb.yellow,
    },
    {
      company: 'Fantuan 饭团',
      role: 'Full-Stack Dev & Tech Consultant',
      dates: '2022–2024',
      stat: '12 clients · +30% efficiency · −35% bugs',
      bg: nb.blueLight,
    },
    {
      company: 'Human Kinetics',
      role: 'Web & Content Developer · Designer',
      dates: '2019–2021',
      stat: '+40% page speed · −25% publish time',
      bg: nb.greenLight,
    },
  ];

  return (
    <AbsoluteFill style={{ padding: '140px 68px 72px' }}>
      <HeaderBar />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, flex: 1 }}>
        {/* Title */}
        <div
          style={{
            transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
            opacity: titleIn,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <KickerBar label="Work History" bg={nb.red} />
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 70,
              letterSpacing: -2,
              color: nb.black,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            Impact at every company.
          </div>
        </div>

        {/* Role cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1, justifyContent: 'center' }}>
          {roles.map((role, ri) => {
            const roleIn = spring({ fps: 30, frame: frame - ri * 16, config: { damping: 13, stiffness: 120 } });
            return (
              <BCard
                key={role.company}
                bg={role.bg}
                shadowOffset={10}
                style={{
                  padding: '26px 32px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transform: `translateX(${interpolate(roleIn, [0, 1], [ri % 2 === 0 ? -100 : 100, 0])}px)`,
                  opacity: roleIn,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      fontFamily: displayFont,
                      fontWeight: 900,
                      fontSize: 34,
                      color: nb.black,
                      textTransform: 'uppercase',
                    }}
                  >
                    {role.role}
                  </div>
                  <div style={{ fontFamily: bodyFont, fontSize: 22, fontWeight: 700, color: '#333' }}>
                    {role.company}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <div
                    style={{
                      background: nb.black,
                      color: nb.white,
                      border: `3px solid ${nb.black}`,
                      padding: '6px 16px',
                      fontFamily: displayFont,
                      fontSize: 16,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                    }}
                  >
                    {role.dates}
                  </div>
                  <div
                    style={{
                      fontFamily: bodyFont,
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#222',
                      textAlign: 'right',
                    }}
                  >
                    {role.stat}
                  </div>
                </div>
              </BCard>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// SCENE 4 · CTA — 450-600 (15-20s)
// ════════════════════════════════════════════════════════════════════════════════
const CtaScene: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const intro = spring({ frame, fps: 30, config: { damping: 12, stiffness: 120 } });
  // blinking effect for urgency
  const blink = 0.5 + 0.5 * Math.abs(Math.sin((frame / 18) * Math.PI));

  return (
    <AbsoluteFill style={{ padding: '140px 68px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <HeaderBar />

      {/* Main CTA block */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          transform: `scale(${interpolate(intro, [0, 1], [0.88, 1])}) translateY(${interpolate(intro, [0, 1], [50, 0])}px)`,
          opacity: intro,
        }}
      >
        {/* Big bold headline */}
        <BCard
          bg={nb.yellow}
          shadowOffset={16}
          style={{ padding: '36px 72px', textAlign: 'center' }}
        >
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 108,
              color: nb.black,
              textTransform: 'uppercase',
              lineHeight: 0.92,
              letterSpacing: -3,
            }}
          >
            Let's Connect.
          </div>
        </BCard>

        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 32,
            fontWeight: 600,
            color: nb.black,
            textAlign: 'center',
            maxWidth: 1000,
            lineHeight: 1.45,
          }}
        >
          I'm actively looking for my next opportunity where I can build great products,
          work with driven teams, and make a real impact.
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Full-Stack Engineer', 'AI Platform Builder', 'React · Firebase · GCP', 'B.S. Computer Science — SFSU'].map(
            (tag, i) => (
              <Tag
                key={tag}
                label={tag}
                bg={i === 0 ? nb.blue : i === 1 ? nb.yellow : i === 2 ? nb.greenLight : nb.purpleLight}
                color={i === 0 ? nb.white : nb.black}
              />
            )
          )}
        </div>
      </div>

      {/* Bottom contact bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: intro,
        }}
      >
        <BCard bg={nb.black} shadowOffset={8} style={{ padding: '18px 32px' }}>
          <div
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 28,
              color: nb.yellow,
              textTransform: 'uppercase',
            }}
          >
            zhujiawen519@gmail.com
          </div>
        </BCard>

        <BCard
          bg={nb.green}
          shadowOffset={8}
          style={{
            padding: '18px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: blink,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: nb.white,
              border: `3px solid ${nb.black}`,
            }}
          />
          <span
            style={{
              fontFamily: displayFont,
              fontWeight: 900,
              fontSize: 26,
              color: nb.white,
              textTransform: 'uppercase',
            }}
          >
            DM Me on LinkedIn
          </span>
        </BCard>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// ROOT — 20 seconds @ 30fps = 600 frames
// ════════════════════════════════════════════════════════════════════════════════
export const JiawenNeoBrutal: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <AnimatedBackground />

      <Sequence from={0} durationInFrames={150}>
        <HeroScene frame={frame} duration={150} />
      </Sequence>

      <Sequence from={150} durationInFrames={150}>
        <SkillsScene frame={frame - 150} duration={150} />
      </Sequence>

      <Sequence from={300} durationInFrames={150}>
        <ExperienceScene frame={frame - 300} duration={150} />
      </Sequence>

      <Sequence from={450} durationInFrames={150}>
        <CtaScene frame={frame - 450} duration={150} />
      </Sequence>
    </AbsoluteFill>
  );
};
