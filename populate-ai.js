#!/usr/bin/env node
/**
 * populate-ai.js — dataSource:"ai" olan config'leri AI ile doldurur.
 *
 * Claude (Anthropic) veya Gemini (Google) destekler. Key formatından sağlayıcı
 * otomatik algılanır: "AIza..." → Gemini, "sk-ant..." → Claude.
 * Her vault için vault adı + açıklaması gönderir, 5-6 alt kategori ve 30+ item
 * (name, desc, tags, content) içeren JSON ister, config'e yazar.
 *
 * Kullanım:
 *   node populate-ai.js --key AIza...                 # Gemini (ucuz/hızlı)
 *   GEMINI_API_KEY=AIza... node populate-ai.js
 *   node populate-ai.js --key sk-ant-...              # Claude
 *   node populate-ai.js --only 31-mythvault-pro --key AIza...
 *   node populate-ai.js --limit 5 --key AIza...       # ilk 5 (test/maliyet)
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'configs');
const args = process.argv.slice(2);
function getArg(f) { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null; }

const API_KEY = getArg('--key') || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
const onlyArg = getArg('--only');
const limitArg = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
const TARGET_ITEMS = getArg('--items') ? parseInt(getArg('--items'), 10) : 20;

if (!API_KEY) {
  console.error('HATA: API key gerekli. --key AIza... (Gemini) veya --key sk-ant-... (Claude).');
  process.exit(1);
}

// Sağlayıcıyı key formatından algıla
const PROVIDER = getArg('--provider') || (API_KEY.startsWith('sk-ant') ? 'claude' : 'gemini');
const MODEL = getArg('--model') || (PROVIDER === 'claude' ? 'claude-sonnet-4-6' : 'gemini-2.0-flash');

const SYSTEM_PROMPT = `Sen bir AI araç kütüphanesi (vault) için içerik üreten uzman bir editörsün.
Sana bir vault'un adı ve amacı verilir. Türkçe olarak, bu vault'a ait gerçekçi ve
yüksek kaliteli içerik üret.

ÇIKTI: Yalnızca geçerli JSON döndür (markdown yok, açıklama yok). Şema:
{
  "categories": [
    {"id": "Kategori Adı", "name": "Kategori Adı", "color": "#rrggbb"}
  ],
  "items": [
    {
      "cat": "Kategori Adı (yukarıdakilerden biri)",
      "name": "Kısa öğe adı",
      "desc": "Tek cümlelik açıklama (max 90 karakter)",
      "tags": ["etiket1", "etiket2", "etiket3"],
      "badge1": "Zorluk (Başlangıç/Orta/İleri)",
      "content": "Kullanıcının doğrudan kullanabileceği profesyonel talimat/şablon metni. Markdown başlıklar (## ile) ve adımlar içersin. 200-350 karakter, öz ve somut."
    }
  ]
}

KURALLAR:
- 5-6 alt kategori üret, her birine farklı uyumlu hex renk ver.
- Tam ${TARGET_ITEMS} item üret, kategorilere dengeli dağıt.
- content alanı gerçekten kullanılabilir, somut ve değerli olsun — yer tutucu değil ama gereksiz uzun da değil.
- Tüm metin Türkçe olsun. JSON dışında hiçbir şey yazma.`;

function buildUserMessage(cfg) {
  return `Vault: ${cfg.title}
Amaç: ${cfg.subtitle}
Genel Kategori: ${cfg.categoryLabel}

Bu vault için ${TARGET_ITEMS}+ item ve 5-6 kategori içeren JSON üret.`;
}

async function callClaude(cfg) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(cfg) }],
    }),
  });
  if (res.status === 429 || res.status === 529) { const e = new Error(`yoğunluk ${res.status}`); e.retryable = true; throw e; }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.content || []).map(b => b.type === 'text' ? b.text : '').join('');
}

async function callGemini(cfg) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(cfg) }] }],
      generationConfig: { maxOutputTokens: 32768, temperature: 0.8, responseMimeType: 'application/json' },
    }),
  });
  if (res.status === 429 || res.status === 503) { const e = new Error(`yoğunluk ${res.status}`); e.retryable = true; throw e; }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAI(cfg, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return PROVIDER === 'claude' ? await callClaude(cfg) : await callGemini(cfg);
    } catch (e) {
      if ((e.retryable || attempt < retries) && attempt < retries) {
        const wait = (attempt + 1) * 6000;
        console.log(`    ⏳ ${e.message}, ${wait/1000}s bekleniyor...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
}

function extractJSON(text) {
  // Markdown fence ve baştaki çöpü temizle, ilk { 'ten başla
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = t.indexOf('{');
  if (start === -1) throw new Error('JSON bulunamadı');
  t = t.slice(start);

  // 1) Doğrudan dene
  try { return JSON.parse(t); } catch (_) {}
  // 2) Son } 'a kadar dene
  try { return JSON.parse(t.slice(0, t.lastIndexOf('}') + 1)); } catch (_) {}
  // 3) Kurtarma: yanıt truncate olduysa son tam item objesine kadar kes,
  //    items array'ini ve root objeyi kapat. (şema: {categories:[...], items:[...]})
  const cut = t.lastIndexOf('},');
  if (cut !== -1) {
    try { return JSON.parse(t.slice(0, cut + 1) + ']}'); } catch (_) {}
  }
  throw new Error('JSON kurtarılamadı (truncate)');
}

async function processConfig(file) {
  const fullPath = path.join(CONFIG_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (cfg.dataSource !== 'ai') return false;
  if (cfg.items && cfg.items.length >= TARGET_ITEMS) { console.log(`  • ${cfg.slug}: zaten dolu, atlandı`); return false; }

  try {
    const raw = await callAI(cfg);
    const parsed = extractJSON(raw);
    if (!parsed.items || !parsed.items.length) throw new Error('item üretilmedi');

    cfg.categories = parsed.categories || [];
    cfg.items = parsed.items.map((it, i) => ({
      id: i + 1,
      no: String(i + 1).padStart(3, '0'),
      ...it,
      source: { generated: true, provider: PROVIDER, model: MODEL },
    }));
    fs.writeFileSync(fullPath, JSON.stringify(cfg, null, 2), 'utf8');
    console.log(`  ✓ ${cfg.slug}: ${cfg.items.length} item, ${cfg.categories.length} kategori`);
    return true;
  } catch (e) {
    console.log(`  ✗ ${cfg.slug}: ${e.message}`);
    return false;
  }
}

async function main() {
  let files = fs.readdirSync(CONFIG_DIR).filter(f => f.endsWith('.json'));
  if (onlyArg) files = files.filter(f => f.startsWith(onlyArg) || f === onlyArg + '.json');

  // Sadece ai-vault'lar
  files = files.filter(f => {
    const c = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, f), 'utf8'));
    return c.dataSource === 'ai';
  });
  if (limitArg) files = files.slice(0, limitArg);

  console.log(`AI ile veri üretiliyor (${files.length} vault, sağlayıcı: ${PROVIDER}, model: ${MODEL})...`);
  let ok = 0;
  for (const f of files) {
    const r = await processConfig(f);
    if (r) ok++;
    await new Promise(res => setTimeout(res, 1200)); // nazik akış
  }
  console.log(`\nTamamlandı: ${ok}/${files.length} vault dolduruldu.`);
}

main();
