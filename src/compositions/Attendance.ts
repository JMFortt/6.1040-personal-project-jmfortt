import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, whether, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { IsMember, MayMarkAttendance, MayViewAllAttendance } from "./Access.ts";
import { idsInput, markInput } from "./validators.ts";

const { Sessioning, UserAuthenticating, ShiftScheduling, AttendanceTracking } = concepts;

// Attendance is recorded per shift in a published week. Like the schedule, every endpoint first
// finds the shift's class and checks the caller's role there.

// --- formers ---

// everyone's records for one shift, with usernames
const ShiftRecords = former("the attendance records of (shift)", ({ shift }, { member, username, status }) =>
    each(AttendanceTracking._recordsForEvent({ event: shift }).is({ user: member, status }))
        .where(UserAuthenticating._username({ user: member }).is({ username }))
        .form({ user: member, username, status }),
);

// just one user's record for one shift (no rows if they have none)
const OwnShiftRecord = former("the attendance record of (user) for (shift)", ({ user, shift }, { username, status }) =>
    each(AttendanceTracking._record({ user, event: shift }).is({ status }))
        .where(UserAuthenticating._username({ user }).is({ username }))
        .form({ user, username, status }),
);

// every shift the user is on in a class, in time order, with their status (null if not marked yet)
const MyRecords = former(
    "the attendance of (user) in (group)",
    ({ user, group }, { week, shift, start, end, status }) =>
        each(ShiftScheduling._weeks({ context: group }).is({ week }))
            .where(
                ShiftScheduling._shiftsInWeek({ week }).is({ shift, start, end }),
                ShiftScheduling._assignees({ shift }).is({ user }),
                whether(AttendanceTracking._record({ user, event: shift }).is({ status })),
            )
            .arranged(start)
            .form({ shift, start, end, status }),
);

// every person on every shift in a class, in time order, with their status (null if not marked yet),
// for the analytics page
const ClassRecords = former(
    "the attendance in (group)",
    ({ group }, { week, shift, start, end, member, status }) =>
        each(ShiftScheduling._weeks({ context: group }).is({ week }))
            .where(
                ShiftScheduling._shiftsInWeek({ week }).is({ shift, start, end }),
                ShiftScheduling._assignees({ shift }).is({ user: member }),
                whether(AttendanceTracking._record({ user: member, event: shift }).is({ status })),
            )
            .arranged(start)
            .form({ shift, start, end, user: member, status }),
);

// --- endpoints ---

// only someone assigned to the shift can be marked
const Mark = endpoint(
    "/attendance/mark",
    ({ session, shift, member, status, user, group }) =>
        receive({ session, shift, member, status })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayMarkAttendance({ user, group }),
                    ShiftScheduling._assignees({ shift }).is({ user: member }),
                )
                    .then(AttendanceTracking.mark({ user: member, event: shift, status }).responds({}))
                    .then(respond({ shift }))
                    .named("allowed"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }).is({ context: group }), no(MayMarkAttendance({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
                where(
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayMarkAttendance({ user, group }),
                    no(ShiftScheduling._assignees({ shift }).is({ user: member })),
                )
                    .then(respond({ error: "NOT_ON_SHIFT" }))
                    .named("not-on-shift"),
            ),
    { input: { required: ["session", "shift", "member", "status"] }, validators: { input: markInput } },
);

// clearing doesn't require them to still be on the shift (they may have been covered since)
const Unmark = endpoint(
    "/attendance/unmark",
    ({ session, shift, member, user, group }) =>
        receive({ session, shift, member })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._shift({ shift }).is({ context: group }), MayMarkAttendance({ user, group }))
                    .then(AttendanceTracking.unmark({ user: member, event: shift }).responds({}))
                    .then(respond({ shift }))
                    .named("allowed"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }).is({ context: group }), no(MayMarkAttendance({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "shift", "member"] }, validators: { input: idsInput("shift", "member") } },
);

// TAs and staff see every record for the shift; other members see only their own
const ForShift = endpoint(
    "/attendance/shift",
    ({ session, shift, user, group }) =>
        receive({ session, shift })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._shift({ shift }).is({ context: group }), MayViewAllAttendance({ user, group }))
                    .then(respond({ records: ShiftRecords({ shift }) }))
                    .named("everyone"),
                where(
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    IsMember({ user, group }),
                    no(MayViewAllAttendance({ user, group })),
                )
                    .then(respond({ records: OwnShiftRecord({ user, shift }) }))
                    .named("own"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }).is({ context: group }), no(IsMember({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-member"),
            ),
    { input: { required: ["session", "shift"] }, validators: { input: idsInput("shift") } },
);

const Mine = endpoint(
    "/attendance/mine",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(IsMember({ user, group })).then(respond({ records: MyRecords({ user, group }) })).named("member"),
                where(no(IsMember({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-member"),
            ),
    { input: { required: ["session", "group"] }, validators: { input: idsInput("group") } },
);

// TAs and staff only: everyone's attendance across the class
const ForClass = endpoint(
    "/attendance/class",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayViewAllAttendance({ user, group }))
                    .then(respond({ records: ClassRecords({ group }) }))
                    .named("allowed"),
                where(no(MayViewAllAttendance({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-allowed"),
            ),
    { input: { required: ["session", "group"] }, validators: { input: idsInput("group") } },
);

export const composition = { ClassRecords, ForClass, ShiftRecords, OwnShiftRecord, MyRecords, Mark, Unmark, ForShift, Mine };
