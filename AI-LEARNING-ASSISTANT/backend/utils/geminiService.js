import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in the .env file.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Recommended stable model
const MODEL = "gemini-3.6-flash";

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractRetryDelaySeconds = (error) => {
  if (!error) return null;

  const details = error?.details || error?.error?.details || [];
  if (Array.isArray(details)) {
    for (const detail of details) {
      const delay = detail?.retryDelay;
      if (!delay) continue;
      if (typeof delay === "number") return Math.max(1, Math.ceil(delay));
      if (typeof delay === "string" && delay.endsWith("s")) {
        const parsed = parseInt(delay, 10);
        if (!Number.isNaN(parsed)) return Math.max(1, parsed);
      }
    }
  }

  const message = typeof error?.message === "string" ? error.message : "";
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    const parsed = Math.ceil(parseFloat(match[1]));
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
};

const generateResponse = async (prompt, retryCount = 0) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("\n========== GEMINI ERROR ==========");
    console.error(error?.message || error);
    console.error("==================================\n");

    const message = error?.message || "";
    const code = error?.code || error?.error?.code;
    const status = error?.status || error?.error?.status;
    const isQuota = code === 429 || status === "RESOURCE_EXHAUSTED" || /quota|rate.?limit/i.test(message);
    const isOverloaded = message.includes("503") || /unavailable|overload/i.test(message);

    if (retryCount < 1) {
      if (isOverloaded) {
        console.log("🔄 Gemini is busy. Retrying in 3 seconds...");
        await sleep(3000);
        return generateResponse(prompt, retryCount + 1);
      }

      if (isQuota) {
        const delay = extractRetryDelaySeconds(error);
        if (delay && delay <= 90) {
          console.log(`⏳ Gemini quota hit. Retrying in ${delay}s...`);
          await sleep(delay * 1000);
          return generateResponse(prompt, retryCount + 1);
        }
      }
    }

    if (isQuota) {
      const delay = extractRetryDelaySeconds(error);
      const friendly = delay
        ? `Gemini quota exceeded. Please try again in ${delay} seconds.`
        : "Gemini quota exceeded. Please wait a moment and try again.";
      const err = new Error(friendly);
      err.statusCode = 429;
      err.retryDelaySeconds = delay || null;
      throw err;
    }

    const generic = new Error("AI service is temporarily unavailable. Please try again later.");
    generic.statusCode = code || 500;
    throw generic;
  }
};


/* -------------------------------------------------------------------------- */
/*                           Generate Text Embedding                          */
/* -------------------------------------------------------------------------- */

export const generateEmbedding = async (text) => {
  try {
    const response = await ai.models.embedContent({
      model: "models/gemini-embedding-001",
      contents: text,
    });

    return response.embeddings[0].values;
  } catch (error) {
    console.error("Embedding Generation Error:", error);
    throw new Error("Failed to generate embedding.");
  }
};

/* -------------------------------------------------------------------------- */
/*                          General AI Chat (Fallback)                        */
/* -------------------------------------------------------------------------- */

export const generalChat = async (question) => {
  const prompt = `
You are an intelligent AI Learning Assistant.

The user's question could NOT be answered using the uploaded document.

Your task:

1. Clearly tell the user that the uploaded document does not contain the answer.
2. Then answer using your own general knowledge.
3. Keep the explanation simple and educational.
4. Use headings.
5. Use bullet points whenever appropriate.
6. Give examples if possible.

Format your response exactly like this:

📄 **Not Found in Uploaded Document**

The uploaded document does not contain information about this topic.

---

🤖 **General AI Explanation**

<Your Answer>

Question:

${question}
`;

  return await generateResponse(prompt);
};


/* -------------------------------------------------------------------------- */
/*                          Generate Flashcards                               */
/* -------------------------------------------------------------------------- */

