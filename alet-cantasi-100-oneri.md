# Alet Çantası — 100 Geliştirme Önerisi

> Proje analizi: 100 HTML vault dosyası + index.html · 52.240 toplam öğe · 6 disiplin  
> Mevcut özellikler: Kategori filtresi, metin araması, kopyalama, benzer öğeler, API key saklama, grid/detay görünümü

---

## 🔍 A. Arama & Keşif (1–15)

**1. Tam metin arama (fuzzy search)**  
Şu an arama yalnızca `name` ve `desc` alanlarına bakıyor. `content` içinde de arama yapılmalı, eşleşen kısımlar sarı ile vurgulanmalı (highlight). Fuse.js gibi hafif bir kütüphane ile tolere edilebilir yazım hataları da yakalanır.

**2. Boolean arama operatörleri**  
`"sistem promptu" AND persona NOT jailbreak` gibi gelişmiş sorgular. Özellikle 6.000+ öğeli PromptVault için kritik.

**3. Gelişmiş filtre paneli**  
Şu anda yalnızca kategori filtresi var. Badge1/badge2 değerlerine, kaynak tipine (`community` vs harici URL) ve içerik uzunluğuna göre çoklu filtre kombinasyonu.

**4. Arama geçmişi**  
Son 10 sorgu localStorage'da saklanır, tek tıkla tekrar çalıştırılır.

**5. Sesli arama**  
Web Speech API ile mikrofon butonu; mobil kullanım için özellikle değerli.

**6. "Bunu içermeyen" (exclude) filtresi**  
Bir vault içinde belli etiketleri veya kelimeleri içeren öğeleri gizleme.

**7. Regex ile arama**  
Gelişmiş kullanıcılar için `/.*/` sözdizimi desteği; RegexVault ve LogVault gibi teknik vault'lar için birebir uygun.

**8. Arama sonuçlarını sıralama**  
Alaka (relevance score), alfabetik, ekleme tarihi veya içerik uzunluğu seçenekleri.

**9. Etiket (tag) araması**  
`#persona` veya `#CoT` gibi hashtag sorguları; etiket bulutundan tek tıkla filtreleme.

**10. Semantik arama (embedding tabanlı)**  
Öğe `desc` metinleri önceden vektörleştirilir, kullanıcı sorgusu da embedding'e çevrilir, kosinüs benzerliğiyle sıralama yapılır. Anthropic API zaten entegre — bu doğal bir uzantı.

**11. Vault'lar arası global arama**  
`index.html`'den tüm 100 vault'ta aynı anda arama yapabilen birleşik arayüz. Şu an her vault izole çalışıyor.

**12. Otomatik tamamlama (autocomplete)**  
Yazmaya başladığında öğe isimlerinden anlık öneri listesi.

**13. "Buna benzer vault öğeleri" önerisi**  
Bir öğe seçildiğinde yalnızca `sameCat.slice(0,4)` değil, etiket örtüşmesine göre diğer vault'lardan da benzer öğeler gösterilsin.

**14. Kelime frekans bulutu**  
Aktif kategorideki içeriklerde en çok geçen kelimeleri görsel olarak sergileyen word cloud.

**15. "Bugünün öğesi" rastgele keşif**  
Her açılışta bir öğeyi öne çıkaran motivasyonel banner; aynı öğe 24 saat boyunca sabit kalır.

---

## ❤️ B. Kişiselleştirme & Organizasyon (16–30)

**16. Favoriler sistemi**  
Her öğeye ⭐ butonu; favori öğeler ayrı bir sekme veya sidebar bölümünde listelenir. localStorage'da saklanır.

**17. Koleksiyonlar / klasörler**  
Kullanıcı kendi "Koleksiyonum" adını verdiği listeler oluşturur, öğeleri sürükle-bırak ile ekler. JSON olarak dışa aktarılabilir.

