/**
 * index-store.mjs — configs/ yükleme + bellek-içi indeks.
 *
 * Başlangıçta tüm vault config'lerini okur, her vault için alan-ağırlıklı token
 * torbası (routing) ve item düzeyinde ters indeks (arama) kurar. Korpus küçük
 * (~100 vault, ~1987 item) olduğu için her şey bellekte tutulur; harici arama
 * kütüphanesi gerekmez.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize } from './tokenize.mjs';
import { canonical } from './synonyms.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(__dirname, '..', 'configs');

// Vault düzeyi yönlendirme için alan ağırlıkları.
const VAULT_FIELD_WEIGHTS = {
  title: 6,
  keywords: 5,
  category: 4,
  subtitle: 3,
  subcat: 2,
  itemName: 1.5,
  itemTag: 1.5,
  itemDesc: 0.5,
};

// Item düzeyi arama için alan ağırlıkları.
const ITEM_FIELD_WEIGHTS = {
  name: 5,
  tag: 3,
  desc: 2,
  content: 1,
};

/** title "PromptVault Pro — ..." → "PromptVault Pro" */
function vaultName(cfg) {
  return String(cfg.title || cfg.slug).split('—')[0].trim();
}

/** Bir metni kanonik token listesine çevirir. */
function canonTokens(text) {
  return tokenize(text).map(canonical);
}

/**
 * Tüm config'leri okuyup slug'a göre sıralar (build-index.js load() deseni).
 */
export function loadVaults() {
  return fs.readdirSync(CONFIG_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, f), 'utf8')))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Bellek-içi indeksi kurar ve sorgu yardımcılarıyla birlikte döner.
 */
export function buildIndex() {
  const raw = loadVaults();
  const vaults = [];

  // Vault başına kanonik token -> birikmiş ağırlık.
  for (const cfg of raw) {
    const name = vaultName(cfg);
    const weights = new Map();

    const add = (text, w) => {
      for (const tok of canonTokens(text)) {
        weights.set(tok, (weights.get(tok) || 0) + w);
      }
    };

    add(name, VAULT_FIELD_WEIGHTS.title);
    add(cfg.title, VAULT_FIELD_WEIGHTS.title);
    (cfg.metaKeywords || []).forEach(k => add(k, VAULT_FIELD_WEIGHTS.keywords));
    add(cfg.categoryLabel, VAULT_FIELD_WEIGHTS.category);
    add(cfg.category, VAULT_FIELD_WEIGHTS.category);
    add(cfg.subtitle, VAULT_FIELD_WEIGHTS.subtitle);
    add(cfg.metaDescription, VAULT_FIELD_WEIGHTS.subtitle);
    (cfg.categories || []).forEach(c => add(c.name, VAULT_FIELD_WEIGHTS.subcat));

    const items = (cfg.items || []).map(it => ({
      id: it.id,
      cat: it.cat,
      name: it.name,
      desc: it.desc,
      tags: it.tags || [],
      badge1: it.badge1,
      content: it.content || '',
      source: it.source || null,
    }));

    items.forEach(it => {
      add(it.name, VAULT_FIELD_WEIGHTS.itemName);
      (it.tags || []).forEach(t => add(t, VAULT_FIELD_WEIGHTS.itemTag));
      add(it.desc, VAULT_FIELD_WEIGHTS.itemDesc);
    });

    vaults.push({
      slug: cfg.slug,
      vaultName: name,
      title: cfg.title,
      subtitle: cfg.subtitle || '',
      metaDescription: cfg.metaDescription || '',
      category: cfg.category || '',
      categoryLabel: cfg.categoryLabel || 'Diğer',
      keywords: cfg.metaKeywords || [],
      colors: cfg.colors || {},
      subCategories: (cfg.categories || []).map(c => ({
        id: c.id, name: c.name, count: c.count || 0,
      })),
      items,
      itemCount: items.length,
      weights,
      // distinct token sayısının karekökü ile normalize (büyük vault'lar baskın olmasın)
      norm: Math.sqrt(Math.max(1, weights.size)),
    });
  }

  // IDF: bir kanonik token'ı (vault ağırlık torbasında) içeren vault sayısı.
  const df = new Map();
  for (const v of vaults) {
    for (const tok of v.weights.keys()) {
      df.set(tok, (df.get(tok) || 0) + 1);
    }
  }
  const N = vaults.length;
  const idf = (tok) => Math.log((N + 1) / ((df.get(tok) || 0) + 1)) + 1;

  // Item düzeyi ters indeks: kanonik token -> [{vi, ii, weight}]
  const itemPostings = new Map();
  const pushPosting = (tok, vi, ii, w) => {
    let arr = itemPostings.get(tok);
    if (!arr) { arr = []; itemPostings.set(tok, arr); }
    arr.push({ vi, ii, w });
  };
  vaults.forEach((v, vi) => {
    v.items.forEach((it, ii) => {
      const addItem = (text, w) => {
        for (const tok of canonTokens(text)) pushPosting(tok, vi, ii, w);
      };
      addItem(it.name, ITEM_FIELD_WEIGHTS.name);
      (it.tags || []).forEach(t => addItem(t, ITEM_FIELD_WEIGHTS.tag));
      addItem(it.desc, ITEM_FIELD_WEIGHTS.desc);
      addItem(it.content, ITEM_FIELD_WEIGHTS.content);
    });
  });

  const bySlug = new Map(vaults.map(v => [v.slug, v]));

  return { vaults, bySlug, idf, df, itemPostings, N };
}

export { vaultName, canonTokens };
