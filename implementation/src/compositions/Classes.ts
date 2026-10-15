import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { IsMember, MayManageMembers } from "./Access.ts";
import { createClassInput, inviteInput } from "./validators.ts";

const { Sessioning, UserAuthenticating, RoleBasedAccessing } = concepts;

// --- formers ---

// every class the user is in, with their role in it
const MyClasses = former("the classes of (user)", ({ user }, { group, name, role }) =>
    each(RoleBasedAccessing._groupsForUser({ user }).is({ group, name, role })).form({ group, name, role }),
);

// the user's pending invites, with each class's name so they know what they're joining
const MyInvites = former("the invites of (user)", ({ user }, { invite, group, name, role }) =>
    each(RoleBasedAccessing._invitesForUser({ user }).is({ invite, group, role }))
        .where(RoleBasedAccessing._group({ group }).is({ name }))
        .form({ invite, group, name, role }),
);

// a class's members, with usernames to show instead of user ids
const Roster = former("the roster of (group)", ({ group }, { member, username, role }) =>
    each(RoleBasedAccessing._members({ group }).is({ user: member, role }))
        .where(UserAuthenticating._username({ user: member }).is({ username }))
        .form({ user: member, username, role }),
);

// --- endpoints ---

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

// invites by username: staff type a name, but RoleBasedAccessing needs that user's id
const Invite = endpoint(
    "/classes/invite",
    ({ session, group, username, role, user, invitee, invite }) =>
        receive({ session, group, username, role })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayManageMembers({ user, group }), UserAuthenticating._user({ username }).is({ user: invitee }))
                    .then(RoleBasedAccessing.invite({ group, user: invitee, role }).responds({ invite }))
                    .then(respond({ invite }))
                    .named("allowed"),
                where(no(MayManageMembers({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
                where(MayManageMembers({ user, group }), no(UserAuthenticating._user({ username })))
                    .then(respond({ error: "NO_SUCH_USER" }))
                    .named("unknown-user"),
            ),
    { input: { required: ["session", "group", "username", "role"] }, validators: { input: inviteInput } },
);

const MyInvitesList = endpoint(
    "/invites/mine",
    ({ session, user }) =>
        receive({ session })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(respond({ invites: MyInvites({ user }) })),
    { input: { required: ["session"] } },
);

// RoleBasedAccessing itself refuses an invite meant for someone else
const Accept = endpoint(
    "/invites/accept",
    ({ session, invite, user }) =>
        receive({ session, invite })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(RoleBasedAccessing.accept({ invite, user }).responds({}))
            .then(respond({ invite })),
    { input: { required: ["session", "invite"] } },
);

const ClassRoster = endpoint(
    "/classes/roster",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(IsMember({ user, group }))
                    .then(respond({ roster: Roster({ group }) }))
                    .named("member"),
                where(no(IsMember({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-member"),
            ),
    { input: { required: ["session", "group"] } },
);

export const composition = {
    MyClasses,
    MyInvites,
    Roster,
    Create,
    Mine,
    Invite,
    MyInvitesList,
    Accept,
    ClassRoster,
};