**18. Kişisel notlar**  
Her öğeye kullanıcının kendi notunu yazabileceği küçük bir alan; `[öğeId]: "not metni"` şeklinde localStorage'da.

**19. Kullanım geçmişi**  
Son görüntülenen 20 öğe "Geçmiş" bölümünde, zaman damgasıyla gösterilir.

**20. Okundu/okunmadı işareti**  
Her öğeye "✓ İncelendi" damgası; büyük vault'larda ilerleme takibi için.

**21. Öncelik/derecelendirme**  
1–5 yıldız kişisel not sistemi; öğelerin kişisel kullanım değerini kaydetmek için.

**22. Renk etiketleme**  
Kırmızı/sarı/yeşil renk etiketi; "acil", "incelenecek", "hazır" gibi iş akışı durumlarını işaretlemek için.

**23. Karanlık/aydınlık tema geçişi**  
Mevcut arayüz karanlık tema üzerine kurulu. Aydınlık tema seçeneği ve sistem temasına otomatik uyum (prefers-color-scheme).

**24. Yazı tipi boyutu ayarı**  
Özellikle uzun `content` metinleri için: küçük / normal / büyük seçeneği.

**25. Kompakt / rahat görünüm**  
Liste yoğunluğunu ayarlayan density kontrolü; güç kullanıcısı için çok satır, gezgin için az satır.

**26. Öğe karşılaştırma**  
İki veya üç öğeyi yan yana koyan "Karşılaştır" modu; benzer prompt'ları veya yaklaşımları değerlendirmek için.

**27. Kısayol tuşları**  
`/` arama, `Esc` kapat, `C` kopyala, `F` favoriye ekle, `←/→` önceki/sonraki öğe gibi klavye navigasyonu.

**28. Vault başlangıç görünümü tercihi**  
Her vault varsayılan olarak grid'de açılıyor; kullanıcı "liste görünümünü varsayılan yap" seçeneğini kaydedebilsin.

**29. Kişiselleştirilmiş "Başlangıç" sayfası**  
index.html açılışında kullanıcının favori vault'larını ve son öğelerini gösteren özelleştirilebilir dashboard.

**30. Profil/takma ad**  
Koleksiyon sahibi adını ve avatar rengini kaydeden basit kimlik alanı; dışa aktarılan dosyalarda görünür.

---

## 🚀 C. AI Entegrasyonu & Çalıştırma (31–45)

**31. "Şimdi Çalıştır" butonu**  
Detay panelinde API key varsa içerik doğrudan Anthropic API'ye gönderilir, yanıt aynı panelde akış (stream) olarak gösterilir.

**32. Değişken doldurma formu**  
`${Position:Software Developer}` gibi şablon değişkenlerini otomatik algılayan ve doldurma formu açan arayüz.

**33. Model seçimi**  
Çalıştır butonunun yanında model dropdown'u: `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-6`.

**34. Sıcaklık (temperature) kaydırıcısı**  
0.0–1.0 arası slider; yaratıcı vault'larda yüksek, analitik vault'larda düşük varsayılan değer.

**35. Sistem prompt üzerine yazma**  
Çalıştır panelinde "Ek sistem bağlamı" alanı; mevcut içeriğin üstüne ekstra talimat eklenebilir.

**36. Sohbet modu**  
Çalıştır'dan gelen yanıta devam mesajı yazılabilen, konuşma geçmişini koruyan mini chat arayüzü.

**37. Yanıt kaydetme**  
API'den gelen çıktıyı "Yanıtlarım" bölümüne zaman damgasıyla kaydeden buton.

**38. Toplu çalıştırma**  
Seçili birden fazla öğeyi sırayla API'ye gönderip sonuçları birleştiren batch modu.

**39. Prompt zincirleme**  
İki öğeyi "zincirle": birincisinin çıktısı ikincisinin girdisi olur. ChainVault ile doğal sinerji.

