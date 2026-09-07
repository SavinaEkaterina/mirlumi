export type LumiState =
  | 'neutral'
  | 'happy'
  | 'support'
  | 'thinking'
  | 'surprised'
  | 'retry'
  | 'clap'
  | 'victory'
  | 'rest'
  | 'attention'
  | 'speaking';

export const LUMI_STATES: LumiState[] = [
  'neutral',
  'happy',
  'support',
  'thinking',
  'surprised',
  'retry',
  'clap',
  'victory',
  'rest',
  'attention',
  'speaking',
];
const withBaseUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
export const LUMI_ASSETS: Record<LumiState, string> = {
  neutral: withBaseUrl('/lumi/character/lumi_neutral.webp'),
happy: withBaseUrl('/lumi/character/lumi_happy.webp'),
support: withBaseUrl('/lumi/character/lumi_support.webp'),
thinking: withBaseUrl('/lumi/character/lumi_thinking.webp'),
surprised: withBaseUrl('/lumi/character/lumi_surprised.webp'),
retry: withBaseUrl('/lumi/character/lumi_retry.webp'),
clap: withBaseUrl('/lumi/character/lumi_clap.webp'),
victory: withBaseUrl('/lumi/character/lumi_victory.webp'),
rest: withBaseUrl('/lumi/character/lumi_rest.webp'),
attention: withBaseUrl('/lumi/character/lumi_attention.webp'),
speaking: withBaseUrl('/lumi/character/lumi_speaking.webp'),
};

export const LUMI_DANCE_VIDEO = withBaseUrl('/lumi/character/dance.mp4');

const STATE_ALIASES: Record<string, LumiState> = {
  normal: 'neutral',
  idle: 'neutral',
  gentle: 'support',
  cheering: 'clap',
  encouraging: 'support',
  explaining: 'speaking',
  talking: 'speaking',
  curious: 'thinking',
  sad: 'retry',
  celebrating: 'victory',
};

export const normalizeLumiState = (state: string | undefined | null): LumiState => {
  if (!state) return 'neutral';
  const lower = state.toLowerCase().trim();
  if (lower in LUMI_ASSETS) {
    return lower as LumiState;
  }
  if (lower in STATE_ALIASES) {
    return STATE_ALIASES[lower];
  }
  return 'neutral';
};

export const getLumiAssetPath = (state: string | undefined | null): string => {
  const canonicalState = normalizeLumiState(state);
  return LUMI_ASSETS[canonicalState] || LUMI_ASSETS.neutral;
};

// =========================================================
// LUMI VISUAL ASSET LIBRARY & REGISTRY
// =========================================================

export type LumiAssetCategory =
  | 'characters'
  | 'objects'
  | 'shapes'
  | 'food'
  | 'transport'
  | 'nature'
  | 'animals'
  | 'special';

export type LumiAssetColor =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'brown'
  | 'orange'
  | 'purple'
  | 'multicolor'
  | 'none';

export type LumiAssetSize = 'small' | 'medium' | 'large';

export interface LumiAssetData {
  id: string;
  name: string;
  type: string; // e.g. "square", "car", "ball"
  category: LumiAssetCategory;
  color: LumiAssetColor;
  src: string; // SVG Data URI or image path
  filePath?: string; // Canonical file path under /public/lumi/
  assetType: 'image' | 'svg';
  defaultSize: LumiAssetSize;
  needsCleanup?: boolean;
}

// Color Palette Definition for crisp vector SVG rendering
const COLOR_HEX: Record<string, { fill: string; stroke: string; lightFill?: string }> = {
  red: { fill: '#ef4444', stroke: '#b91c1c', lightFill: '#fca5a5' },
  blue: { fill: '#2563eb', stroke: '#1d4ed8', lightFill: '#93c5fd' },
  yellow: { fill: '#eab308', stroke: '#a16207', lightFill: '#fde047' },
  green: { fill: '#22c55e', stroke: '#15803d', lightFill: '#86efac' },
  brown: { fill: '#854d0e', stroke: '#543109', lightFill: '#ca8a04' },
  orange: { fill: '#f97316', stroke: '#c2410c', lightFill: '#fdba74' },
  purple: { fill: '#a855f7', stroke: '#7e22ce', lightFill: '#d8b4fe' },
  multicolor: { fill: '#ec4899', stroke: '#be185d', lightFill: '#f472b6' },
  none: { fill: '#64748b', stroke: '#334155', lightFill: '#cbd5e1' },
};

/**
 * Creates high quality, transparent vector SVG Data URIs for items.
 * Ensures 100% vector scalability, crisp edges, and no missing image 404s.
 */
