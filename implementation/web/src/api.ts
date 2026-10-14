import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { TAbleWireHttp } from "../../generated/wire.ts";

// typed client generated from the backend's endpoints
export const client = createHttpClient<TAbleWireHttp>({ baseUrl: "/api" });

export const UNREACHABLE = "Can't reach the server. Try again in a moment.";
export const SESSION_EXPIRED = "You've been logged out. Please log in again.";

// true if a protected request was refused because the session isn't valid,
// which every page handles the same way: back to the login page
export function loggedOutBy(result: object) {
    return "error" in result && result.error === "UNAUTHORIZED";
}

// turns an error category from the API into a message for the user
export function errorMessage(error: string, messages: Record<string, string>) {
    if (error in messages) return messages[error]!;
    if (error === "UNAVAILABLE") return UNREACHABLE;
    return "Something went wrong. Please try again.";
}

// the session is kept in sessionStorage so a refresh doesn't log you out;
// unlike localStorage it's per tab, so different tabs can be different users
const SESSION_KEY = "table.session";

export function savedSession() {
    try {
        return sessionStorage.getItem(SESSION_KEY);
    } catch {
        return null;
    }
}

export function saveSession(session: string | null) {
    try {
        if (session === null) sessionStorage.removeItem(SESSION_KEY);
        else sessionStorage.setItem(SESSION_KEY, session);
    } catch {
        // storage blocked (e.g. private window): you just won't stay logged in on refresh
    }
}
