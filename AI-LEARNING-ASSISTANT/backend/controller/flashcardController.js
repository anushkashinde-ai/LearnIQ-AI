import Flashcard from "../models/Flashcard.js";

// ===========================
// Get Flashcards for Document
// ===========================
export const getFlashcards = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({
      documentId: req.params.documentId,
      userId: req.user._id,
    })
      .populate("documentId", "title fileName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flashcards.length,
      data: flashcards,
    });
  } catch (error) {
    next(error);
  }
};

// ===========================
// Get All Flashcard Sets
// ===========================
export const getAllFlashcardSets = async (req, res, next) => {
  try {
    const allSets = await Flashcard.find({
      userId: req.user._id,
    })
      .populate("documentId", "title fileName")
      .sort({ updatedAt: -1, createdAt: -1 });

    const seenDocIds = new Set();
    const flashcardSets = [];
    for (const set of allSets) {
      const docId =
        (set.documentId && (set.documentId._id || set.documentId))?.toString?.() ||
        String(set.documentId);
      if (!docId || seenDocIds.has(docId)) continue;
      seenDocIds.add(docId);
      flashcardSets.push(set);
    }

    res.status(200).json({
      success: true,
      count: flashcardSets.length,
      data: flashcardSets,
    });
  } catch (error) {
    next(error);
  }
};

// ===========================
// Review Flashcard
// ===========================
export const reviewFlashcard = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      "cards._id": req.params.cardId,
      userId: req.user._id,
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set not found",
      });
    }

    const card = flashcardSet.cards.id(req.params.cardId);

    if (!card) {
      return res.status(404).json({
        success: false,
        error: "Flashcard not found",
      });
    }

    card.lastReviewed = new Date();
    card.reviewCount += 1;

    await flashcardSet.save();

    res.status(200).json({
      success: true,
      message: "Flashcard reviewed successfully",
      data: flashcardSet,
    });
  } catch (error) {
    next(error);
  }
};

// ===========================
// Toggle Star
// ===========================
export const toggleStartFlashcard = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      "cards._id": req.params.cardId,
      userId: req.user._id,
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set not found",
      });
    }

    const card = flashcardSet.cards.id(req.params.cardId);

    if (!card) {
      return res.status(404).json({
        success: false,
        error: "Flashcard not found",
      });
    }

    card.isStarred = !card.isStarred;

    await flashcardSet.save();

    res.status(200).json({
      success: true,
      message: `Flashcard ${
        card.isStarred ? "starred" : "unstarred"
      } successfully`,
      data: flashcardSet,
    });
  } catch (error) {
    next(error);
  }
};

// ===========================
// Delete Flashcard Set
// ===========================
export const deleteFlashcardSet = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set not found",
      });
    }

    await flashcardSet.deleteOne();

    res.status(200).json({
      success: true,
      message: "Flashcard set deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};