import { randomBytes } from "crypto";


const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return -1;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return -1;

  return dot / (magA * magB);
};
/**
 * Remove punctuation and normalize text
 */
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Stop words
 */
const stopWords = new Set([
  "the",
  "is",
  "in",
  "and",
  "to",
  "of",
  "a",
  "that",
  "it",
  "with",
  "as",
  "for",
  "was",
  "on",
  "are",
  "by",
  "this",
  "be",
  "which",
  "an",
  "or",
  "at",
  "from",
  "into",
  "about",
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
]);

/**
 * Common technical synonyms
 */
const synonyms = {
  tcp: ["transmission", "control", "protocol"],
  udp: ["user", "datagram", "protocol"],
  ip: ["internet", "protocol"],
  osi: ["open", "systems", "interconnection"],
  dns: ["domain", "name", "system"],
  http: ["hypertext", "transfer", "protocol"],
  https: ["secure", "http"],
  lan: ["local", "area", "network"],
  wan: ["wide", "area", "network"],
  router: ["routing", "gateway"],
  switch: ["switching"],
};

/**
 * Split document into chunks
 */
export const chunkText = (
  text,
  maxChunkSize = 500,
  overlap = 50
) => {

  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  const paragraphs = cleanedText
    .split(/\n+/)
    .filter((p) => p.trim().length > 0);

  const chunks = [];

  let currentChunk = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {

    const paragraphWords = paragraph.trim().split(/\s+/);

    const paragraphWordCount = paragraphWords.length;

    // Handle huge paragraphs
    if (paragraphWordCount > maxChunkSize) {

      if (currentChunk.length > 0) {

        chunks.push({
          content: currentChunk.join("\n\n"),
          chunkIndex,
          pageNumber: 0,
        });

        chunkIndex++;

        currentChunk = [];
        currentWordCount = 0;
      }

      for (
        let i = 0;
        i < paragraphWords.length;
        i += maxChunkSize - overlap
      ) {

        const chunkWords = paragraphWords.slice(
          i,
          i + maxChunkSize
        );

        chunks.push({
          content: chunkWords.join(" "),
          chunkIndex,
          pageNumber: 0,
        });

        chunkIndex++;

        if (i + maxChunkSize >= paragraphWords.length)
          break;
      }

      continue;
    }

    if (
      currentWordCount + paragraphWordCount >
        maxChunkSize &&
      currentChunk.length > 0
    ) {

      chunks.push({
        content: currentChunk.join("\n\n"),
        chunkIndex,
        pageNumber: 0,
      });

      chunkIndex++;

      const previousWords = currentChunk
        .join(" ")
        .split(/\s+/);

      const overlapWords = previousWords
        .slice(-Math.min(overlap, previousWords.length))
        .join(" ");

      currentChunk = [
        overlapWords,
        paragraph.trim(),
      ];

      currentWordCount =
        overlapWords.split(/\s+/).length +
        paragraphWordCount;

    } else {

      currentChunk.push(paragraph.trim());

      currentWordCount += paragraphWordCount;

    }

  }

  if (currentChunk.length > 0) {

    chunks.push({
      content: currentChunk.join("\n\n"),
      chunkIndex,
      pageNumber: 0,
    });

  }

  // Fallback
  if (chunks.length === 0 && cleanedText.length > 0) {

    const words = cleanedText.split(/\s+/);

    for (
      let i = 0;
      i < words.length;
      i += maxChunkSize - overlap
    ) {

      chunks.push({
        content: words
          .slice(i, i + maxChunkSize)
          .join(" "),
        chunkIndex,
        pageNumber: 0,
      });

      chunkIndex++;

      if (i + maxChunkSize >= words.length)
        break;

    }

  }

  return chunks;
};

/**
 * Find the most relevant chunks for a query
 */
export const findRelevantChunks = (
  chunks,
  queryEmbedding,
  maxChunks = 5
) => {

  if (
    !chunks ||
    chunks.length === 0 ||
    !queryEmbedding
  ) {
    return [];
  }

  const scoredChunks = chunks
    .map((chunk) => {

      const score = cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      );

      return {
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        _id: chunk._id,
        score,
      };
    })
    .filter(
      (chunk) =>
        chunk.score > 0 &&
        Number.isFinite(chunk.score)
    )
    .sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, maxChunks);
};

/**
 * Generate random document id
 */
export const generateDocumentId = () => {
  return randomBytes(12).toString("hex");
};