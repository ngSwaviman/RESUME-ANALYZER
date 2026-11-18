/**
 * TF-IDF vectorisation + cosine similarity, implemented from scratch so the
 * ranking is fully explainable (no black-box model, no hardcoded scores).
 *
 *   tf(t,d)   = count(t,d) / totalTerms(d)
 *   idf(t)    = ln((1 + N) / (1 + df(t))) + 1        (smoothed)
 *   w(t,d)    = tf(t,d) * idf(t)
 *   cos(A,B)  = (A . B) / (||A|| * ||B||)
 */
const { tokenize, withBigrams, termFrequency } = require('./textProcessing');

const buildIdf = (tokenLists) => {
  const documentFrequency = new Map();
  tokenLists.forEach((tokens) => {
    new Set(tokens).forEach((token) => {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    });
  });

  const totalDocuments = tokenLists.length || 1;
  const idf = new Map();
  documentFrequency.forEach((df, token) => {
    idf.set(token, Math.log((1 + totalDocuments) / (1 + df)) + 1);
  });
  return idf;
};

const buildVector = (tokens, idf) => {
  const tf = termFrequency(tokens);
  const total = tokens.length || 1;
  const vector = new Map();
  tf.forEach((count, token) => {
    const weight = (count / total) * (idf.get(token) || 1);
    vector.set(token, weight);
  });
  return vector;
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA.size || !vecB.size) return 0;

  let dot = 0;
  const [small, large] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];
  small.forEach((weight, token) => {
    const other = large.get(token);
    if (other) dot += weight * other;
  });

  let normA = 0;
  vecA.forEach((weight) => {
    normA += weight * weight;
  });
  let normB = 0;
  vecB.forEach((weight) => {
    normB += weight * weight;
  });

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Vectorise a corpus (index 0 is usually the job description).
 * Returns the vectors plus the vocabulary size for diagnostics.
 */
const vectorizeCorpus = (documents) => {
  const tokenLists = documents.map((doc) => withBigrams(tokenize(doc)));
  const idf = buildIdf(tokenLists);
  const vectors = tokenLists.map((tokens) => buildVector(tokens, idf));
  const vocabulary = new Set();
  tokenLists.forEach((tokens) => tokens.forEach((token) => vocabulary.add(token)));
  return { tokenLists, vectors, vocabularySize: vocabulary.size, idf };
};

/** Pairwise similarity of two raw texts, computed with a shared IDF space. */
const similarityBetween = (textA, textB) => {
  const { vectors, vocabularySize } = vectorizeCorpus([textA, textB]);
  return {
    similarity: Number(cosineSimilarity(vectors[0], vectors[1]).toFixed(6)),
    vocabularySize,
  };
};

module.exports = {
  buildIdf,
  buildVector,
  cosineSimilarity,
  vectorizeCorpus,
  similarityBetween,
};
