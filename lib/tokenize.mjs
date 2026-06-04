/**
 * tokenize.mjs — Türkçe-duyarlı tokenizasyon.
 *
 * Türkçe küçük harfe çevirme (I→ı, İ→i) doğru çalışsın diye toLocaleLowerCase('tr-TR')
 * kullanılır. Çağrı yapan taraf eşanlamlı genişletmeyi (synonyms.mjs) ayrıca uygular.
 */

// Küçük TR + EN stopword listesi — yönlendirmede gürültü yapan bağlaçlar/edatlar.
export const STOPWORDS = new Set([
  // Türkçe
  've', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'ki', 'mi', 'mı',
  'mu', 'mü', 'ya', 'veya', 'ama', 'fakat', 'çok', 'gibi', 'kadar', 'göre',
  'ise', 'her', 'olan', 'olarak', 'daha', 'en', 'ne', 'nasıl', 'hangi',
  'yap', 'yapmak', 'kur', 'kurmak', 'oluştur', 'istiyorum', 'lazım', 'gerek',
  // İngilizce
  'the', 'a', 'an', 'of', 'to', 'and', 'or', 'for', 'with', 'in', 'on', 'at',
  'is', 'are', 'be', 'by', 'as', 'it', 'this', 'that', 'i', 'we', 'you',
  'build', 'make', 'create', 'want', 'need', 'how', 'using', 'use',
]);

/**
 * Metni normalize token dizisine çevirir.
 * @param {string} text
 * @returns {string[]} tekrarları korunan token listesi
 */
export function tokenize(text) {
  if (!text) return [];
  const lower = String(text).toLocaleLowerCase('tr-TR');
  // Harf/rakam dışındaki her şeyden böl (Türkçe çğıöşü \p{L} ile korunur).
  const raw = lower.split(/[^\p{L}\p{N}]+/u);
  const out = [];
  for (const t of raw) {
    if (t.length < 2) continue;
    if (STOPWORDS.has(t)) continue;
    out.push(t);
  }
  return out;
}

/** Benzersiz token kümesi (sayımıyla birlikte). */
export function tokenCounts(text) {
  const counts = new Map();
  for (const t of tokenize(text)) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  return counts;
}
