import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const palette = {
  bg: '#08110B',
  bgSoft: '#122117',
  panel: 'rgba(13, 24, 16, 0.82)',
  panelStrong: '#112116',
  border: 'rgba(155, 191, 143, 0.22)',
  text: '#F5FBF1',
  textMuted: '#9FC39C',
  lime: '#49E619',
  limeSoft: '#86F968',
  blue: '#87D9FF',
  gold: '#F7D267',
  red: '#FF8F8F',
};

const displayFont = '"Manrope", "Avenir Next", "Helvetica Neue", sans-serif';
const bodyFont = '"Noto Sans", "Segoe UI", sans-serif';

const scenes = [
  {
    kicker: 'AI Career Platform',
    title: 'Your career journey, managed in one intelligent workspace.',
    body:
      'CareerVivid unifies AI resume building, whiteboard diagramming, interview coaching, and a job marketplace into a single platform.',
  },
  {
    kicker: 'AI Resume Builder',
    title: 'Generate ATS-ready proof in minutes.',
    body:
      'Smart templates, AI bullet rewriting, real-time preview, and instant PDF exports without fighting formatting.',
  },
  {
    kicker: 'Interview Studio',
    title: 'Practice with a real-time voice coach.',
    body:
      'Role-based mock interviews that adapt to you, providing instant feedback on pacing and delivery before the real call.',
  },
  {
    kicker: 'Portfolio & Tracking',
    title: 'Show your work and track every opportunity.',
    body:
      'Publish a personal website from your resume, manage applications on a Kanban board, and maintain your momentum.',
  },
  {
    kicker: 'AI Whiteboard',
    title: 'Collaborative architecture and flowcharts.',
    body:
      'Design system diagrams instantly—just describe your flowchart in plain English and watch the AI build it.',
  },
  {
    kicker: 'CareerVivid',
    title: 'Build the resume. Master the whiteboard. Land the job.',
    body:
      'One product for the full job-search loop, designed to help serious candidates move faster and stand out.',
  },
] as const;

type SceneTextProps = {
  kicker: string;
  title: string;
  body: string;
  frame: number;
  duration: number;
  align?: 'left' | 'center';
  maxWidth?: number;
};

const fullSize: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

const cardBase: React.CSSProperties = {
  border: `1px solid ${palette.border}`,
  background: 'linear-gradient(180deg, rgba(22,36,25,0.92) 0%, rgba(12,22,15,0.88) 100%)',
  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.28)',
  backdropFilter: 'blur(18px)',
};

