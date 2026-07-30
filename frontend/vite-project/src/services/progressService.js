import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const getDashboardData = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_DASHBOARD);
        return response.data.data;
    } catch (error) {
        throw {
            message:
                error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to fetch dashboard data',
        };
    }
};

const progressService = {
    getDashboardData
};

export default progressService;
