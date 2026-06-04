#!/usr/bin/env node
/**
 * build-configs.js — 100 vault iskelet config üretir.
 *
 * Girdi:  vault-ideas.json (docx'ten çıkarılan 97 fikir) + 3 yerleşik yeni fikir
 * Çıktı:  configs/NN-slug.json (her vault için iskelet config)
 *
 * Her config: tema rengi (kategoriye göre), SEO metni, etiketler ve boş
 * categories/items (sonradan fetch-web-data.js veya populate-ai.js doldurur).
 */

const fs = require('fs');
const path = require('path');

const IDEAS_PATH = path.join(__dirname, 'vault-ideas.json');
const CONFIG_DIR = path.join(__dirname, 'configs');

// ── 6 KATEGORİ → RENK PALETİ ──
// num aralığına göre (1-indexed) tema seçilir.
const CATEGORIES = [
  { range: [1, 15],   key: 'ai',         label: 'AI & Prompt Mühendisliği',          primary: '#a375ff', accent: '#ff6b9d', bg: '#08060e' },
  { range: [16, 30],  key: 'game',       label: 'Oyun Motoru & 3D',                  primary: '#5ed47e', accent: '#4fc3f7', bg: '#06100a' },
  { range: [31, 45],  key: 'history',    label: 'Tarih, Mitoloji & Hikaye',          primary: '#d4a04c', accent: '#c97e4c', bg: '#0e0a06' },
  { range: [46, 60],  key: 'devops',     label: 'Yazılım Mimarisi & DevOps',         primary: '#4a9eff', accent: '#a78bfa', bg: '#06080e' },
  { range: [61, 75],  key: 'productivity', label: 'Verimlilik & Otomasyon',          primary: '#4cc9c9', accent: '#5ed47e', bg: '#060e0e' },
  { range: [76, 100], key: 'analytic',   label: 'Spesifik Disiplinler & Analitik',   primary: '#ff6b6b', accent: '#d4a04c', bg: '#0e0606' },
];

// ── 3 YENİ FİKİR (98-100) ──
const NEW_IDEAS = [
  { num: '98',  name: 'TurkVault Pro',   desc: 'Türkçe NLP, dil işleme ve Türkçe içerik üretimi için optimize edilmiş prompt koleksiyonu.' },
  { num: '99',  name: 'ResumeVault Pro', desc: 'CV, kapak mektubu ve kariyer dokümanı şablonları; ATS uyumlu özgeçmiş üretimi.' },
  { num: '100', name: 'PitchVault Pro',  desc: 'Startup pitch deck, yatırımcı sunumu ve girişim hikayesi şablonları.' },
];

// ── dataSource: hangi vault web'den, hangisi AI'dan beslenecek ──
// Hazır yapılandırılmış kaynağı olan (prompt/repo/kod koleksiyonu) konular → web.
// Niş/Türkçe/kavramsal konular → ai. (İlk tur varsayılanları; sonra düzeltilebilir.)
const WEB_SLUGS = new Set([
  'prompt', 'persona', 'chain', 'agent', 'embed',     // AI koleksiyonları
  'shader', 'godot', 'firebase',                       // kod/asset koleksiyonları
  'arch', 'sec', 'deploy', 'regex', 'api', 'db', 'git', 'cron', 'script', 'log', // devops
  'obsi', 'ecom', 'social', 'ad',                      // verimlilik/pazarlama
  'pwa', 'ui/ux', 'crypto', 'math', 'stat',            // analitik/teknik
]);

function slugify(name) {
  // "PromptVault Pro" → "prompt-vault-pro"
  return name
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortName(name) {
  // "PromptVault Pro" → "Prompt"
  return name.replace(/Vault Pro$/i, '').trim();
}

function hexDarken(hex, amount = 30) {
  const r = Math.max(0, parseInt(hex.slice(1,3),16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3,5),16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5,7),16) - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function catFor(num) {
  return CATEGORIES.find(c => num >= c.range[0] && num <= c.range[1]) || CATEGORIES[CATEGORIES.length - 1];
}

function darkenBg(bg, layer) {
  // bg2/bg3/bg4 türetmek için hafifçe açalım
  const add = layer * 4;
  const r = Math.min(255, parseInt(bg.slice(1,3),16) + add);
  const g = Math.min(255, parseInt(bg.slice(3,5),16) + add);
  const b = Math.min(255, parseInt(bg.slice(5,7),16) + add);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function buildConfig(idea, num) {
  const cat = catFor(num);
  const slug = slugify(idea.name);
  const short = shortName(idea.name);
  const shortLower = short.toLowerCase().split(/[^a-zçğıöşü]/i)[0];
  const numPad = String(num).padStart(2, '0');
  const primary = cat.primary;
  const accent = cat.accent;
  const bg = cat.bg;

  const dataSource = WEB_SLUGS.has(shortLower) ? 'web' : 'ai';

  return {
    slug: `${numPad}-${slug}`,
    title: `${idea.name} — ${cat.label}`,
    metaDescription: idea.desc.slice(0, 155),
    metaKeywords: [short, idea.name, cat.label, 'AI', 'yapay zeka', 'şablon'],
    subtitle: idea.desc,
    heroCorner: short[0] || 'V',
    heroEyebrow: `${cat.label} · Alet Çantası`,
    heroTitleHTML: `${short.replace(/(.+)/, '$1')}<em>Vault</em> <span>Pro</span>`,
    footerBrandHTML: `${short}<em>Vault</em> <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text4)">Pro</span>`,
    footerNote: `${idea.name} · ${cat.label}`,
    itemNoun: 'Öğe',
    itemNounPlural: 'Öğeler',
    searchPlaceholder: `${short} ara...`,
    emptyGlyph: '◈',
    emptyText: `Sol taraftan bir öğe seç`,
    storageKey: slug.replace(/-/g, '_'),
    apiPlaceholder: 'sk-ant-api...',
    apiLink: 'https://console.anthropic.com',
    apiLinkText: 'Anthropic key al →',
    category: cat.key,
    categoryLabel: cat.label,
    dataSource,
    sourceUrl: null,
    colors: {
      primary,
      primary2: primary,
      primaryDim: primary + '15',
      primaryGlow: primary + '30',
      primaryDark: hexDarken(primary),
      accent,
      accent2: accent,
      accentDim: accent + '18',
      accentGlow: accent + '30',
      bg,
      bg2: darkenBg(bg, 1),
      bg3: darkenBg(bg, 2),
      bg4: darkenBg(bg, 3),
      border: darkenBg(bg, 4),
      border2: darkenBg(bg, 6),
      border3: darkenBg(bg, 9),
      heroBg: darkenBg(bg, 1),
    },
    categories: [],
    items: [],
  };
}

// ── ÇALIŞTIR ──
function main() {
  const ideas = JSON.parse(fs.readFileSync(IDEAS_PATH, 'utf8'));
  const all = [...ideas, ...NEW_IDEAS];

  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });

  let webCount = 0, aiCount = 0;
  all.forEach((idea, i) => {
    const num = i + 1;
    const cfg = buildConfig(idea, num);
    const outFile = path.join(CONFIG_DIR, `${cfg.slug}.json`);
    fs.writeFileSync(outFile, JSON.stringify(cfg, null, 2), 'utf8');
    if (cfg.dataSource === 'web') webCount++; else aiCount++;
  });

  console.log(`✓ ${all.length} iskelet config üretildi → ${CONFIG_DIR}/`);
  console.log(`  Web kaynaklı: ${webCount}, AI üretimli: ${aiCount}`);
}

main();
