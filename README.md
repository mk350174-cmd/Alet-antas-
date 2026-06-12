# 🔧 Alet Çantası — 100+ Vault Uygulaması & Rehber Kataloğu

> **Prompt Engineering, Araçlar, İçerik Zenginleştirme ve AI Entegrasyonu** için 100+ web uygulaması + 1.600+ satır geliştirme önerisi.

## 🎯 Proje Özeti

**Alet Çantası**, 6 disiplin alanında (Arama, Kişiselleştirme, AI, Dışa Aktarma, Mimari, UI/UX + Güvenlik, Analitik, İçerik, Geliştirici) **100 bağımsız vault uygulaması** ve bunlara entegre edilebilecek **130+ açık kaynak teknolojisini** kaynak göstermektedir.

- **100 Vault HTML dosyası** — Her biri tamamen işlevsel, self-contained web app
- **Master index.html** — 100 vault'a hızlı linkler, kategori filtresi
- **3 Rehber Dokümantasyonu** — 1.600+ satır geliştirme önerisi ve teknik altyapı

---

## 📦 Kurulum

### 1. Gereksinimleri Yükle
```bash
npm install
```

### 2. Lokal Sunucu Çalıştır
```bash
npm run serve
```

Tarayıcınızda açın: **http://localhost:8080**

### 3. İçeriği Kontrol Et
```bash
ls dist/*.html | wc -l  # 101 dosya olmalı (100 vault + index)
```

---

## 📚 Dosya Yapısı

```
Alet-antas-/
├── dist/                              # Üretim çıktısı
│   ├── index.html                     # Master katalog
│   ├── 01-promptvault-pro.html        # PromptVault (6000+ prompt)
│   ├── 02-logicvault-pro.html         # LogicVault (mantık, algoritma)
│   ├── ...
│   └── 100-pitchvault-pro.html        # PitchVault (sunum şablonları)
├── configs/                           # Vault metadata (99 JSON)
├── content/                           # Vault veri dosyaları (batch JSON)
├── build-*.js                         # Node.js build scriptleri (5 dosya)
├── vault-template.html                # Tüm vault'ların temel şablonu
├── vault-ideas.json                   # 100 vault fikri ve başlangıç verileri
│
├── alet-cantasi-100-repo-onerisi.md   # 130+ repo kataloğu + kurulum faz
├── alet-cantasi-100-ileri-oneri-v2.md # 100+ ileri teknik öneriler
├── alet-cantasi-100-oneri.md          # Temel 100 geliştirme önerisi
│
├── package.json                       # Node.js config
├── .gitignore                         # Git ignore kuralları
└── README.md                          # Bu dosya
```

---

## 📖 Rehber Dokümantasyonu

### 1. **alet-cantasi-100-repo-onerisi.md** (714 satır)
**130+ Açık Kaynak Teknoloji Kataloğu & Kurulum Yol Haritası**

- **A–J Öneriler:** Arama (Fuse.js, MiniSearch), Kişiselleştirme, AI (Anthropic SDK), Dışa Aktarma, Mimari, UI/UX, Güvenlik, Analitik, İçerik, Geliştirici
- **K. Vault-Özel Repo'lar:** Her vault'a özel teknoloji (chess.js, three.js, AR.js, vb)
- **L. Webhook & Veri Çekme:** n8n, Crawlee, Supabase vb
- **M. Kurulum Faz Yol Haritası:** F1–F9 (1 hafta hızlı kazanım → 3+ hafta federation)

👉 **Başlamak için:** F1 (Fuse.js, Clusterize.js, marked, Workbox)

### 2. **alet-cantasi-100-ileri-oneri-v2.md** (558 satır)
**2025–2026 İleri Teknik Öneriler (101–212+)**

- **N. Browser-içi AI Çıkarım** (WebLLM, transformers.js, Whisper, Diffusion)
- **O. Local-First & Sync** (Yjs CRDT, Automerge, peer-to-peer)
- **P. MCP & Agent Entegrasyonu** (Model Context Protocol)
- **Q. RAG ve Vektör Altyapısı** (Embedding, semantic search)
- **R–W. Routing, Güvenlik, UI/UX, Veri Mimarisi, Kültür** (20+ alt öneriler)

👉 **Hedefler:** Privacy-first, local-first, AI-native, zero-server

### 3. **alet-cantasi-100-oneri.md** (355 satır)
**Temel 100 Geliştirme Önerisi Özeti (1–100)**

Kısa açıklamalar ile her önerinin amacı ve kullanım örneği.

---

## 🔨 Build & Geliştirme

### Mevcut Node.js Scriptleri
```bash
node build-configs.js     # 99 vault config iskeleti üret
node fetch-web-data.js    # Web kaynaklarından veri çek
node populate-ai.js       # API ile vault'ları doldur
node generate.js          # HTML dosyaları üret
node build-index.js       # Master index.html üret
```

### Gelecek: Vite Migrasyonu (F4–F5)
- Modern bundler, code splitting per vault
- Hot reload, TypeScript desteği
- Service Worker, PWA, offline support

---

## 🚀 Kullanım Örneği

### Vault Aç
1. **http://localhost:8080** → index.html açılır
2. "PromptVault" kartına tıkla
3. 6000+ prompt'a erişebilirsin (arama, filtre, kopyalama, favoriler, notlar, vb)

### Kurulum Faz (M. Bölüm)
| Faz | Süre | Teknoloji | Neden |
|-----|------|-----------|-------|
| **F1** | 1 hafta | Fuse.js, Clusterize.js, marked | Hızlı kazanım (arama, sayfalama, highlight) |
| **F2** | 1–2 hafta | Anthropic SDK, p-queue, LangChain | AI altyapı (streaming, batch, chain) |
| **F3** | 1 hafta | Dexie, PapaParse, html2pdf | Dışa aktarma (JSON, CSV, PDF) |
| **F4** | 1–2 hafta | Vite, Workbox, FlexSearch | Performans & PWA |
| **F5** | 2 hafta | Tailwind, Floating UI, i18next | UX & Erişilebilirlik & i18n |

Detaylı yol haritası için **alet-cantasi-100-repo-onerisi.md** § M. bölümünü okuyun.

---

## 📝 Katkı

İstek veya öneri:
1. Markdown'larda ilgili bölümü düzenle
2. `npm run format` ile formatting'i düzelt
3. Commit & PR oluştur

---

## 📄 Lisans

Bu proje MIT lisansı altındadır. Kaynakçada gösterilen repo'ların çoğu MIT/Apache-2.0/BSD altında. **Ticari kullanım öncesi her bir kütüphanenin LICENSE dosyasını doğrulayın.**

---

## 👤 İletişim

- **Geliştirici:** Mehmet Koyuncu  
- **Email:** mk350174@gmail.com  
- **GitHub:** [mk350174-cmd/Alet-antas-](https://github.com/mk350174-cmd/Alet-antas-)

---

## 🔗 Hızlı Bağlantılar

- **Master Index:** `dist/index.html`
- **Repository Kataloğu:** `alet-cantasi-100-repo-onerisi.md`
- **İleri Öneriler:** `alet-cantasi-100-ileri-oneri-v2.md`
- **Temel 100 Öneriler:** `alet-cantasi-100-oneri.md`

---

**Son güncelleme:** 2026-06-12 · **Vault sayısı:** 100 · **HTML dosyası:** 101