import axios from "axios";
import { BASE_URL } from "./apiPaths";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 80000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        if(accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        // Remove default Content-Type when sending FormData so axios can set the correct one with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const extractFriendlyMessage = (error) => {
    const payload = error?.response?.data;
    if (!payload) return null;

    let candidate = null;

    if (typeof payload?.error === "string" && payload.error.trim()) {
        candidate = payload.error;
    } else if (typeof payload?.message === "string" && payload.message.trim()) {
        candidate = payload.message;
    } else if (typeof payload?.error?.message === "string" && payload.error.message.trim()) {
        candidate = payload.error.message;
    } else if (typeof payload?.error === "object" && payload.error !== null) {
        const raw = payload.error;
        if (typeof raw.code === "number" && (raw.code === 429 || /quota|rate.?limit/i.test(String(raw.message || "")))) {
            const fallback = "Gemini quota exceeded. Please wait a moment and try again.";
            const message = String(raw.message || "");
            const match = message.match(/retry in ([\d.]+)s/i);
            if (match) {
                const seconds = Math.ceil(parseFloat(match[1]));
                if (!Number.isNaN(seconds) && seconds > 0) {
                    return `Gemini quota exceeded. Please try again in ${seconds} seconds.`;
                }
            }
            return fallback;
        }
        if (typeof raw.message === "string" && raw.message.trim()) {
            candidate = raw.message;
        }
    }

    if (candidate) {
        return candidate.trim().replace(/\s+/g, " ").slice(0, 240);
    }

    return null;
};

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const friendly = extractFriendlyMessage(error);

        if (error.response) {
            const status = error.response.status;

            // Attach the friendly message so components/services can read it directly
            try {
                const payload = error.response.data || {};
                error.friendlyMessage =
                    friendly ||
                    payload?.message ||
                    payload?.error ||
                    (typeof payload?.error === "object" ? payload.error?.message : null) ||
                    error.message;
                error.statusCode = status;
                error.retryDelaySeconds = payload?.retryDelaySeconds || null;
            } catch (_) {}

            if (status === 401) {
                // Session expiry is truly global — only one toast here
                try { toast.error(friendly || "Session expired. Please login again."); } catch (_) {}
            } else if (status === 429) {
                console.debug(
                    "[rate-limit] " + (friendly || `Too many requests (${status}).`)
                );
            } else if (status >= 500) {
                console.debug(
                    `[server ${status}] ` + (friendly || error.message || "")
                );
            }
            // NOTE: Components explicitly catch and toast for all 4xx/5xx
            //       → interceptor does NOT toast here to avoid double notifications.
        } else if (error.code === "ECONNABORTED") {
            const msg = "Request timeout. Please try again.";
            console.debug(msg);
            try { toast.error(msg); } catch (_) {}
            error.friendlyMessage = msg;
        } else if (error.code === "ERR_NETWORK" || !error.response) {
            const msg = "Could not reach the server. Please check your connection and try again.";
            console.debug(msg);
            try { toast.error(msg); } catch (_) {}
            error.friendlyMessage = msg;
        }
        return Promise.reject(error); 
    }
);

export default axiosInstance;
