import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Reserving.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };
import userAuthenticatingSpec from "@design/concepts/UserAuthenticating.md" with { type: "text" };
import { AlreadyReserved, NoSuchReservation, ReservingConcept } from "./concepts/Reserving.ts";
import { NotLoggedIn, SessioningConcept, SessionNotFound } from "./concepts/Sessioning.ts";
import {
    InvalidCredentials,
    LoginFailed,
    UserAuthenticatingConcept,
    UsernameTaken,
} from "./concepts/UserAuthenticating.ts";

const reserving = registerConcept({
    class: ReservingConcept,
    spec,
    refusals: { ALREADY_RESERVED: AlreadyReserved, NO_SUCH_RESERVATION: NoSuchReservation },
});

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

export const applicationConceptSet = conceptSet({
    Reserving: reserving,
    UserAuthenticating: userAuthenticating,
    Sessioning: sessioning,
});
export const { concepts } = applicationConceptSet;
