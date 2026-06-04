#!/usr/bin/env node
/**
 * apply-content.js — editörce yazılmış vault içeriğini config'lere işler.
 *
 * Girdi: { "<slug>": { "categories": [...], "items": [...] }, ... } şeklinde
 * bir JSON dosyası. Her slug için ilgili config'i bulur, categories'i yazar,
 * items'a id/no/source alanlarını ekleyip kaydeder.
 *
 * Kullanım:  node apply-content.js content/batch-01.json
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'configs');
const inputFile = process.argv[2];
if (!inputFile) { console.error('Kullanım: node apply-content.js <içerik.json>'); process.exit(1); }

const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
let applied = 0;

for (const [slug, payload] of Object.entries(data)) {
  const file = path.join(CONFIG_DIR, slug.endsWith('.json') ? slug : slug + '.json');
  if (!fs.existsSync(file)) { console.log(`  ✗ ${slug}: config bulunamadı`); continue; }
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!payload.items || !payload.items.length) { console.log(`  ✗ ${slug}: item yok`); continue; }

  cfg.categories = payload.categories || [];
  cfg.items = payload.items.map((it, i) => ({
    id: i + 1,
    no: String(i + 1).padStart(3, '0'),
    ...it,
    source: { generated: true },
  }));
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2), 'utf8');
  console.log(`  ✓ ${slug}: ${cfg.items.length} item, ${cfg.categories.length} kategori`);
  applied++;
}

console.log(`\nUygulandı: ${applied} vault.`);
