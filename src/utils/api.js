import { auth } from "./firebase";

export const API_BASE = "https://us-central1-stroller-stats.cloudfunctions.net/app";

// fetch() for endpoints that need the signed-in user; getIdToken refreshes expired tokens.
export const authFetch = async (path, options = {}) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Not signed in");
    }
    const token = await user.getIdToken();
    return fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
};
