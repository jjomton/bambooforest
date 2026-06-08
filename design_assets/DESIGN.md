---
name: Bamboo Forest Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.03em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  gutter-mobile: 12px
---

## Brand & Style

The design system is built for a contemporary anonymous community, specifically tailored for IT students and professionals. It balances the anonymity of a "bamboo forest" with the professional environment of an education center.

The aesthetic follows a **Minimalist / Corporate Modern** hybrid, inspired by leading Korean fintech and hyper-local apps. It prioritizes clarity, high-quality whitespace, and a sense of "digital hygiene." The emotional response should be one of safety, reliability, and calm. By using a bright, airy palette and soft geometry, the interface reduces the "noise" typical of anonymous boards, fostering a more constructive and trustworthy community dialogue.

## Colors

The palette is anchored by **Trustworthy Blue (#2563EB)**, used strategically for primary actions and brand presence to instill confidence. 

To achieve the "Toss-like" clean aesthetic, the system utilizes a layered grayscale approach:
- **Background:** A very light, cool gray (#F2F4F7) provides a canvas that makes white content cards "pop."
- **Surface:** Pure white (#FFFFFF) is reserved for interactive cards and containers to create a clear visual hierarchy.
- **Text:** High-contrast dark grays for readability, avoiding pure black to reduce eye strain during long reading sessions.

## Typography

This design system uses a dual-font strategy to optimize for both personality and utility. 

**Plus Jakarta Sans** is used for headlines to provide a modern, friendly, and slightly geometric feel. **Inter** is utilized for body text and labels to ensure maximum legibility for Korean and English characters, especially in dense technical discussions or long anonymous posts. 

For the Korean language, line-height is intentionally generous (1.6 for body) to account for the visual complexity of Hangul characters. Negative letter-spacing is applied to headlines to maintain a tight, professional look.

## Layout & Spacing

The system follows a **fluid-first layout** model with an emphasis on mobile accessibility. 

- **Grid:** On mobile, a single-column layout is used with 20px side margins to give the content room to breathe. On desktop, content is centered in a max-width container of 768px (for the feed) to mimic the intimacy of a mobile app.
- **Rhythm:** An 8px base grid drives all spacing decisions.
- **Whitespace:** Generous padding within cards (minimum 20px) is mandatory to prevent the UI from feeling cluttered, even when the board is high-traffic.

## Elevation & Depth

Depth is primarily communicated through **Tonal Layering** rather than heavy shadows. 

- **Level 0 (Background):** The light gray canvas (#F2F4F7).
- **Level 1 (Cards/Containers):** Pure white surfaces that appear to sit flush on the background but are separated by color contrast.
- **Level 2 (Interactive/Floating):** Used for primary buttons or floating action buttons (FABs). These utilize a very soft, diffused shadow (0px 8px 24px rgba(0, 0, 0, 0.04)) to indicate interactability without breaking the minimal aesthetic.

This approach keeps the UI light and fast-loading, focusing the user's attention on the text content rather than the interface chrome.

## Shapes

The design system employs a **Rounded** shape language to maintain its friendly and approachable personality. 

- **Primary Radius:** `1.0rem` (16px) for standard cards and large buttons, effectively creating a `rounded-2xl` look as requested.
- **Small Radius:** `0.5rem` (8px) for input fields and smaller chips.
- **Interactive Elements:** Buttons and input fields should feel "soft" to the touch, reinforcing the safe-space environment of the bamboo forest.

## Components

### Buttons
Primary buttons use the Brand Blue (#2563EB) with white text and 16px corner radius. Secondary buttons should be a soft gray (tint of primary) or ghost buttons with a light border to maintain hierarchy.

### Cards
Cards are the heart of the community. They must be pure white with 16px corner radius. No borders are needed when placed on the gray background. Padding inside cards should be 20px to 24px.

### Inputs
Input fields should use a subtle gray fill (#F9FAFB) with no border in their default state. On focus, they transition to a white background with a 2px Brand Blue border.

### Chips & Tags
Used for categories like \"Career,\" \"Life,\" or \"Study.\" These should have a pill shape (rounded-full) and use low-saturation background colors with slightly darker text for a sophisticated look.

### Anonymous Identifiers
Instead of photos, use high-quality geometric avatars or colored initials inside rounded-xl squares to maintain the professional yet anonymous vibe.

### Lists
Lists do not use heavy dividers. Use 12px to 16px of vertical whitespace between items, or a very faint 1px divider (#F2F4F7).