**40. Maliyet tahmini**  
Seçilen modelde bu içeriği çalıştırmanın yaklaşık token ve dolar maliyetini göster.

**41. Yanıt kalite puanı**  
Yanıt geldiğinde 👍/👎 butonu; geri bildirimler localStorage'a kaydedilir, ileride fine-tuning verisi olabilir.

**42. Hızlı düzenleme**  
İçerik alanını çalıştırmadan önce düzenlenebilir hale getiren "Düzenle & Çalıştır" modu.

**43. Sistem prompt şablonları**  
"Kısa yanıt ver", "JSON formatında çıkart", "Türkçe yanıt ver" gibi hazır ek talimat etiketleri.

**44. A/B karşılaştırma**  
Aynı içeriği iki farklı modele gönderip yanıtları yan yana gösteren split-run modu.

**45. API kullanım panosu**  
Bugün kaç istek atıldı, toplam token harcaması, hangi vault en çok kullanıldı — mini dashboard.

---

## 📤 D. Dışa Aktarma & Paylaşım (46–55)

**46. Markdown dışa aktarma**  
Tek öğeyi veya tüm bir kategoriyi `.md` dosyası olarak indirme.

**47. JSON dışa aktarma**  
Tüm vault verisini veya filtrelenmiş sonuçları yapılandırılmış JSON olarak export etme.

**48. CSV dışa aktarma**  
Spreadsheet uyumlu CSV; `id, cat, name, desc, tags, content` sütunları.

**49. PDF dışa aktarma**  
Seçili öğeleri veya koleksiyonu PDF olarak kaydetme; baskı CSS ile düzenli görünüm.

**50. Obsidian uyumlu dışa aktarma**  
Her öğeyi ayrı bir `.md` dosyası olarak, frontmatter ile (ObsiVault ile mükemmel uyum).

**51. Notion import formatı**  
Notion'ın CSV import şemasına uygun dosya çıktısı.

**52. Paylaşılabilir bağlantı**  
Öğenin URL hash'ine `#item-42` gibi ID ekleme; sayfa yüklenince o öğe otomatik açılır.

**53. QR kod**  
Seçili öğenin paylaşım URL'si için QR kod üretme; basılı materyaller veya mobil transfer için.

**54. Embed kodu**  
Bir öğeyi `<iframe>` olarak başka sitelere gömmek için hazır HTML snippet'i.

**55. Sosyal medya paylaşımı**  
Öğe adı, kısa açıklama ve URL içeren önceden dolu Twitter/X, LinkedIn paylaşım bağlantıları.

---

## 🏗️ E. Mimari & Performans (56–65)

**56. Service Worker ile çevrimdışı çalışma**  
Vault dosyaları önbelleğe alınır; internet olmadan da tam işlevsel kullanım. PWA manifest eklenerek ana ekrana eklenebilir hale gelir.

**57. Sanal kaydırma (virtual scroll)**  
6.000+ öğeli PromptVault'ta tüm kartların DOM'a yazılması yetersiz. Yalnızca görünür satırları render eden virtual list implementasyonu.

**58. Web Worker ile arama**  
Büyük vault'larda arama işlemini ana thread'i bloke etmeden arka planda çalıştırma.

**59. Lazy loading / code splitting**  
index.html'de vault'lar ilk açılışta değil, tıklandığında yüklenir. Büyük vault dosyaları (12MB!) sayfa açılışını yavaşlatıyor.

**60. Veri sıkıştırma**  
`content` alanlarını LZString ile sıkıştırarak dosya boyutunu %40–60 küçültme.

**61. IndexedDB ile yerel veritabanı**  
localStorage'ın 5MB sınırını aşan veri (koleksiyonlar, notlar, yanıtlar) için IndexedDB.

**62. İçerik hash ile önbellek yönetimi**  
Vault dosyaları `v3-promptvault.html` gibi sürüm hash'leri ile; tarayıcı önbelleği doğru invalidate edilir.

