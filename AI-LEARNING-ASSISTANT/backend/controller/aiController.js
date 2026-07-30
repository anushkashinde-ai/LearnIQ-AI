import mongoose from "mongoose";
import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";

const isValidObjectId = (id) => {
  try {
    if (!id) return false;
    if (typeof id !== "string" && typeof id !== "number") return false;
    return mongoose.Types.ObjectId.isValid(String(id)) && String(new mongoose.Types.ObjectId(String(id))) === String(id);
  } catch {
    return false;
  }
};

const resolveDocumentForUser = async (documentId, userId, { requireReady = true } = {}) => {
  if (!isValidObjectId(documentId)) {
    return {
      error: {
        statusCode: 400,
        error: "Invalid document id.",
      },
    };
  }

  const rawDoc = await Document.findOne({
    _id: documentId,
    userId,
  });

  if (!rawDoc) {
    return {
      error: {
        statusCode: 404,
        error: "Document not found",
      },
    };
  }

  if (!requireReady) {
    return { document: rawDoc };
  }

  if (rawDoc.status === "error") {
    return {
      error: {
        statusCode: 400,
        error: "This document failed to process and cannot be used with AI features yet.",
      },
    };
  }

  if (rawDoc.status === "processing") {
    return {
      error: {
        statusCode: 409,
        error: "Document is still processing. Please wait a moment and try again.",
      },
    };
  }

  if (rawDoc.status !== "ready") {
    return {
      error: {
        statusCode: 400,
        error: "Document is not ready yet. Please refresh or upload a new file.",
      },
    };
  }

  return { document: rawDoc };
};

/* -------------------------------------------------------------------------- */
/*                           GENERATE FLASHCARDS                              */
/* -------------------------------------------------------------------------- */

export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const { error, document } = await resolveDocumentForUser(documentId, req.user._id);
    if (error) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.error,
        statusCode: error.statusCode,
      });
    }

    if (!document.extractedText || document.extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Document does not have enough text content to generate flashcards.",
        statusCode: 400,
      });
    }

    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      parseInt(count),
      document.title || document.fileName || "",
      {
        documentId: document._id.toString(),
        userId: req.user._id.toString(),
      },
    );

    if (!cards || cards.length === 0) {
      return res.status(500).json({
        success: false,
        error: "No valid flashcards could be generated from this document.",
        statusCode: 500,
      });
    }

    const newCards = cards.map((card) => ({
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || "medium",
      reviewCount: 0,
      isStarred: false,
      lastReviewed: null,
    }));

    let flashcardSet = await Flashcard.findOne({
      userId: req.user._id,
      documentId: document._id,
    });

    if (flashcardSet) {
      flashcardSet.cards = newCards;
      flashcardSet.updatedAt = new Date();
      await flashcardSet.save();
      await flashcardSet.populate("documentId", "title fileName");
    } else {
      flashcardSet = await (
        await Flashcard.create({
          userId: req.user._id,
          documentId: document._id,
          cards: newCards,
        })
      ).populate("documentId", "title fileName");
    }

    res.status(201).json({
      success: true,
      data: flashcardSet,
      message: "Flashcards generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                              GENERATE QUIZ                                 */
/* -------------------------------------------------------------------------- */

export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 5, title } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const { error, document } = await resolveDocumentForUser(documentId, req.user._id);
    if (error) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.error,
        statusCode: error.statusCode,
      });
    }

    const extractedText = document.extractedText || "";
    if (extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Document is too short to generate a quiz. Please upload a document with more content.",
        statusCode: 400,
      });
    }

    const questions = await geminiService.generateQuiz(
      extractedText,
      parseInt(numQuestions) || 5,
      document.title || document.fileName || "",
      `userId=${req.user._id}&documentId=${document._id}`
    );

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Could not generate any valid quiz questions for this document. Try a longer document.",
        statusCode: 400,
      });
    }

    const desired = parseInt(numQuestions) || questions.length;
    const finalQuestions = questions.slice(0, Math.max(1, desired));

    const quiz = await Quiz.create({
  userId: req.user._id,
  documentId: document._id,
  title: title || `${document.title || document.fileName || "Document"} - Quiz`,
  questions: finalQuestions,
  totalQuestions: finalQuestions.length,
  userAnswers: [],
  score: 0,
  completedAt: null,
});

    const populated = await Quiz.findOne({ _id: quiz._id })
      .populate("documentId", "title fileName");

    res.status(201).json({
      success: true,
      data: populated || quiz,
      message: "Quiz generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                           GENERATE SUMMARY                                 */
/* -------------------------------------------------------------------------- */

export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const { error, document } = await resolveDocumentForUser(documentId, req.user._id);
    if (error) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.error,
        statusCode: error.statusCode,
      });
    }

    const summary = await geminiService.generateSummary(document.extractedText);

    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        summary,
      },
      message: "Summary generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                   CHAT                                     */
