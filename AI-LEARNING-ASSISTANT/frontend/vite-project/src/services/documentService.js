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

const getDocuments = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENTS.GET_DOCUMENTS);
        return response.data?.data;
    } catch (error) {
        throw normalizeError(error, "Failed to fetch documents.");
    }
};

const uploadDocument = async (formData) => {
    try {
        const response = await axiosInstance.post(API_PATHS.DOCUMENTS.UPLOAD, formData);
        return response.data;
    } catch (error) {
        throw normalizeError(error, "Failed to upload document. Ensure it's a valid PDF under 10MB.");
    }
};

const deleteDocument = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.DOCUMENTS.DELETE_DOCUMENT(id));
        return response.data;
    } catch (error) {
        throw normalizeError(error, "Failed to delete document.");
    }
};


const getDocumentById = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENTS.GET_DOCUMENT_BY_ID(id));
        return response.data?.data;
    } catch (error) {
        throw normalizeError(error, "Failed to fetch document.");
    }
};

const documentService = {
    getDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentById
};

export default documentService;