export const generateFlashcards = async (text, count = 10, documentTitle = "", extraContext = {}) => {
  const randomSeed = Math.floor(Math.random() * 1_000_000);
  const safeTitle = (documentTitle || "the provided document").toString().trim();
  const firstChars = (text || "").substring(0, 80).replace(/\s+/g, " ").trim();

  const prompt = `
You are an expert teacher creating flashcards for a specific document.

CRITICAL INSTRUCTIONS FOR UNIQUENESS:
- The flashcards below are for the document titled: "${safeTitle}"
- The document starts with the following content snippet: "${firstChars}"
- Randomization seed (use this to produce varied, non-repeating cards): ${randomSeed}
- EVERY question must be directly extracted from THIS specific document and no other.
- NEVER use generic knowledge, stock questions, or content not present in the document.
- ALL questions must be UNIQUE within this set — no duplicates, no rephrased duplicates.
- Cover DIFFERENT sections, ideas, facts, definitions and examples spread across the document.
- If a section talks about a specific named concept, formula, person, date or rule, prefer that as a question source.

Create EXACTLY ${count} educational flashcards from the document below.

Additional rules:
- Cover the most important concepts.
- Keep questions concise and specific to the document content.
- Keep answers short and accurate.
- Mix difficulties evenly across: easy | medium | hard

Output Format ONLY (do not add any other text):

Q: Question
A: Answer
D: easy | medium | hard

Separate each flashcard using:

----

Document (use ONLY this as your source, no outside knowledge):

${text.substring(0, 12000)}
`;

  const generatedText = await generateResponse(prompt);

  const flashcards = [];
  const seenQuestions = new Set();

  const cards = generatedText
    .split("----")
    .filter((card) => card.trim());

  for (const card of cards) {
    let question = "";
    let answer = "";
    let difficulty = "medium";

    const lines = card.split("\n");

    for (const line of lines) {
      const l = line.trim();

      if (l.startsWith("Q:"))
        question = l.substring(2).trim();

      if (l.startsWith("A:"))
        answer = l.substring(2).trim();

      if (l.startsWith("D:"))
        difficulty = l.substring(2).trim().toLowerCase();
    }

    if (question && answer) {
      const qKey = question
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 80);
      if (!qKey || seenQuestions.has(qKey)) continue;
      seenQuestions.add(qKey);

      flashcards.push({
        question,
        answer,
        difficulty,
      });
    }
  }

  return flashcards.slice(0, count);
};

/* -------------------------------------------------------------------------- */
/*                              Generate Quiz                                 */
/* -------------------------------------------------------------------------- */

