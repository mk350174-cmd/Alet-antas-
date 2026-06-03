#!/usr/bin/env node
/**
 * fetch-web-data.js — Web/GitHub'dan gerçek veri çekip config'leri doldurur.
 *
 * dataSource:"web" olan config'leri işler. Node'un yerleşik fetch'i ile
 * yapılandırılmış endpoint'lerden (CSV, GitHub Search API) veri çeker,
 * her item'a kaynak atıfı (source: {url, license}) ekler.
 *
 * Kullanım:
 *   node fetch-web-data.js                 # tüm web config'leri
 *   node fetch-web-data.js --only 01-promptvault-pro
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'configs');
const args = process.argv.slice(2);
const onlyArg = args.indexOf('--only') !== -1 ? args[args.indexOf('--only') + 1] : null;

// ── KAYNAK HARİTASI ──
// Her web-vault için bir veri kaynağı stratejisi. Anahtar = slug'daki vault adı
// (örn. "01-promptvault-pro" → "promptvault"). type'a göre fetch yöntemi seçilir.
const PROMPTS_CSV = 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv';
const PROMPTS_LICENSE = 'CC0-1.0 (awesome-chatgpt-prompts)';

const SOURCE_MAP = {
  // Prompt koleksiyonları → awesome-chatgpt-prompts CSV (farklı filtreler)
  promptvault:  { type: 'csv-prompts', filter: 'all' },
  personavault: { type: 'csv-prompts', filter: 'persona' },
  agentvault:   { type: 'csv-prompts', filter: 'dev' },
  chainvault:   { type: 'csv-prompts', filter: 'all' },
  embedvault:   { type: 'github', q: 'RAG embedding vector database', topic: 'rag' },

  // Kod / repo koleksiyonları → GitHub Search API
  shadervault:   { type: 'github', q: 'GLSL HLSL shader', topic: 'shader' },
  godotvault:    { type: 'github', q: 'godot gdscript', topic: 'godot' },
  firebasevault: { type: 'github', q: 'firebase template', topic: 'firebase' },
  archvault:     { type: 'github', q: 'software architecture microservices', topic: 'architecture' },
  secvault:      { type: 'github', q: 'security SAST DAST scanner', topic: 'security' },
  deployvault:   { type: 'github', q: 'kubernetes terraform docker ci cd', topic: 'devops' },
  regexvault:    { type: 'github', q: 'regex library examples', topic: 'regex' },
  apivault:      { type: 'github', q: 'REST GraphQL API design', topic: 'api' },
  dbvault:       { type: 'github', q: 'SQL NoSQL database schema', topic: 'database' },
  gitvault:      { type: 'github', q: 'git advanced workflow', topic: 'git' },
  cronvault:     { type: 'github', q: 'cron job scheduler automation', topic: 'cron' },
  scriptvault:   { type: 'github', q: 'bash powershell automation scripts', topic: 'bash' },
  logvault:      { type: 'github', q: 'log analysis anomaly detection', topic: 'logging' },
  obsivault:     { type: 'github', q: 'obsidian zettelkasten markdown', topic: 'obsidian' },
  ecomvault:     { type: 'github', q: 'ecommerce SEO conversion', topic: 'ecommerce' },
  socialvault:   { type: 'github', q: 'social media content automation', topic: 'social-media' },
  advault:       { type: 'github', q: 'ad copy marketing ab testing', topic: 'marketing' },
  pwavault:      { type: 'github', q: 'progressive web app service worker', topic: 'pwa' },
  cryptovault:   { type: 'github', q: 'smart contract solidity web3', topic: 'web3' },
  mathvault:     { type: 'github', q: 'linear algebra algorithms math', topic: 'mathematics' },
  statvault:     { type: 'github', q: 'data visualization statistics', topic: 'data-visualization' },
};

const GITHUB_LICENSE_NOTE = 'GitHub Search API · her repo kendi lisansına tabidir';

// ── YARDIMCILAR ──
function vaultKey(slug) {
  // "01-promptvault-pro" → "promptvault"
  const m = slug.match(/^\d+-([a-z]+)vault/);
  return m ? m[1] + 'vault' : slug.replace(/^\d+-/, '').replace(/-.*$/, '');
}

// Basit CSV parser (tırnak içi virgül ve newline'ları destekler)
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vault-builder' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.text();
}

async function fetchJSON(url, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'vault-builder', 'Accept': 'application/vnd.github+json' } });
    if (res.ok) return res.json();
    // GitHub rate limit (403/429) → bekle ve tekrar dene
    if ((res.status === 403 || res.status === 429) && attempt < retries) {
      const reset = parseInt(res.headers.get('x-ratelimit-reset') || '0', 10);
      const waitMs = reset ? Math.max(0, reset * 1000 - Date.now()) + 1000 : (attempt + 1) * 15000;
      console.log(`    ⏳ Rate limit, ${Math.round(waitMs/1000)}s bekleniyor...`);
      await new Promise(r => setTimeout(r, Math.min(waitMs, 65000)));
      continue;
    }
    throw new Error(`HTTP ${res.status} — ${url}`);
  }
}

// ── VERİ ÇEKİCİLER ──
let _csvCache = null;
async function getPromptsCSV() {
  if (_csvCache) return _csvCache;
  const text = await fetchText(PROMPTS_CSV);
  const rows = parseCSV(text);
  const header = rows.shift(); // act,prompt,for_devs,type,contributor
  _csvCache = rows.filter(r => r.length >= 2 && r[0]).map(r => ({
    act: r[0], prompt: r[1], for_devs: r[2] === 'TRUE', contributor: r[4] || '',
  }));
  return _csvCache;
}

const CSV_ITEM_CAP = 80; // her vault için makul üst sınır

async function buildFromCSV(source) {
  const prompts = await getPromptsCSV();
  let filtered = prompts;
  if (source.filter === 'dev') filtered = prompts.filter(p => p.for_devs);
  // 'persona' ve 'all' için tümünü kullan (CSV zaten persona tarzı "act as" promptları)

  // Kalite filtresi: temiz ad + yeterli içerik (bozuk/çok satırlı kayıtları ele)
  filtered = filtered.filter(p => {
    const act = (p.act || '').trim();
    return act.length >= 3 && act.length <= 50 &&
           act === p.act &&                    // baştaki/sondaki boşluk yok
           !/[\n\r]/.test(act) &&              // ad tek satır
           (p.prompt || '').length >= 40;
  }).slice(0, CSV_ITEM_CAP);

  const items = filtered.map((p, i) => ({
    id: i + 1,
    cat: p.for_devs ? 'Geliştirici' : 'Genel',
    name: p.act,
    desc: p.prompt.slice(0, 90).replace(/\s+\S*$/, '') + '…',
    tags: ['prompt', p.for_devs ? 'dev' : 'genel'],
    badge1: p.for_devs ? 'Dev' : 'Genel',
    content: p.prompt,
    source: { url: 'https://github.com/f/awesome-chatgpt-prompts', license: PROMPTS_LICENSE, author: p.contributor },
  }));

  const cats = [...new Set(items.map(it => it.cat))].map(name => ({
    id: name, name, color: name === 'Geliştirici' ? '#4fc3f7' : '#a375ff', count: items.filter(it => it.cat === name).length,
  }));

  return { items, categories: cats };
}

async function buildFromGitHub(source) {
  const q = encodeURIComponent(source.q + ' stars:>100');
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=40`;
  const data = await fetchJSON(url);
  const repos = data.items || [];

  const items = repos.map((r, i) => ({
    id: i + 1,
    cat: r.language || 'Diğer',
    name: r.name,
    desc: (r.description || 'Açıklama yok').slice(0, 120),
    tags: (r.topics || []).slice(0, 4).concat([`★${r.stargazers_count}`]),
    badge1: r.language || '—',
    badge2: `★ ${r.stargazers_count.toLocaleString('tr-TR')}`,
    content: `${r.full_name}\n\n${r.description || ''}\n\n` +
             `⭐ Yıldız: ${r.stargazers_count}\n🍴 Fork: ${r.forks_count}\n` +
             `📅 Güncelleme: ${(r.updated_at || '').slice(0,10)}\n🔗 ${r.html_url}`,
    meta: { 'Yıldız': r.stargazers_count, 'Dil': r.language || '—', 'Fork': r.forks_count },
    source: { url: r.html_url, license: (r.license && r.license.spdx_id) || GITHUB_LICENSE_NOTE, author: r.owner && r.owner.login },
  }));

  const langs = [...new Set(items.map(it => it.cat))];
  const palette = ['#4a9eff', '#5ed47e', '#a375ff', '#ff6b6b', '#d4a04c', '#4cc9c9', '#ff6b9d', '#fb923c'];
  const cats = langs.map((name, i) => ({
    id: name, name, color: palette[i % palette.length], count: items.filter(it => it.cat === name).length,
  }));

  return { items, categories: cats };
}

// ── ANA İŞLEM ──
async function processConfig(file) {
  const fullPath = path.join(CONFIG_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (cfg.dataSource !== 'web') return null;

  const key = vaultKey(cfg.slug);
  const source = SOURCE_MAP[key];
  if (!source) { console.log(`  ⚠ ${cfg.slug}: kaynak haritasında yok, atlandı`); return null; }

  try {
    const result = source.type === 'csv-prompts'
      ? await buildFromCSV(source)
      : await buildFromGitHub(source);

    if (!result.items.length) { console.log(`  ⚠ ${cfg.slug}: veri boş döndü`); return null; }

    cfg.categories = result.categories;
    cfg.items = result.items;
    cfg.sourceUrl = source.type === 'csv-prompts' ? PROMPTS_CSV : `github-search:${source.q}`;
    fs.writeFileSync(fullPath, JSON.stringify(cfg, null, 2), 'utf8');
    console.log(`  ✓ ${cfg.slug}: ${result.items.length} item, ${result.categories.length} kategori`);
    return cfg.slug;
  } catch (e) {
    console.log(`  ✗ ${cfg.slug}: ${e.message}`);
    return null;
  }
}

async function main() {
  let files = fs.readdirSync(CONFIG_DIR).filter(f => f.endsWith('.json'));
  if (onlyArg) files = files.filter(f => f.startsWith(onlyArg) || f === onlyArg + '.json');

  console.log(`Web verisi çekiliyor (${files.length} config taranıyor)...`);
  let ok = 0;
  for (const f of files) {
    const r = await processConfig(f);
    if (r) ok++;
    // GitHub rate limit'e nazik davran
    await new Promise(res => setTimeout(res, 1500));
  }
  console.log(`\nTamamlandı: ${ok} vault dolduruldu.`);
}

main();
