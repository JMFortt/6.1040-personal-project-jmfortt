import { assemble } from "@mit-sdg/sync-engine/assembly";
import { composition as auth } from "./compositions/Auth.ts";
import { composition } from "./compositions/Reservations.ts";
import { ReservingConcept } from "./concepts/Reserving.ts";
import { SessioningConcept } from "./concepts/Sessioning.ts";
import { UserAuthenticatingConcept } from "./concepts/UserAuthenticating.ts";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: {
      Reserving: new ReservingConcept(db),
      UserAuthenticating: new UserAuthenticatingConcept(db),
      Sessioning: new SessioningConcept(db),
    },
    composition: { Reservations: composition, Auth: auth },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
