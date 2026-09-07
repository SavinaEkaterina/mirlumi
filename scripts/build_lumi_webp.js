import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate distinct SVG for each Lumi state
const states = {
  neutral: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="40" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="80" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="44" cy="52" rx="4.5" ry="6" fill="#451A03"/>
    <ellipse cx="76" cy="52" rx="4.5" ry="6" fill="#451A03"/>
    <circle cx="46" cy="50" r="1.8" fill="#FFFFFF"/>
    <circle cx="78" cy="50" r="1.8" fill="#FFFFFF"/>
    <path d="M 48 66 Q 60 76 72 66" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  happy: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="38" cy="64" rx="8" ry="5" fill="#FCA5A5" opacity="0.9"/>
    <ellipse cx="82" cy="64" rx="8" ry="5" fill="#FCA5A5" opacity="0.9"/>
    <path d="M 38 52 Q 44 43 50 52" fill="none" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
    <path d="M 70 52 Q 76 43 82 52" fill="none" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
    <path d="M 46 66 Q 60 84 74 66 Z" fill="#D97706" stroke="#451A03" stroke-width="2"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  support: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="40" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="80" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <path d="M 38 52 Q 44 46 50 52" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 70 52 Q 76 46 82 52" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 48 68 Q 60 78 72 68" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 20 70 Q 30 65 36 72" fill="none" stroke="#D97706" stroke-width="4" stroke-linecap="round"/>
    <path d="M 100 70 Q 90 65 84 72" fill="none" stroke="#D97706" stroke-width="4" stroke-linecap="round"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  thinking: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="40" cy="64" rx="6" ry="4" fill="#FCA5A5" opacity="0.7"/>
    <ellipse cx="80" cy="64" rx="6" ry="4" fill="#FCA5A5" opacity="0.7"/>
    <ellipse cx="44" cy="48" rx="4" ry="5" fill="#451A03"/>
    <ellipse cx="76" cy="46" rx="4" ry="5" fill="#451A03"/>
    <circle cx="45" cy="46" r="1.5" fill="#FFFFFF"/>
    <circle cx="77" cy="44" r="1.5" fill="#FFFFFF"/>
    <path d="M 52 68 Q 60 64 68 68" fill="none" stroke="#451A03" stroke-width="3" stroke-linecap="round"/>
    <path d="M 72 75 Q 76 65 74 60" fill="none" stroke="#D97706" stroke-width="4" stroke-linecap="round"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  surprised: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="38" cy="64" rx="7" ry="5" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="82" cy="64" rx="7" ry="5" fill="#FCA5A5" opacity="0.8"/>
    <circle cx="44" cy="50" r="6.5" fill="#451A03"/>
    <circle cx="76" cy="50" r="6.5" fill="#451A03"/>
    <circle cx="46" cy="48" r="2.2" fill="#FFFFFF"/>
    <circle cx="78" cy="48" r="2.2" fill="#FFFFFF"/>
    <ellipse cx="60" cy="72" rx="6" ry="8" fill="#451A03"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="5" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  retry: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="40" cy="64" rx="6" ry="4" fill="#FCA5A5" opacity="0.7"/>
    <ellipse cx="80" cy="64" rx="6" ry="4" fill="#FCA5A5" opacity="0.7"/>
    <path d="M 38 48 Q 44 54 50 50" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 70 50 Q 76 54 82 48" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 50 72 Q 60 64 70 72" fill="none" stroke="#451A03" stroke-width="3" stroke-linecap="round"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  clap: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="38" cy="64" rx="8" ry="5" fill="#FCA5A5" opacity="0.9"/>
    <ellipse cx="82" cy="64" rx="8" ry="5" fill="#FCA5A5" opacity="0.9"/>
    <path d="M 38 52 Q 44 43 50 52" fill="none" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
    <path d="M 70 52 Q 76 43 82 52" fill="none" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
    <path d="M 48 66 Q 60 82 72 66 Z" fill="#D97706" stroke="#451A03" stroke-width="2"/>
    <ellipse cx="50" cy="80" rx="6" ry="5" fill="#F59E0B"/>
    <ellipse cx="70" cy="80" rx="6" ry="5" fill="#F59E0B"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  victory: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="38" cy="64" rx="9" ry="5" fill="#FCA5A5" opacity="0.9"/>
    <ellipse cx="82" cy="64" rx="9" ry="5" fill="#FCA5A5" opacity="0.9"/>
    <path d="M 36 50 Q 44 40 52 50" fill="none" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
    <path d="M 68 50 Q 76 40 84 50" fill="none" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
    <path d="M 46 64 Q 60 86 74 64 Z" fill="#D97706" stroke="#451A03" stroke-width="2.5"/>
    <path d="M 22 55 Q 32 40 38 48" fill="none" stroke="#D97706" stroke-width="5" stroke-linecap="round"/>
    <path d="M 98 55 Q 88 40 82 48" fill="none" stroke="#D97706" stroke-width="5" stroke-linecap="round"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="5" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  rest: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="40" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="80" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <path d="M 38 52 Q 44 56 50 52" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 70 52 Q 76 56 82 52" fill="none" stroke="#451A03" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 50 68 Q 60 76 70 68" fill="none" stroke="#451A03" stroke-width="3" stroke-linecap="round"/>
    <text x="92" y="36" font-size="16" font-weight="bold" fill="#3B82F6">z</text>
    <text x="100" y="24" font-size="12" font-weight="bold" fill="#3B82F6">z</text>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  attention: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="40" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="80" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <circle cx="44" cy="50" r="5" fill="#451A03"/>
    <circle cx="76" cy="50" r="5" fill="#451A03"/>
    <circle cx="46" cy="48" r="1.8" fill="#FFFFFF"/>
    <circle cx="78" cy="48" r="1.8" fill="#FFFFFF"/>
    <path d="M 50 68 Q 60 74 70 68" fill="none" stroke="#451A03" stroke-width="3" stroke-linecap="round"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,

  speaking: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="48" fill="#FDE68A"/>
    <circle cx="60" cy="60" r="42" fill="#FEF3C7"/>
    <ellipse cx="40" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="80" cy="64" rx="7" ry="4" fill="#FCA5A5" opacity="0.8"/>
    <ellipse cx="44" cy="50" rx="4.5" ry="6" fill="#451A03"/>
    <ellipse cx="76" cy="50" rx="4.5" ry="6" fill="#451A03"/>
    <circle cx="46" cy="48" r="1.8" fill="#FFFFFF"/>
    <circle cx="78" cy="48" r="1.8" fill="#FFFFFF"/>
    <ellipse cx="60" cy="70" rx="7" ry="6" fill="#451A03"/>
    <path d="M 55 72 Q 60 76 65 72" fill="#F87171"/>
    <path d="M 60,15 C 60,8 65,3 72,5 C 78,7 76,16 68,16" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="5" r="4" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
  </svg>`
};

for (const [state, svgContent] of Object.entries(states)) {
  const tmpSvgPath = path.join(publicDir, `_temp_${state}.svg`);
  const webpPath = path.join(publicDir, `lumi_${state}.webp`);
  
  fs.writeFileSync(tmpSvgPath, svgContent, 'utf-8');
  try {
    execSync(`convert -background none -density 150 "${tmpSvgPath}" "${webpPath}"`);
    console.log(`Generated ${webpPath}`);
  } catch (err) {
    console.error(`Failed to convert ${state}:`, err);
  } finally {
    if (fs.existsSync(tmpSvgPath)) {
      fs.unlinkSync(tmpSvgPath);
    }
  }
}