function generateSvgDataUri(type: string, color: string): string {
  const c = COLOR_HEX[color] || COLOR_HEX.red;
  const fill = c.fill;
  const stroke = c.stroke;
  const light = c.lightFill || fill;

  let svgContent = '';

  switch (type) {
    // --- SHAPES ---
    case 'square':
      svgContent = `<rect x="12" y="12" width="76" height="76" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
      <rect x="20" y="20" width="30" height="30" rx="8" fill="white" opacity="0.25"/>`;
      break;

    case 'circle':
      svgContent = `<circle cx="50" cy="50" r="38" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
      <ellipse cx="38" cy="36" rx="12" ry="8" fill="white" opacity="0.3" transform="rotate(-20 38 36)"/>`;
      break;

    case 'triangle':
      svgContent = `<path d="M 50 12 L 88 82 A 6 6 0 0 1 82 90 L 18 90 A 6 6 0 0 1 12 82 Z" fill="${fill}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M 46 24 L 32 68 L 22 68 Z" fill="white" opacity="0.25"/>`;
      break;

    case 'rectangle':
      svgContent = `<rect x="8" y="24" width="84" height="52" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
      <rect x="16" y="32" width="30" height="18" rx="6" fill="white" opacity="0.25"/>`;
      break;

    case 'star':
      svgContent = `<polygon points="50,8 63,35 93,38 71,58 78,88 50,72 22,88 29,58 7,38 37,35" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>
      <polygon points="50,18 57,36 72,38 60,50 50,60" fill="white" opacity="0.3"/>`;
      break;

    case 'bunny':
      svgContent = `
      <ellipse cx="36" cy="22" rx="8" ry="20" fill="${fill}" stroke="${stroke}" stroke-width="4" transform="rotate(-8 36 22)" />
      <ellipse cx="64" cy="22" rx="8" ry="20" fill="${fill}" stroke="${stroke}" stroke-width="4" transform="rotate(8 64 22)" />
      <ellipse cx="36" cy="22" rx="4" ry="14" fill="${light}" transform="rotate(-8 36 22)" />
      <ellipse cx="64" cy="22" rx="4" ry="14" fill="${light}" transform="rotate(8 64 22)" />
      <circle cx="50" cy="58" r="28" fill="${fill}" stroke="${stroke}" stroke-width="5" />
      <circle cx="40" cy="52" r="4" fill="#1e293b" />
      <circle cx="60" cy="52" r="4" fill="#1e293b" />
      <ellipse cx="50" cy="60" rx="3" ry="2" fill="#f43f5e" />
      <path d="M 46 64 Q 50 68 54 64" stroke="#1e293b" stroke-width="3" fill="none" stroke-linecap="round" />
      <ellipse cx="32" cy="58" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />
      <ellipse cx="68" cy="58" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />`;
      break;

    // --- OBJECTS ---
    case 'ball':
      svgContent = `<circle cx="50" cy="50" r="38" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
      <path d="M 18 36 Q 50 20 82 36" fill="none" stroke="${light}" stroke-width="8" stroke-linecap="round"/>
      <path d="M 18 64 Q 50 80 82 64" fill="none" stroke="${light}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="36" cy="32" rx="8" ry="5" fill="white" opacity="0.35"/>`;
      break;

    case 'car':
      svgContent = `
      <path d="M 15 55 L 25 35 Q 30 25 45 25 L 65 25 Q 75 25 82 38 L 90 55 Q 95 55 95 68 L 95 72 Q 95 78 88 78 L 12 78 Q 5 78 5 72 L 5 68 Q 5 55 15 55 Z" fill="${fill}" stroke="${stroke}" stroke-width="5"/>
      <path d="M 28 35 L 45 32 L 45 52 L 20 52 Z" fill="#e0f2fe" stroke="${stroke}" stroke-width="3"/>
      <path d="M 52 32 L 72 35 L 82 52 L 52 52 Z" fill="#e0f2fe" stroke="${stroke}" stroke-width="3"/>
      <circle cx="28" cy="76" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
      <circle cx="28" cy="76" r="4" fill="#94a3b8"/>
      <circle cx="72" cy="76" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
      <circle cx="72" cy="76" r="4" fill="#94a3b8"/>`;
      break;

    case 'cube':
      svgContent = `
      <path d="M 50 10 L 85 28 L 50 46 L 15 28 Z" fill="${light}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 15 28 L 50 46 L 50 86 L 15 68 Z" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 50 46 L 85 28 L 85 68 L 50 86 Z" fill="${stroke}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`;
      break;

    case 'book':
      svgContent = `
      <rect x="18" y="15" width="64" height="70" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="5"/>
      <rect x="25" y="15" width="57" height="70" rx="3" fill="#f8fafc" stroke="${stroke}" stroke-width="3"/>
      <line x1="25" y1="15" x2="25" y2="85" stroke="${stroke}" stroke-width="4"/>
      <line x1="38" y1="32" x2="72" y2="32" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
      <line x1="38" y1="46" x2="68" y2="46" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
      <line x1="38" y1="60" x2="60" y2="60" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>`;
      break;

    case 'teddy':
      svgContent = `
      <circle cx="25" cy="22" r="13" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <circle cx="75" cy="22" r="13" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <circle cx="25" cy="22" r="7" fill="${light}"/>
      <circle cx="75" cy="22" r="7" fill="${light}"/>
      <ellipse cx="50" cy="55" rx="30" ry="26" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <circle cx="50" cy="42" r="22" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <ellipse cx="50" cy="47" rx="10" ry="7" fill="${light}"/>
      <circle cx="50" cy="44" r="3" fill="#1e293b"/>
      <circle cx="42" cy="38" r="3" fill="#1e293b"/>
      <circle cx="58" cy="38" r="3" fill="#1e293b"/>`;
      break;

    case 'cup':
      svgContent = `
      <path d="M 22 25 L 28 72 Q 30 82 50 82 Q 70 82 72 72 L 78 25 Z" fill="${fill}" stroke="${stroke}" stroke-width="5"/>
      <path d="M 74 32 C 92 32 92 62 72 64" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="50" cy="25" rx="28" ry="6" fill="${light}" stroke="${stroke}" stroke-width="3"/>`;
      break;

    case 'sofa':
      svgContent = `
      <rect x="15" y="45" width="70" height="28" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="5"/>
      <rect x="10" y="32" width="12" height="36" rx="6" fill="${light}" stroke="${stroke}" stroke-width="4"/>
      <rect x="78" y="32" width="12" height="36" rx="6" fill="${light}" stroke="${stroke}" stroke-width="4"/>
      <rect x="20" y="20" width="60" height="28" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <line x1="20" y1="73" x2="20" y2="85" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
      <line x1="80" y1="73" x2="80" y2="85" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>`;
      break;

    case 'pillow':
      svgContent = `
      <rect x="15" y="25" width="70" height="50" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="5"/>
      <path d="M 25 35 Q 50 48 75 35" fill="none" stroke="${light}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
      <path d="M 25 65 Q 50 52 75 65" fill="none" stroke="${light}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
      break;

    case 'flower':
      svgContent = `
      <circle cx="50" cy="30" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="70" cy="50" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="50" cy="70" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="30" cy="50" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="64" cy="36" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="64" cy="64" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="36" cy="64" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="36" cy="36" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="50" cy="50" r="14" fill="#eab308" stroke="#a16207" stroke-width="3"/>`;
      break;

    case 'picture':
      svgContent = `
      <rect x="12" y="18" width="76" height="64" rx="8" fill="#fef3c7" stroke="${stroke}" stroke-width="5"/>
      <rect x="18" y="24" width="64" height="52" rx="4" fill="#e0f2fe" stroke="${stroke}" stroke-width="3"/>
      <circle cx="32" cy="38" r="7" fill="#eab308"/>
      <polygon points="20,72 40,48 56,64 68,54 80,72" fill="${fill}"/>`;
      break;

    // --- SINGLE COLOR ITEMS ---
    case 'carrot':
      svgContent = `
      <path d="M 30 18 Q 20 8 10 14 Q 25 25 35 25" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
      <path d="M 35 25 Q 65 30 85 80 Q 50 65 35 25 Z" fill="#f97316" stroke="#c2410c" stroke-width="4" stroke-linejoin="round"/>
      <line x1="45" y1="38" x2="55" y2="42" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>
      <line x1="55" y1="52" x2="65" y2="56" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>`;
      break;

    case 'cucumber':
      svgContent = `
      <path d="M 18 35 Q 22 15 50 25 Q 82 35 82 60 Q 50 80 18 55 Q 12 45 18 35 Z" fill="#15803d" stroke="#166534" stroke-width="4"/>
      <circle cx="30" cy="38" r="2" fill="#86efac"/>
      <circle cx="48" cy="45" r="2" fill="#86efac"/>
      <circle cx="65" cy="52" r="2" fill="#86efac"/>`;
      break;

    case 'tree':
      svgContent = `
      <rect x="42" y="55" width="16" height="35" rx="3" fill="#78350f" stroke="#451a03" stroke-width="4"/>
      <circle cx="50" cy="38" r="28" fill="#15803d" stroke="#166534" stroke-width="5"/>
      <circle cx="35" cy="48" r="20" fill="#22c55e" stroke="#15803d" stroke-width="4"/>
      <circle cx="65" cy="48" r="20" fill="#22c55e" stroke="#15803d" stroke-width="4"/>`;
      break;

    case 'orange':
      svgContent = `
      <circle cx="50" cy="52" r="35" fill="#f97316" stroke="#ea580c" stroke-width="5"/>
      <circle cx="42" cy="32" r="3" fill="#ea580c" opacity="0.6"/>
      <circle cx="58" cy="42" r="3" fill="#ea580c" opacity="0.6"/>
      <path d="M 50 17 Q 55 8 68 12 Q 58 20 50 17 Z" fill="#22c55e" stroke="#15803d" stroke-width="3"/>`;
      break;

    case 'cat':
      svgContent = `
      <polygon points="22,18 36,38 18,40" fill="#f97316" stroke="#ea580c" stroke-width="3"/>
      <polygon points="78,18 64,38 82,40" fill="#f97316" stroke="#ea580c" stroke-width="3"/>
      <circle cx="50" cy="55" r="30" fill="#f97316" stroke="#ea580c" stroke-width="4"/>
      <circle cx="38" cy="48" r="4" fill="#1e293b"/>
      <circle cx="62" cy="48" r="4" fill="#1e293b"/>
      <polygon points="50,56 46,62 54,62" fill="#f43f5e"/>
      <line x1="20" y1="58" x2="35" y2="58" stroke="#1e293b" stroke-width="3"/>
      <line x1="80" y1="58" x2="65" y2="58" stroke="#1e293b" stroke-width="3"/>`;
      break;

    case 'sun':
      svgContent = `
      <circle cx="50" cy="50" r="24" fill="#facc15" stroke="#ca8a04" stroke-width="4"/>
      <g stroke="#eab308" stroke-width="5" stroke-linecap="round">
        <line x1="50" y1="12" x2="50" y2="20"/>
        <line x1="50" y1="80" x2="50" y2="88"/>
        <line x1="12" y1="50" x2="20" y2="50"/>
        <line x1="80" y1="50" x2="88" y2="50"/>
        <line x1="23" y1="23" x2="29" y2="29"/>
        <line x1="71" y1="71" x2="77" y2="77"/>
        <line x1="23" y1="77" x2="29" y2="71"/>
        <line x1="71" y1="29" x2="77" y2="23"/>
      </g>`;
      break;

    case 'cloud':
      svgContent = `
      <path d="M 25 68 Q 12 68 12 52 Q 12 38 28 35 Q 38 18 58 22 Q 74 15 82 32 Q 92 40 88 56 Q 92 68 76 68 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="4" stroke-linejoin="round"/>`;
      break;

    case 'balloon':
      svgContent = `
      <path d="M 50 82 Q 45 88 52 96" stroke="#64748b" stroke-width="3" fill="none"/>
      <polygon points="50,78 45,84 55,84" fill="#ef4444"/>
      <ellipse cx="50" cy="42" rx="32" ry="38" fill="#ef4444" stroke="#b91c1c" stroke-width="4"/>
      <ellipse cx="38" cy="28" rx="8" ry="12" fill="white" opacity="0.35" transform="rotate(-20 38 28)"/>`;
      break;

    case 'watermelon':
      svgContent = `
      <path d="M 12 30 A 42 42 0 0 0 88 30 Z" fill="#22c55e" stroke="#15803d" stroke-width="4"/>
      <path d="M 18 30 A 35 35 0 0 0 82 30 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/>
      <circle cx="36" cy="42" r="2.5" fill="#1e293b"/>
      <circle cx="50" cy="52" r="2.5" fill="#1e293b"/>
      <circle cx="64" cy="42" r="2.5" fill="#1e293b"/>`;
      break;

    case 'kite':
      svgContent = `
      <polygon points="50,10 82,45 50,88 18,45" fill="#ec4899" stroke="#be185d" stroke-width="4"/>
      <line x1="50" y1="10" x2="50" y2="88" stroke="#f472b6" stroke-width="3"/>
      <line x1="18" y1="45" x2="82" y2="45" stroke="#f472b6" stroke-width="3"/>
      <path d="M 50 88 Q 62 94 58 100" stroke="#be185d" stroke-width="2" fill="none"/>`;
      break;

    case 'bus':
      svgContent = `
      <rect x="10" y="22" width="80" height="50" rx="10" fill="#eab308" stroke="#ca8a04" stroke-width="5"/>
      <rect x="18" y="30" width="16" height="18" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <rect x="42" y="30" width="16" height="18" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <rect x="66" y="30" width="16" height="18" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
      <circle cx="28" cy="72" r="9" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
      <circle cx="72" cy="72" r="9" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>`;
      break;

    case 'airplane':
      svgContent = `
      <path d="M 10 50 Q 30 38 75 42 L 88 22 L 95 24 L 88 45 L 98 48 Q 100 50 98 52 L 88 55 L 95 76 L 88 78 L 75 58 Q 30 62 10 50 Z" fill="#2563eb" stroke="#1d4ed8" stroke-width="3"/>
      <circle cx="35" cy="48" r="3" fill="#e0f2fe"/>
      <circle cx="48" cy="48" r="3" fill="#e0f2fe"/>
      <circle cx="61" cy="48" r="3" fill="#e0f2fe"/>`;
      break;

    case 'tomato':
      svgContent = `
      <circle cx="50" cy="54" r="32" fill="#ef4444" stroke="#b91c1c" stroke-width="4"/>
      <path d="M 50 22 L 44 28 L 50 32 L 56 28 Z" fill="#22c55e"/>
      <path d="M 50 22 Q 40 12 30 18 Q 42 22 50 22 Z" fill="#15803d"/>
      <path d="M 50 22 Q 60 12 70 18 Q 58 22 50 22 Z" fill="#15803d"/>`;
      break;

    case 'moon':
      svgContent = `
      <path d="M 65 18 A 32 32 0 1 1 28 72 A 28 28 0 0 0 65 18 Z" fill="#fde047" stroke="#eab308" stroke-width="4"/>`;
      break;

    case 'apple':
      svgContent = `
      <path d="M50 22 C 52 10, 58 8, 62 10" stroke="#78350F" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M52 18 C 65 12, 70 20, 52 22 Z" fill="#10B981" />
      <path d="M 50 28 C 30 18, 12 35, 18 60 C 22 80, 42 90, 50 82 C 58 90, 78 80, 82 60 C 88 35, 70 18, 50 28 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="4" />
      <ellipse cx="34" cy="42" rx="6" ry="12" transform="rotate(-25 34 42)" fill="white" opacity="0.35" />`;
      break;

    case 'pear':
      svgContent = `
      <path d="M50 20 C 52 10, 58 8, 62 10" stroke="#78350F" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M52 16 C 65 10, 70 18, 52 20 Z" fill="#10B981" />
      <path d="M 50 24 C 38 24, 34 42, 22 58 C 12 72, 28 90, 50 90 C 72 90, 88 72, 78 58 C 66 42, 62 24, 50 24 Z" fill="${fill}" stroke="${stroke}" stroke-width="4" />
      <ellipse cx="40" cy="52" rx="5" ry="10" transform="rotate(-15 40 52)" fill="white" opacity="0.3" />`;
      break;

    case 'plum':
      svgContent = `
      <ellipse cx="50" cy="54" rx="30" ry="36" fill="#8B5CF6" stroke="#6D28D9" stroke-width="4" />
      <path d="M 50 18 Q 50 54 42 85" stroke="#6D28D9" stroke-width="3" fill="none" opacity="0.5" />
      <ellipse cx="36" cy="40" rx="5" ry="10" transform="rotate(-15 36 40)" fill="white" opacity="0.3" />`;
      break;

    case 'banana':
      svgContent = `
      <path d="M 22 25 C 40 45, 65 82, 85 62 C 60 92, 28 65, 18 35 Z" fill="#F59E0B" stroke="#B45309" stroke-width="4" />
      <path d="M 22 25 C 20 18, 26 15, 28 20 Z" fill="#78350F" />
      <path d="M 85 62 C 88 64, 85 68, 82 66 Z" fill="#78350F" />`;
      break;

    case 'dog':
      svgContent = `
      <circle cx="50" cy="50" r="32" fill="#D97706" stroke="#B45309" stroke-width="4" />
      <path d="M 18 30 C 10 50, 20 65, 26 50 Z" fill="#92400E" />
      <path d="M 82 30 C 90 50, 80 65, 74 50 Z" fill="#92400E" />
      <ellipse cx="50" cy="58" rx="14" ry="10" fill="#FEF3C7" />
      <ellipse cx="50" cy="54" rx="5" ry="3.5" fill="#1E293B" />
      <circle cx="38" cy="44" r="4" fill="#1E293B" />
      <circle cx="62" cy="44" r="4" fill="#1E293B" />`;
      break;

    case 'fish':
      svgContent = `
      <polygon points="20,50 8,30 8,70" fill="#0284C7" stroke="#0369A1" stroke-width="3" />
      <ellipse cx="54" cy="50" rx="32" ry="22" fill="#38BDF8" stroke="#0369A1" stroke-width="4" />
      <circle cx="70" cy="44" r="4" fill="#1E293B" />
      <circle cx="71" cy="42" r="1.5" fill="white" />
      <path d="M 44 40 Q 50 50 44 60" stroke="#0284C7" stroke-width="3" fill="none" />`;
      break;

    case 'bird':
      svgContent = `
      <circle cx="46" cy="50" r="26" fill="#3B82F6" stroke="#1D4ED8" stroke-width="4" />
      <polygon points="70,46 88,52 70,58" fill="#F59E0B" />
      <circle cx="56" cy="42" r="3.5" fill="#1E293B" />
      <path d="M 30 52 C 20 62, 10 50, 22 42 Z" fill="#1D4ED8" />`;
      break;

    case 'bicycle':
      svgContent = `
      <circle cx="26" cy="62" r="18" stroke="#334155" stroke-width="5" fill="none" />
      <circle cx="74" cy="62" r="18" stroke="#334155" stroke-width="5" fill="none" />
      <path d="M 26 62 L 48 62 L 62 40 L 74 62" stroke="#EF4444" stroke-width="5" fill="none" />
      <path d="M 48 62 L 40 40 L 32 40" stroke="#EF4444" stroke-width="5" fill="none" />`;
      break;

    case 'traffic_light':
      svgContent = `
      <rect x="32" y="10" width="36" height="80" rx="10" fill="#1E293B" stroke="#0F172A" stroke-width="4" />
      <circle cx="50" cy="25" r="10" fill="#EF4444" stroke="#B91C1C" stroke-width="2" />
      <circle cx="50" cy="50" r="10" fill="#EAB308" stroke="#CA8A04" stroke-width="2" />
      <circle cx="50" cy="75" r="10" fill="#22C55E" stroke="#15803D" stroke-width="2" />`;
      break;

    case 'lamp':
      svgContent = `
      <path d="M 32 45 L 68 45 L 62 18 L 38 18 Z" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <rect x="47" y="45" width="6" height="30" fill="#78350f"/>
      <ellipse cx="50" cy="78" rx="18" ry="6" fill="#78350f"/>`;
      break;

    case 'clock':
      svgContent = `
      <circle cx="50" cy="50" r="36" fill="#f8fafc" stroke="${fill}" stroke-width="6"/>
      <path d="M 50 50 L 50 26 M 50 50 L 68 50" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="4" fill="#1e293b"/>`;
      break;

    case 'backpack':
      svgContent = `
      <rect x="25" y="30" width="50" height="55" rx="15" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
      <rect x="35" y="55" width="30" height="22" rx="6" fill="white" opacity="0.3" stroke="${stroke}" stroke-width="2"/>
      <path d="M 38 30 C 38 18 62 18 62 30" stroke="${stroke}" stroke-width="4" fill="none"/>`;
      break;

    default:
      svgContent = `<circle cx="50" cy="50" r="36" fill="${fill}" stroke="${stroke}" stroke-width="5"/>`;
      break;
  }

  const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgFull)}`;
}

// ---------------------------------------------------------
// REGISTRY ITEMS DEFINITION
// ---------------------------------------------------------

export const LUMI_ASSET_REGISTRY: LumiAssetData[] = [
  // --- SHAPES (3D PNG assets in /public/lumi/shapes/) ---
  ...(['square', 'circle', 'triangle', 'rectangle', 'star'] as const).flatMap((shape) => {
    const names: Record<string, string> = {
      square: 'Квадрат',
      circle: 'Круг',
      triangle: 'Треугольник',
      rectangle: 'Прямоугольник',
      star: 'Звезда',
    };
    const colors: LumiAssetColor[] = ['red', 'blue', 'yellow', 'green'];
    return colors.map((color) => ({
      id: `lumi_${shape}_${color}`,
      name: names[shape] || shape,
      type: shape,
      category: 'shapes' as LumiAssetCategory,
      color,
      src: generateSvgDataUri(shape, color),
      filePath: `/lumi/shapes/${shape}/lumi_${shape}_${color}.png`,
      assetType: 'image' as const,
      defaultSize: 'medium' as LumiAssetSize,
    }));
  }),

  // STAR (Base entry)
  { id: 'lumi_star', name: 'Звезда', type: 'star', category: 'shapes', color: 'red', src: generateSvgDataUri('star', 'red'), filePath: '/lumi/shapes/star/lumi_star_red.png', assetType: 'image', defaultSize: 'medium' },

  // BUNNY (Physical files exist in /public/lumi/objects/bunny/)
  ...(['red', 'blue', 'yellow', 'green'] as LumiAssetColor[]).map((color) => ({
    id: `lumi_bunny_${color}`,
    name: 'Зайчик',
    type: 'bunny',
    category: 'objects' as LumiAssetCategory,
    color,
    src: generateSvgDataUri('bunny', color),
    filePath: `/lumi/objects/bunny/lumi_bunny_${color}.webp`,
    assetType: 'image' as const,
    defaultSize: 'medium' as LumiAssetSize,
  })),

  // --- OBJECTS WITH PHYSICAL FILES: Ball, Car, Book, Cup, Sofa, Pillow, Flower, Picture ---
  ...(['ball', 'car', 'book', 'cup', 'sofa', 'pillow', 'flower', 'picture'] as const).flatMap((type) => {
    const names: Record<string, string> = {
      ball: 'Мяч',
      car: 'Машинка',
      book: 'Книга',
      cup: 'Чашка',
      sofa: 'Диван',
      pillow: 'Подушка',
      flower: 'Цветок',
      picture: 'Картина',
    };
    const colors: LumiAssetColor[] = ['red', 'blue', 'yellow', 'green'];
    return colors.map((color) => ({
      id: `lumi_${type}_${color}`,
      name: names[type] || type,
      type,
      category: (type === 'car' ? 'transport' : type === 'flower' ? 'nature' : 'objects') as LumiAssetCategory,
      color,
      src: generateSvgDataUri(type, color),
      filePath: type === 'ball' 
        ? `/lumi/objects/ball/lumi_ball_${color}.png`
        : `/lumi/objects/${type}/lumi_${type}_${color}.webp`,
      assetType: 'image' as const,
      defaultSize: 'medium' as LumiAssetSize,
    }));
  }),

  // CUBE (3D PNG assets in /public/lumi/objects/cube/)
  ...(['red', 'blue', 'yellow', 'green'] as LumiAssetColor[]).map((color) => ({
    id: `lumi_cube_${color}`,
    name: 'Кубик',
    type: 'cube',
    category: 'objects' as LumiAssetCategory,
    color,
    src: generateSvgDataUri('cube', color),
    filePath: `/lumi/objects/cube/lumi_cube_${color}.png`,
    assetType: 'image' as const,
    defaultSize: 'medium' as LumiAssetSize,
  })),

  // TEDDY (Physical files exist in /public/lumi/objects/teddy/)
  ...(['blue', 'brown', 'green', 'yellow', 'red'] as LumiAssetColor[]).map((color) => ({
    id: `lumi_teddy_${color}`,
    name: 'Мишка',
    type: 'teddy',
    category: 'objects' as LumiAssetCategory,
    color,
    src: generateSvgDataUri('teddy', color),
    filePath: color === 'red' ? `/lumi/objects/teddy/lumi_teddy_red.png` : `/lumi/objects/teddy/lumi_teddy_${color}.webp`,
    assetType: 'image' as const,
    defaultSize: 'medium' as LumiAssetSize,
  })),

  // --- FOOD (Physical files directly in /public/lumi/food/) ---
  { id: 'lumi_apple', name: 'Яблоко', type: 'apple', category: 'food', color: 'red', src: generateSvgDataUri('apple', 'red'), filePath: '/lumi/food/lumi_apple.webp', assetType: 'image', defaultSize: 'medium' },
  ...(['red', 'blue', 'yellow', 'green'] as LumiAssetColor[]).map((color) => ({
    id: `lumi_apple_${color}`,
    name: 'Яблоко',
    type: 'apple',
    category: 'food' as LumiAssetCategory,
    color,
    src: generateSvgDataUri('apple', color),
    filePath: `/lumi/food/lumi_apple_${color}.png`,
    assetType: 'image' as const,
    defaultSize: 'medium' as LumiAssetSize,
  })),
  { id: 'lumi_pear', name: 'Груша', type: 'pear', category: 'food', color: 'green', src: generateSvgDataUri('pear', 'green'), filePath: '/lumi/food/lumi_pear.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_plum', name: 'Слива', type: 'plum', category: 'food', color: 'purple', src: generateSvgDataUri('plum', 'purple'), filePath: '/lumi/food/lumi_plum.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_banana', name: 'Банан', type: 'banana', category: 'food', color: 'yellow', src: generateSvgDataUri('banana', 'yellow'), filePath: '/lumi/food/lumi_banana.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_orange', name: 'Апельсин', type: 'orange', category: 'food', color: 'orange', src: generateSvgDataUri('orange', 'orange'), filePath: '/lumi/food/lumi_orange.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_tomato', name: 'Помидор', type: 'tomato', category: 'food', color: 'red', src: '/lumi/food/lumi_tomato.webp', filePath: '/lumi/food/lumi_tomato.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_carrot', name: 'Морковка', type: 'carrot', category: 'food', color: 'orange', src: generateSvgDataUri('carrot', 'orange'), filePath: '/lumi/food/lumi_carrot.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_cucumber', name: 'Огурец', type: 'cucumber', category: 'food', color: 'green', src: generateSvgDataUri('cucumber', 'green'), filePath: '/lumi/food/lumi_cucumber.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_watermelon', name: 'Арбуз', type: 'watermelon', category: 'food', color: 'green', src: generateSvgDataUri('watermelon', 'green'), filePath: '/lumi/food/lumi_watermelon.webp', assetType: 'image', defaultSize: 'medium' },

  // --- ADDITIONAL OBJECTS (3D PNG assets exist in /public/lumi/objects/) ---
  ...(['lamp', 'clock', 'backpack'] as const).flatMap((type) => {
    const names: Record<string, string> = {
      lamp: 'Лампа',
      clock: 'Часы',
      backpack: 'Рюкзак',
    };
    const colors: LumiAssetColor[] = ['red', 'blue', 'yellow', 'green'];
    return colors.map((color) => ({
      id: `lumi_${type}_${color}`,
      name: names[type] || type,
      type,
      category: 'objects' as LumiAssetCategory,
      color,
      src: generateSvgDataUri(type, color),
      filePath: `/lumi/objects/${type}/lumi_${type}_${color}.png`,
      assetType: 'image' as const,
      defaultSize: 'medium' as LumiAssetSize,
    }));
  }),

  // --- TRANSPORT (Physical WebP files exist in /public/lumi/transport/) ---
  { id: 'lumi_bicycle', name: 'Велосипед', type: 'bicycle', category: 'transport', color: 'red', src: generateSvgDataUri('bicycle', 'red'), filePath: '/lumi/transport/lumi_bicycle.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_bus', name: 'Автобус', type: 'bus', category: 'transport', color: 'yellow', src: generateSvgDataUri('bus', 'yellow'), filePath: '/lumi/transport/lumi_bus.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_airplane', name: 'Самолёт', type: 'airplane', category: 'transport', color: 'blue', src: generateSvgDataUri('airplane', 'blue'), filePath: '/lumi/transport/lumi_airplane.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_kite', name: 'Воздушный змей', type: 'kite', category: 'transport', color: 'multicolor', src: generateSvgDataUri('kite', 'multicolor'), filePath: '/lumi/transport/lumi_kite.webp', assetType: 'image', defaultSize: 'medium' },

  // --- NATURE (Physical files in /public/lumi/nature/) ---
  { id: 'lumi_tree', name: 'Дерево', type: 'tree', category: 'nature', color: 'green', src: generateSvgDataUri('tree', 'green'), filePath: '/lumi/nature/lumi_tree.webp', assetType: 'image', defaultSize: 'large' },
  { id: 'lumi_sun', name: 'Солнышко', type: 'sun', category: 'nature', color: 'yellow', src: generateSvgDataUri('sun', 'yellow'), filePath: '/lumi/nature/lumi_sun.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_cloud', name: 'Облачко', type: 'cloud', category: 'nature', color: 'blue', src: generateSvgDataUri('cloud', 'blue'), filePath: '/lumi/nature/lumi_cloud.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_moon', name: 'Месяц', type: 'moon', category: 'nature', color: 'yellow', src: generateSvgDataUri('moon', 'yellow'), filePath: '/lumi/nature/lumi_moon.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_leaf', name: 'Листочек', type: 'leaf', category: 'nature', color: 'green', src: generateSvgDataUri('tree', 'green'), filePath: '/lumi/nature/lumi_leaf.png', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_snowman', name: 'Снеговик', type: 'snowman', category: 'nature', color: 'none', src: generateSvgDataUri('cloud', 'blue'), filePath: '/lumi/nature/lumi_snowman.png', assetType: 'image', defaultSize: 'medium' },

  // --- ANIMALS ---
  { id: 'lumi_cat', name: 'Котик', type: 'cat', category: 'animals', color: 'orange', src: generateSvgDataUri('cat', 'orange'), filePath: '/lumi/animals/lumi_cat.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_bird', name: 'Птичка', type: 'bird', category: 'animals', color: 'blue', src: generateSvgDataUri('bird', 'blue'), filePath: '/lumi/animals/lumi_bird.webp', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_dog', name: 'Собачка', type: 'dog', category: 'animals', color: 'brown', src: generateSvgDataUri('dog', 'brown'), filePath: '/lumi/animals/lumi_dog.png', assetType: 'image', defaultSize: 'medium' },
  { id: 'lumi_fish', name: 'Рыбка', type: 'fish', category: 'animals', color: 'blue', src: generateSvgDataUri('fish', 'blue'), filePath: '/lumi/animals/lumi_fish.webp', assetType: 'image', defaultSize: 'medium' },

  // --- SPECIAL ---
  { id: 'lumi_traffic_light', name: 'Светофор', type: 'traffic_light', category: 'special', color: 'multicolor', src: generateSvgDataUri('traffic_light', 'multicolor'), filePath: '/lumi/special/lumi_traffic_light.webp', assetType: 'image', defaultSize: 'medium' },
  ...(['red', 'blue', 'yellow', 'green'] as LumiAssetColor[]).map((color) => ({
    id: `lumi_balloon_${color}`,
    name: 'Шарик',
    type: 'balloon',
    category: 'special' as LumiAssetCategory,
    color,
    src: generateSvgDataUri('balloon', color),
    filePath: `/lumi/objects/balloon/lumi_balloon_${color}.png`,
    assetType: 'image' as const,
    defaultSize: 'medium' as LumiAssetSize,
  })),
];

/**
 * List of assets flagged if background cleanup is required (Rule #7)
 */
export const ASSETS_NEEDING_CLEANUP: string[] = [];

// =========================================================
// REGISTRY QUERY & HELPER FUNCTIONS
// =========================================================

/**
 * Gets asset data by ID or by type + color combination.
 */
export function getAsset(typeOrId: string, color?: LumiAssetColor): LumiAssetData | undefined {
  if (!color) {
    const direct = LUMI_ASSET_REGISTRY.find((a) => a.id === typeOrId);
    if (direct) return direct;
  }
  const id1 = color ? `lumi_${typeOrId}_${color}` : typeOrId;
  const id2 = color ? `${typeOrId}-${color}` : typeOrId;
  const id3 = typeOrId.startsWith('lumi_') ? typeOrId : `lumi_${typeOrId}`;
  
  return (
    LUMI_ASSET_REGISTRY.find((a) => a.id === id1 || a.id === id2 || a.id === id3 || a.id === typeOrId) ||
    LUMI_ASSET_REGISTRY.find((a) => a.type === typeOrId && (!color || a.color === color))
  );
}

/**
 * Gets all color variants for a given object/shape type.
 */
export function getAssetVariants(type: string): LumiAssetData[] {
  return LUMI_ASSET_REGISTRY.filter((a) => a.type === type);
}

/**
 * Returns a random asset matching optional category and color filters.
 */
export function getRandomAsset(category?: LumiAssetCategory, color?: LumiAssetColor): LumiAssetData {
  let items = LUMI_ASSET_REGISTRY;
  if (category) {
    items = items.filter((a) => a.category === category);
  }
  if (color) {
    items = items.filter((a) => a.color === color);
  }
  if (items.length === 0) {
    items = LUMI_ASSET_REGISTRY;
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

/**
 * Returns a set of unique random assets for future game builders.
 */
export function getRandomAssetSet(
  count: number,
  options?: { categories?: LumiAssetCategory[]; colors?: LumiAssetColor[] }
): LumiAssetData[] {
  let pool = [...LUMI_ASSET_REGISTRY];
  if (options?.categories && options.categories.length > 0) {
    pool = pool.filter((a) => options.categories!.includes(a.category));
  }
  if (options?.colors && options.colors.length > 0) {
    pool = pool.filter((a) => options.colors!.includes(a.color));
  }
  if (pool.length === 0) pool = [...LUMI_ASSET_REGISTRY];

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}
