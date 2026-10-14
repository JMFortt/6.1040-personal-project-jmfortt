import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

export const policy = httpPolicy({
    basePath: "/api",
    publicErrors: {
        INVALID_CREDENTIALS: "INVALID_REQUEST",
        USERNAME_TAKEN: "CONFLICT",
        LOGIN_FAILED: "UNAUTHORIZED",
        SESSION_NOT_FOUND: "NOT_FOUND",
        NOT_LOGGED_IN: "UNAUTHORIZED",
        GROUP_NOT_FOUND: "NOT_FOUND",
        ALREADY_IN_GROUP: "CONFLICT",
        INVITE_NOT_FOUND: "NOT_FOUND",
        NOT_INVITEE: "FORBIDDEN",
        NOT_A_MEMBER: "NOT_FOUND",
        CANNOT_CHANGE_OWNER_ROLE: "FORBIDDEN",
        CANNOT_REMOVE_OWNER: "FORBIDDEN",
    },
});