const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();
  const sweep = interpolate(frame, [0, durationInFrames], [-180, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 15% 20%, rgba(73, 230, 25, 0.14), transparent 32%),
          radial-gradient(circle at 82% 22%, rgba(135, 217, 255, 0.16), transparent 28%),
          radial-gradient(circle at 55% 78%, rgba(73, 230, 25, 0.08), transparent 30%),
          linear-gradient(135deg, ${palette.bg} 0%, #0E1912 55%, #122418 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -220,
          background:
            'conic-gradient(from 210deg, rgba(73,230,25,0.06), rgba(135,217,255,0.04), rgba(247,210,103,0.05), rgba(73,230,25,0.06))',
          filter: 'blur(70px)',
          transform: `translateX(${sweep}px) rotate(${interpolate(frame, [0, durationInFrames], [0, 16])}deg)`,
        }}
      />
      {new Array(28).fill(true).map((_, index) => {
        const x = ((index * 241) % width) + 20;
        const y = ((index * 127) % height) + 20;
        const size = 2 + (index % 4);
        const drift = interpolate(frame, [0, durationInFrames], [0, -70 - index * 1.2]);
        const opacity = 0.12 + (index % 5) * 0.03;

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: x,
              top: y + drift,
              width: size,
              height: size,
              borderRadius: '50%',
              background: index % 3 === 0 ? palette.limeSoft : palette.blue,
              opacity,
              boxShadow: `0 0 ${size * 8}px ${index % 3 === 0 ? 'rgba(73,230,25,0.45)' : 'rgba(135,217,255,0.35)'}`,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.16) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const BrandBar: React.FC = () => {
  return (
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Img
          src={staticFile('/brand/icon128.png')}
          style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            boxShadow: '0 18px 30px rgba(0, 0, 0, 0.28)',
          }}
        />
        <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
          <span
            style={{
              fontFamily: displayFont,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: -0.8,
              color: palette.text,
            }}
          >
            CareerVivid
          </span>
          <span
            style={{
              fontFamily: bodyFont,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: 2.6,
              color: palette.textMuted,
            }}
          >
            AI Career Workflow
          </span>
        </div>
      </div>
      <div
        style={{
          ...cardBase,
          borderRadius: 999,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: palette.lime,
            boxShadow: '0 0 18px rgba(73, 230, 25, 0.8)',
          }}
        />
        <span
          style={{
            fontFamily: bodyFont,
            color: palette.text,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          Commercial v1
        </span>
      </div>
    </div>
  );
};

const SceneText: React.FC<SceneTextProps> = ({
  kicker,
  title,
  body,
  frame,
  duration,
  align = 'left',
  maxWidth = 720,
}) => {
  const intro = spring({
    frame,
    fps: 30,
    config: {
      damping: 18,
      stiffness: 140,
      mass: 0.8,
    },
  });
  const outStart = duration - 24;
  const outro = frame > outStart ? interpolate(frame, [outStart, duration], [1, 0]) : 1;
  const translateY = interpolate(intro * outro, [0, 1], [42, 0]);
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
        textAlign: align,
      }}
    >
      <div
        style={{
          alignSelf: align === 'center' ? 'center' : 'flex-start',
          ...cardBase,
          borderRadius: 999,
          padding: '12px 18px',
          color: palette.lime,
          fontFamily: bodyFont,
          textTransform: 'uppercase',
          letterSpacing: 2.2,
          fontWeight: 800,
          fontSize: 16,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: displayFont,
          fontWeight: 800,
          fontSize: 74,
          lineHeight: 1,
          letterSpacing: -2.4,
          color: palette.text,
          textWrap: 'balance',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 28,
          lineHeight: 1.45,
          letterSpacing: -0.3,
          color: palette.textMuted,
          textWrap: 'pretty',
        }}
      >
        {body}
      </div>
    </div>
  );
};

const WindowShell: React.FC<
  React.PropsWithChildren<{
    title: string;
    width: number;
    height: number;
    style?: React.CSSProperties;
  }>
