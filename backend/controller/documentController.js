import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import { extracttextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";
import { generateEmbedding } from "../utils/geminiService.js";
import fs from "fs/promises";
import mongoose from "mongoose";

/* ============================================================
   Upload Document
============================================================ */

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF file",
        statusCode: 400,
      });
    }

    const { title } = req.body;

    if (!title) {
      await fs.unlink(req.file.path).catch(() => {});

      return res.status(400).json({
        success: false,
        error: "Please provide a document title",
        statusCode: 400,
      });
    }

    const baseUrl = `http://localhost:${process.env.PORT || 8000}`;

    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      filePath: fileUrl,
      fileSize: req.file.size,
      status: "processing",
    });

    // Process PDF in background
    processPDF(document._id, req.file.path).catch((err) => {
      console.error("PDF Processing Error:", err);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded successfully and is being processed.",
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    next(error);
  }
};

/* ============================================================
   Process PDF
============================================================ */

const processPDF = async (documentId, filePath) => {
  try {
    // Extract text from PDF
    const { text } = await extracttextFromPDF(filePath);

    const chunks = chunkText(text, 500, 50);
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) console.debug(`[pdf] generated ${chunks.length} chunks for doc=${documentId}`);

    const chunksWithEmbeddings = [];

    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.content);

        chunksWithEmbeddings.push({
          ...chunk,
          embedding,
        });
      } catch (err) {
        if (isDev) {
          console.debug(
            `[pdf] embedding failed chunk ${chunk.chunkIndex}: ${err.message}`
          );
        }
        chunksWithEmbeddings.push({
          ...chunk,
          embedding: [],
        });
      }
    }

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunksWithEmbeddings,
      status: "ready",
    });

    if (isDev) {
      console.debug(`[pdf] doc=${documentId} ready (${chunksWithEmbeddings.length} chunks)`);
    }
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    await Document.findByIdAndUpdate(documentId, {
      status: "error",
    });
  }
};

/* ============================================================
   Get All Documents
============================================================ */

export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "flashcards",
          localField: "_id",
          foreignField: "documentId",
          as: "flashcards",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "documentId",
          as: "quizzes",
        },
      },
      {
        $addFields: {
          flashcardCount: { $size: "$flashcards" },
          quizCount: { $size: "$quizzes" },
        },
      },
      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcards: 0,
          quizzes: 0,
        },
      },
      {
        $sort: {
          uploadDate: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   Get Single Document
============================================================ */

export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    const flashcardCount = await Flashcard.countDocuments({
      documentId: document._id,
      userId: req.user._id,
    });

    const quizCount = await Quiz.countDocuments({
      documentId: document._id,
      userId: req.user._id,
    });

    document.lastAccessed = new Date();
    await document.save();

    const documentData = document.toObject();

    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: documentData,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   Delete Document
============================================================ */

export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    // Delete related flashcards
    await Flashcard.deleteMany({
      documentId: document._id,
    });

    // Delete related quizzes
    await Quiz.deleteMany({
      documentId: document._id,
    });

    // Delete physical PDF (only if local path exists)
    if (
      document.filePath &&
      !document.filePath.startsWith("http")
    ) {
      await fs.unlink(document.filePath).catch(() => {});
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

