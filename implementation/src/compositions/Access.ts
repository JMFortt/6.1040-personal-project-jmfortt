import { is, view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { RoleBasedAccessing } = concepts;

// TAble's access policy: what each role (LA, TA, STAFF) may do in a class.
// RoleBasedAccessing only knows who holds which role; these views give the roles meaning.

// any role at all makes you a member, which lets you see the class
export const IsMember = view("(user) is a member of (group)", ({ user, group }, _outputs, _bindings) =>
    where(RoleBasedAccessing._role({ group, user })),
).holds();

// TAs and staff build the schedule
export const MayEditSchedule = view("(user) may edit the schedule of (group)", ({ user, group }, _outputs, { role }) =>
    where(
        RoleBasedAccessing._role({ group, user }).is({ role }),
        is.among(role, ["TA", "STAFF"]),
    ),
).holds();

// only staff invite people
export const MayManageMembers = view("(user) may manage the members of (group)", ({ user, group }, _outputs, _bindings) =>
    where(RoleBasedAccessing._role({ group, user }).is({ role: "STAFF" })),
).holds();

export const composition = { IsMember, MayEditSchedule, MayManageMembers };
