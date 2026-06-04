#!/usr/bin/env node
/**
 * mcp-server.mjs — "Alet Çantası" MCP sunucusu.
 *
 * 100 vault bilgi tabanını tek bir yönlendirilebilir sistem-mimarisi alet çantası
 * olarak MCP istemcisine (Claude Desktop / Claude Code) açar. Bir iş tarifi verilince
 * route_task aracı çapraz-grup ilgili vault'ları önerir; diğer araçlar içeriği getirir.
 *
 * stdio transport: stdout JSON-RPC kanalıdır — TÜM log'lar stderr'e yazılır.
 * Sunucu tamamen offline/self-contained; API anahtarı gerektirmez.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildIndex } from './lib/index-store.mjs';
import { routeTask, searchItems } from './lib/scoring.mjs';

const log = (...a) => console.error('[alet-cantasi]', ...a);

const index = buildIndex();
log(`indeks hazır: ${index.vaults.length} vault, ${index.vaults.reduce((s, v) => s + v.itemCount, 0)} item`);

const CATEGORY_KEYS = ['ai', 'game', 'history', 'devops', 'productivity', 'analytic'];

function jsonContent(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

function vaultSummary(v) {
  const topTags = [...new Set(v.items.flatMap(i => i.tags || []))].slice(0, 8);
  return {
    slug: v.slug,
    vaultName: v.vaultName,
    category: v.category,
    categoryLabel: v.categoryLabel,
    subtitle: v.subtitle,
    itemCount: v.itemCount,
    topTags,
  };
}

const server = new McpServer({ name: 'alet-cantasi', version: '0.1.0' });

// ── list_vaults ──────────────────────────────────────────────────────────────
server.registerTool('list_vaults', {
  title: 'List vaults',
  description:
    'Tüm 100 vault\'u (Türkçe bilgi tabanları) listeler veya filtreler. ' +
    'Optional: category (ai|game|history|devops|productivity|analytic) ve query (ad/altbaşlık alt-dizesi). ' +
    'Browse the full toolbox of vaults; content is Turkish.',
  inputSchema: {
    category: z.enum(CATEGORY_KEYS).optional().describe('Kategori anahtarına göre filtrele'),
    query: z.string().optional().describe('Vault adı/altbaşlığında alt-dize araması'),
  },
}, async ({ category, query }) => {
  let list = index.vaults;
  if (category) list = list.filter(v => v.category === category);
  if (query) {
    const q = query.toLocaleLowerCase('tr-TR');
    list = list.filter(v =>
      (v.vaultName + ' ' + v.subtitle).toLocaleLowerCase('tr-TR').includes(q));
  }
  // categoryLabel'a göre grupla
  const grouped = {};
  for (const v of list) {
    (grouped[v.categoryLabel] = grouped[v.categoryLabel] || []).push(vaultSummary(v));
  }
  return jsonContent({ total: list.length, byCategory: grouped });
});

// ── route_task ───────────────────────────────────────────────────────────────
server.registerTool('route_task', {
  title: 'Route a task to vaults',
  description:
    'Bir iş/proje tarifi verildiğinde hangi vault\'ların gerektiğini ÇAPRAZ-GRUP olarak ' +
    'yönlendirir — sistem mimarisi için bir alet çantası kurar. TR ve EN tarifleri destekler. ' +
    'Given a task description, returns a cross-group toolkit of relevant vaults with reasons. ' +
    'Örnek: "SEO\'lu e-ticaret sitesi ve lansman hunisi kur".',
  inputSchema: {
    task: z.string().describe('İş/proje tarifi (Türkçe veya İngilizce)'),
    limit: z.number().int().min(1).max(30).optional().describe('Önerilecek vault sayısı (varsayılan 8)'),
    diversify: z.boolean().optional().describe('Çapraz-grup çeşitlilik (varsayılan true)'),
    minScore: z.number().optional().describe('Minimum skor eşiği (varsayılan 0)'),
  },
}, async ({ task, limit, diversify, minScore }) => {
  const result = routeTask(index, {
    task,
    limit: limit ?? 8,
    diversify: diversify ?? true,
    minScore: minScore ?? 0,
  });
  return jsonContent(result);
});

// ── get_vault ────────────────────────────────────────────────────────────────
server.registerTool('get_vault', {
  title: 'Get vault detail',
  description:
    'Bir vault\'un tam detayını döner: metadata, alt-kategoriler ve item listesi (içerik hariç). ' +
    'Item tam içeriği için get_item kullan. Returns vault metadata + item list (no full content).',
  inputSchema: {
    slug: z.string().describe('Vault slug, örn. "68-ecomvault-pro"'),
    includeItems: z.boolean().optional().describe('Item listesini dahil et (varsayılan true)'),
  },
}, async ({ slug, includeItems }) => {
  const v = index.bySlug.get(slug);
  if (!v) return jsonContent({ error: `Vault bulunamadı: ${slug}` });
  const out = {
    slug: v.slug,
    vaultName: v.vaultName,
    title: v.title,
    subtitle: v.subtitle,
    category: v.category,
    categoryLabel: v.categoryLabel,
    keywords: v.keywords,
    subCategories: v.subCategories,
    itemCount: v.itemCount,
  };
  if (includeItems ?? true) {
    out.items = v.items.map(i => ({
      id: i.id, cat: i.cat, name: i.name, desc: i.desc, tags: i.tags, badge1: i.badge1,
    }));
  }
  return jsonContent(out);
});

// ── search_items ─────────────────────────────────────────────────────────────
server.registerTool('search_items', {
  title: 'Search items',
  description:
    'Tüm vault\'lardaki ~1987 item içinde tam-metin arama yapar (TR/EN köprülü). ' +
    'Full-text search across all items; returns matches with vault slug, item id and a snippet.',
  inputSchema: {
    query: z.string().describe('Arama sorgusu (Türkçe veya İngilizce)'),
    vault: z.string().optional().describe('Tek bir vault slug ile sınırla'),
    category: z.string().optional().describe('Kategori anahtarı veya etiketi ile sınırla'),
    limit: z.number().int().min(1).max(100).optional().describe('Sonuç sayısı (varsayılan 20)'),
  },
}, async ({ query, vault, category, limit }) => {
  const results = searchItems(index, { query, vault, category, limit: limit ?? 20 });
  return jsonContent({ query, count: results.length, results });
});

// ── get_item ─────────────────────────────────────────────────────────────────
server.registerTool('get_item', {
  title: 'Get item content',
  description:
    'Bir item\'ın tam Markdown içeriğini ve kaynak atıfını (source) döner. ' +
    'Returns full Turkish markdown content of one item plus its source attribution.',
  inputSchema: {
    slug: z.string().describe('Vault slug'),
    itemId: z.number().int().describe('Item numeric id (1\'den başlar)'),
  },
}, async ({ slug, itemId }) => {
  const v = index.bySlug.get(slug);
  if (!v) return jsonContent({ error: `Vault bulunamadı: ${slug}` });
  const it = v.items.find(i => i.id === itemId);
  if (!it) return jsonContent({ error: `Item bulunamadı: ${slug}#${itemId}` });
  return jsonContent({
    slug: v.slug,
    vaultName: v.vaultName,
    item: {
      id: it.id, cat: it.cat, name: it.name, desc: it.desc,
      tags: it.tags, badge1: it.badge1, content: it.content, source: it.source,
    },
  });
});

// ── Resources: vault://{slug} (opsiyonel, manuel @-attach için) ───────────────
server.registerResource('vault', new ResourceTemplate('vault://{slug}', {
  list: async () => ({
    resources: index.vaults.map(v => ({
      uri: `vault://${v.slug}`,
      name: v.vaultName,
      description: `${v.categoryLabel} — ${v.subtitle} (${v.itemCount} item)`,
      mimeType: 'application/json',
    })),
  }),
}), {
  title: 'Vault',
  description: 'Tek bir vault\'un metadata + item listesi (JSON).',
}, async (uri, { slug }) => {
  const v = index.bySlug.get(slug);
  const body = v ? {
    slug: v.slug, vaultName: v.vaultName, subtitle: v.subtitle,
    categoryLabel: v.categoryLabel, keywords: v.keywords,
    subCategories: v.subCategories,
    items: v.items.map(i => ({ id: i.id, cat: i.cat, name: i.name, desc: i.desc, tags: i.tags })),
  } : { error: `Vault bulunamadı: ${slug}` };
  return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(body, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
log('MCP sunucusu stdio üzerinde bağlı.');