> = ({title, width, height, style, children}) => {
  return (
    <div
      style={{
        ...cardBase,
        width,
        height,
        borderRadius: 34,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: `1px solid ${palette.border}`,
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          {['#FF6B6B', '#F7D267', '#49E619'].map((color) => (
            <div
              key={color}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 18,
            fontWeight: 700,
            color: palette.text,
          }}
        >
          {title}
        </div>
        <div style={{width: 56}} />
      </div>
      <div style={{padding: 24, height: height - 68}}>{children}</div>
    </div>
  );
};

const MetricPill: React.FC<{
  label: string;
  value: string;
  tone?: 'lime' | 'blue' | 'gold';
}> = ({label, value, tone = 'lime'}) => {
  const color = tone === 'blue' ? palette.blue : tone === 'gold' ? palette.gold : palette.lime;
  return (
    <div
      style={{
        ...cardBase,
        borderRadius: 22,
        padding: '18px 20px',
        minWidth: 170,
      }}
    >
      <div
        style={{
          fontFamily: bodyFont,
          textTransform: 'uppercase',
          letterSpacing: 1.8,
          fontSize: 13,
          color: palette.textMuted,
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: displayFont,
          fontSize: 34,
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

const TypingBar: React.FC<{frame: number}> = ({frame}) => {
  const width = interpolate(frame, [0, 45], [0, 100], {
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        height: 18,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, rgba(73,230,25,0.8), rgba(135,217,255,0.8))',
          boxShadow: '0 0 24px rgba(73,230,25,0.35)',
        }}
      />
    </div>
  );
};

const HeroScene: React.FC<{frame: number; duration: number}> = ({frame, duration}) => {
  const cardScale = spring({
    frame,
    fps: 30,
    config: {damping: 16, stiffness: 120},
  });
  const bannerFloat = interpolate(frame, [0, duration], [18, -12]);

  return (
    <AbsoluteFill style={{padding: '148px 68px 72px'}}>
      <BrandBar />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 38,
          alignItems: 'center',
          flex: 1,
        }}
      >
        <SceneText {...scenes[0]} frame={frame} duration={duration} />
        <div
          style={{
            position: 'relative',
            height: 760,
            transform: `scale(${0.92 + cardScale * 0.08}) translateY(${interpolate(
              frame,
              [0, duration],
              [40, 0]
            )}px)`,
          }}
        >
          <WindowShell
            title="Career Search Workspace"
            width={760}
            height={620}
            style={{
              position: 'absolute',
              top: 82,
              left: 0,
              transform: `rotate(-5deg) translateY(${bannerFloat}px)`,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: 18,
                height: '100%',
              }}
            >
              <div
                style={{
                  ...cardBase,
                  borderRadius: 26,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: bodyFont,
                    color: palette.textMuted,
                    fontSize: 16,
                    letterSpacing: 0.2,
                  }}
                >
                  Resume rewrite in progress
                </div>
                <TypingBar frame={frame} />
                <div
                  style={{
                    ...cardBase,
                    borderRadius: 22,
                    padding: 18,
                    display: 'grid',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: displayFont,
                      fontSize: 24,
                      fontWeight: 800,
                      color: palette.text,
                    }}
                  >
                    “Managed a team”
                  </div>
                  <div
                    style={{
                      fontFamily: bodyFont,
                      fontSize: 22,
                      lineHeight: 1.45,
                      color: palette.textMuted,
                    }}
                  >
                    “Led a cross-functional team of 10+ contributors and cut deployment time by 40%.”
                  </div>
                </div>
                <div style={{display: 'flex', gap: 14}}>
                  <MetricPill label="ATS Score" value="98/100" />
                  <MetricPill label="Templates" value="30+" tone="gold" />
                </div>
              </div>
              <div style={{display: 'grid', gap: 16}}>
                {['Interview Studio', 'Portfolio Site', 'Job Tracker'].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      ...cardBase,
                      borderRadius: 24,
                      padding: 18,
                      transform: `translateY(${interpolate(frame, [0, 24 + index * 6], [40, 0], {
                        extrapolateRight: 'clamp',
                      })}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: bodyFont,
                        color: palette.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: 1.8,
                        fontSize: 12,
                        marginBottom: 10,
                      }}
                    >
                      Connected tool
                    </div>
                    <div
                      style={{
                        fontFamily: displayFont,
                        fontSize: 28,
                        fontWeight: 800,
                        color: palette.text,
                        marginBottom: 10,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: bodyFont,
                        fontSize: 18,
                        color: palette.textMuted,
                        lineHeight: 1.4,
                      }}
                    >
                      {index === 0 &&
                        'Role-based mock interviews with timing, tone, and pacing feedback.'}
                      {index === 1 &&
                        'Publish a personal site from your resume with shareable themes and a clean link.'}
                      {index === 2 &&
                        'Track statuses, prep notes, and momentum across every application.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </WindowShell>

          <div
            style={{
              position: 'absolute',
              right: -18,
              top: 0,
              ...cardBase,
              borderRadius: 28,
              padding: 22,
              width: 280,
              transform: `rotate(6deg) translateY(${interpolate(frame, [0, duration], [-26, 18])}px)`,
            }}
          >
            <div
              style={{
                fontFamily: bodyFont,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 2,
                color: palette.textMuted,
                marginBottom: 16,
              }}
            >
              Browser extension
            </div>
            <div
              style={{
                display: 'grid',
                gap: 12,
              }}
            >
              {['Save Job', 'Tailor Resume', 'Practice Interview'].map((label, index) => (
                <div
                  key={label}
                  style={{
                    background: index === 1 ? 'rgba(73,230,25,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${index === 1 ? 'rgba(73,230,25,0.35)' : palette.border}`,
                    color: index === 1 ? palette.limeSoft : palette.text,
                    borderRadius: 18,
                    padding: '14px 16px',
                    fontFamily: displayFont,
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <Img
            src={staticFile('/brand/resume-banner.png')}
            style={{
              position: 'absolute',
              right: 48,
              bottom: 0,
              width: 260,
              height: 260,
              borderRadius: 44,
              objectFit: 'cover',
              boxShadow: '0 28px 70px rgba(0,0,0,0.35)',
              border: `1px solid ${palette.border}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ResumeScene: React.FC<{frame: number; duration: number}> = ({frame, duration}) => {
  const leftIntro = spring({
    frame,
    fps: 30,
    config: {damping: 17, stiffness: 120},
  });

  return (
    <AbsoluteFill style={{padding: '150px 68px 72px'}}>
      <BrandBar />
      <div style={{display: 'grid', gridTemplateColumns: '0.88fr 1.12fr', gap: 38, flex: 1}}>
        <SceneText {...scenes[1]} frame={frame} duration={duration} maxWidth={620} />
        <div
          style={{
            position: 'relative',
            transform: `translateY(${interpolate(leftIntro, [0, 1], [46, 0])}px)`,
            opacity: leftIntro,
          }}
        >
          <WindowShell title="Resume Builder" width={940} height={760}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 1.1fr',
                gap: 18,
                height: '100%',
              }}
            >
              <div
                style={{
                  ...cardBase,
                  borderRadius: 26,
                  padding: 20,
                  display: 'grid',
                  gridTemplateRows: 'repeat(6, auto)',
                  gap: 12,
                }}
              >
                {['Summary', 'Experience', 'Skills', 'Projects', 'Education', 'Links'].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      background: index === 1 ? 'rgba(73,230,25,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${index === 1 ? 'rgba(73,230,25,0.35)' : palette.border}`,
                      borderRadius: 18,
                      padding: '18px 16px',
                      fontFamily: displayFont,
                      fontSize: 24,
                      fontWeight: 800,
                      color: index === 1 ? palette.limeSoft : palette.text,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div
                style={{
                  ...cardBase,
                  borderRadius: 26,
                  padding: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', gap: 16}}>
                  <MetricPill label="AI Rewrite" value="Live" tone="blue" />
                  <MetricPill label="Ready to Export" value="PDF" tone="gold" />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 22,
                      padding: 18,
                      border: `1px solid ${palette.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: bodyFont,
                        color: palette.textMuted,
                        fontSize: 14,
                        textTransform: 'uppercase',
                        letterSpacing: 1.6,
                        marginBottom: 10,
                      }}
                    >
                      Before
                    </div>
                    <div
                      style={{
                        fontFamily: bodyFont,
                        color: palette.text,
                        fontSize: 23,
                        lineHeight: 1.5,
                      }}
                    >
                      Managed onboarding and helped improve team communication.
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(73,230,25,0.09)',
                      borderRadius: 22,
                      padding: 18,
                      border: '1px solid rgba(73,230,25,0.35)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: bodyFont,
                        color: palette.limeSoft,
                        fontSize: 14,
                        textTransform: 'uppercase',
                        letterSpacing: 1.6,
                        marginBottom: 10,
                      }}
                    >
                      After
                    </div>
                    <div
                      style={{
                        fontFamily: bodyFont,
                        color: palette.text,
                        fontSize: 23,
                        lineHeight: 1.5,
                      }}
                    >
                      Streamlined onboarding for 35+ new hires and introduced documentation that cut ramp time by 2 weeks.
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    ...cardBase,
                    borderRadius: 24,
                    padding: 20,
                    display: 'grid',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: displayFont,
                        fontSize: 28,
                        fontWeight: 800,
                        color: palette.text,
                      }}
                    >
                      ATS Readiness
                    </span>
                    <span
                      style={{
                        fontFamily: displayFont,
                        fontSize: 34,
                        fontWeight: 800,
                        color: palette.lime,
                      }}
                    >
                      98/100
                    </span>
                  </div>
                  <div
                    style={{
                      height: 22,
                      borderRadius: 999,
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        width: '98%',
                        height: '100%',
                        borderRadius: 999,
                        background:
                          'linear-gradient(90deg, rgba(73,230,25,0.95), rgba(135,217,255,0.95))',
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                  }}
                >
                  {['One-click templates', 'Import existing resume', 'Shareable export'].map((label) => (
                    <div
                      key={label}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${palette.border}`,
                        borderRadius: 18,
                        padding: '16px 14px',
                        color: palette.text,
                        fontFamily: bodyFont,
                        fontSize: 17,
                        lineHeight: 1.35,
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </WindowShell>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WaveBars: React.FC<{frame: number}> = ({frame}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        height: 160,
      }}
    >
      {new Array(16).fill(true).map((_, index) => {
        const barHeight = 30 + Math.abs(Math.sin((frame + index * 4) / 8)) * 110;
        const active = index % 4 === 0 || index % 5 === 0;
        return (
          <div
            key={index}
            style={{
              width: 18,
              height: barHeight,
              borderRadius: 999,
              background: active
                ? 'linear-gradient(180deg, rgba(73,230,25,1), rgba(135,217,255,0.85))'
                : 'rgba(255,255,255,0.09)',
              boxShadow: active ? '0 0 20px rgba(73,230,25,0.24)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

const InterviewScene: React.FC<{frame: number; duration: number}> = ({frame, duration}) => {
  return (
    <AbsoluteFill style={{padding: '150px 68px 72px'}}>
      <BrandBar />
      <div style={{display: 'grid', gridTemplateColumns: '1.04fr 0.96fr', gap: 38, flex: 1}}>
        <div style={{position: 'relative'}}>
          <WindowShell title="Interview Studio" width={980} height={760}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: 18,
                height: '100%',
              }}
            >
              <div
                style={{
                  ...cardBase,
                  borderRadius: 28,
                  padding: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: bodyFont,
                      fontSize: 16,
                      textTransform: 'uppercase',
                      letterSpacing: 2,
                      color: palette.textMuted,
                      marginBottom: 14,
                    }}
                  >
                    Live prompt
                  </div>
                  <div
                    style={{
                      fontFamily: displayFont,
                      fontSize: 40,
                      lineHeight: 1.16,
                      fontWeight: 800,
                      color: palette.text,
                    }}
                  >
                    “Tell me about a time you resolved a difficult conflict at work.”
                  </div>
                </div>
                <WaveBars frame={frame} />
                <div
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 24,
                    lineHeight: 1.5,
                    color: palette.textMuted,
                  }}
                >
                  The session adapts to the role, listens for clarity, and helps candidates practice before the stakes are higher.
                </div>
              </div>
              <div style={{display: 'grid', gap: 14}}>
                {[
                  ['Feedback', 'Delivery improved'],
                  ['Confidence', 'More structured answers'],
                  ['Pacing', 'Less filler, clearer close'],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    style={{
                      ...cardBase,
                      borderRadius: 24,
                      padding: 20,
                      transform: `translateX(${interpolate(
                        frame,
                        [8 + index * 4, 28 + index * 4],
                        [50, 0],
                        {extrapolateRight: 'clamp'}
                      )}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: bodyFont,
                        fontSize: 14,
                        textTransform: 'uppercase',
                        letterSpacing: 1.6,
                        color: palette.textMuted,
                        marginBottom: 8,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: displayFont,
                        fontWeight: 800,
                        fontSize: 30,
                        color: index === 1 ? palette.blue : palette.text,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    ...cardBase,
                    borderRadius: 24,
                    padding: 22,
                    display: 'grid',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: displayFont,
                      color: palette.text,
                      fontSize: 30,
                      fontWeight: 800,
                    }}
                  >
                    Recommended next prompt
                  </div>
                  <div
                    style={{
                      fontFamily: bodyFont,
                      color: palette.textMuted,
                      fontSize: 20,
                      lineHeight: 1.45,
                    }}
                  >
                    “Walk me through a project where you influenced without direct authority.”
                  </div>
                </div>
              </div>
            </div>
          </WindowShell>
        </div>
        <SceneText {...scenes[2]} frame={frame} duration={duration} maxWidth={580} />
      </div>
    </AbsoluteFill>
  );
};

const PortfolioTrackerScene: React.FC<{frame: number; duration: number}> = ({frame, duration}) => {
  const cardIntro = spring({
    frame,
    fps: 30,
    config: {damping: 18, stiffness: 130},
  });

  return (
    <AbsoluteFill style={{padding: '150px 68px 72px'}}>
      <BrandBar />
      <div style={{display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 38, flex: 1}}>
        <SceneText {...scenes[3]} frame={frame} duration={duration} maxWidth={620} />
        <div
          style={{
            display: 'grid',
            gap: 18,
            transform: `translateY(${interpolate(cardIntro, [0, 1], [50, 0])}px)`,
            opacity: cardIntro,
          }}
        >
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
            <WindowShell title="Portfolio Site" width={460} height={360}>
              <div
                style={{
                  height: '100%',
                  display: 'grid',
                  gridTemplateRows: '180px 1fr',
                  gap: 14,
                }}
              >
                <Img
                  src={staticFile('/brand/resume-banner.png')}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 20,
                    objectFit: 'cover',
                    border: `1px solid ${palette.border}`,
                  }}
                />
                <div style={{display: 'grid', gap: 10}}>
                  <div
                    style={{
                      fontFamily: displayFont,
                      fontSize: 34,
                      fontWeight: 800,
                      color: palette.text,
                    }}
                  >
                    Personal site from resume
                  </div>
                  <div
                    style={{
                      fontFamily: bodyFont,
                      fontSize: 21,
                      lineHeight: 1.4,
                      color: palette.textMuted,
                    }}
                  >
                    Publish projects, achievements, and a clean share link without rebuilding everything by hand.
                  </div>
                </div>
              </div>
            </WindowShell>
            <WindowShell title="Job Tracker" width={460} height={360}>
              <div style={{display: 'grid', gap: 12}}>
                {[
                  ['Applied', 7, 'rgba(135,217,255,0.18)'],
                  ['Interviewing', 3, 'rgba(73,230,25,0.16)'],
                  ['Offer', 1, 'rgba(247,210,103,0.18)'],
                ].map(([label, count, bg]) => (
                  <div
                    key={label}
                    style={{
                      background: bg,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 20,
                      padding: '18px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: displayFont,
                        fontWeight: 800,
                        fontSize: 30,
                        color: palette.text,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: displayFont,
                        fontWeight: 800,
                        fontSize: 36,
                        color: palette.text,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </WindowShell>
          </div>
          <WindowShell title="Preparation Notes" width={938} height={362}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                height: '100%',
              }}
            >
              {[
                'Role research',
                'My story',
                'Interview prep',
                'Questions for them',
              ].map((label, index) => (
                <div
                  key={label}
                  style={{
                    ...cardBase,
                    borderRadius: 22,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: displayFont,
                      fontWeight: 800,
                      fontSize: 24,
                      color: index === 2 ? palette.limeSoft : palette.text,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: bodyFont,
                      fontSize: 18,
                      lineHeight: 1.45,
                      color: palette.textMuted,
                    }}
                  >
                    {index === 0 &&
                      'Summaries on the company, role, and responsibilities.'}
                    {index === 1 &&
                      'A sharper narrative linking experience to the open role.'}
                    {index === 2 &&
                      'Generated practice questions with STAR-style framing.'}
                    {index === 3 &&
                      'Thoughtful questions to ask recruiters and hiring managers.'}
                  </div>
                </div>
              ))}
            </div>
          </WindowShell>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ExtensionScene: React.FC<{frame: number; duration: number}> = ({frame, duration}) => {
  const columnLift = (offset: number) =>
    interpolate(frame, [offset, offset + 20], [70, 0], {
      extrapolateRight: 'clamp',
    });

  return (
    <AbsoluteFill style={{padding: '150px 68px 72px'}}>
      <BrandBar />
      <div style={{display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 38, flex: 1}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18}}>
          {[
            {
              title: 'Describe diagram',
              body: 'Type your system architecture or flow in plain English.',
            },
            {
              title: 'AI generates',
              body: 'Watch as the AI builds a professional Excalidraw diagram instantly.',
            },
            {
              title: 'Edit freely',
              body: 'Full canvas control to tweak shapes, arrows, and text manually.',
            },
            {
              title: 'Auto-save',
              body: 'Changes persist securely to your project with visual thumbnails.',
            },
          ].map((item, index) => (
            <div
              key={item.title}
              style={{
                ...cardBase,
                borderRadius: 28,
                padding: 24,
                transform: `translateY(${columnLift(index * 5)})`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    index === 1
                      ? 'rgba(135,217,255,0.16)'
                      : index === 2
                        ? 'rgba(73,230,25,0.16)'
                        : 'rgba(255,255,255,0.05)',
                  color: index === 1 ? palette.blue : index === 2 ? palette.limeSoft : palette.text,
                  fontFamily: displayFont,
                  fontWeight: 800,
                  fontSize: 28,
                  marginBottom: 18,
                }}
              >
                0{index + 1}
              </div>
              <div
                style={{
                  fontFamily: displayFont,
                  fontWeight: 800,
                  fontSize: 30,
                  lineHeight: 1.05,
                  color: palette.text,
                  marginBottom: 14,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontFamily: bodyFont,
                  fontSize: 20,
                  lineHeight: 1.45,
                  color: palette.textMuted,
                }}
              >
                {item.body}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SceneText {...scenes[4]} frame={frame} duration={duration} maxWidth={560} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{frame: number; duration: number}> = ({frame, duration}) => {
  const intro = spring({
    frame,
    fps: 30,
    config: {damping: 18, stiffness: 120},
  });

  return (
    <AbsoluteFill
      style={{
        padding: '140px 90px 80px',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <BrandBar />
      <div
        style={{
          width: 1320,
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
          alignItems: 'center',
          textAlign: 'center',
          transform: `translateY(${interpolate(intro, [0, 1], [44, 0])}px)`,
          opacity: intro,
        }}
      >
        <div
          style={{
            ...cardBase,
            borderRadius: 999,
            padding: '14px 22px',
            color: palette.lime,
            fontFamily: bodyFont,
            textTransform: 'uppercase',
            letterSpacing: 2.2,
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Study the role. Sharpen the story. Show up ready.
        </div>
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 92,
            lineHeight: 0.96,
            letterSpacing: -3.2,
            fontWeight: 800,
            color: palette.text,
            textWrap: 'balance',
          }}
        >
          {scenes[5].title}
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 30,
            lineHeight: 1.45,
            color: palette.textMuted,
            maxWidth: 980,
            textWrap: 'pretty',
          }}
        >
          {scenes[5].body}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            'AI Resume Builder',
            'Interview Studio',
            'AI Whiteboard',
            'Job Tracker',
            'Portfolio Site',
          ].map((label, index) => (
            <div
              key={label}
              style={{
                ...cardBase,
                borderRadius: 999,
                padding: '14px 18px',
                fontFamily: bodyFont,
                fontSize: 20,
                color: index === 2 ? palette.blue : palette.text,
                borderColor: index === 3 ? 'rgba(73,230,25,0.35)' : palette.border,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <Img
            src={staticFile('/brand/icon128.png')}
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
            }}
          />
          <div style={{display: 'grid', gap: 4}}>
            <span
              style={{
                fontFamily: displayFont,
                color: palette.text,
                fontSize: 38,
                fontWeight: 800,
              }}
            >
              CareerVivid
            </span>
            <span
              style={{
                fontFamily: bodyFont,
                color: palette.textMuted,
                fontSize: 22,
              }}
            >
              AI-powered career assistant
            </span>
          </div>
        </div>
        <div
          style={{
            ...cardBase,
            borderRadius: 999,
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: palette.lime,
              boxShadow: '0 0 18px rgba(73,230,25,0.85)',
            }}
          />
          <span
            style={{
              fontFamily: bodyFont,
              fontSize: 22,
              color: palette.text,
              fontWeight: 700,
            }}
          >
            careervivid.app
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CareerVividCommercial: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={fullSize}>
      <AnimatedBackground />

      <Sequence from={0} durationInFrames={150}>
        <HeroScene frame={frame} duration={150} />
      </Sequence>
      <Sequence from={150} durationInFrames={150}>
        <ResumeScene frame={frame - 150} duration={150} />
      </Sequence>
      <Sequence from={300} durationInFrames={150}>
        <InterviewScene frame={frame - 300} duration={150} />
      </Sequence>
      <Sequence from={450} durationInFrames={150}>
        <PortfolioTrackerScene frame={frame - 450} duration={150} />
      </Sequence>
      <Sequence from={600} durationInFrames={120}>
        <ExtensionScene frame={frame - 600} duration={120} />
      </Sequence>
      <Sequence from={720} durationInFrames={180}>
        <CtaScene frame={frame - 720} duration={180} />
      </Sequence>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 240px rgba(0,0,0,0.18)',
        }}
      />
      <Audio src={staticFile('background-music.mp3')} volume={0.4} />
    </AbsoluteFill>
  );
};
