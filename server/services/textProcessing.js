/**
 * Text preprocessing utilities for the resume/job matching engine.
 * Pure functions - no database access, easy to unit test.
 */

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an', 'and', 'any',
  'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'done', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
  'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
  'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // resume boilerplate that carries no matching signal
  'resume', 'curriculum', 'vitae', 'page', 'email', 'phone', 'mobile', 'address', 'linkedin',
  'github', 'profile', 'summary', 'objective', 'experience', 'education', 'skills', 'projects',
  'certification', 'certifications', 'company', 'location', 'present', 'current', 'year',
  'years', 'month', 'months', 'work', 'worked', 'working', 'using', 'used', 'use', 'etc',
  'responsible', 'responsibilities', 'including', 'include', 'included', 'well', 'good',
  'strong', 'ability', 'knowledge', 'understanding', 'development', 'develop', 'developed',
]);

/** Lowercase, strip diacritics and non-word noise while keeping tech symbols (+ # .). */
const normalizeText = (text = '') =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Split text into meaningful tokens (word boundary safe for c++, c#, node.js). */
const tokenize = (text = '') => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const rawTokens = normalized
    .replace(/[.]/g, ' ')
    .replace(/[-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^[+#]+|[+#]+$/g, ''))
    .filter(Boolean);

  return rawTokens.filter(
    (token) => token.length > 1 && !STOPWORDS.has(token) && !/^\d+$/.test(token)
  );
};

/** Add bigrams so phrases like "machine learning" keep their meaning. */
const withBigrams = (tokens) => {
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return [...tokens, ...bigrams];
};

const termFrequency = (tokens) => {
  const tf = new Map();
  tokens.forEach((token) => tf.set(token, (tf.get(token) || 0) + 1));
  return tf;
};

/** Jaccard overlap of two token sets - used as an explainability extra. */
const jaccardSimilarity = (a, b) => {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  return intersection / (setA.size + setB.size - intersection);
};

module.exports = {
  STOPWORDS,
  normalizeText,
  tokenize,
  withBigrams,
  termFrequency,
  jaccardSimilarity,
};
