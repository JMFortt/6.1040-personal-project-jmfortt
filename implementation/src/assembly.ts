import { assemble } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import { composition as access } from "./compositions/Access.ts";
import { composition as auth } from "./compositions/Auth.ts";
import { composition as classes } from "./compositions/Classes.ts";
import { composition as schedule } from "./compositions/Schedule.ts";
import { RoleBasedAccessingConcept } from "./concepts/RoleBasedAccessing.ts";
import { SessioningConcept } from "./concepts/Sessioning.ts";
import { ShiftSchedulingConcept } from "./concepts/ShiftScheduling.ts";
import { UserAuthenticatingConcept } from "./concepts/UserAuthenticating.ts";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";

// tests pass their own database; the app uses the one from MONGODB_URL
export function assembleApplication(database: Db = db) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: {
      UserAuthenticating: new UserAuthenticatingConcept(database),
      Sessioning: new SessioningConcept(database),
      RoleBasedAccessing: new RoleBasedAccessingConcept(database),
      ShiftScheduling: new ShiftSchedulingConcept(database),
    },
    composition: { Access: access, Auth: auth, Classes: classes, Schedule: schedule },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
