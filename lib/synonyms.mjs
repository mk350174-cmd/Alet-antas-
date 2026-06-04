/**
 * synonyms.mjs — TR↔EN köprü sözlüğü.
 *
 * İş tarifi ve vault tokenları aynı kanonik kavrama indirgensin diye eşanlamlı
 * grupları tanımlar. Her grupta tüm terimler aynı "kanonik" token'a (grubun ilk
 * elemanı) eşlenir. Böylece İngilizce "ecommerce" ile Türkçe "e-ticaret" eşleşir.
 *
 * Genişletmek için: yeni bir dizi ekle; ilk eleman kanonik addır.
 */

const GROUPS = [
  ['eticaret', 'ecommerce', 'e-ticaret', 'eticaret', 'shop', 'mağaza', 'magaza', 'online satış', 'dükkan'],
  ['huni', 'funnel', 'dönüşüm', 'donusum', 'conversion', 'lansman', 'launch'],
  ['reklam', 'ad', 'ads', 'advertising', 'kampanya', 'campaign'],
  ['seo', 'arama motoru', 'search'],
  ['güvenlik', 'guvenlik', 'security', 'sec', 'secure', 'auth', 'kimlik'],
  ['dağıtım', 'dagitim', 'deploy', 'deployment', 'yayınlama', 'yayinlama', 'ci', 'cd', 'pipeline'],
  ['veritabanı', 'veritabani', 'database', 'db', 'sql', 'postgres', 'mysql'],
  ['api', 'rest', 'endpoint', 'servis', 'service'],
  ['otomasyon', 'automation', 'makro', 'macro', 'script', 'betik', 'workflow'],
  ['oyun', 'game', 'gaming'],
  ['motor', 'engine', 'godot', 'unity', 'unreal'],
  ['shader', 'grafik', 'graphics', 'render'],
  ['mitoloji', 'myth', 'mythology', 'efsane', 'lore'],
  ['tarih', 'history', 'historical'],
  ['hikaye', 'story', 'narrative', 'anlatı', 'anlati', 'senaryo'],
  ['karakter', 'character', 'persona'],
  ['prompt', 'istem', 'talimat'],
  ['ajan', 'agent', 'agentic'],
  ['model', 'llm', 'gpt', 'claude', 'gemini'],
  ['görsel', 'gorsel', 'vision', 'image', 'resim'],
  ['ses', 'audio', 'voice', 'speech'],
  ['embedding', 'embed', 'vektör', 'vektor', 'vector', 'rag'],
  ['verimlilik', 'productivity', 'üretkenlik', 'uretkenlik'],
  ['odak', 'focus', 'konsantrasyon', 'concentration'],
  ['bütçe', 'butce', 'budget', 'finans', 'finance', 'para', 'money'],
  ['takvim', 'agenda', 'schedule', 'planlama', 'planning', 'plan'],
  ['eposta', 'email', 'e-posta', 'eposta', 'mail', 'newsletter', 'bülten', 'bulten'],
  ['sosyal medya', 'social', 'instagram', 'linkedin', 'twitter', 'içerik', 'icerik', 'content'],
  ['yemek', 'meal', 'food', 'beslenme', 'nutrition', 'tarif', 'recipe'],
  ['seyahat', 'travel', 'gezi', 'tatil', 'trip'],
  ['scraping', 'scrape', 'kazıma', 'kazima', 'crawler', 'crawl'],
  ['not', 'note', 'obsidian', 'pkm', 'bilgi yönetimi'],
  ['hukuk', 'law', 'legal', 'yasa', 'sözleşme', 'sozlesme', 'contract'],
  ['tıp', 'tip', 'med', 'medical', 'sağlık', 'saglik', 'health'],
  ['biyoloji', 'bio', 'biology', 'genetik', 'genetics'],
  ['matematik', 'math', 'mathematics', 'hesap'],
  ['istatistik', 'stat', 'statistics', 'veri analizi', 'data'],
  ['psikoloji', 'psy', 'psychology', 'psikoloji'],
  ['felsefe', 'philo', 'philosophy'],
  ['yatırım', 'yatirim', 'invest', 'investment', 'borsa', 'stock'],
  ['kripto', 'crypto', 'blockchain', 'web3', 'token', 'smart contract'],
  ['cv', 'resume', 'özgeçmiş', 'ozgecmis', 'kariyer', 'career'],
  ['sunum', 'pitch', 'deck', 'startup', 'girişim', 'girisim'],
  ['video', 'reel', 'reels', 'shorts', 'tiktok'],
  ['etkinlik', 'event', 'organizasyon', 'organization'],
  ['tarım', 'tarim', 'agri', 'agriculture', 'çiftçilik', 'ciftcilik'],
  ['astroloji', 'astro', 'astrology', 'burç', 'burc'],
  ['ui', 'ux', 'arayüz', 'arayuz', 'interface', 'tasarım', 'tasarim', 'design'],
  ['pwa', 'progressive', 'web app', 'mobil'],
  ['iot', 'sensör', 'sensor', 'gömülü', 'gomulu', 'embedded'],
  ['ar', 'vr', 'artırılmış', 'artirilmis', 'sanal gerçeklik', 'augmented', 'virtual'],
  ['regex', 'düzenli ifade', 'duzenli ifade', 'pattern'],
  ['cron', 'zamanlama', 'scheduler', 'zamanlanmış', 'zamanlanmis'],
  ['log', 'günlük', 'gunluk', 'logging', 'kayıt', 'kayit'],
  ['cloud', 'bulut', 'aws', 'azure', 'gcp'],
  ['mimari', 'architecture', 'sistem', 'system', 'tasarım deseni', 'pattern'],
  ['git', 'versiyon', 'version', 'github'],
  ['test', 'testing', 'qa', 'kalite'],
];

// terim -> kanonik token haritası
const CANON = new Map();
for (const group of GROUPS) {
  const canon = group[0];
  for (const term of group) {
    // Çok kelimeli terimleri tek token'a indirgemek için boşlukları kaldır.
    CANON.set(term.replace(/\s+/g, ''), canon);
    CANON.set(term, canon);
  }
}

/**
 * Tek bir token'ı (varsa) kanonik eşanlamlısına çevirir; yoksa kendisini döner.
 */
export function canonical(token) {
  return CANON.get(token) || token;
}

/**
 * Token dizisini kanonik forma genişletir: her token hem kendisi hem kanoniği ile
 * temsil edilsin (recall artar). Sonuç benzersizleştirilir.
 */
export function expandTokens(tokens) {
  const out = new Set();
  for (const t of tokens) {
    out.add(t);
    const c = CANON.get(t);
    if (c) out.add(c);
  }
  return [...out];
}
