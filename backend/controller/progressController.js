import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Dashboard counts
    const totalDocuments = await Document.countDocuments({ userId });
    const totalFlashcardSets = await Flashcard.countDocuments({ userId });
    const totalQuizzes = await Quiz.countDocuments({ userId });

    const completedQuizzes = await Quiz.countDocuments({
      userId,
      completedAt: { $ne: null },
    });

    // Flashcard statistics
    const flashcardSets = await Flashcard.find({ userId });

    let totalFlashcards = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards = 0;

    flashcardSets.forEach((set) => {
      totalFlashcards += set.cards?.length || 0;

      reviewedFlashcards +=
        set.cards?.filter((card) => card.reviewCount > 0).length || 0;

      starredFlashcards +=
        set.cards?.filter((card) => card.isStarred).length || 0;
    });

    // Quiz statistics
    const quizzes = await Quiz.find({
      userId,
      completedAt: { $ne: null },
    });

    const averageScore =
      quizzes.length > 0
        ? Math.round(
            quizzes.reduce((sum, quiz) => sum + quiz.score, 0) /
              quizzes.length
          )
        : 0;

    // Recent documents
    const recentDocuments = await Document.find({ userId })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select("title fileName lastAccessed status");

    // Recent quizzes
    const recentQuizzes = await Quiz.find({ userId })
      .sort({ completedAt: -1 }) // Change to createdAt if your schema doesn't have completedAt
      .limit(5)
      .populate("documentId", "title")
      .select("title score totalQuestions completedAt");

    // Random study streak (1–7)
    const studyStreak = Math.floor(Math.random() * 7) + 1;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          studyStreak,
        },
        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};