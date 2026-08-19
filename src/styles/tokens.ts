/**
 * OrderFlow Design Token System
 * 
 * Hospitality-focused, restrained palette with 60/30/10 visual balance:
 * - 60% Warm Neutral Base (Parchment & Warm White)
 * - 30% Deep Charcoal / Espresso & Structured Hairline Borders
 * - 10% Terracotta Brand Accent & Semantic Status Highlights
 */

export const TOKENS = {
  colors: {
    // 60% Neutral Base
    background: '#F5F0E7',
    backgroundSubtle: '#EDE8DF',
    surface: '#FFFDF9',
    surfaceSubtle: '#FBF8F2',
    surfaceDark: '#1E1B18',
    surfaceDarkSubtle: '#26221E',

    // Typography
    ink: '#211F1B',
    muted: '#777067',
    faint: '#AAA298',
    inkLight: '#F5F2EC',
    mutedLight: '#A8A096',

    // Hairlines & Borders
    line: '#DDD6CA',
    lineSubtle: '#E8E2D8',
    lineDark: '#36312B',

    // 10% Brand Accent (Terracotta)
    accent: '#C9532F',
    accentHover: '#B54624',
    accentSoft: '#F0D8CC',
    accentMuted: '#FAF0EB',

    // Semantic Status Tokens
    status: {
      success: {
        text: '#166534',
        bg: '#EBF7EE',
        border: '#BBF7D0',
        dot: '#16A34A',
      },
      warning: {
        text: '#854D0E',
        bg: '#FEF9C3',
        border: '#FDE047',
        dot: '#CA8A04',
      },
      error: {
        text: '#991B1B',
        bg: '#FEF2F2',
        border: '#FECACA',
        dot: '#DC2626',
      },
      info: {
        text: '#1E40AF',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        dot: '#2563EB',
      },
      preparing: {
        text: '#C2410C',
        bg: '#FAF0EB',
        border: '#F4D3C5',
        dot: '#EA580C',
      },
      attention: {
        text: '#6B21A8',
        bg: '#FAF5FF',
        border: '#E9D5FF',
        dot: '#9333EA',
      },
    },
  },

  typography: {
    fontDisplay: 'Georgia, "Times New Roman", serif',
    fontFunctional: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
} as const;
