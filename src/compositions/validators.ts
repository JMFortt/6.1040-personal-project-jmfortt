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

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function strings(value: Record<string, unknown>, keys: string[]) {
    return keys.every((key) => typeof value[key] === "string");
}

function isTime(value: unknown) {
    return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

// ShiftScheduling itself refuses times out of order and capacity below 1; these check the shapes
export const createSlotInput = validator(
    (value) =>
        strings(value, ["session", "group"]) &&
        WEEKDAYS.includes(value.weekday as string) &&
        Number.isInteger(value.startMinute) &&
        Number.isInteger(value.endMinute) &&
        Number.isInteger(value.capacity),
    "the weekday must be a day of the week, and times and capacity must be whole numbers",
);

export const createShiftInput = validator(
    (value) => strings(value, ["session", "week"]) && isTime(value.start) && isTime(value.end) && Number.isInteger(value.capacity),
    "start and end must be times and capacity must be a whole number",
);

export const publishInput = validator(
    (value) => strings(value, ["session", "group"]) && isTime(value.start) && nonemptyString(value.name),
    "the week needs a start time and a name",
);

export const renameInput = validator(
    (value) => strings(value, ["session", "week"]) && nonemptyString(value.name),
    "the week's name must not be empty",
);

export const markInput = validator(
    (value) =>
        strings(value, ["session", "shift", "member"]) && ["PRESENT", "ABSENT", "LATE", "EXCUSED"].includes(value.status as string),
    "the status must be PRESENT, ABSENT, LATE, or EXCUSED",
);

// { session, <id>, capacity }: ShiftScheduling itself refuses a capacity below 1 or below how many are on it
export function capacityInput(key: string) {
    return validator(
        (value) => strings(value, ["session", key]) && Number.isInteger(value.capacity),
        "capacity must be a whole number",
    );
}

// for endpoints that take a session plus some ids, like { session, shift, member }
export function idsInput(...keys: string[]) {
    return validator((value) => strings(value, ["session", ...keys]), `${keys.join(" and ")} must be given`);
}

export const changeRoleInput = validator(
    (value) =>
        typeof value.session === "string" &&
        typeof value.group === "string" &&
        typeof value.member === "string" &&
        ROLES.includes(value.role as string),
    "the role must be LA, TA, or STAFF",
);

export const createClassInput = validator(
    (value) => typeof value.session === "string" && nonemptyString(value.name),
    "the class name must not be empty",
);
