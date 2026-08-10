---
name: Serene Path
colors:
  surface: '#fdf9f3'
  surface-dim: '#dddad4'
  surface-bright: '#fdf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ed'
  surface-container: '#f1ede7'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e6e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#53433f'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f4f0ea'
  outline: '#85736e'
  outline-variant: '#d8c2bc'
  surface-tint: '#8b4e3d'
  primary: '#8b4e3d'
  on-primary: '#ffffff'
  primary-container: '#d68c78'
  on-primary-container: '#5a2718'
  inverse-primary: '#ffb5a1'
  secondary: '#546346'
  on-secondary: '#ffffff'
  secondary-container: '#d5e5c0'
  on-secondary-container: '#586749'
  tertiary: '#715a40'
  on-tertiary: '#ffffff'
  tertiary-container: '#b59a7c'
  on-tertiary-container: '#45321b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a1'
  on-primary-fixed: '#380d03'
  on-primary-fixed-variant: '#6f3728'
  secondary-fixed: '#d7e8c3'
  secondary-fixed-dim: '#bccca8'
  on-secondary-fixed: '#131f08'
  on-secondary-fixed-variant: '#3d4b30'
  tertiary-fixed: '#fdddbc'
  tertiary-fixed-dim: '#dfc1a2'
  on-tertiary-fixed: '#281805'
  on-tertiary-fixed-variant: '#58432b'
  background: '#fdf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e6e2dc'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: 0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.04em
  interactive-child:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin-mobile: 24px
  container-margin-desktop: 80px
  gutter: 24px
  tap-target-min: 64px
  section-gap: 48px
---

## Brand & Style
This design system is built for a therapeutic learning environment, prioritizing sensory regulation and cognitive clarity. The style is **Soft Minimalist** with a **Tactile** edge—focusing on organic warmth rather than clinical coldness. 

The aesthetic avoids the "high-energy" tropes of traditional children's apps (neon colors, bouncing animations, loud patterns) in favor of a "Low-Arousal" visual strategy. It balances clinical credibility for parents and providers with a gentle, non-threatening interface for children. Every element is designed to reduce cognitive load and prevent sensory overwhelm.

## Colors
The palette is rooted in nature and earth tones to promote a calming emotional response. 
- **Primary (Soft Coral/Terracotta):** Used for primary actions and progress indicators. It provides warmth without the urgency of a traditional red.
- **Secondary (Sage Green):** Used for success states, secondary navigation, and calming instructional areas.
- **Tertiary (Warm Sand):** Used for decorative elements or lower-priority interactive areas.
- **Neutral (Warm Cream):** This replaces pure white across all surfaces to reduce glare and visual fatigue.
- **Text (Charcoal Brown):** Replaces pure black (#000000) to maintain high contrast (WCAG AA) while appearing softer to the eye.
- **Error (Amber Clay):** Used for alerts. It signals caution without triggering the "alarm" response associated with bright red.

## Typography
**Plus Jakarta Sans** is the sole typeface, chosen for its friendly, humanist-rounded terminals and exceptional legibility. 

- **Scale:** Font sizes are intentionally oversized. The minimum size for child-facing body text is 20px. 
- **Readability:** Line heights are set to 1.5x-1.6x the font size to ensure clear vertical separation, helping users who struggle with visual tracking.
- **Spacing:** Letter spacing is slightly increased (1% to 4%) across all roles to prevent "character crowding," which can be a barrier for neurodivergent readers.
- **Hierarchy:** Use weight (Medium to Bold) rather than color shifts to denote hierarchy, ensuring information remains accessible in all lighting conditions.

## Layout & Spacing
The layout follows a **Fixed Grid** system to provide a predictable, stable environment. Visual stability is key—elements should not jump or shift unexpectedly.

- **Grid:** A 12-column grid for desktop and a 4-column grid for mobile. Large margins (80px on desktop) are used to create a "sanctuary" for content, preventing the UI from feeling cluttered.
- **Rhythm:** An 8px base unit drives all spacing. 
- **Child-Facing Constraints:** In learning modules, layouts should be centered and singular. Avoid multi-column "sidebar + content" views which can cause split-attention fatigue.
- **Tap Targets:** Every interactive element intended for child use must be at least 64px x 64px, with at least 16px of clear space between adjacent targets.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and extremely soft shadows. 

- **Surfaces:** Use subtle shifts in background color (e.g., a slightly darker cream or very light sand) to define containers rather than hard lines.
- **Shadows:** Avoid high-contrast black shadows. Use "Ambient Glows"—shadows with a large blur radius (24px+), low opacity (8-10%), and a color tint derived from the Primary or Neutral palette (e.g., a soft terracotta-tinted shadow).
- **Interactive State:** When a button is pressed, it should "sink" (reduce shadow) to provide a physical, tactile metaphor of being pushed.

## Shapes
The shape language is defined by the absence of sharp corners. 
- **Standard UI Elements:** Use a 16px radius (`rounded-lg`) for buttons, input fields, and small cards.
- **Large Containers:** Use a 24px-32px radius (`rounded-xl`) for main content areas and modal overlays.
- **Focus States:** Use a thick (3px), solid offset border in the Secondary color for focus states. Do not rely on color change alone.
- **Iconography:** Icons should feature rounded caps and corners, maintaining a consistent stroke weight of 2px for clarity.

## Components
- **Buttons:** Large, high-contrast buttons with 64px height. Primary buttons use the soft terracotta background with white text. Secondary buttons use a thick sage green border.
- **Cards:** Cards should have no borders; instead, use a 1-step darker background color than the page base to create a "well" effect.
- **Input Fields:** Use large, clear labels placed *above* the input. Placeholder text should be 20% darker than the background to ensure it is legible but distinct from user input.
- **Feedback Indicators:** Use the secondary sage green for "correct" or "completed" states. Use the amber clay for "needs attention." Avoid using sound as the only feedback mechanism; always pair with a slow, gentle visual transition.
- **Progress Bars:** Thick (12px), rounded bars. The progress fill should be a solid color (Secondary), while the track is a slightly darker version of the page background.
- **Chips/Tags:** Used for filtering preferences. These should be large (48px height) to ensure ease of selection.