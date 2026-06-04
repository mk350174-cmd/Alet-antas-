#!/usr/bin/env node
/**
 * test-mcp.mjs — MCP araç mantığını istemci olmadan doğrular.
 * Çalıştır: node test-mcp.mjs   (tüm assert PASS → exit 0, hata → exit 1)
 */

import { buildIndex } from './lib/index-store.mjs';
import { routeTask, searchItems } from './lib/scoring.mjs';

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

const index = buildIndex();
const totalItems = index.vaults.reduce((s, v) => s + v.itemCount, 0);

console.log('İndeks:');
check('100 vault yüklendi', index.vaults.length === 100, `görülen: ${index.vaults.length}`);
check('~1987 item yüklendi', totalItems >= 1900, `görülen: ${totalItems}`);

console.log('\nroute_task — e-ticaret/SEO/huni (TR):');
{
  const r = routeTask(index, { task: 'SEO\'lu e-ticaret sitesi ve lansman hunisi kur', limit: 8 });
  const slugs = r.recommended.map(x => x.slug);
  const groups = Object.keys(r.byGroup).length;
  console.log('   →', slugs.join(', '));
  check('ecom/ad/funnel\'den biri üst 8\'de',
    slugs.some(s => /ecom|advault|funnel/.test(s)), slugs.join(','));
  check('en az 3 farklı gruptan vault', groups >= 3, `grup: ${groups}`);
}

console.log('\nroute_task — godot 3D oyun (TR):');
{
  const r = routeTask(index, { task: 'godot ile 3D oyun ve shader yap', limit: 6 });
  const slugs = r.recommended.map(x => x.slug);
  console.log('   →', slugs.join(', '));
  check('oyun grubu vault\'u üstte (godot/engine/shader)',
    /godot|engine|shader|physics/.test(slugs[0] || ''), slugs.join(','));
}

console.log('\nroute_task — İngilizce tarif (EN→TR köprü):');
{
  const r = routeTask(index, { task: 'build a database backed REST api with security and deployment', limit: 8 });
  const slugs = r.recommended.map(x => x.slug);
  console.log('   →', slugs.join(', '));
  check('db/api/sec/deploy\'dan biri eşleşti',
    slugs.some(s => /dbvault|apivault|secvault|deployvault|archvault/.test(s)), slugs.join(','));
}

console.log('\nsearch_items:');
{
  const res = searchItems(index, { query: 'smart contract', limit: 5 });
  console.log('   →', res.map(r => `${r.slug}#${r.itemId}`).join(', '));
  check('smart contract için sonuç var', res.length > 0);
  check('snippet dolu', res.length > 0 && res[0].snippet.length > 0);
}

console.log('\nget_item (doğrudan model):');
{
  const v = index.bySlug.get('01-promptvault-pro');
  const it = v && v.items.find(i => i.id === 1);
  check('01-promptvault-pro#1 mevcut', !!it);
  check('content dolu', !!it && it.content.length > 50, it ? `len ${it.content.length}` : '');
}

console.log(`\nSonuç: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
