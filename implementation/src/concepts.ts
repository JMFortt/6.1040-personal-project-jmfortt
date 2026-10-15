import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";
import attendanceTrackingSpec from "@design/concepts/AttendanceTracking.md" with { type: "text" };
import { AttendanceTrackingConcept, NoRecord } from "./concepts/AttendanceTracking.ts";
import shiftTradingSpec from "@design/concepts/ShiftTrading.md" with { type: "text" };
import {
    ActiveRequestExists,
    AlreadyResolved,
    NotClaimed,
    NotOpen,
    OwnRequest,
    RequestNotFound,
    ShiftTradingConcept,
} from "./concepts/ShiftTrading.ts";
import roleBasedAccessingSpec from "@design/concepts/RoleBasedAccessing.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };
import shiftSchedulingSpec from "@design/concepts/ShiftScheduling.md" with { type: "text" };
import {
    AlreadyAssigned,
    InvalidCapacity,
    InvalidTimes,
    NotAssigned,
    ShiftFull,
    ShiftNotFound,
    ShiftSchedulingConcept,
    SlotNotFound,
    WeekAlreadyPublished,
    WeekNotFound,
} from "./concepts/ShiftScheduling.ts";
import {
    AlreadyInGroup,
    CannotChangeOwnerRole,
    CannotRemoveOwner,
    GroupNotFound,
    InviteNotFound,
    NotAMember,
    NotInvitee,
    RoleBasedAccessingConcept,
} from "./concepts/RoleBasedAccessing.ts";
import userAuthenticatingSpec from "@design/concepts/UserAuthenticating.md" with { type: "text" };
import { NotLoggedIn, SessioningConcept, SessionNotFound } from "./concepts/Sessioning.ts";
import {
    InvalidCredentials,
    LoginFailed,
    UserAuthenticatingConcept,
    UsernameTaken,
} from "./concepts/UserAuthenticating.ts";

const userAuthenticating = registerConcept({
    class: UserAuthenticatingConcept,
    spec: userAuthenticatingSpec,
    refusals: {
        INVALID_CREDENTIALS: InvalidCredentials,
        USERNAME_TAKEN: UsernameTaken,
        LOGIN_FAILED: LoginFailed,
    },
});

const sessioning = registerConcept({
    class: SessioningConcept,
    spec: sessioningSpec,
    refusals: { SESSION_NOT_FOUND: SessionNotFound, NOT_LOGGED_IN: NotLoggedIn },
});

const roleBasedAccessing = registerConcept({
    class: RoleBasedAccessingConcept,
    spec: roleBasedAccessingSpec,
    refusals: {
        GROUP_NOT_FOUND: GroupNotFound,
        ALREADY_IN_GROUP: AlreadyInGroup,
        INVITE_NOT_FOUND: InviteNotFound,
        NOT_INVITEE: NotInvitee,
        NOT_A_MEMBER: NotAMember,
        CANNOT_CHANGE_OWNER_ROLE: CannotChangeOwnerRole,
        CANNOT_REMOVE_OWNER: CannotRemoveOwner,
    },
});

const shiftScheduling = registerConcept({
    class: ShiftSchedulingConcept,
    spec: shiftSchedulingSpec,
    refusals: {
        INVALID_TIMES: InvalidTimes,
        INVALID_CAPACITY: InvalidCapacity,
        SLOT_NOT_FOUND: SlotNotFound,
        WEEK_NOT_FOUND: WeekNotFound,
        WEEK_ALREADY_PUBLISHED: WeekAlreadyPublished,
        SHIFT_NOT_FOUND: ShiftNotFound,
        ALREADY_ASSIGNED: AlreadyAssigned,
        SHIFT_FULL: ShiftFull,
        NOT_ASSIGNED: NotAssigned,
    },
});

const attendanceTracking = registerConcept({
    class: AttendanceTrackingConcept,
    spec: attendanceTrackingSpec,
    refusals: { NO_RECORD: NoRecord },
});

const shiftTrading = registerConcept({
    class: ShiftTradingConcept,
    spec: shiftTradingSpec,
    refusals: {
        ACTIVE_REQUEST_EXISTS: ActiveRequestExists,
        REQUEST_NOT_FOUND: RequestNotFound,
        NOT_OPEN: NotOpen,
        OWN_REQUEST: OwnRequest,
        NOT_CLAIMED: NotClaimed,
        ALREADY_RESOLVED: AlreadyResolved,
    },
});

export const applicationConceptSet = conceptSet({
    UserAuthenticating: userAuthenticating,
    Sessioning: sessioning,
    RoleBasedAccessing: roleBasedAccessing,
    ShiftScheduling: shiftScheduling,
    AttendanceTracking: attendanceTracking,
    ShiftTrading: shiftTrading,
});
export const { concepts } = applicationConceptSet;
