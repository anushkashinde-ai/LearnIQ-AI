import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const normalizeError = (error, fallbackMessage) => {
  const payload = error?.response?.data || error || {};
  return {
    message:
      error?.friendlyMessage ||
      payload?.message ||
      payload?.error ||
      (typeof payload?.error === "object" ? payload.error?.message : null) ||
      fallbackMessage ||
      "Something went wrong.",
    statusCode: error?.statusCode || payload?.statusCode || error?.status || null,
    retryDelaySeconds: error?.retryDelaySeconds || payload?.retryDelaySeconds || null,
  };
};

// ===========================
// Get All Flashcard Sets
// ===========================
const getAllFlashcards = async () => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.FLASHCARDS.GET_ALL_FLASHCARDS_SETS
    );

    return response.data.data;
  } catch (error) {
    throw normalizeError(error, "Failed to fetch flashcards.");
  }
};

// ===========================
// Get Flashcards For Document
// ===========================
const getFlashcardForDocument = async (documentId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.FLASHCARDS.GET_FLASHCARDS_FOR_DOC(documentId)
    );

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw normalizeError(error, "Failed to fetch flashcards for document.");
  }
};

// ===========================
// Review Flashcard
// ===========================
const reviewFlashcard = async (cardId) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.FLASHCARDS.REVIEW_FLASHCARD(cardId)
    );

    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error, "Failed to review flashcard.");
  }
};

// ===========================
// Toggle Star
// ===========================
const toggleStar = async (cardId) => {
  try {
    const response = await axiosInstance.put(
      API_PATHS.FLASHCARDS.TOGGLE_STAR(cardId)
    );

    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error, "Failed to toggle star.");
  }
};

// ===========================
// Delete Flashcard Set
// ===========================
const deleteFlashcardSet = async (setId) => {
  try {
    const response = await axiosInstance.delete(
      API_PATHS.FLASHCARDS.DELETE_FLASHCARD_SET(setId)
    );

    return response.data;
  } catch (error) {
    throw normalizeError(error, "Failed to delete flashcard set.");
  }
};

const flashcardService = {
  getAllFlashcards,
  getFlashcardForDocument,
  reviewFlashcard,
  toggleStar,
  deleteFlashcardSet,
};

export default flashcardService;
