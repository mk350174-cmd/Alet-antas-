/**
 * scoring.mjs — route_task (çapraz-grup yönlendirme) ve search_items skorlaması.
 *
 * Sunucunun LLM'i yok; yönlendirme tamamen leksikal TF/IDF eşleşmesidir. Türkçe
 * içeriği İngilizce iş tarifleriyle eşleştirmek için synonyms.mjs kanonik token
 * köprüsü kullanılır.
 */

import { tokenize } from './tokenize.mjs';
import { canonical } from './synonyms.mjs';

function canonCounts(text) {
  const counts = new Map();
  for (const t of tokenize(text)) {
    const c = canonical(t);
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  return counts;
}

/**
 * Bir iş tarifini ilgili vault'lara yönlendirir.
 * @param {object} index buildIndex() çıktısı
 * @param {object} opts {task, limit=8, diversify=true, minScore=0}
 */
export function routeTask(index, { task, limit = 8, diversify = true, minScore = 0 }) {
  const { vaults, idf } = index;
  const taskTokens = canonCounts(task);

  const scored = vaults.map(v => {
    let score = 0;
    const matched = [];
    for (const [tok, cnt] of taskTokens) {
      const w = v.weights.get(tok);
      if (!w) continue;
      const contrib = w * idf(tok) * Math.log(1 + cnt);
      score += contrib;
      matched.push({ tok, contrib });
    }
    score = score / v.norm;
    matched.sort((a, b) => b.contrib - a.contrib);
    return { v, score, matched: matched.map(m => m.tok) };
  }).filter(s => s.score > minScore);

  scored.sort((a, b) => b.score - a.score);

  // Çapraz-grup alet çantası: her grubun EN İYİ vault'unu öne çıkar — ama yalnızca
  // skoru üst eşleşmeye göre anlamlıysa (relTh). Böylece alakasız grup liderleri
  // (örn. e-ticaret işine "kültür" vault'u) çantaya girmez.
  let chosen;
  if (diversify && scored.length) {
    const topScore = scored[0].score;
    const relTh = topScore * 0.15; // grup liderleri için göreli alaka eşiği
    const seenGroup = new Set();
    const picked = [];
    const rest = [];
    for (const s of scored) {
      if (!seenGroup.has(s.v.categoryLabel) && s.score >= relTh) {
        seenGroup.add(s.v.categoryLabel);
        picked.push(s);
      } else {
        rest.push(s);
      }
    }
    chosen = dedupePreferDiversity(picked, rest, limit);
  } else {
    chosen = scored.slice(0, limit);
  }

  const recommended = chosen.map(s => ({
    slug: s.v.slug,
    vaultName: s.v.vaultName,
    categoryLabel: s.v.categoryLabel,
    score: round(s.score),
    matchedTokens: s.matched.slice(0, 6),
    reason: buildReason(s),
    itemCount: s.v.itemCount,
  }));

  const byGroup = {};
  for (const r of recommended) {
    (byGroup[r.categoryLabel] = byGroup[r.categoryLabel] || []).push(r.slug);
  }

  return {
    task,
    diversify,
    recommended,
    byGroup,
    suggestedNextCalls: [
      'get_vault(slug) — seçilen vault\'un item listesini al',
      'search_items(query) — item düzeyinde detay ara',
      'get_item(slug, itemId) — bir item\'ın tam içeriğini oku',
    ],
  };
}

// Önce gruplar arası çeşitlilik (her gruptan en iyi), sonra skorca en iyi kalanlar.
function dedupePreferDiversity(picked, rest, limit) {
  const out = [];
  const usedSlug = new Set();
  for (const s of picked) {
    if (out.length >= limit) break;
    out.push(s); usedSlug.add(s.v.slug);
  }
  const restSorted = rest.sort((a, b) => b.score - a.score);
  for (const s of restSorted) {
    if (out.length >= limit) break;
    if (usedSlug.has(s.v.slug)) continue;
    out.push(s); usedSlug.add(s.v.slug);
  }
  return out.sort((a, b) => b.score - a.score);
}

function buildReason(s) {
  if (!s.matched.length) return 'Genel kategori eşleşmesi';
  const toks = s.matched.slice(0, 4).map(t => `'${t}'`).join(', ');
  return `Eşleşen kavramlar: ${toks}`;
}

/**
 * Tüm item'larda tam-metin arama (kanonik token + TF/IDF).
 * @param {object} index
 * @param {object} opts {query, vault?, category?, limit=20}
 */
export function searchItems(index, { query, vault, category, limit = 20 }) {
  const { vaults, idf, itemPostings } = index;
  const qTokens = [...canonCounts(query).keys()];

  // (vi,ii) -> {score, hits}
  const acc = new Map();
  for (const tok of qTokens) {
    const postings = itemPostings.get(tok);
    if (!postings) continue;
    const tokIdf = idf(tok);
    for (const p of postings) {
      const key = p.vi + ':' + p.ii;
      const cur = acc.get(key) || { vi: p.vi, ii: p.ii, score: 0 };
      cur.score += p.w * tokIdf;
      acc.set(key, cur);
    }
  }

  let results = [...acc.values()].map(a => {
    const v = vaults[a.vi];
    const it = v.items[a.ii];
    return { v, it, score: a.score };
  });

  if (vault) results = results.filter(r => r.v.slug === vault);
  if (category) results = results.filter(r => r.v.category === category || r.v.categoryLabel === category);

  results.sort((a, b) => b.score - a.score);
  results = results.slice(0, limit);

  return results.map(r => ({
    slug: r.v.slug,
    vaultName: r.v.vaultName,
    itemId: r.it.id,
    name: r.it.name,
    desc: r.it.desc,
    tags: r.it.tags,
    badge1: r.it.badge1,
    score: round(r.score),
    snippet: makeSnippet(r.it.content, query),
  }));
}

// İçerikte ilk eşleşen terim etrafında ~160 karakterlik pencere.
function makeSnippet(content, query) {
  if (!content) return '';
  const lc = content.toLocaleLowerCase('tr-TR');
  const terms = tokenize(query);
  let idx = -1;
  for (const t of terms) {
    const at = lc.indexOf(t);
    if (at !== -1 && (idx === -1 || at < idx)) idx = at;
  }
  if (idx === -1) return content.slice(0, 160).trim() + (content.length > 160 ? '…' : '');
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + 100);
  return (start > 0 ? '…' : '') + content.slice(start, end).trim() + (end < content.length ? '…' : '');
}

function round(n) { return Math.round(n * 100) / 100; }
