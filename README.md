# Alet Çantası — 100 Vault + MCP Router

100 adet standalone HTML5 "vault" bilgi tabanı ve bunları tek bir **yönlendirilebilir
sistem-mimarisi alet çantası** olarak açan bir **MCP sunucusu**.

Her vault, belirli bir alanda (AI/prompt, oyun motoru, tarih, DevOps, verimlilik,
spesifik disiplinler) Türkçe içerik barındırır. MCP sunucusu, bir iş tarifi verildiğinde
hangi vault'ların gerektiğini **çapraz-grup** olarak önerir.

## Vault Üretim Pipeline'ı (mevcut)

```bash
node generate.js --batch configs/   # configs/*.json → dist/*.html (100 vault)
node build-index.js                  # dist/index.html master katalog
node apply-content.js content/X.json # bir içerik batch'ini configs/'e uygula
```

## MCP Sunucusu — Alet Çantası Router'ı

100 vault'u MCP istemcisine (Claude Desktop / Claude Code) 5 araç olarak açar.
Tamamen offline; **API anahtarı gerektirmez**.

### Kurulum

```bash
npm install        # @modelcontextprotocol/sdk
node test-mcp.mjs  # araç mantığını doğrula (istemci gerekmez)
```

### Araçlar

| Araç | Ne yapar |
|---|---|
| `list_vaults` | Tüm vault'ları listeler/filtreler (category, query) |
| `route_task` | Bir iş tarifini çapraz-grup ilgili vault'lara yönlendirir (TR/EN) |
| `get_vault` | Bir vault'un metadata + item listesini döner |
| `search_items` | ~1987 item içinde tam-metin arama (TR/EN köprülü) |
| `get_item` | Bir item'ın tam Markdown içeriğini + kaynak atfını döner |

### Claude Code'a Ekleme

Repo kökündeki `.mcp.json` otomatik algılanır. Alternatif:

```bash
claude mcp add alet-cantasi -- node /home/user/Alet-antas-/mcp-server.mjs
```

### Claude Desktop'a Ekleme

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "alet-cantasi": { "command": "node", "args": ["/ABS/PATH/Alet-antas-/mcp-server.mjs"] }
  }
}
```

### Manuel Test (MCP Inspector)

```bash
npx @modelcontextprotocol/inspector node mcp-server.mjs
```

### Örnek

`route_task("SEO'lu e-ticaret sitesi ve lansman hunisi kur")` →
`funnelvault`, `ecomvault`, `advault`, `autovault` … (farklı gruplardan uyumlu takım).

## Mimari

```
configs/*.json ──┬─► generate.js ─► dist/*.html      (kullanıcıya yönelik vault'lar)
                 └─► lib/index-store.mjs ─► mcp-server.mjs  (MCP router)
                       ├─ lib/tokenize.mjs   (TR-duyarlı tokenizasyon)
                       ├─ lib/synonyms.mjs   (TR↔EN köprü)
                       └─ lib/scoring.mjs    (route_task TF/IDF + diversify, search_items)
```
