export const STOPWORDS = new Set([
  // Türkçe
  've', 'ile', 'için', 'bir', 'bu', 'da', 'de', 'ki', 'mi', 'mu', 'mü', 'ne',
  'ya', 'çok', 'daha', 'en', 'her', 'hiç', 'olan', 'olur', 'olarak', 'hem',
  'ise', 'veya', 'ama', 'fakat', 'ancak', 'sadece', 'bile', 'nasıl', 'hangi',
  'kadar', 'sonra', 'önce', 'üzere', 'göre',
  // İngilizce
  'the', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'a', 'an', 'that', 'this', 'it',
  'as', 'by', 'not', 'but', 'if', 'then', 'when', 'which', 'who',
]);

export function tokenize(text) {
  if (text == null) return [];
  const lower = String(text).toLocaleLowerCase('tr-TR');
  const raw = lower.split(/[^\p{L}\p{N}]+/u);
  const out = [];
  for (const t of raw) {
    if (t.length < 2) continue;
    if (STOPWORDS.has(t)) continue;
    out.push(t);
  }
  return out;
}

export function tokenCounts(text) {
  const counts = new Map();
  for (const t of tokenize(text)) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  return counts;
}