export const generateQuiz = async (text, numQuestions = 5, documentTitle = "", extraContext = "") => {
  const snippet = typeof text === 'string' ? text.replace(/\s+/g, " ").slice(0, 120) : "";
  const seed = Math.floor(Math.random() * 1_000_000);

  const prompt = `
You are an expert teacher. This is a randomized request (seed: ${seed}).

Generate EXACTLY ${numQuestions} multiple-choice questions.

CONTEXT YOU MUST USE:
- Document title: "${documentTitle || "Provided document"}"
- Document opening content (for anchoring): "${snippet}"
- Extra context: "${extraContext || "None"}"

Rules:

- EVERY question must be directly drawn from the DOCUMENT PROVIDED BELOW. Do NOT use outside, generic, or stock knowledge.
- Each question must have 4 distinct options.
- Only ONE option should be correct, and the correct option value MUST exactly equal one of the 4 option strings.
- ALL questions must be UNIQUE (do not repeat questions, rephrases, or the same fact twice).
- Cover DIFFERENT sections/topics from the document.
- Include a short, one-sentence explanation under E:.
- Difficulty (D:) must be one of: easy, medium, hard.
- Distribute difficulty: about 40% medium, 30% easy, 30% hard.

Format ONLY for each question (do NOT deviate):

Q:
01:
02:
03:
04:
C:
E:
D:

Separate each question using:

----

Document full text to base questions on:

${(text || "").substring(0, 12000)}
`;

  const generatedText = await generateResponse(prompt);

  const quizzes = [];
  const seenQ = new Set();

  const blocks = generatedText
    .split("----")
    .filter((block) => block.trim());

  for (const block of blocks) {

    let question = "";
    let options = [];
    let correctAnswer = "";
    let explanation = "";
    let difficulty = "medium";

    const lines = block.split("\n");

    for (const line of lines) {

      const l = line.trim();

      if (l.startsWith("Q:"))
        question = l.substring(2).trim();

      else if (/^0\d:/.test(l))
        options.push(l.substring(3).trim());

      else if (l.startsWith("C:"))
        correctAnswer = l.substring(2).trim();

      else if (l.startsWith("E:"))
        explanation = l.substring(2).trim();

      else if (l.startsWith("D:")) {
        const raw = l.substring(2).trim().toLowerCase();
        if (["easy","medium","hard"].includes(raw)) difficulty = raw;
      }
    }

    if (
      question &&
      options.length === 4 &&
      correctAnswer
    ) {
      // normalize correct answer: if C: is "01"/"02"/number, map to option text
      if (/^0\d$/.test(correctAnswer)) {
        const idx = parseInt(correctAnswer, 10) - 1;
        if (options[idx]) correctAnswer = options[idx];
      }
      // options exact-match fallback
      if (!options.includes(correctAnswer)) {
        const match = options.find(o => o.toLowerCase() === String(correctAnswer).toLowerCase());
        if (match) correctAnswer = match;
      }

      const qKey = question.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!qKey || seenQ.has(qKey)) continue;
      seenQ.add(qKey);

      quizzes.push({
        question,
        options,
        correctAnswer,
        explanation,
        difficulty,
      });
    }
  }

  return quizzes.slice(0, numQuestions);
};

/* -------------------------------------------------------------------------- */
/*                             Generate Summary                               */
/* -------------------------------------------------------------------------- */

export const generateSummary = async (text) => {
  const prompt = `
You are an expert study assistant.

Summarize the following document.

Instructions:

- Cover all important topics.
- Use headings.
- Use bullet points.
- Keep it concise.
- Explain difficult concepts in simple language.

Document:

${text.substring(0, 15000)}
`;

  return await generateResponse(prompt);
};

/* -------------------------------------------------------------------------- */
/*                        Chat using Document Context                         */
/* -------------------------------------------------------------------------- */

export const chatWithContext = async (question, chunks) => {

  if (!chunks || chunks.length === 0) {
    return "NOT_FOUND";
  }

  // Reduce prompt size to avoid Gemini 503 errors
  const context = chunks
    .slice(0, 3)
    .map(
      (chunk, index) =>
        `Chunk ${index + 1}\n${chunk.content.substring(0, 800)}`
    )
    .join("\n\n");

  if (process.env.NODE_ENV !== "production") {
    console.debug("[gemini chat] question length=", String(question || "").length, "chunks=", chunks.length);
  }

  const prompt = `
You are an AI Learning Assistant.

You MUST answer ONLY using the uploaded document.

Rules:

1. Read ONLY the document below.
2. Never use outside knowledge.
3. If the answer exists, answer in your own words.
4. Keep the answer clear and concise.
5. Use bullet points whenever appropriate.
6. If the answer does NOT exist, reply with EXACTLY:

NOT_FOUND

Nothing else.

======================

DOCUMENT

${context}

======================

Question:

${question}

Answer:
`;

  const answer = await generateResponse(prompt);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[gemini chat] response length=", String(answer || "").length);
  }

  return answer.trim();
};

/* -------------------------------------------------------------------------- */
/*                           Explain Concept                                  */
/* -------------------------------------------------------------------------- */

export const explainConcept = async (concept, context) => {

  const prompt = `
You are an expert teacher.

Explain this concept using ONLY the provided document.

Concept:

${concept}

Document Context:

${context.substring(0, 8000)}

Instructions:

- Explain simply.
- Use headings.
- Use bullet points.
- Give examples if present in the document.
- Do not use outside knowledge.

`;

  return await generateResponse(prompt);
};