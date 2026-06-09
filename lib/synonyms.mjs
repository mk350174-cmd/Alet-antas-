// Synonym groups: each entry is [key, ...synonyms].
// Bidirectional — every term maps to all others in its group.
const GROUPS = [
  ['ecommerce', 'e-ticaret', 'eticaret', 'shop', 'mağaza', 'alışveriş'],
  ['funnel', 'huni', 'dönüşüm', 'conversion', 'lansman'],
  ['deploy', 'yayınlama', 'dağıtım', 'deployment', 'ci', 'cd'],
  ['security', 'güvenlik', 'sec', 'siber', 'cyber'],
  ['database', 'veritabanı', 'db', 'veri', 'storage'],
  ['game', 'oyun', 'oyunu', 'gaming', 'motor'],
  ['godot', 'gdscript', 'gd'],
  ['shader', 'glsl', 'hlsl', 'gpu'],
  ['agent', 'ajan', 'otonom', 'autonomous', 'workflow'],
  ['prompt', 'istem', 'şablon', 'template'],
  ['seo', 'arama', 'optimizasyon', 'organic', 'ranking'],
  ['api', 'endpoint', 'rest', 'graphql', 'servis', 'service'],
  ['auth', 'kimlik', 'doğrulama', 'authentication', 'login', 'oturum'],
  ['test', 'testing', 'qa', 'kalite', 'doğrulama'],
  ['regex', 'düzenli', 'ifade', 'pattern', 'regexp'],
  ['log', 'günlük', 'loglama', 'logging', 'izleme', 'monitoring'],
  ['cloud', 'bulut', 'aws', 'gcp', 'azure', 'sunucu'],
  ['budget', 'bütçe', 'finans', 'harcama', 'maliyet', 'cost'],
  ['travel', 'seyahat', 'gezi', 'turizm', 'trip'],
  ['myth', 'mitoloji', 'efsane', 'tanrı', 'legend'],
  ['history', 'tarih', 'tarihi', 'osmanlı', 'atatürk'],
  ['crypto', 'şifreleme', 'encryption', 'blockchain', 'token'],
  ['ml', 'makine', 'öğrenmesi', 'model', 'eğitim', 'training'],
  ['iot', 'nesnelerin', 'sensör', 'sensor', 'embedded'],
  ['ar', 'artırılmış', 'gerçeklik', 'augmented', 'reality'],
  ['vr', 'sanal', 'gerçeklik', 'virtual', 'headset'],
];

// term → Set of synonyms (all other terms in its group)
const SYNONYM_MAP = new Map();
for (const group of GROUPS) {
  for (let i = 0; i < group.length; i++) {
    const term = group[i];
    if (!SYNONYM_MAP.has(term)) SYNONYM_MAP.set(term, new Set());
    for (let j = 0; j < group.length; j++) {
      if (i !== j) SYNONYM_MAP.get(term).add(group[j]);
    }
  }
}

export function expandTokens(tokens) {
  const out = new Set(tokens);
  for (const t of tokens) {
    const syns = SYNONYM_MAP.get(t);
    if (syns) for (const s of syns) out.add(s);
  }
  return [...out];
}

export function canonical(token) {
  const syns = SYNONYM_MAP.get(token);
  if (!syns) return token;
  // Return the first (key) of the group — the group's first element
  for (const group of GROUPS) {
    if (group.includes(token)) return group[0];
  }
  return token;
}
