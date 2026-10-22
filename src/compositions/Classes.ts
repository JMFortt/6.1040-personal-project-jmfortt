import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, is, no, now, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { IsMember, IsOwner, MayManageMembers } from "./Access.ts";
import { changeRoleInput, createClassInput, idsInput, inviteInput } from "./validators.ts";

const { Sessioning, UserAuthenticating, RoleBasedAccessing, ShiftScheduling, ShiftTrading } = concepts;

// --- cleanup when someone leaves or is removed from a class ---

// they come off the template and off every shift that hasn't started yet; past shifts keep them,
// so attendance history still makes sense
const RemoveFromSchedule = reaction(({ group, user, instant }) =>
    when(RoleBasedAccessing.removeMember({ group, user }).responds({}))
        .where(now(instant))
        .then(ShiftScheduling.removeFromSchedule({ context: group, user, from: instant })),
);

// any cover requests they made in that class that are still active are withdrawn
const WithdrawCoverRequests = reaction(({ group, user, week, shift, request, status }) =>
    when(RoleBasedAccessing.removeMember({ group, user }).responds({}))
        .where(
            ShiftScheduling._weeks({ context: group }).is({ week }),
            ShiftScheduling._shiftsInWeek({ week }).is({ shift }),
            ShiftTrading._requestsForShift({ shift }).is({ request, requester: user, status }),
            is.among(status, ["OPEN", "CLAIMED"]),
        )
        .then(ShiftTrading.withdraw({ request })),
);

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

// also says who the owner is, so the page can mark their row and not offer to change or remove them
const ClassRoster = endpoint(
    "/classes/roster",
    ({ session, group, user, owner }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(IsMember({ user, group }), RoleBasedAccessing._group({ group }).is({ owner }))
                    .then(respond({ roster: Roster({ group }), owner }))
                    .named("member"),
                where(no(IsMember({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-member"),
            ),
    { input: { required: ["session", "group"] } },
);

// --- managing members (STAFF), and leaving (anyone but the owner) ---

// RoleBasedAccessing itself refuses changing the owner's role or a non-member's
const ChangeRole = endpoint(
    "/classes/change-role",
    ({ session, group, member, role, user }) =>
        receive({ session, group, member, role })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayManageMembers({ user, group }))
                    .then(RoleBasedAccessing.changeRole({ group, user: member, role }).responds({}))
                    .then(respond({ member }))
                    .named("allowed"),
                where(no(MayManageMembers({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-allowed"),
            ),
    { input: { required: ["session", "group", "member", "role"] }, validators: { input: changeRoleInput } },
);

// RoleBasedAccessing itself refuses removing the owner or a non-member
const RemoveMember = endpoint(
    "/classes/remove",
    ({ session, group, member, user }) =>
        receive({ session, group, member })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayManageMembers({ user, group }))
                    .then(RoleBasedAccessing.removeMember({ group, user: member }).responds({}))
                    .then(respond({ member }))
                    .named("allowed"),
                where(no(MayManageMembers({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-allowed"),
            ),
    { input: { required: ["session", "group", "member"] }, validators: { input: idsInput("group", "member") } },
);

// anyone can remove themselves; the owner is refused by RoleBasedAccessing
const Leave = endpoint(
    "/classes/leave",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(RoleBasedAccessing.removeMember({ group, user }).responds({}))
            .then(respond({ group })),
    { input: { required: ["session", "group"] }, validators: { input: idsInput("group") } },
);

// only the owner can delete a class; the Cleanup reactions then delete its schedule, continuing
// right after the response is sent
const Delete = endpoint(
    "/classes/delete",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(IsOwner({ user, group }))
                    .then(RoleBasedAccessing.deleteGroup({ group }).responds({}))
                    .then(respond({ group }))
                    .named("owner"),
                where(no(IsOwner({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-owner"),
            ),
    { input: { required: ["session", "group"] }, validators: { input: idsInput("group") } },
);

// --- pending invites (STAFF) ---

// a class's invites that haven't been accepted yet, with the invitee's username
const PendingInvites = former("the pending invites of (group)", ({ group }, { invite, invitee, username, role }) =>
    each(RoleBasedAccessing._invitesForGroup({ group }).is({ invite, invitee, role }))
        .where(UserAuthenticating._username({ user: invitee }).is({ username }))
        .form({ invite, user: invitee, username, role }),
);

const Invites = endpoint(
    "/classes/invites",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayManageMembers({ user, group }))
                    .then(respond({ invites: PendingInvites({ group }) }))
                    .named("allowed"),
                where(no(MayManageMembers({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-allowed"),
            ),
    { input: { required: ["session", "group"] }, validators: { input: idsInput("group") } },
);

// the invite must belong to the class the caller manages, so staff of one class can't withdraw
// another class's invites
const WithdrawInvite = endpoint(
    "/classes/withdraw-invite",
    ({ session, group, invite, user }) =>
        receive({ session, group, invite })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayManageMembers({ user, group }), RoleBasedAccessing._invitesForGroup({ group }).is({ invite }))
                    .then(RoleBasedAccessing.withdrawInvite({ invite }).responds({}))
                    .then(respond({ invite }))
                    .named("allowed"),
                where(no(MayManageMembers({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-allowed"),
                where(MayManageMembers({ user, group }), no(RoleBasedAccessing._invitesForGroup({ group }).is({ invite })))
                    .then(respond({ error: "NO_SUCH_INVITE" }))
                    .named("no-invite"),
            ),
    { input: { required: ["session", "group", "invite"] }, validators: { input: idsInput("group", "invite") } },
);

export const composition = {
    PendingInvites,
    Invites,
    WithdrawInvite,
    Delete,
    RemoveFromSchedule,
    WithdrawCoverRequests,
    ChangeRole,
    RemoveMember,
    Leave,
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
