export const BASE_URL = "https://learniq-ai.onrender.com";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
    CHANGE_PASSWORD: "/api/auth/change-password",
  },

  DOCUMENTS: {
    UPLOAD: "/api/documents/upload",
    GET_DOCUMENTS: "/api/documents",
    GET_DOCUMENT_BY_ID: (id) => `/api/documents/${id}`,
    UPDATE_DOCUMENT: (id) => `/api/documents/${id}`,
    DELETE_DOCUMENT: (id) => `/api/documents/${id}`,
  },

  AI: {
    GENERATE_FLASHCARDS: "/api/ai/generate-flashcards",
    GENERATE_QUIZ: "/api/ai/generate-quiz",
    GENERATE_SUMMARY: "/api/ai/generate-summary",
    CHAT: "/api/ai/chat",
    EXPLAIN_CONCEPT: "/api/ai/explain-concept",
    GET_CHAT_HISTORY: (documentId) =>
      `/api/ai/chat-history/${documentId}`,
  },

  FLASHCARDS: {
  GET_ALL_FLASHCARDS_SETS: "/api/flashcards",

  GET_FLASHCARDS_FOR_DOC: (documentId) =>
    `/api/flashcards/${documentId}`,

  REVIEW_FLASHCARD: (cardId) =>
    `/api/flashcards/${cardId}/review`,

  TOGGLE_STAR: (cardId) =>
    `/api/flashcards/${cardId}/star`,

  DELETE_FLASHCARD_SET: (id) =>
    `/api/flashcards/${id}`,
},

  QUIZZES: {
    GET_ALL_QUIZZES: "/api/quizzes",
    GET_QUIZZES_FOR_DOC: (documentId) =>
      `/api/quizzes/document/${documentId}`,
    GET_QUIZ_BY_ID: (quizId) =>
      `/api/quizzes/${quizId}`,
    SUBMIT_QUIZ: (quizId) =>
      `/api/quizzes/${quizId}/submit`,
    GET_QUIZ_RESULTS: (quizId) =>
      `/api/quizzes/${quizId}/results`,
    DELETE_QUIZ: (quizId) =>
      `/api/quizzes/${quizId}`,
  },

  PROGRESS: {
    GET_DASHBOARD: "/api/progress/dashboard",
  },
};