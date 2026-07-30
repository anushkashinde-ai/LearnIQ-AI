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

const login = async (email, password) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
            email,
            password,
        });
        return response.data.data;
    } catch (error) {
        throw normalizeError(error, "Login failed. Please check your email and password.");
    }
};

const register = async (username, email, password) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
            username,
            email,
            password,
        });
        return response.data.data;
    } catch (error) {
        throw normalizeError(error, "Registration failed. Please try again.");
    }
};


const getProfile = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        return response.data.data;
    } catch (error) {
        throw normalizeError(error, "Failed to load profile.");
    }
};


const updateProfile = async (userData) => {
    try {
        const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, userData);
        return response.data.data;
    } catch (error) {
        throw normalizeError(error, "Failed to update profile.");
    }
};

const changePassword = async (passwords) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, passwords);
        return response.data;
    } catch (error) {
        throw normalizeError(error, "Failed to change password.");
    }
};


const authService = {
    login,
    register,
    getProfile,
    updateProfile,
    changePassword,
};

export default authService;
