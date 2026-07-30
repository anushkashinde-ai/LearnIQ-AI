import express from "express";
import {
  getFlashcards,
  getAllFlashcardSets,
  reviewFlashcard,
  toggleStartFlashcard,
  deleteFlashcardSet,
} from "../controller/flashcardController.js";

import protect from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// ============================
// Flashcard Routes
// ============================

// Get all flashcard sets of logged-in user
router.get("/", getAllFlashcardSets);

// Get flashcards for a specific document
router.get("/:documentId", getFlashcards);

// Review a flashcard
router.post("/:cardId/review", reviewFlashcard);

// Toggle star/unstar
router.put("/:cardId/star", toggleStartFlashcard);

// Delete flashcard set
router.delete("/:id", deleteFlashcardSet);

export default router;