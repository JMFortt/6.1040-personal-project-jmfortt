import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { createClassInput } from "./validators.ts";

const { Sessioning, RoleBasedAccessing } = concepts;

// every class the user is in, with their role in it
const MyClasses = former("the classes of (user)", ({ user }, { group, name, role }) =>
    each(RoleBasedAccessing._groupsForUser({ user }).is({ group, name, role })).form({ group, name, role }),
);

// whoever creates a class is its STAFF member, so they can do everything in it
const Create = endpoint(
    "/classes/create",
    ({ session, name, user, group }) =>
        receive({ session, name })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(RoleBasedAccessing.createGroup({ owner: user, name, ownerRole: "STAFF" }).responds({ group }))
            .then(respond({ group })),
    { input: { required: ["session", "name"] }, validators: { input: createClassInput } },
);

const Mine = endpoint(
    "/classes/mine",
    ({ session, user }) =>
        receive({ session })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(respond({ classes: MyClasses({ user }) })),
    { input: { required: ["session"] } },
);

export const composition = { MyClasses, Create, Mine };
