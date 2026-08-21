// App-wide typography and sizing standards.
//
// Font family: Roboto everywhere. On Android the system font IS Roboto
// (with real 400/500/700/900 weight files), so plain fontWeight styles
// already render true Roboto weights. Web is pinned to Roboto in
// global.css. Do not set fontFamily on individual Text elements.
//
// Font sizes follow a fixed scale: integers only, never below 10,
// and even numbers from 18 upward.
export const typeScale = {
  micro: 10, // badges, fine print
  caption: 11, // helper text, timestamps
  label: 12, // form labels, chips, tabs
  body: 13, // default body copy
  bodyLg: 14, // emphasized body, buttons
  subtitle: 16, // card titles
  titleSm: 18, // section headings
  title: 20, // screen titles
  headline: 24, // hero headings
  display: 28 // large numerals / hero text
} as const;

// Semantic text roles — the canonical size+weight pair for each role a
// piece of text can play. Screens should pull from here instead of
// hand-picking a fontSize/fontWeight, which is how the app ended up with
// 11 different "screen title" sizes (13-30px) and both '800' and '900'
// used interchangeably for the same visual weight class.
export const textRoles = {
  // Top-of-screen title (back button + title pattern), e.g. "My Orders",
  // "Solar Accessories", "Product Detail".
  screenTitle: { fontSize: typeScale.title, fontWeight: '900' as const },
  // Large centered heading on intro/confirmation/hero screens, e.g.
  // "Log in", "Order Placed!", a survey-confirmation headline.
  heroTitle: { fontSize: typeScale.headline, fontWeight: '900' as const },
  // Mid-page section header, e.g. "Order Progress", "Smart Tools",
  // "Specifications".
  sectionHeading: { fontSize: typeScale.titleSm, fontWeight: '900' as const },
  // One-line description directly under a title or heading.
  subtitle: { fontSize: typeScale.body, fontWeight: '600' as const },
  // Product/category/brand card name.
  cardTitle: { fontSize: typeScale.bodyLg, fontWeight: '800' as const },
  // Normal paragraph/body copy.
  body: { fontSize: typeScale.body, fontWeight: '400' as const },
  // Meta text, timestamps, helper text.
  caption: { fontSize: typeScale.caption, fontWeight: '600' as const },
  // Form labels, chips, tab labels, badges.
  label: { fontSize: typeScale.label, fontWeight: '700' as const }
} as const;

// Icons snap to the 4pt grid.
export const iconSizes = {
  xs: 12, // inline with captions
  sm: 16, // inline with body text, list chevrons
  md: 20, // default action icons, headers
  lg: 24, // tab bar, primary actions
  xl: 28, // feature tiles
  hero: 32 // empty states, hero cards
} as const;

// Buttons: minimum 48dp touch target for primary actions (Material),
// 44dp absolute minimum for secondary/compact controls.
export const buttonSizes = {
  primaryHeight: 48,
  compactHeight: 44,
  minTouchTarget: 44,
  iconButton: 44
} as const;
