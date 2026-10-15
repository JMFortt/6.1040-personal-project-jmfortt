import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { Ref } from "vue/dist/vue.esm-bundler.js";
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

// messages for schedule edits; pages add or override entries for specific actions
export const SCHEDULE_MESSAGES: Record<string, string> = {
    FORBIDDEN: "Only TAs and staff can edit the schedule.",
    NOT_FOUND: "That no longer exists. Try refreshing.",
    CONFLICT: "They're already on it, or it's full.",
    INVALID_REQUEST: "That person isn't in this class.",
};

// Runs one API call the same way on every page: uses the saved session, shows a busy state,
// turns an error into a message, and sends you to login if the session has expired.
// Returns true if the call succeeded.
export function makePerform(onExpired: () => void) {
    return async function perform(
        call: (session: string) => Promise<object>,
        messages: Record<string, string>,
        error: Ref<string>,
        busy: Ref<boolean>,
    ) {
        error.value = "";
        const session = savedSession();
        if (session === null) {
            onExpired();
            return false;
        }
        busy.value = true;
        try {
            const result = await call(session);
            if (loggedOutBy(result)) {
                onExpired();
                return false;
            }
            if ("error" in result) {
                error.value = errorMessage(String(result.error), messages);
                return false;
            }
            return true;
        } catch {
            error.value = UNREACHABLE;
            return false;
        } finally {
            busy.value = false;
        }
    };
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