**63. Çoklu dil desteği (i18n)**  
Arayüz metinleri JSON dil dosyalarına taşınır; en azından İngilizce/Türkçe geçişi. TurkVault'u olan bir ürün için kritik.

**64. Erişilebilirlik (a11y) iyileştirme**  
ARIA roller, `role="listbox"`, `aria-selected`, odak yönetimi, ekran okuyucu etiketleri. Şu an keyboard-only navigasyon kırık.

**65. Responsive mobil düzen**  
Şu anki üç-sütun layout (sidebar + list + detail) mobil ekranlarda çöküyor. Tab-based navigation veya drawer menü ile mobil uyum.

---

## 🎨 F. UI/UX Geliştirmeleri (66–75)

**66. Öğe önizleme (hover peek)**  
Liste satırının üzerine gelince içeriğin ilk 150 karakterini gösteren tooltip; seçmeden önce fikir verir.

**67. Tam ekran içerik modu**  
"Dikkat dağıtıcısız okuma" için içerik panelini tam ekrana alan buton.

**68. İçerik sözdizimi renklendirme**  
Kod bloğu içeren `content` değerlerini (özellikle ShaderVault, MemVault gibi teknik vault'lar) highlight.js ile renklendirir.

**69. Markdown render**  
`content` alanındaki `**kalın**`, `# başlık`, `` `kod` `` gibi markdown'u HTML'e render etme.

**70. Çoklu seçim modu**  
Shift+tıklama veya checkbox ile birden fazla öğe seçimi; toplu kopyalama/dışa aktarma/favorileme.

**71. Sürükle-bırak koleksiyon yönetimi**  
Öğeleri koleksiyonlar arasında sürükleyerek düzenleme.

**72. Animasyonlu yükleme iskelet ekranı**  
Vault açılırken beyaz flash yerine içerik şekillerini simüle eden skeleton loader.

**73. Breadcrumb navigasyon**  
"index > AI & Prompt > PromptVault > Öğe #42" şeklinde; geri tuşu davranışını düzeltir.

**74. Sütun sayısı kontrolü**  
Grid görünümünde 2/3/4 sütun seçeneği; geniş ekranlarda verimlilik.

**75. Öğe geçiş animasyonu**  
Liste'den detay paneline geçişte kart genişleme animasyonu; yön hissi yaratır.

---

## 🔒 G. Güvenlik & Gizlilik (76–80)

**76. API key maskeleme**  
Input alanında key varsayılan olarak `sk-ant-•••••••••` biçiminde gösterilir; kopyalanabilir ama görünmez.

**77. API key şifreleme**  
localStorage'daki API key'i tarayıcının crypto API'si ile hafif şifreleme (AES-GCM + türetilmiş anahtar).

**78. Oturum süresi**  
API key'in ne kadar süre aktif kalacağını ayarlayan "X saat sonra unut" seçeneği.

**79. Veri temizleme butonu**  
"Tüm verileri sil" — koleksiyonlar, notlar, geçmiş, API key — tek tıkla.

**80. İzin açıklamaları**  
Clipboard API, localStorage gibi tarayıcı izinleri kullanılmadan önce ne için kullanıldığını açıklayan kısa mesaj.

---

## 📊 H. Analitik & İçgörü (81–88)

**81. Vault kullanım istatistikleri**  
Hangi vault kaç kez açıldı, hangi öğe en çok kopyalandı — LocalStorage'da tutulan kişisel analitik.

**82. Etiket frekans analizi**  
Seçili kategori veya tüm vault için etiketlerin ne sıklıkla geçtiğini bar grafik olarak gösterme.

**83. İçerik uzunluğu dağılımı**  
Kısa (<200 karakter) / orta / uzun içeriklerin oranını vault bazında görselleştirme.

**84. Çalışma süresi takibi**  
Vault'ta kaç dakika harcandığını kaydeden arka plan sayacı; haftalık özet.

**85. "Boşluk analizi"**  
Hangi kategorilerde az öğe olduğunu veya hangi etiketlerin eksik kaldığını öne çıkaran görünüm.

**86. Benzer öğe ağı**  
Ortak etiketlere göre öğeler arasındaki bağlantıları node-graph olarak görselleştirme (D3.js).

**87. İlerleme çubuğu**  
"580 öğeden 47'sini inceledi" şeklinde kişisel tamamlanma yüzdesi.

**88. Vault karşılaştırma**  
İki vault arasında ortak etiket/konu örtüşmesini gösteren Venn diyagramı.

---

## 🌐 I. İçerik & Veri Zenginleştirme (89–95)

**89. Kullanıcı tarafından öğe ekleme**  
Her vault'ta "Yeni öğe ekle" formu; girilen veri localStorage'a yazılır, dışa aktarılabilir.

**90. Topluluk önerileri**  
API aracılığıyla kullanıcının öğe önerisini gönderebileceği basit form (GitHub issue veya e-posta formatında).

**91. Sürüm geçmişi**  
Düzenlenen öğelerin önceki hallerini saklayan yerel versiyon sistemi; "geri al" ile eski içeriğe dönme.

**92. İçerik kalite puanı**  
İçerik uzunluğu, etiket sayısı, kaynak varlığı gibi kriterlere göre otomatik hesaplanan "zenginlik skoru".

**93. Otomatik etiket önerisi**  
İçerik analiz edildiğinde "Bu öğeye şu etiketler eklenebilir" öneri sistemi; Anthropic API kullanılabilir.

**94. Kaynak zenginleştirme**  
`source: "community"` olan öğeler için bağlı vault'a veya ilgili kaynaklara yönlendiren bağlantı önerisi.

**95. Çeviri desteği**  
İçeriği tek tıkla seçilen dile çeviren buton; Anthropic API ile.

---

## 🛠️ J. Geliştirici & Güç Kullanıcısı (96–100)

**96. CLI modu (JSON endpoint)**  
`?format=json&cat=Geliştirici` gibi URL parametreleriyle ham veri döndüren hafif API modu; vault içeriğini script'lerle tüketmek için.

**97. Webhook entegrasyonu**  
Kullanıcının tanımladığı webhook URL'sine öğe kopyalandığında veya çalıştırıldığında POST isteği atan bildirim sistemi.

**98. Özelleştirilebilir CSS**  
Ayarlar panelinde kullanıcının kendi CSS snippet'ini girebileceği alan; kişisel tema oluşturma.

**99. Makro/kısayol kaydedici**  
Sık yapılan eylem dizilerini (ör. "bu kategoriyi aç → şu etiketi filtrele → ilk öğeyi kopyala") tek tuşa atama.

**100. Vault API köprüsü (OmniVault entegrasyonu)**  
Tüm vault'ların verisini OmniVault'taki `master API` yapısına bağlayan merkezi bir veri köprüsü; vault'lar arası cross-reference ve projeksiyon sorguları için altyapı.

---

## Öncelik Özeti

| Etki | Efor | Öneriler |
|------|------|----------|
| 🔴 Yüksek etki, düşük efor | Hızlı kazanım | 1 (full-text search), 16 (favoriler), 27 (klavye kısayolları), 31 (Çalıştır butonu), 57 (virtual scroll), 65 (mobil düzen) |
| 🟡 Yüksek etki, orta efor | Sonraki sprint | 10 (semantik arama), 11 (global arama), 17 (koleksiyonlar), 32 (değişken formu), 56 (PWA/offline) |
| 🟢 Orta etki, düşük efor | Hızlı tatmin | 7 (regex), 23 (tema), 48 (CSV export), 66 (hover peek), 69 (markdown render) |
| 🔵 Uzun vadeli | Büyük fark | 10 (embedding search), 39 (zincir modu), 86 (bağlantı grafiği), 100 (OmniVault köprüsü) |
