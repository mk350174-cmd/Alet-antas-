#!/usr/bin/env node
/**
 * build-index.js — 100 vault için master index (katalog) sayfası üretir.
 *
 * configs/*.json metadata'sından 6 kategoriye gruplanmış, aranabilir bir
 * ana sayfa oluşturur → dist/index.html. Her kart ilgili vault HTML'ine linkler.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'configs');
const DIST_DIR = path.join(__dirname, 'dist');
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Kategori sırası (build-configs.js ile uyumlu)
const CAT_ORDER = [
  'AI & Prompt Mühendisliği',
  'Oyun Motoru & 3D',
  'Tarih, Mitoloji & Hikaye',
  'Yazılım Mimarisi & DevOps',
  'Verimlilik & Otomasyon',
  'Spesifik Disiplinler & Analitik',
];

function load() {
  return fs.readdirSync(CONFIG_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, f), 'utf8')))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function vaultName(cfg) {
  // title "PromptVault Pro — ..." → "PromptVault Pro"
  return cfg.title.split('—')[0].trim();
}

function build() {
  const vaults = load();
  const groups = {};
  vaults.forEach(v => {
    const label = v.categoryLabel || 'Diğer';
    (groups[label] = groups[label] || []).push(v);
  });

  const totalItems = vaults.reduce((s, v) => s + (v.items ? v.items.length : 0), 0);
  const filled = vaults.filter(v => v.items && v.items.length).length;

  const sections = CAT_ORDER.filter(c => groups[c]).map(cat => {
    const list = groups[cat];
    const color = list[0].colors.primary;
    const cards = list.map(v => {
      const n = v.items ? v.items.length : 0;
      const name = vaultName(v);
      return `<a class="card" href="${esc(v.slug)}.html" style="--cc:${esc(v.colors.primary)}">
        <div class="card-top"><span class="card-dot"></span><span class="card-name">${esc(name)}</span></div>
        <p class="card-desc">${esc(v.subtitle)}</p>
        <div class="card-foot"><span class="card-count">${n} öğe</span><span class="card-go">→</span></div>
      </a>`;
    }).join('\n');
    return `<section class="cat-section">
      <div class="cat-head" style="--cc:${esc(color)}">
        <h2 class="cat-title">${esc(cat)}</h2>
        <span class="cat-count">${list.length} vault</span>
      </div>
      <div class="cards">${cards}</div>
    </section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Alet Çantası — 100 AI Vault Koleksiyonu</title>
<meta name="description" content="100 adet uzmanlaşmış AI araç arşivi: prompt, kod, mitoloji, DevOps, verimlilik ve daha fazlası. Türkçe, ücretsiz, tek koleksiyon.">
<meta name="robots" content="index, follow">
<meta property="og:title" content="Alet Çantası — 100 AI Vault Koleksiyonu">
<meta property="og:description" content="100 uzmanlaşmış AI araç arşivi. Türkçe, ücretsiz.">
<meta property="og:locale" content="tr_TR">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CollectionPage","name":"Alet Çantası — 100 AI Vault","inLanguage":"tr","description":"100 uzmanlaşmış AI araç arşivi"}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,400&family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#060608;--bg2:#0c0c10;--bg3:#121218;--border:#1e1e28;--border2:#2a2a36;--text:#ede9e0;--text2:#9896a0;--text3:#585668;--text4:#343244;--gold:#c9a84c;--radius:8px;--radius-lg:14px;--tr:.28s cubic-bezier(.4,0,.2,1)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Instrument Sans',sans-serif;font-size:14px;line-height:1.6;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 50% 0%,#c9a84c08,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 100%,#7eb8d406,transparent 50%);pointer-events:none;z-index:0}
.wrap{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:0 24px}
.hero{padding:72px 24px 48px;text-align:center;border-bottom:1px solid var(--border);position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:.2}
.eyebrow{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.24em;color:var(--gold);text-transform:uppercase;margin-bottom:20px}
.title{font-family:'Cormorant Garamond',serif;font-size:clamp(48px,7vw,96px);font-weight:300;line-height:.95;letter-spacing:-.03em;margin-bottom:20px}
.title em{font-style:italic;color:var(--gold)}
.sub{font-size:15px;color:var(--text2);max-width:620px;margin:0 auto 32px;line-height:1.8}
.stats{display:flex;justify-content:center;gap:0;flex-wrap:wrap}
.stat{padding:12px 32px;border-right:1px solid var(--border)}
.stat:last-child{border-right:none}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:600;color:var(--gold);line-height:1}
.stat-lbl{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text3);margin-top:4px}
.search-wrap{position:sticky;top:0;z-index:10;background:rgba(6,6,8,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:14px 24px}
.search{max-width:1280px;margin:0 auto;position:relative}
.search input{width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);padding:12px 16px 12px 42px;color:var(--text);font-family:'Instrument Sans',sans-serif;font-size:14px;transition:all var(--tr)}
.search input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px #c9a84c18}
.search-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:16px}
.cat-section{padding:48px 0 8px}
.cat-head{display:flex;align-items:baseline;gap:14px;margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid var(--border);position:relative}
.cat-head::after{content:'';position:absolute;bottom:-1px;left:0;width:80px;height:2px;background:var(--cc);opacity:.7}
.cat-title{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;letter-spacing:-.01em;color:var(--text)}
.cat-count{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3);letter-spacing:.1em}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.card{display:flex;flex-direction:column;gap:10px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;text-decoration:none;color:inherit;transition:all var(--tr);position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--cc);opacity:.5;transition:opacity var(--tr)}
.card:hover{background:var(--bg3);border-color:var(--border2);transform:translateY(-3px);box-shadow:0 12px 32px #00000060}
.card:hover::before{opacity:1}
.card-top{display:flex;align-items:center;gap:10px}
.card-dot{width:8px;height:8px;border-radius:50%;background:var(--cc);flex-shrink:0;box-shadow:0 0 10px var(--cc)}
.card-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--text);letter-spacing:-.01em}
.card-desc{font-size:12px;color:var(--text3);line-height:1.6;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:4px}
.card-count{font-family:'DM Mono',monospace;font-size:10px;color:var(--cc);letter-spacing:.06em}
.card-go{color:var(--cc);font-size:16px;opacity:0;transform:translateX(-6px);transition:all var(--tr)}
.card:hover .card-go{opacity:1;transform:translateX(0)}
.empty-note{padding:40px;text-align:center;font-family:'DM Mono',monospace;font-size:12px;color:var(--text4);display:none}
.footer{margin-top:48px;padding:32px 24px;border-top:1px solid var(--border);text-align:center}
.footer-brand{font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--text)}
.footer-brand em{font-style:italic;color:var(--gold)}
.footer-note{font-family:'DM Mono',monospace;font-size:10px;color:var(--text4);letter-spacing:.08em;margin-top:8px}
@media(max-width:640px){.hero{padding:48px 16px 32px}.stat{padding:10px 18px}.cards{grid-template-columns:1fr}}
</style>
</head>
<body>
<header class="hero">
  <div class="eyebrow">AI Alet Çantası · 6 Disiplin</div>
  <h1 class="title">100 <em>Vault</em></h1>
  <p class="sub">Uzmanlaşmış yapay zeka araç arşivlerinin tek koleksiyonu. Prompt mühendisliğinden oyun motoruna, mitolojiden DevOps'a kadar her alan için hazır, kategorize edilmiş içerik.</p>
  <div class="stats">
    <div class="stat"><div class="stat-num">${vaults.length}</div><div class="stat-lbl">Vault</div></div>
    <div class="stat"><div class="stat-num">${CAT_ORDER.filter(c=>groups[c]).length}</div><div class="stat-lbl">Disiplin</div></div>
    <div class="stat"><div class="stat-num">${totalItems.toLocaleString('tr-TR')}</div><div class="stat-lbl">Toplam Öğe</div></div>
  </div>
</header>
<div class="search-wrap">
  <div class="search">
    <span class="search-icon">⌕</span>
    <input id="q" type="text" placeholder="Vault ara... (örn. prompt, shader, mitoloji)" autocomplete="off">
  </div>
</div>
<div class="wrap">
  ${sections}
  <div class="empty-note" id="empty">Eşleşen vault bulunamadı</div>
</div>
<footer class="footer">
  <div class="footer-brand">AI <em>Alet Çantası</em></div>
  <div class="footer-note">${vaults.length} Vault · ${filled} dolu · ${totalItems.toLocaleString('tr-TR')} öğe · Türkçe</div>
</footer>
<script>
const q=document.getElementById('q'), empty=document.getElementById('empty');
q.addEventListener('input',()=>{
  const v=q.value.trim().toLowerCase();
  let shown=0;
  document.querySelectorAll('.card').forEach(c=>{
    const t=(c.querySelector('.card-name').textContent+' '+c.querySelector('.card-desc').textContent).toLowerCase();
    const ok=!v||t.includes(v);
    c.style.display=ok?'':'none';
    if(ok)shown++;
  });
  document.querySelectorAll('.cat-section').forEach(s=>{
    const any=[...s.querySelectorAll('.card')].some(c=>c.style.display!=='none');
    s.style.display=any?'':'none';
  });
  empty.style.display=shown?'none':'block';
});
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf8');
  console.log(`✓ Master index üretildi → dist/index.html (${vaults.length} vault, ${totalItems} öğe)`);
}

build();