/* -------------------------------------------------------------------------- */

export const chat = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId and question",
        statusCode: 400,
      });
    }

    const { error, document } = await resolveDocumentForUser(documentId, req.user._id);
    if (error) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.error,
        statusCode: error.statusCode,
      });
    }

    // Generate embedding for user's question
    const questionEmbedding = await geminiService.generateEmbedding(question);

    // Retrieve semantically similar chunks
    const relevantChunks = findRelevantChunks(
      document.chunks,
      questionEmbedding,
      3,
    );

    const chunkIndices = relevantChunks.map((chunk) => chunk.chunkIndex);

    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: document._id,
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        documentId: document._id,
        messages: [],
      });
    }

    let answer = "";
    let source = "document";

    // If no relevant chunks found, use general AI directly
    if (relevantChunks.length === 0) {
      answer = await geminiService.generalChat(question);
      source = "general";
    } else {
      answer = await geminiService.chatWithContext(question, relevantChunks);

      // Gemini couldn't answer using the document
      if (answer.trim() === "NOT_FOUND") {
        answer = await geminiService.generalChat(question);
        source = "general";
      }
    }

    chatHistory.messages.push(
      {
        role: "user",
        content: question,
        timestamp: new Date(),
        relevantChunks: [],
      },
      {
        role: "assistant",
        content: answer,
        source,
        timestamp: new Date(),
        relevantChunks: source === "document" ? chunkIndices : [],
      },
    );

    await chatHistory.save();

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        source,
        relevantChunks: source === "document" ? chunkIndices : [],
        chatHistoryId: chatHistory._id,
      },
      message: "Response generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                            EXPLAIN CONCEPT                                 */
/* -------------------------------------------------------------------------- */

export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;

    if (!documentId || !concept) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId and concept",
        statusCode: 400,
      });
    }

    const { error, document } = await resolveDocumentForUser(documentId, req.user._id);
    if (error) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.error,
        statusCode: error.statusCode,
      });
    }

    const conceptEmbedding = await geminiService.generateEmbedding(concept);

    const relevantChunks = findRelevantChunks(
      document.chunks,
      conceptEmbedding,
      3,
    );

    const context = relevantChunks.map((chunk) => chunk.content).join("\n\n");

    const explanation = await geminiService.explainConcept(concept, context);

    res.status(200).json({
      success: true,
      data: {
        concept,
        explanation,
        relevantChunks: relevantChunks.map((chunk) => chunk.chunkIndex),
      },
      message: "Explanation generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                           GET CHAT HISTORY                                 */
/* -------------------------------------------------------------------------- */

export const getChatHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    // Verify that the document belongs to the logged-in user
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    // Get chat history
    const chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId,
    }).select("messages");

    if (!chatHistory) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No chat history found for this document",
      });
    }

    res.status(200).json({
      success: true,
      data: chatHistory.messages,
      message: "Chat history retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};
