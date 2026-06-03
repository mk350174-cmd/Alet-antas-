#!/usr/bin/env node
/**
 * Vault Generator — JSON config dosyasından vault HTML üretir.
 * Kullanım: node generate.js --config configs/my-vault.json
 *           node generate.js --batch configs/          (klasördeki tüm JSON'ları üretir)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}
const configArg   = getArg('--config');
const batchArg    = getArg('--batch');
const outputArg   = getArg('--output');
const templateArg = getArg('--template');

const TEMPLATE_PATH = templateArg || path.join(__dirname, 'vault-template.html');
const DIST_DIR = path.join(__dirname, 'dist');

if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

if (!configArg && !batchArg) {
  console.error('Kullanım: node generate.js --config configs/vault.json');
  console.error('          node generate.js --batch configs/');
  process.exit(1);
}

function loadTemplate() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Template bulunamadı: ${TEMPLATE_PATH}`);
    process.exit(1);
  }
  return fs.readFileSync(TEMPLATE_PATH, 'utf8');
}

function hexDarken(hex, amount = 30) {
  const r = Math.max(0, parseInt(hex.slice(1,3),16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3,5),16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5,7),16) - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function hexAlpha(hex, alphaHex = '08') {
  return hex + alphaHex;
}

function buildStatsHTML(stats) {
  return stats.map(s => `<div class="stat"><div class="stat-num">${s.em ? `<em>${s.num}</em>` : s.num}</div><div class="stat-label">${s.label}</div></div>`).join('\n    ');
}

function buildHeroTitleHTML(titleParts) {
  // titleParts: [{text, style}] where style: 'normal'|'em'|'span'
  if (typeof titleParts === 'string') return titleParts;
  return titleParts.map(p => {
    if (p.style === 'em') return `<em>${p.text}</em>`;
    if (p.style === 'span') return `<span>${p.text}</span>`;
    return p.text;
  }).join('');
}

function buildCatsJSON(categories) {
  // Supports both array and object format
  if (Array.isArray(categories)) {
    return JSON.stringify(categories);
  }
  return JSON.stringify(categories);
}

function normalizeItems(items) {
  return items.map((item, i) => {
    const out = { ...item };
    if (!out.id) out.id = i + 1;
    if (!out.no) out.no = String(out.id).padStart(3, '0');
    // Derive cc from categories if not set — will be done at runtime by catColor()
    return out;
  });
}

function generate(configPath) {
  const rawConfig = fs.readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(rawConfig);

  const template = loadTemplate();

  // Resolve colors with fallbacks
  const colors = cfg.colors || {};
  const primary       = colors.primary       || '#7eb8d4';
  const primary2      = colors.primary2      || primary;
  const primaryDim    = colors.primaryDim    || hexAlpha(primary, '15');
  const primaryGlow   = colors.primaryGlow   || hexAlpha(primary, '30');
  const primaryDark   = colors.primaryDark   || hexDarken(primary);
  const accent        = colors.accent        || '#c9a84c';
  const accent2       = colors.accent2       || accent;
  const accentDim     = colors.accentDim     || hexAlpha(accent, '18');
  const accentGlow    = colors.accentGlow    || hexAlpha(accent, '30');
  const bg            = colors.bg            || '#060608';
  const bg2           = colors.bg2           || '#0c0c10';
  const bg3           = colors.bg3           || '#121218';
  const bg4           = colors.bg4           || '#1a1a22';
  const border        = colors.border        || '#1e1e28';
  const border2       = colors.border2       || '#2a2a36';
  const border3       = colors.border3       || '#363648';
  const heroBg        = colors.heroBg        || '#08080e';

  const itemNoun       = cfg.itemNoun        || 'Öğe';
  const itemNounPlural = cfg.itemNounPlural  || (itemNoun + 'ler');
  const itemNounLower  = itemNounPlural.toLowerCase();
  const itemCount      = (cfg.items || []).length;
  const normalizedItems = normalizeItems(cfg.items || []);

  const statsHTML = cfg.stats
    ? buildStatsHTML(cfg.stats)
    : `<div class="stat"><div class="stat-num"><em>${itemCount}</em></div><div class="stat-label">${itemNounPlural}</div></div>`;

  const heroTitleHTML = cfg.heroTitleHTML || buildHeroTitleHTML(cfg.heroTitleParts || [{ text: cfg.title || cfg.vaultTitle, style: 'em' }]);
  const footerBrandHTML = cfg.footerBrandHTML || `<em>${cfg.title || cfg.vaultTitle}</em>`;

  let html = template;

  // Simple string replacements
  const replacements = {
    '{{VAULT_TITLE}}':        cfg.title || cfg.vaultTitle || 'Vault Pro',
    '{{META_DESCRIPTION}}':   cfg.metaDescription || cfg.description || '',
    '{{META_KEYWORDS}}':      (cfg.metaKeywords || []).join(', '),
    '{{ITEM_COUNT}}':         String(itemCount),
    '{{COLOR_BG}}':           bg,
    '{{COLOR_BG2}}':          bg2,
    '{{COLOR_BG3}}':          bg3,
    '{{COLOR_BG4}}':          bg4,
    '{{COLOR_BORDER}}':       border,
    '{{COLOR_BORDER2}}':      border2,
    '{{COLOR_BORDER3}}':      border3,
    '{{COLOR_PRIMARY}}':      primary,
    '{{COLOR_PRIMARY2}}':     primary2,
    '{{COLOR_PRIMARY_DIM}}':  primaryDim,
    '{{COLOR_PRIMARY_GLOW}}': primaryGlow,
    '{{COLOR_PRIMARY_DARK}}': primaryDark,
    '{{COLOR_ACCENT}}':       accent,
    '{{COLOR_ACCENT2}}':      accent2,
    '{{COLOR_ACCENT_DIM}}':   accentDim,
    '{{COLOR_ACCENT_GLOW}}':  accentGlow,
    '{{COLOR_HERO_BG}}':      heroBg,
    '{{HERO_CORNER}}':        cfg.heroCorner || itemNoun[0] || 'V',
    '{{HERO_EYEBROW}}':       cfg.heroEyebrow || cfg.title || '',
    '{{HERO_TITLE_HTML}}':    heroTitleHTML,
    '{{HERO_SUBTITLE}}':      cfg.subtitle || '',
    '{{HERO_STATS_HTML}}':    statsHTML,
    '{{API_PLACEHOLDER}}':    cfg.apiPlaceholder || 'API key...',
    '{{API_LINK}}':           cfg.apiLink || '#',
    '{{API_LINK_TEXT}}':      cfg.apiLinkText || 'API key al →',
    '{{SEARCH_PLACEHOLDER}}': cfg.searchPlaceholder || (itemNoun + ' ara...'),
    '{{EMPTY_GLYPH}}':        cfg.emptyGlyph || '◈',
    '{{EMPTY_TEXT}}':         cfg.emptyText || ('Sol taraftan bir ' + itemNoun + ' seç'),
    '{{FOOTER_BRAND_HTML}}':  footerBrandHTML,
    '{{FOOTER_NOTE}}':        cfg.footerNote || cfg.title || '',
    '{{CATS_JSON}}':          buildCatsJSON(cfg.categories || []),
    '{{ITEMS_JSON}}':         JSON.stringify(normalizedItems),
    '{{STORAGE_KEY}}':        cfg.storageKey || (cfg.slug || 'vault'),
    '{{ITEM_NOUN}}':          itemNoun,
    '{{ITEM_NOUN_PLURAL}}':   itemNounPlural,
    '{{ITEM_NOUN_LOWER}}':    itemNounLower,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.split(placeholder).join(value);
  }

  const slug = cfg.slug || path.basename(configPath, '.json');
  const outFile = outputArg || path.join(DIST_DIR, `${slug}.html`);
  fs.writeFileSync(outFile, html, 'utf8');

  const sizeKB = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(`✓ Üretildi: ${outFile} (${sizeKB} KB, ${itemCount} öğe)`);
  return outFile;
}

// ── BATCH MODE ──
if (batchArg) {
  const dir = path.resolve(batchArg);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (!files.length) { console.log('JSON dosyası bulunamadı:', dir); process.exit(0); }
  console.log(`Batch: ${files.length} config işleniyor...`);
  files.forEach(f => generate(path.join(dir, f)));
  console.log(`\nTamamlandı! Dosyalar: ${DIST_DIR}/`);
} else {
  generate(path.resolve(configArg));
}
