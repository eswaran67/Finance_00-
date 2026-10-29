import React, { useState } from 'react';
import { 
  Palette, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  RotateCcw, 
  Sliders, 
  X, 
  Sparkles 
} from 'lucide-react';
import { 
  BG_PRESETS, 
  PRESET_WALLPAPERS, 
  saveBackgroundConfig, 
  applyBackgroundToDOM 
} from '../utils/backgroundManager';
import { getTranslation } from '../translations';

export default function BackgroundCustomizerModal({ 
  isOpen, 
  onClose, 
  bgConfig, 
  setBgConfig, 
  lang = 'ta', 
  onShowToast 
}) {
  const t = (key, params) => getTranslation(lang, key, params);
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'color' | 'image'
  const [colorInput, setColorInput] = useState(bgConfig.customColor || '#080c14');
  const [imageUrlInput, setImageUrlInput] = useState(bgConfig.imageUrl || '');
  const [overlayDarkness, setOverlayDarkness] = useState(bgConfig.overlayDarkness !== undefined ? bgConfig.overlayDarkness : 0.82);
  const [blurVal, setBlurVal] = useState(bgConfig.blur || 0);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    const updated = {
      mode: 'preset',
      presetId: preset.id,
      customColor: preset.bgApp,
      imageUrl: '',
      overlayDarkness: 0.82,
      blur: 0
    };
    setBgConfig(updated);
    saveBackgroundConfig(updated);
    applyBackgroundToDOM(updated);
    if (onShowToast) onShowToast(t('bgSavedToast'), 'success');
  };

  const handleApplyColor = (color) => {
    setColorInput(color);
    const updated = {
      mode: 'color',
      presetId: '',
      customColor: color,
      imageUrl: '',
      overlayDarkness: 0.82,
      blur: 0
    };
    setBgConfig(updated);
    saveBackgroundConfig(updated);
    applyBackgroundToDOM(updated);
    if (onShowToast) onShowToast(t('bgSavedToast'), 'success');
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      if (onShowToast) {
        onShowToast(lang === 'ta' ? 'படத்தின் அளவு 8MB-க்கு குறைவாக இருக்க வேண்டும்.' : 'Image size must be less than 8MB.', 'warning');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImageUrlInput(dataUrl);
      const updated = {
        mode: 'image',
        presetId: '',
        customColor: '#080c14',
        imageUrl: dataUrl,
        overlayDarkness: overlayDarkness,
        blur: blurVal
      };
      setBgConfig(updated);
      saveBackgroundConfig(updated);
      applyBackgroundToDOM(updated);
      if (onShowToast) onShowToast(t('bgSavedToast'), 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyImageUrl = (url) => {
    if (!url) return;
    const updated = {
      mode: 'image',
      presetId: '',
      customColor: '#080c14',
      imageUrl: url,
      overlayDarkness: overlayDarkness,
      blur: blurVal
    };
    setBgConfig(updated);
    saveBackgroundConfig(updated);
    applyBackgroundToDOM(updated);
    if (onShowToast) onShowToast(t('bgSavedToast'), 'success');
  };

  const handleSliderChange = (newDarkness, newBlur) => {
    setOverlayDarkness(newDarkness);
    setBlurVal(newBlur);
    if (bgConfig.mode === 'image') {
      const updated = {
        ...bgConfig,
        overlayDarkness: newDarkness,
        blur: newBlur
      };
      setBgConfig(updated);
      saveBackgroundConfig(updated);
    }
  };

  const handleResetDefault = () => {
    const defaultCfg = {
      mode: 'preset',
      presetId: 'midnight',
      customColor: '#080c14',
      imageUrl: '',
      overlayDarkness: 0.82,
      blur: 0
    };
    setBgConfig(defaultCfg);
    saveBackgroundConfig(defaultCfg);
    applyBackgroundToDOM(defaultCfg);
    if (onShowToast) onShowToast(t('bgSavedToast'), 'info');
  };

  const popularColors = [
    { name: 'Obsidian Black', hex: '#080c14' },
    { name: 'Navy Midnight', hex: '#071026' },
    { name: 'Deep Emerald', hex: '#041710' },
    { name: 'Royal Amethyst', hex: '#110722' },
    { name: 'Charcoal Ruby', hex: '#19080e' },
    { name: 'Deep Slate', hex: '#0f172a' },
    { name: 'Pure White (Light)', hex: '#ffffff' },
    { name: 'Soft Pearl Slate (Light)', hex: '#f4f6fa' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide bg-customizer-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={20} style={{ color: 'var(--primary-emerald)' }} />
              {t('bgModalTitle')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {t('bgModalSub')}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tab switcher */}
        <div className="bg-tabs-bar">
          <button 
            className={`bg-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            <Sparkles size={15} />
            {t('bgTabPresets')}
          </button>
          <button 
            className={`bg-tab-btn ${activeTab === 'color' ? 'active' : ''}`}
            onClick={() => setActiveTab('color')}
          >
            <Palette size={15} />
            {t('bgTabColor')}
          </button>
          <button 
            className={`bg-tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon size={15} />
            {t('bgTabImage')}
          </button>
        </div>

        {/* TAB 1: PRESETS */}
        {activeTab === 'presets' && (
          <div className="bg-tab-content">
            <h4 className="bg-section-title">{t('bgSelectPreset')}</h4>
            <div className="bg-presets-grid">
              {BG_PRESETS.map((p) => {
                const isSelected = bgConfig.mode === 'preset' && bgConfig.presetId === p.id;
                return (
                  <div 
                    key={p.id}
                    className={`bg-preset-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectPreset(p)}
                  >
                    <div 
                      className="bg-preset-swatch" 
                      style={{ background: p.previewGradient }}
                    >
                      {isSelected && (
                        <div className="bg-swatch-check">
                          <Check size={16} color="#ffffff" />
                        </div>
                      )}
                    </div>
                    <div className="bg-preset-info">
                      <span className="bg-preset-name">
                        {lang === 'ta' ? p.nameTa : p.name}
                      </span>
                      <span className="bg-preset-theme-badge">
                        {p.theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM COLOR */}
        {activeTab === 'color' && (
          <div className="bg-tab-content">
            <h4 className="bg-section-title">{t('bgCustomColorLabel')}</h4>
            
            <div className="bg-color-picker-box">
              <div className="bg-color-input-wrap">
                <input 
                  type="color" 
                  value={colorInput} 
                  onChange={(e) => handleApplyColor(e.target.value)}
                  className="bg-native-color-picker"
                />
                <div className="bg-color-hex-display">
                  <span className="hex-label">HEX:</span>
                  <input 
                    type="text" 
                    value={colorInput} 
                    onChange={(e) => handleApplyColor(e.target.value)}
                    className="hex-input"
                    maxLength={7}
                  />
                </div>
              </div>
              
              <div className="bg-color-preview-banner" style={{ backgroundColor: colorInput }}>
                <span>{colorInput} Preview</span>
              </div>
            </div>

            <h5 style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '16px', marginBottom: '8px' }}>
              {lang === 'ta' ? 'பிரபலமான வண்ணங்கள்:' : 'Curated FinTech Tones:'}
            </h5>
            <div className="popular-colors-list">
              {popularColors.map((c) => (
                <button 
                  key={c.hex}
                  onClick={() => handleApplyColor(c.hex)}
                  className={`color-pill ${colorInput.toLowerCase() === c.hex.toLowerCase() ? 'active' : ''}`}
                  style={{ '--pill-color': c.hex }}
                >
                  <span className="pill-dot" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BACKGROUND IMAGE */}
        {activeTab === 'image' && (
          <div className="bg-tab-content">
            <h4 className="bg-section-title">{t('bgCustomImageLabel')}</h4>

            {/* Upload from file button */}
            <div className="bg-upload-section">
              <label className="btn-primary bg-upload-btn">
                <Upload size={16} />
                <span>{t('bgUploadImage')}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <span className="bg-upload-hint">
                {lang === 'ta' ? '(JPG, PNG, WebP போன்றவை - அதிகபட்சம் 8MB)' : '(Supports JPG, PNG, WebP - max 8MB)'}
              </span>
            </div>

            {/* URL input */}
            <div className="bg-url-input-wrap">
              <input 
                type="text" 
                placeholder={t('bgImageUrlPlaceholder')}
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="bg-url-input"
              />
              <button 
                onClick={() => handleApplyImageUrl(imageUrlInput)} 
                className="btn-secondary"
                disabled={!imageUrlInput}
              >
                {lang === 'ta' ? 'இணை' : 'Apply URL'}
              </button>
            </div>

            {/* Curated Aesthetic Wallpapers */}
            <h5 style={{ fontSize: '13px', color: 'var(--text-sub)', marginTop: '20px', marginBottom: '10px' }}>
              {lang === 'ta' ? 'பிரத்யேக வால்பேப்பர்கள் (Wallpapers):' : 'Curated HD FinTech Wallpapers:'}
            </h5>
            <div className="wallpapers-grid">
              {PRESET_WALLPAPERS.map((wp) => {
                const isSelected = bgConfig.mode === 'image' && bgConfig.imageUrl === wp.url;
                return (
                  <div 
                    key={wp.id}
                    className={`wallpaper-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleApplyImageUrl(wp.url)}
                  >
                    <img src={wp.thumb} alt={wp.name} loading="lazy" />
                    <div className="wp-overlay">
                      <span>{lang === 'ta' ? wp.nameTa : wp.name}</span>
                      {isSelected && <Check size={16} color="#ffffff" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Image Overlay & Blur Controls */}
            <div className="image-sliders-panel">
              <div className="slider-group">
                <div className="slider-label-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={14} />
                    {t('bgOverlayDarkness')}
                  </span>
                  <strong>{Math.round(overlayDarkness * 100)}%</strong>
                </div>
                <input 
                  type="range" 
                  min="0.2" 
                  max="0.95" 
                  step="0.05" 
                  value={overlayDarkness} 
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value), blurVal)}
                  className="bg-range-slider"
                />
                <span className="slider-hint">
                  {lang === 'ta' ? 'அதிக இருள் வைத்தால் எழுத்துக்கள் மிகத் தெளிவாகத் தெரியும்.' : 'Higher darkness ensures maximum text readability.'}
                </span>
              </div>

              <div className="slider-group" style={{ marginTop: '12px' }}>
                <div className="slider-label-row">
                  <span>{t('bgBlurLevel')}</span>
                  <strong>{blurVal}px</strong>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="2" 
                  value={blurVal} 
                  onChange={(e) => handleSliderChange(overlayDarkness, parseInt(e.target.value))}
                  className="bg-range-slider"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', marginTop: '22px' }}>
          <button onClick={handleResetDefault} className="btn-secondary" style={{ gap: '6px' }}>
            <RotateCcw size={14} />
            {t('bgResetDefault')}
          </button>
          
          <button onClick={onClose} className="btn-primary">
            <Check size={16} />
            {lang === 'ta' ? 'முடிந்தது' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
}
