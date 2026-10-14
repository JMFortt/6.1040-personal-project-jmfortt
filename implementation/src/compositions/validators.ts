import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";

// requests aren't type-checked at runtime, so endpoints check app rules here
// before anything runs; a failed check is refused as INVALID_REQUEST
function validator(accepts: (value: Record<string, unknown>) => boolean, detail: string): EndpointValidator {
    return (value) =>
        typeof value === "object" && value !== null && accepts(value as Record<string, unknown>)
            ? { ok: true }
            : { ok: false, detail };
}

function nonemptyString(value: unknown) {
    return typeof value === "string" && value.trim() !== "";
}

// TAble's roles; RoleBasedAccessing accepts any role, so the app checks them here
const ROLES = ["LA", "TA", "STAFF"];

export const inviteInput = validator(
    (value) =>
        typeof value.session === "string" &&
        typeof value.group === "string" &&
        nonemptyString(value.username) &&
        ROLES.includes(value.role as string),
    "the username must not be empty and the role must be LA, TA, or STAFF",
);

export const createClassInput = validator(
    (value) => typeof value.session === "string" && nonemptyString(value.name),
    "the class name must not be empty",
);
