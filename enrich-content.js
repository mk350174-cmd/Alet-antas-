#!/usr/bin/env node
/**
 * enrich-content.js — item içeriklerini güvenli şekilde zenginleştirir.
 *
 * apply-content.js'in aksine categories/tags/colors gibi yapıyı DEĞİŞTİRMEZ;
 * yalnızca eşleşen item'ların `content` alanını günceller. Eşleştirme item
 * `name` ile yapılır (slug bazında).
 *
 * Girdi formatı (content/enrich-XX.json):
 * {
 *   "10-routervault-pro": {
 *     "Uygun Model Belirleme": "## Yeni zengin içerik...",
 *     ...
 *   }
 * }
 *
 * Kullanım: node enrich-content.js content/enrich-XX.json
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, 'configs');
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Kullanım: node enrich-content.js <batch.json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
let vaultCount = 0, updated = 0, missing = [];

for (const [slug, contentMap] of Object.entries(data)) {
  const file = path.join(CONFIG_DIR, slug + '.json');
  if (!fs.existsSync(file)) { console.error(`  ✗ config yok: ${slug}`); continue; }
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const byName = new Map((cfg.items || []).map(it => [it.name, it]));
  let n = 0;
  for (const [name, content] of Object.entries(contentMap)) {
    const it = byName.get(name);
    if (!it) { missing.push(`${slug} :: ${name}`); continue; }
    it.content = content;
    n++; updated++;
  }
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2), 'utf8');
  vaultCount++;
  console.log(`  ✓ ${slug}: ${n} item içeriği güncellendi`);
}

console.log(`\nZenginleştirildi: ${vaultCount} vault, ${updated} item.`);
if (missing.length) {
  console.error(`\n⚠ Eşleşmeyen ${missing.length} item adı:`);
  missing.forEach(m => console.error('   - ' + m));
  process.exit(2);
}
