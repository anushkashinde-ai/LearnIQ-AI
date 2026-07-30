import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

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

const getAllQuizzes = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_ALL_QUIZZES);
        return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
        throw normalizeError(error, "Failed to fetch quizzes.");
    }
};

const getQuizzesForDocument = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZZES_FOR_DOC(documentId));
        return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
        throw normalizeError(error, "Failed to fetch quizzes for document.");
    }
};

const getQuizById = async (quizId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZ_BY_ID(quizId));
        return response.data?.data ?? response.data;
    } catch (error) {
        throw normalizeError(error, "Failed to fetch quiz by ID.");
    }
};

const submitQuiz = async (quizId, answers) => {
    try {
        const response = await axiosInstance.post(API_PATHS.QUIZZES.SUBMIT_QUIZ(quizId), { answers });
        return response.data?.data ?? response.data;
    } catch (error) {
        throw normalizeError(error, "Failed to submit quiz.");
    }
};


const getQuizResults = async (quizId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZ_RESULTS(quizId));
        return response.data?.data ?? response.data;
    } catch (error) {
        throw normalizeError(error, "Failed to fetch quiz results.");
    }
};


const deleteQuiz = async (quizId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.QUIZZES.DELETE_QUIZ(quizId));
        return response.data?.data ?? response.data;
    } catch (error) {
        throw normalizeError(error, "Failed to delete quiz.");
    }
};

const quizService = {
    getAllQuizzes,
    getQuizzesForDocument,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
};

export default quizService;
