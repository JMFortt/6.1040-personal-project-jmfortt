import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";
import roleBasedAccessingSpec from "@design/concepts/RoleBasedAccessing.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };
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

export const applicationConceptSet = conceptSet({
    UserAuthenticating: userAuthenticating,
    Sessioning: sessioning,
    RoleBasedAccessing: roleBasedAccessing,
});
export const { concepts } = applicationConceptSet;
