---
name: Pro_Commercial_Site_Builder
description: Create Linear-style or Apple-style premium landing pages with video scroll, smooth scrolling, and glassmorphism.
---

# Pro Commercial Site Builder

**Trigger**: "Turn this video into a pro website"
**Context**: User wants a "Linear.app" or "Apple-style" landing page, not just a demo.

## Instructions

### 1. Architecture (The "Shell")
- **Navbar**: MUST include a fixed, glassmorphism Navbar (Logo, Links, 'Get Started' button).
- **Scroll**: MUST use a 'Lenis' smooth scroll wrapper for that premium weight.
- **Layout**: Navbar -> Hero (Sticky Video) -> Feature Grid -> Footer.

### 2. The Hero Logic (The "Pin")
- **Pinning**: The video canvas must use CSS `position: sticky; top: 0` (or GSAP Pin equivalent).
- **Duration**: Pins for **400vh** (4 screen heights).
- **Playback**: As the user scrolls, the video plays (scrubs).
- **Overlays**: Crucial: Overlay HTML text must fade IN and OUT over the video at:
  - **25%**: First Message
  - **50%**: Second Message
  - **75%**: Third Message

### 3. The Transition
- When the video ends, the user continues scrolling naturally into a white/gray "Details" section.

### 4. Styling (The "Pro" Look)
- **Font**: Inter or Geist (sans-serif).
- **Typography**: Tight tracking (`tracking-tighter`), uppercase subheads.
- **Nav**: `backdrop-blur-md` and `border-b border-white/10`.
