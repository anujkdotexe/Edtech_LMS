// Resilient Local SVG Avatar Generator
// Works 100% offline with zero dependencies on third-party avatar uptime (e.g. Dicebear)

const PALETTES = [
  { bg1: '#4f46e5', bg2: '#7c3aed', text: '#ffffff', accent: '#a5b4fc' }, // Indigo-Violet
  { bg1: '#0ea5e9', bg2: '#2563eb', text: '#ffffff', accent: '#93c5fd' }, // Sky-Blue
  { bg1: '#10b981', bg2: '#059669', text: '#ffffff', accent: '#a7f3d0' }, // Emerald
  { bg1: '#f59e0b', bg2: '#d97706', text: '#ffffff', accent: '#fde68a' }, // Amber
  { bg1: '#ec4899', bg2: '#be185d', text: '#ffffff', accent: '#fbcfe8' }, // Pink
  { bg1: '#8b5cf6', bg2: '#6d28d9', text: '#ffffff', accent: '#c4b5fd' }, // Purple
  { bg1: '#14b8a6', bg2: '#0f766e', text: '#ffffff', accent: '#99f6e4' }, // Teal
  { bg1: '#f97316', bg2: '#c2410c', text: '#ffffff', accent: '#fed7aa' }, // Orange
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates an offline-safe inline SVG Data URI for any user seed or name.
 */
export function generateLocalAvatarSvg(seed: string = 'learner'): string {
  const hash = hashString(seed.toLowerCase().trim() || 'user');
  const palette = PALETTES[hash % PALETTES.length];

  // Derive initials
  const parts = seed.trim().split(/[\s_-]+/);
  let initials = 'U';
  if (parts.length >= 2 && parts[0] && parts[1]) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts[0]) {
    initials = parts[0].slice(0, 2).toUpperCase();
  }

  // Geometric features based on hash
  const eyeType = hash % 3; // 0 = dots, 1 = happy arcs, 2 = glasses
  const mouthType = (hash >> 2) % 3; // 0 = smile, 1 = grin, 2 = surprised

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
    </defs>
    <!-- Background Circle -->
    <rect width="100" height="100" rx="50" fill="url(#g_${hash})" />
    
    <!-- Subtle Inner Glow / Accents -->
    <circle cx="50" cy="50" r="42" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.3" />
    
    <!-- Character Face or Modern Badge Avatar -->
    <g transform="translate(0, 0)">
      <!-- Eyes -->
      ${
        eyeType === 0
          ? `<circle cx="38" cy="45" r="5" fill="${palette.text}" />
             <circle cx="62" cy="45" r="5" fill="${palette.text}" />`
          : eyeType === 1
          ? `<path d="M 33 46 Q 38 38 43 46" fill="none" stroke="${palette.text}" stroke-width="3.5" stroke-linecap="round" />
             <path d="M 57 46 Q 62 38 67 46" fill="none" stroke="${palette.text}" stroke-width="3.5" stroke-linecap="round" />`
          : `<rect x="30" y="38" width="16" height="13" rx="3" fill="none" stroke="${palette.text}" stroke-width="2.5" />
             <rect x="54" y="38" width="16" height="13" rx="3" fill="none" stroke="${palette.text}" stroke-width="2.5" />
             <line x1="46" y1="44" x2="54" y2="44" stroke="${palette.text}" stroke-width="2.5" />`
      }
      
      <!-- Mouth -->
      ${
        mouthType === 0
          ? `<path d="M 38 62 Q 50 72 62 62" fill="none" stroke="${palette.text}" stroke-width="3.5" stroke-linecap="round" />`
          : mouthType === 1
          ? `<path d="M 36 60 Q 50 75 64 60 Z" fill="${palette.text}" />`
          : `<ellipse cx="50" cy="65" rx="6" ry="8" fill="${palette.text}" />`
      }
      
      <!-- Cheeks -->
      <circle cx="28" cy="54" r="4" fill="${palette.accent}" opacity="0.6" />
      <circle cx="72" cy="54" r="4" fill="${palette.accent}" opacity="0.6" />
    </g>
    
    <!-- Fallback Initials in bottom corner watermark -->
    <text x="50" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="${palette.text}" opacity="0.4" text-anchor="middle" letter-spacing="1">
      ${initials}
    </text>
  </svg>`.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface AvatarSeedPreset {
  id: string;
  name: string;
  url: string;
  dataUri: string;
}

export const AVATAR_SEEDS = [
  'felix',
  'kitty',
  'buddy',
  'sparky',
  'pepper',
  'luna',
  'shadow',
  'rocky',
  'coco',
  'sunny',
  'daisy',
  'rusty',
];

export const LOCAL_AVATAR_PRESETS: AvatarSeedPreset[] = AVATAR_SEEDS.map((seed) => ({
  id: seed,
  name: seed.charAt(0).toUpperCase() + seed.slice(1),
  url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`,
  dataUri: generateLocalAvatarSvg(seed),
}));
