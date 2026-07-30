import axiosInstance from '../utils/axiosInstance.js';
import { API_PATHS } from '../utils/apiPaths.js';

const normalizeError = (error, fallbackMessage) => {
    const payload = error?.response?.data;
    let message = null;

    if (typeof error?.friendlyMessage === "string" && error.friendlyMessage.trim()) {
        message = error.friendlyMessage;
    } else if (typeof payload?.error === "string" && payload.error.trim()) {
        message = payload.error;
    } else if (typeof payload?.message === "string" && payload.message.trim()) {
        message = payload.message;
    } else if (typeof payload?.error?.message === "string" && payload.error.message.trim()) {
        message = payload.error.message;
    } else if (typeof error?.message === "string" && error.message.trim()) {
        message = error.message;
    }

    return {
        message: message || fallbackMessage,
        statusCode: error?.statusCode || payload?.statusCode || error?.response?.status || null,
        retryDelaySeconds: error?.retryDelaySeconds || payload?.retryDelaySeconds || null,
    };
};

const generateFlashcards = async (documentId, options) => {
    try{
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_FLASHCARDS, { documentId, ...options });
        return response.data?.data ?? response.data;
    } catch (error) {
         throw normalizeError(error, 'Failed to generate flashcards');
    }
};

const generateQuiz = async (documentId, options) => {
    try{
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_QUIZ, { documentId, ...options });
        return response.data?.data ?? response.data;
    } catch (error) {
         throw normalizeError(error, 'Failed to generate quiz');
    }
};

const generateSummary = async (documentId) => {
    try{
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_SUMMARY, { documentId });
        return response.data?.data; 
    } catch (error) {
        throw normalizeError(error, 'Failed to generate summary');
    }
};

const chat = async (documentId, message) => {
    try{
        const response = await axiosInstance.post(API_PATHS.AI.CHAT, { documentId, question: message});
        return response.data?.data ?? response.data; 
    } catch (error) {
         throw normalizeError(error, 'Chat request failed');
    }
};


const explainConcept = async (documentId, concept) => {
    try{
        const response = await axiosInstance.post(API_PATHS.AI.EXPLAIN_CONCEPT, { documentId, concept });
        return response.data?.data ?? response.data; 
    } catch (error) {
         throw normalizeError(error, 'Explain concept request failed');
    }
};

const getChatHistory = async (documentId) => {
    try {
        const response = await axiosInstance.get(
            API_PATHS.AI.GET_CHAT_HISTORY(documentId)
        );

        return response.data?.data ?? response.data;
    } catch (error) {
        throw normalizeError(error, 'Failed to retrieve chat history');
    }
};

const aiService = {
    generateFlashcards,
    generateQuiz,
    generateSummary,
    chat,
    explainConcept,
    getChatHistory
};

export default aiService;

