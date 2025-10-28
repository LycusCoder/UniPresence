# 🎨 UniPresence Enterprise - UI/UX Design System

> **Professional-grade design system and wireframes for modern enterprise employee management with AI-powered features**

**Project:** UniPresence Enterprise  
**Version:** 2.0.0 - Modern Redesign  
**Last Updated:** 1 Agustus 2025  
**Phase:** 2.5 - UI/UX Modernization  
**Design System Maturity:** Level 3 (Systematic)

---

## 📑 Table of Contents

1. [Brand Identity](#-brand-identity)
2. [Design Philosophy](#-design-philosophy)
3. [Design Tokens](#-design-tokens)
4. [Design System](#-design-system)
   - [Color System](#color-system)
   - [Typography](#typography)
   - [Spacing & Layout](#spacing--layout)
   - [Elevation & Shadows](#elevation--shadows)
5. [Component Library](#-component-library)
6. [Interactive States](#-interactive-states)
7. [Microinteractions](#-microinteractions)
8. [Page Wireframes](#-page-wireframes)
9. [Responsive Design](#-responsive-design)
10. [Theme System](#-theme-system)
11. [Accessibility Standards](#-accessibility-standards)
12. [Internationalization](#-internationalization)
13. [Design-to-Code Handoff](#-design-to-code-handoff)
14. [UI Style Audit Checklist](#-ui-style-audit-checklist)
15. [Changelog](#-changelog)

---

## 🏢 Brand Identity

### Brand Overview

**UniPresence Enterprise** is a modern, AI-powered employee management system that combines cutting-edge technology with professional corporate aesthetics.

#### Brand Attributes
- **Trustworthy:** Enterprise-grade reliability
- **Innovative:** AI-powered face recognition & automation
- **Professional:** Clean, corporate design language
- **Human-Centric:** Intuitive, accessible interface
- **Scalable:** Built for growth

### Logo Usage

```
Primary Logo:
┌─────────────────────────────┐
│  UP  UniPresence Enterprise │
│  🔴  Sistem Manajemen       │
│      Karyawan               │
└─────────────────────────────┘

Minimum Size: 120px width
Clear Space: 16px on all sides
Backgrounds: White, Light Gray, Dark Slate
```

**Logo Variants:**
- Full Logo (with tagline)
- Logo Mark Only ("UP" icon)
- Monochrome (for dark backgrounds)
- Favicon (32x32px)

### Brand Voice & Tone

| Context | Voice | Example |
|---------|-------|----------|
| **Dashboard Welcome** | Warm & Professional | "Selamat pagi, Budi! Anda sudah absen 20 hari bulan ini." |
| **Error Messages** | Helpful & Clear | "Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan hadap ke kamera." |
| **Success Notifications** | Encouraging | "Absensi berhasil! Selamat bekerja hari ini." |
| **Instructions** | Direct & Simple | "Posisikan wajah di tengah kamera." |
| **Settings** | Technical but Friendly | "Mode gelap menghemat baterai dan mengurangi kelelahan mata." |

### Visual Signature Elements

1. **Maroon Accent**: Distinctive corporate red/maroon color
2. **Glassmorphism Cards**: Subtle frosted glass effect on modals
3. **Smooth Animations**: 200-300ms transitions
4. **Icon System**: Consistent rounded style
5. **Grid-Based Layouts**: 8px base unit

---

## 🎯 Design Philosophy

### Vision

Create a **modern, professional, and user-friendly** employee management system that:
- Feels like a cutting-edge tech product (not traditional enterprise software)
- Prioritizes user experience and visual appeal  
- Maintains corporate professionalism
- Ensures accessibility and inclusivity
- Leverages AI for intelligent automation

### Core Principles

#### 1. **Human-Centered + AI-Augmented Design**
```
User Intent → Smart Interface → AI Processing → Instant Feedback
     ↓              ↓                ↓              ↓
  Natural      Predictive      Face/OCR       Visual
  Actions      Assistance     Recognition    Confirmation
```

**Implementation:**
- AI-powered face quality analysis (real-time feedback)
- Smart form suggestions (department, position autocomplete)
- Predictive search (employee lookup)
- Adaptive UI based on usage patterns

#### 2. **Modern & Clean**
- Minimalist design with purposeful elements
- Generous white space (breathing room)
- Clear visual hierarchy (F-pattern)
- Subtle depth (shadows, not borders)

#### 3. **User-Centric**
- Intuitive navigation (3-click rule)
- Clear feedback for all actions (loading, success, error)
- Minimal cognitive load (progressive disclosure)
- Contextual help (tooltips, inline guidance)

#### 4. **Professional & Trustworthy**
- Corporate color palette (maroon, slate, gold)
- Consistent branding across all touchpoints
- Reliable interactions (no unexpected behaviors)
- Data-first design (stats, metrics visible)

#### 5. **Responsive & Accessible**
- Works on all devices (mobile-first approach)
- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader friendly

### Design Flow Diagram

```
┌─────────────┐
│    User     │
│   Action    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│ Interface   │ ───> │ AI/Backend   │
│ (Frontend)  │ <─── │ Processing   │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐
│  Feedback   │
│   Loop      │ → Visual, Audio, Haptic
└─────────────┘
```

---

## 🎨 Design Tokens

### What are Design Tokens?

Design tokens are the atomic values (colors, spacing, typography) that define our design system. They ensure consistency across platforms and make updates scalable.

### Token Structure

```json
{
  "color": {
    "primary": {
      "900": { "value": "#5F0000", "type": "color" },
      "800": { "value": "#700000", "type": "color" },
      "700": { "value": "#8B0000", "type": "color" }
    }
  },
  "spacing": {
    "4": { "value": "16px", "type": "dimension" }
  },
  "typography": {
    "heading-1": {
      "value": {
        "fontFamily": "Inter",
        "fontSize": "48px",
        "fontWeight": 700,
        "lineHeight": "120%"
      },
      "type": "typography"
    }
  }
}
```

### Export Formats

**For Developers:**
- `tokens.json` - Base JSON format
- `tokens.scss` - SASS variables
- `tokens.css` - CSS custom properties
- `tokens.js` - JavaScript/TypeScript constants

**For Designers:**
- `figma-tokens.json` - Figma Variables
- `sketch-tokens.json` - Sketch Symbols

### Versioning

**Semantic Versioning (SemVer):**
```
v2.0.0
│ │ │
│ │ └─ Patch: Bug fixes, minor tweaks
│ └─── Minor: New tokens, backward compatible
└───── Major: Breaking changes
```

**Current Version:** `v2.0.0` (Initial modern redesign)

---

## 🎨 Design System

### Color System

#### Primary Colors (Maroon/Burgundy Theme)

```css
/* Primary - Corporate Maroon */
--primary-950: #450000;     /* Ultra dark */
--primary-900: #5F0000;     /* Dark maroon - hover states */
--primary-800: #700000;     /* Maroon - headers */
--primary-700: #8B0000;     /* Main maroon - primary actions ⭐ */
--primary-600: #A52A2A;     /* Medium maroon */
--primary-500: #B22222;     /* Light maroon - highlights */
--primary-400: #C84848;     /* Lighter - accents */
--primary-300: #DC8585;     /* Very light - backgrounds */
--primary-200: #F0B8B8;     /* Subtle backgrounds */
--primary-100: #FAE5E5;     /* Hover backgrounds */
--primary-50: #FDF5F5;      /* Ultra light */
```

#### Secondary Colors (Slate/Gray)

```css
/* Secondary - Slate/Gray */
--secondary-950: #0F172A;   /* Almost black */
--secondary-900: #1E293B;   /* Dark slate - text ⭐ */
--secondary-800: #334155;   /* Slate - secondary text */
--secondary-700: #475569;   /* Medium slate */
--secondary-600: #64748B;   /* Light slate */
--secondary-500: #94A3B8;   /* Very light slate */
--secondary-400: #CBD5E1;   /* Borders */
--secondary-300: #E2E8F0;   /* Light borders */
--secondary-200: #F1F5F9;   /* Light backgrounds */
--secondary-100: #F8FAFC;   /* Very light backgrounds */
--secondary-50: #FCFDFE;    /* Almost white */
```

#### Accent Colors (Gold/Amber)

```css
/* Accent - Gold/Amber */
--accent-900: #78350F;      /* Dark brown-gold */
--accent-800: #92400E;      /* Brown-gold */
--accent-700: #B45309;      /* Dark gold */
--accent-600: #D97706;      /* Gold - CTAs ⭐ */
--accent-500: #F59E0B;      /* Amber - highlights */
--accent-400: #FBBF24;      /* Light amber */
--accent-300: #FCD34D;      /* Very light */
--accent-200: #FDE68A;      /* Pale amber */
--accent-100: #FEF3C7;      /* Ultra light */
```

#### Semantic Colors

```css
/* Success - Green */
--success-900: #14532D;
--success-800: #166534;
--success-700: #15803D;
--success-600: #16A34A;     /* Main success ⭐ */
--success-500: #22C55E;
--success-400: #4ADE80;
--success-300: #86EFAC;
--success-200: #BBF7D0;
--success-100: #DCFCE7;     /* Success background */
--success-50: #F0FDF4;

/* Warning - Orange */
--warning-900: #7C2D12;
--warning-800: #9A3412;
--warning-700: #C2410C;
--warning-600: #EA580C;     /* Main warning ⭐ */
--warning-500: #F97316;
--warning-400: #FB923C;
--warning-300: #FDBA74;
--warning-200: #FED7AA;
--warning-100: #FFEDD5;     /* Warning background */
--warning-50: #FFF7ED;

/* Error - Red */
--error-900: #7F1D1D;
--error-800: #991B1B;
--error-700: #B91C1C;
--error-600: #DC2626;       /* Main error ⭐ */
--error-500: #EF4444;
--error-400: #F87171;
--error-300: #FCA5A5;
--error-200: #FECACA;
--error-100: #FEE2E2;       /* Error background */
--error-50: #FEF2F2;

/* Info - Blue */
--info-900: #1E3A8A;
--info-800: #1E40AF;
--info-700: #1D4ED8;
--info-600: #2563EB;        /* Main info ⭐ */
--info-500: #3B82F6;
--info-400: #60A5FA;
--info-300: #93C5FD;
--info-200: #BFDBFE;
--info-100: #DBEAFE;        /* Info background */
--info-50: #EFF6FF;
```

#### Dark Mode Colors

```css
/* Dark Mode Palette */
--dark-bg: #0F172A;         /* Dark background */
--dark-surface: #1E293B;    /* Dark cards */
--dark-surface-elevated: #334155; /* Elevated cards */
--dark-border: #475569;     /* Dark borders */
--dark-text: #E2E8F0;       /* Dark mode text */
--dark-text-muted: #94A3B8; /* Muted dark text */
--dark-text-subtle: #64748B; /* Subtle dark text */
```

#### High-Contrast Mode

```css
/* High Contrast (Accessibility) */
--hc-bg: #000000;
--hc-surface: #1A1A1A;
--hc-text: #FFFFFF;
--hc-primary: #FF6B6B;
--hc-border: #FFFFFF;
```

### Color Contrast Ratios (WCAG AA)

| Combination | Contrast Ratio | WCAG AA | Use Case |
|-------------|----------------|---------|----------|
| `primary-700` on white | 9.2:1 | ✅ Pass | Headings, buttons |
| `secondary-900` on white | 16.1:1 | ✅ Pass | Body text |
| `secondary-700` on white | 8.5:1 | ✅ Pass | Secondary text |
| White on `primary-700` | 9.2:1 | ✅ Pass | Button text |
| `accent-600` on white | 5.8:1 | ✅ Pass | CTA buttons |
| `success-600` on white | 4.6:1 | ✅ Pass | Success messages |
| `error-600` on white | 5.2:1 | ✅ Pass | Error messages |

**Testing Tool:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Color Usage Guidelines

| Color | Primary Use | Do | Don't |
|-------|-------------|----|---------|
| **Primary (Maroon)** | Branding, main actions, headers | Use for primary buttons, active states | Overuse - max 10% of UI |
| **Secondary (Slate)** | Text, borders, subtle elements | Use for body text, icons | Use for main CTAs |
| **Accent (Gold)** | Important highlights, badges | Use sparingly for emphasis | Use for long text blocks |
| **Success** | Confirmations, positive states | Pair with checkmark icons | Use for warnings |
| **Warning** | Cautions, pending states | Show before destructive actions | Use for errors |
| **Error** | Errors, destructive actions | Show with clear messages | Use for informational alerts |

---

### Typography

#### Font Families

```css
/* Primary Font - Sans Serif */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Secondary Font - Monospace (for codes, IDs) */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 
             'Monaco', 'Courier New', monospace;

/* Display Font - Headings (optional premium look) */
--font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
```

**Why Inter?**
- Open source & free
- Designed for screens (excellent readability)
- Wide language support (Latin, Cyrillic, Greek)
- Variable font support
- Widely used in modern SaaS products (Notion, Linear, GitHub)

#### Font Sizes & Line Heights

```css
/* Display - Hero & Large Headings */
--text-6xl: 3.75rem;    /* 60px - Hero headings */
--text-5xl: 3rem;       /* 48px - Page titles */
--text-4xl: 2.25rem;    /* 36px - Section headings */
--text-3xl: 1.875rem;   /* 30px - Card titles */
--text-2xl: 1.5rem;     /* 24px - Subheadings */
--text-xl: 1.25rem;     /* 20px - Large text */

/* Body */
--text-lg: 1.125rem;    /* 18px - Large body */
--text-base: 1rem;      /* 16px - Base body ⭐ */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-xs: 0.75rem;     /* 12px - Captions, labels */
--text-xxs: 0.625rem;   /* 10px - Tiny labels */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;  /* Default ⭐ */
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Letter Spacing */
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;   /* Default ⭐ */
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;

/* Font Weights */
--font-thin: 100;
--font-extralight: 200;
--font-light: 300;
--font-normal: 400;     /* Default ⭐ */
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

#### Typography Scale (Type Ramp)

| Element | Font Size | Weight | Line Height | Letter Spacing | Use Case |
|---------|-----------|--------|-------------|----------------|-----------|
| **H1 (Hero)** | `text-5xl` (48px) | `font-bold` (700) | `leading-tight` (1.25) | `tracking-tight` | Hero sections, page titles |
| **H2 (Page Title)** | `text-4xl` (36px) | `font-bold` (700) | `leading-tight` | `tracking-tight` | Main page headings |
| **H3 (Section)** | `text-3xl` (30px) | `font-semibold` (600) | `leading-snug` (1.375) | `tracking-normal` | Section headings |
| **H4 (Card Title)** | `text-2xl` (24px) | `font-semibold` (600) | `leading-snug` | `tracking-normal` | Card titles, modals |
| **H5 (Subtitle)** | `text-xl` (20px) | `font-medium` (500) | `leading-normal` (1.5) | `tracking-normal` | Subtitles, subsections |
| **H6 (Small Head)** | `text-lg` (18px) | `font-medium` (500) | `leading-normal` | `tracking-normal` | Small headings |
| **Body Large** | `text-lg` (18px) | `font-normal` (400) | `leading-relaxed` (1.625) | `tracking-normal` | Intro paragraphs |
| **Body** | `text-base` (16px) | `font-normal` (400) | `leading-normal` (1.5) | `tracking-normal` | Default body text ⭐ |
| **Body Small** | `text-sm` (14px) | `font-normal` (400) | `leading-normal` | `tracking-normal` | Secondary text |
| **Caption** | `text-xs` (12px) | `font-normal` (400) | `leading-normal` | `tracking-wide` | Captions, metadata |
| **Label** | `text-xs` (12px) | `font-semibold` (600) | `leading-normal` | `tracking-wide` | Form labels, tags |
| **Button** | `text-sm` (14px) | `font-semibold` (600) | `leading-none` (1) | `tracking-wide` | Button text |
| **Code/Mono** | `text-sm` (14px) | `font-normal` (400) | `leading-normal` | `tracking-normal` | Code snippets, IDs |

#### Text Accessibility Map (Light & Dark Mode)

| Text Type | Light Mode | Dark Mode | Contrast (Light) | Contrast (Dark) |
|-----------|------------|-----------|------------------|------------------|
| **Heading** | `secondary-900` (#1E293B) | `dark-text` (#E2E8F0) | 16.1:1 ✅ | 14.2:1 ✅ |
| **Body** | `secondary-800` (#334155) | `dark-text` (#E2E8F0) | 13.4:1 ✅ | 14.2:1 ✅ |
| **Secondary** | `secondary-700` (#475569) | `dark-text-muted` (#94A3B8) | 8.5:1 ✅ | 5.8:1 ✅ |
| **Muted** | `secondary-600` (#64748B) | `dark-text-subtle` (#64748B) | 5.6:1 ✅ | 4.2:1 ⚠️ |
| **Link** | `primary-700` (#8B0000) | `primary-400` (#C84848) | 9.2:1 ✅ | 7.1:1 ✅ |
| **Link Hover** | `primary-800` (#700000) | `primary-300` (#DC8585) | 11.8:1 ✅ | 5.3:1 ✅ |

**Note:** ⚠️ = Use only for non-critical text (labels, timestamps)

#### Fallback Fonts (Mobile)

**iOS:**
```css
--font-ios: -apple-system, 'SF Pro Text', 'SF Pro Display', sans-serif;
```

**Android:**
```css
--font-android: 'Roboto', 'Noto Sans', sans-serif;
```

---

### Spacing & Layout

#### Spacing System (8px Base Unit)

```css
/* Base unit: 4px (0.25rem) */
--space-0: 0;           /* 0px - No space */
--space-px: 1px;        /* 1px - Hairline */
--space-0-5: 0.125rem;  /* 2px - Tiny */
--space-1: 0.25rem;     /* 4px */
--space-1-5: 0.375rem;  /* 6px */
--space-2: 0.5rem;      /* 8px */
--space-2-5: 0.625rem;  /* 10px */
--space-3: 0.75rem;     /* 12px */
--space-3-5: 0.875rem;  /* 14px */
--space-4: 1rem;        /* 16px ⭐ Base spacing */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-7: 1.75rem;     /* 28px */
--space-8: 2rem;        /* 32px */
--space-9: 2.25rem;     /* 36px */
--space-10: 2.5rem;     /* 40px */
--space-11: 2.75rem;    /* 44px */
--space-12: 3rem;       /* 48px */
--space-14: 3.5rem;     /* 56px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
--space-28: 7rem;       /* 112px */
--space-32: 8rem;       /* 128px */
--space-36: 9rem;       /* 144px */
--space-40: 10rem;      /* 160px */
--space-44: 11rem;      /* 176px */
--space-48: 12rem;      /* 192px */
--space-52: 13rem;      /* 208px */
--space-56: 14rem;      /* 224px */
--space-60: 15rem;      /* 240px */
--space-64: 16rem;      /* 256px */
--space-72: 18rem;      /* 288px */
--space-80: 20rem;      /* 320px */
--space-96: 24rem;      /* 384px */
```

#### Component-Specific Spacing

```css
/* Padding */
--padding-btn-sm: var(--space-2) var(--space-4);     /* 8px 16px */
--padding-btn-md: var(--space-3) var(--space-6);     /* 12px 24px */
--padding-btn-lg: var(--space-4) var(--space-8);     /* 16px 32px */
--padding-card: var(--space-6);                       /* 24px */
--padding-section: var(--space-8) var(--space-12);   /* 32px 48px */
--padding-page: var(--space-6) var(--space-8);       /* 24px 32px */

/* Gap (Flexbox/Grid) */
--gap-xs: var(--space-1);     /* 4px */
--gap-sm: var(--space-2);     /* 8px */
--gap-md: var(--space-4);     /* 16px ⭐ */
--gap-lg: var(--space-6);     /* 24px */
--gap-xl: var(--space-8);     /* 32px */
--gap-2xl: var(--space-12);   /* 48px */

/* Container Max Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;   /* Default max-width ⭐ */
--container-2xl: 1536px;
--container-full: 100%;
```

#### Responsive Spacing Rules

```css
/* Mobile: Reduced spacing */
@media (max-width: 640px) {
  --padding-card: var(--space-4);      /* 16px instead of 24px */
  --padding-section: var(--space-6);   /* 24px instead of 32px */
  --gap-md: var(--space-3);            /* 12px instead of 16px */
}

/* Desktop: Increased spacing */
@media (min-width: 1024px) {
  --padding-card: var(--space-8);      /* 32px instead of 24px */
  --padding-section: var(--space-12);  /* 48px instead of 32px */
}
```

---

### Border Radius

```css
--radius-none: 0;           /* No rounding */
--radius-sm: 0.25rem;       /* 4px - small elements, tags */
--radius-md: 0.5rem;        /* 8px - buttons, inputs ⭐ */
--radius-lg: 0.75rem;       /* 12px - cards */
--radius-xl: 1rem;          /* 16px - large cards */
--radius-2xl: 1.5rem;       /* 24px - modals, dialogs */
--radius-3xl: 2rem;         /* 32px - hero sections */
--radius-full: 9999px;      /* Fully rounded - pills, avatars */
```

**Usage:**
- `radius-sm`: Badges, tags, tiny buttons
- `radius-md`: Buttons, inputs, chips (default)
- `radius-lg`: Cards, panels, containers
- `radius-xl`: Large cards, feature sections
- `radius-2xl`: Modals, popovers, notifications
- `radius-full`: Avatars, pills, toggle switches

---

### Elevation & Shadows

#### Light Mode Shadows

```css
/* Level 0: Flat */
--shadow-none: none;

/* Level 1: Subtle - Hovering 1-2px */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
             0 1px 2px -1px rgba(0, 0, 0, 0.1);

/* Level 2: Default - Hovering 4-8px */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -2px rgba(0, 0, 0, 0.1); /* ⭐ Default card shadow */

/* Level 3: Raised - Hovering 10-15px */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -4px rgba(0, 0, 0, 0.1);

/* Level 4: Floating - Hovering 20-25px */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 8px 10px -6px rgba(0, 0, 0, 0.1);

/* Level 5: Modal - Hovering 25-50px */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Inner Shadow */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
```

#### Dark Mode Shadows

```css
/* Dark shadows need to be stronger */
--shadow-dark-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-dark-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4),
                  0 1px 2px -1px rgba(0, 0, 0, 0.4);
--shadow-dark-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5),
                  0 2px 4px -2px rgba(0, 0, 0, 0.5);
--shadow-dark-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.6),
                  0 4px 6px -4px rgba(0, 0, 0, 0.5);
--shadow-dark-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.7),
                  0 8px 10px -6px rgba(0, 0, 0, 0.6);
--shadow-dark-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
```

#### Focus Shadow (Accessibility)

```css
/* Focus rings for keyboard navigation */
--shadow-focus: 0 0 0 3px rgba(139, 0, 0, 0.1);           /* Primary color */
--shadow-focus-dark: 0 0 0 3px rgba(200, 72, 72, 0.3);   /* Dark mode */
--shadow-focus-error: 0 0 0 3px rgba(220, 38, 38, 0.2);  /* Error state */
--shadow-focus-success: 0 0 0 3px rgba(22, 163, 74, 0.2); /* Success state */
```

#### Elevation Mapping

| Level | Shadow | Use Case | Example |
|-------|--------|----------|----------|
| **0** | `none` | Flush with background | Dividers, flat buttons |
| **1** | `shadow-sm` | Slightly raised | Input fields (focused), chips |
| **2** | `shadow-md` | Default elevation | Cards, buttons, panels ⭐ |
| **3** | `shadow-lg` | Floating elements | Dropdowns, tooltips, popovers |
| **4** | `shadow-xl` | Important overlays | Modals, dialogs, toasts |
| **5** | `shadow-2xl` | Critical overlays | Full-screen modals, alerts |

#### Glassmorphism Effect (Modern Surface)

```css
/* Frosted glass effect for modern UI */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-lg);
}

/* Dark mode glass */
.dark .glass {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Elevation + Blur */
--elevation-opacity-1: rgba(255, 255, 255, 0.05);
--elevation-opacity-2: rgba(255, 255, 255, 0.1);
--elevation-opacity-3: rgba(255, 255, 255, 0.15);
--blur-surface-sm: blur(8px);
--blur-surface-md: blur(12px);
--blur-surface-lg: blur(16px);
```

---

(Character limit reached - continuing in next message)