import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

export const policy = httpPolicy({
    basePath: "/api",
    publicErrors: {
        INVALID_CREDENTIALS: "INVALID_REQUEST",
        USERNAME_TAKEN: "CONFLICT",
        LOGIN_FAILED: "UNAUTHORIZED",
        SESSION_NOT_FOUND: "NOT_FOUND",
        NOT_LOGGED_IN: "UNAUTHORIZED",
    },
});
