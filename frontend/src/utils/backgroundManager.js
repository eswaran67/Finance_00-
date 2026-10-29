// =================================================================
// WEBSITE BACKGROUND & THEME MANAGER
// Supports Preset Themes, Custom Solid Colors, Gradients, and Custom Images
// =================================================================

export const BG_PRESETS = [
  {
    id: 'midnight',
    name: 'Midnight Obsidian',
    nameTa: 'நள்ளிரவு கருப்பு (Midnight)',
    theme: 'dark',
    type: 'preset',
    bgApp: '#080c14',
    previewGradient: 'linear-gradient(135deg, #080c14 0%, #0e1a2f 100%)',
    style: {
      background: 'radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 45%), radial-gradient(circle at 85% 30%, rgba(14, 165, 233, 0.07) 0%, transparent 45%), #080c14'
    }
  },
  {
    id: 'sapphire',
    name: 'Royal Sapphire Navy',
    nameTa: 'ராயல் நீலம் (Royal Navy)',
    theme: 'dark',
    type: 'preset',
    bgApp: '#060e22',
    previewGradient: 'linear-gradient(135deg, #060e22 0%, #1e3a8a 100%)',
    style: {
      background: 'radial-gradient(ellipse at top, #1e3a8a 0%, #060e22 75%), #060e22'
    }
  },
  {
    id: 'emerald',
    name: 'Executive Forest Emerald',
    nameTa: 'மரகத பச்சை (Emerald Jade)',
    theme: 'dark',
    type: 'preset',
    bgApp: '#03140e',
    previewGradient: 'linear-gradient(135deg, #03140e 0%, #065f46 100%)',
    style: {
      background: 'radial-gradient(ellipse at top, #065f46 0%, #03140e 75%), #03140e'
    }
  },
  {
    id: 'amethyst',
    name: 'Royal Amethyst Violet',
    nameTa: 'அரச ஊதா (Royal Violet)',
    theme: 'dark',
    type: 'preset',
    bgApp: '#0e071e',
    previewGradient: 'linear-gradient(135deg, #0e071e 0%, #581c87 100%)',
    style: {
      background: 'radial-gradient(ellipse at top, #581c87 0%, #0e071e 75%), #0e071e'
    }
  },
  {
    id: 'crimson',
    name: 'Ruby Charcoal',
    nameTa: 'மாணிக்க சிவப்பு (Ruby Charcoal)',
    theme: 'dark',
    type: 'preset',
    bgApp: '#15060b',
    previewGradient: 'linear-gradient(135deg, #15060b 0%, #881337 100%)',
    style: {
      background: 'radial-gradient(ellipse at top, #881337 0%, #15060b 75%), #15060b'
    }
  },
  {
    id: 'cyber-grid',
    name: 'FinTech Tech Grid',
    nameTa: 'சைபர் கிரிட் (Tech Matrix)',
    theme: 'dark',
    type: 'preset',
    bgApp: '#080d1a',
    previewGradient: 'linear-gradient(135deg, #080d1a 0%, #0f172a 100%)',
    style: {
      backgroundColor: '#080d1a',
      backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
      backgroundSize: '36px 36px'
    }
  },
  {
    id: 'aurora',
    name: 'Aurora Glow Mesh',
    nameTa: 'அரோரா வண்ண ஒளி (Aurora)',
    theme: 'dark',
    type: 'preset',
    bgApp: '#070b14',
    previewGradient: 'linear-gradient(135deg, #047857 0%, #1e1b4b 50%, #4338ca 100%)',
    style: {
      background: 'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.16) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.16) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 45%), #070b14'
    }
  },
  {
    id: 'slate-light',
    name: 'Pristine Executive Slate (Light)',
    nameTa: 'வெள்ளை பளிங்கு (Clean Light)',
    theme: 'light',
    type: 'preset',
    bgApp: '#f4f6fa',
    previewGradient: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
    style: {
      background: 'radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 20%, rgba(14, 165, 233, 0.05) 0%, transparent 40%), #f4f6fa'
    }
  },
  {
    id: 'warm-ivory',
    name: 'Warm Ivory & Champagne (Light)',
    nameTa: 'ஐவரி தங்கம் (Warm Ivory Light)',
    theme: 'light',
    type: 'preset',
    bgApp: '#faf7f2',
    previewGradient: 'linear-gradient(135deg, #faf7f2 0%, #fde68a 100%)',
    style: {
      background: 'radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.06) 0%, transparent 40%), #faf7f2'
    }
  }
];

export const PRESET_WALLPAPERS = [
  {
    id: 'wp-waves',
    name: 'Abstract Silk Waves',
    nameTa: 'மென்மையான அலைகள் (Waves)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=60'
  },
  {
    id: 'wp-dark-geometry',
    name: 'Dark Geometric Poly',
    nameTa: 'கருப்பு வடிவியல் (Geometric)',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=60'
  },
  {
    id: 'wp-emerald-luxury',
    name: 'Deep Emerald Crystals',
    nameTa: 'பச்சை படிகங்கள் (Emerald Crystal)',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=60'
  },
  {
    id: 'wp-neon-finance',
    name: 'Midnight City Skyline',
    nameTa: 'இரவு வானலை (City Skyline)',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=60'
  }
];

const STORAGE_KEY = 'finance_custom_bg';

export function getSavedBackground() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse saved background:', e);
  }
  return {
    mode: 'preset', // 'preset' | 'color' | 'image'
    presetId: 'midnight',
    customColor: '#080c14',
    imageUrl: '',
    overlayDarkness: 0.82,
    blur: 0
  };
}

export function saveBackgroundConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save background config:', e);
  }
}

export function applyBackgroundToDOM(config) {
  if (!config) return;

  const root = document.documentElement;
  const body = document.body;

  if (config.mode === 'preset') {
    const preset = BG_PRESETS.find(p => p.id === config.presetId) || BG_PRESETS[0];
    root.style.setProperty('--bg-app', preset.bgApp);
    
    // Apply preset inline styling or class
    if (preset.style.background) {
      body.style.background = preset.style.background;
    } else if (preset.style.backgroundColor) {
      body.style.backgroundColor = preset.style.backgroundColor;
      body.style.backgroundImage = preset.style.backgroundImage || 'none';
      body.style.backgroundSize = preset.style.backgroundSize || 'auto';
    }
    body.style.backgroundAttachment = 'fixed';
    
    // Set theme accordingly
    if (preset.theme) {
      root.setAttribute('data-theme', preset.theme);
      localStorage.setItem('finance_theme', preset.theme);
    }
  } else if (config.mode === 'color') {
    const color = config.customColor || '#080c14';
    root.style.setProperty('--bg-app', color);
    body.style.background = color;
    body.style.backgroundImage = 'none';
  } else if (config.mode === 'image') {
    // Handled by custom bg overlay component for smooth blur/darkness
    body.style.backgroundColor = '#080c14';
    body.style.backgroundImage = 'none';
  }
}
