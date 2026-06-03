#!/usr/bin/env node
/**
 * populate-ai.js — dataSource:"ai" olan config'leri Claude API ile doldurur.
 *
 * Her vault için Anthropic API'ye (claude-sonnet-4-6) vault adı + açıklaması
 * gönderir, 5-6 alt kategori ve 30+ item (name, desc, tags, content) içeren
 * JSON ister, parse edip config'in categories/items alanlarını yazar.
 *
 * Kullanım:
 *   ANTHROPIC_API_KEY=sk-ant-... node populate-ai.js
 *   node populate-ai.js --key sk-ant-...
 *   node populate-ai.js --only 31-mythvault-pro --key sk-ant-...
 *   node populate-ai.js --limit 5            # ilk 5 ai-vault (test/maliyet kontrolü)
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'configs');
const args = process.argv.slice(2);
function getArg(f) { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null; }

const API_KEY = getArg('--key') || process.env.ANTHROPIC_API_KEY;
const onlyArg = getArg('--only');
const limitArg = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
const MODEL = getArg('--model') || 'claude-sonnet-4-6';
const TARGET_ITEMS = 32;

if (!API_KEY) {
  console.error('HATA: API key gerekli. --key sk-ant-... veya ANTHROPIC_API_KEY env değişkeni kullanın.');
  process.exit(1);
}

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
      "content": "Kullanıcının doğrudan kullanabileceği eksiksiz, profesyonel talimat/şablon metni. Markdown başlıklar (## ile) ve adımlar içersin. En az 400 karakter."
    }
  ]
}

KURALLAR:
- 5-6 alt kategori üret, her birine farklı uyumlu hex renk ver.
- En az ${TARGET_ITEMS} item üret, kategorilere dengeli dağıt.
- content alanı gerçekten kullanılabilir, somut ve değerli olsun — yer tutucu değil.
- Tüm metin Türkçe olsun. JSON dışında hiçbir şey yazma.`;

function buildUserMessage(cfg) {
  return `Vault: ${cfg.title}
Amaç: ${cfg.subtitle}
Genel Kategori: ${cfg.categoryLabel}

Bu vault için ${TARGET_ITEMS}+ item ve 5-6 kategori içeren JSON üret.`;
}

async function callClaude(cfg, retries = 3) {
  const body = {
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(cfg) }],
  };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status === 529) {
        const wait = (attempt + 1) * 8000;
        console.log(`    ⏳ Yoğunluk (${res.status}), ${wait/1000}s bekleniyor...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return (data.content || []).map(b => b.type === 'text' ? b.text : '').join('');
    } catch (e) {
      if (attempt < retries) { await new Promise(r => setTimeout(r, (attempt + 1) * 5000)); continue; }
      throw e;
    }
  }
}

function extractJSON(text) {
  // Yanıttan ilk { ... son } bloğunu al (markdown fence olasılığına karşı)
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('JSON bulunamadı');
  return JSON.parse(t.slice(start, end + 1));
}

async function processConfig(file) {
  const fullPath = path.join(CONFIG_DIR, file);
  const cfg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (cfg.dataSource !== 'ai') return false;
  if (cfg.items && cfg.items.length >= TARGET_ITEMS) { console.log(`  • ${cfg.slug}: zaten dolu, atlandı`); return false; }

  try {
    const raw = await callClaude(cfg);
    const parsed = extractJSON(raw);
    if (!parsed.items || !parsed.items.length) throw new Error('item üretilmedi');

    cfg.categories = parsed.categories || [];
    cfg.items = parsed.items.map((it, i) => ({
      id: i + 1,
      no: String(i + 1).padStart(3, '0'),
      ...it,
      source: { generated: true, model: MODEL },
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

  console.log(`AI ile veri üretiliyor (${files.length} vault, model: ${MODEL})...`);
  let ok = 0;
  for (const f of files) {
    const r = await processConfig(f);
    if (r) ok++;
    await new Promise(res => setTimeout(res, 1200)); // nazik akış
  }
  console.log(`\nTamamlandı: ${ok}/${files.length} vault dolduruldu.`);
}

main();
