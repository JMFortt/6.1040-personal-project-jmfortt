import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { IsMember, MayEditSchedule } from "./Access.ts";
import { capacityInput, createShiftInput, createSlotInput, idsInput, publishInput, renameInput } from "./validators.ts";

const { Sessioning, UserAuthenticating, ShiftScheduling } = concepts;

// Every edit below follows the same shape: find the class the slot/week/shift belongs to,
// then branch on whether the caller may edit that class's schedule. Viewing only needs membership.

// --- formers ---

// the weekly template: each slot with its assignees' usernames
const Template = former(
    "the weekly template of (group)",
    ({ group }, { slot, weekday, startMinute, endMinute, capacity, member, username }) =>
        each(ShiftScheduling._slots({ context: group }).is({ slot, weekday, startMinute, endMinute, capacity })).form({
            slot,
            weekday,
            startMinute,
            endMinute,
            capacity,
            assignees: each(ShiftScheduling._slotAssignees({ slot }).is({ user: member }))
                .where(UserAuthenticating._username({ user: member }).is({ username }))
                .form({ user: member, username }),
        }),
);

// the published weeks, oldest first
const Weeks = former("the published weeks of (group)", ({ group }, { week, name, start }) =>
    each(ShiftScheduling._weeks({ context: group }).is({ week, name, start })).form({ week, name, start }),
);

// one published week: its shifts in time order, each with its assignees' usernames
const WeekView = former(
    "the published week (week)",
    ({ week }, { name, start, shift, shiftStart, end, capacity, member, username }) =>
        where(ShiftScheduling._week({ week }).is({ name, start })).form({
            week,
            name,
            start,
            shifts: each(ShiftScheduling._shiftsInWeek({ week }).is({ shift, start: shiftStart, end, capacity })).form({
                shift,
                start: shiftStart,
                end,
                capacity,
                assignees: each(ShiftScheduling._assignees({ shift }).is({ user: member }))
                    .where(UserAuthenticating._username({ user: member }).is({ username }))
                    .form({ user: member, username }),
            }),
        }),
);

// --- viewing (any member) ---

const ViewTemplate = endpoint(
    "/schedule/template",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(IsMember({ user, group })).then(respond({ template: Template({ group }) })).named("member"),
                where(no(IsMember({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-member"),
            ),
    { input: { required: ["session", "group"] }, validators: { input: idsInput("group") } },
);

const ListWeeks = endpoint(
    "/schedule/weeks",
    ({ session, group, user }) =>
        receive({ session, group })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(IsMember({ user, group })).then(respond({ weeks: Weeks({ group }) })).named("member"),
                where(no(IsMember({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-member"),
            ),
    { input: { required: ["session", "group"] }, validators: { input: idsInput("group") } },
);

const ViewWeek = endpoint(
    "/schedule/week",
    ({ session, week, user, group }) =>
        receive({ session, week })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._week({ week }).is({ context: group }), IsMember({ user, group }))
                    .then(respond({ week: WeekView({ week }) }))
                    .named("member"),
                where(no(ShiftScheduling._week({ week }))).then(respond({ error: "NO_SUCH_WEEK" })).named("no-week"),
                where(ShiftScheduling._week({ week }).is({ context: group }), no(IsMember({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-member"),
            ),
    { input: { required: ["session", "week"] }, validators: { input: idsInput("week") } },
);

// --- editing the template (TA/STAFF) ---

const CreateSlot = endpoint(
    "/schedule/slots/create",
    ({ session, group, weekday, startMinute, endMinute, capacity, user, slot }) =>
        receive({ session, group, weekday, startMinute, endMinute, capacity })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayEditSchedule({ user, group }))
                    .then(
                        ShiftScheduling.createSlot({ context: group, weekday, startMinute, endMinute, capacity }).responds({ slot }),
                    )
                    .then(respond({ slot }))
                    .named("allowed"),
                where(no(MayEditSchedule({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-allowed"),
            ),
    {
        input: { required: ["session", "group", "weekday", "startMinute", "endMinute", "capacity"] },
        validators: { input: createSlotInput },
    },
);

const DeleteSlot = endpoint(
    "/schedule/slots/delete",
    ({ session, slot, user, group }) =>
        receive({ session, slot })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._slot({ slot }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.deleteSlot({ slot }).responds({}))
                    .then(respond({ slot }))
                    .named("allowed"),
                where(no(ShiftScheduling._slot({ slot }))).then(respond({ error: "NO_SUCH_SLOT" })).named("no-slot"),
                where(ShiftScheduling._slot({ slot }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "slot"] }, validators: { input: idsInput("slot") } },
);

// assigning also requires the member to be in the slot's class
const AssignSlot = endpoint(
    "/schedule/slots/assign",
    ({ session, slot, member, user, group }) =>
        receive({ session, slot, member })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(
                    ShiftScheduling._slot({ slot }).is({ context: group }),
                    MayEditSchedule({ user, group }),
                    IsMember({ user: member, group }),
                )
                    .then(ShiftScheduling.assignSlot({ slot, user: member }).responds({}))
                    .then(respond({ slot }))
                    .named("allowed"),
                where(no(ShiftScheduling._slot({ slot }))).then(respond({ error: "NO_SUCH_SLOT" })).named("no-slot"),
                where(ShiftScheduling._slot({ slot }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
                where(
                    ShiftScheduling._slot({ slot }).is({ context: group }),
                    MayEditSchedule({ user, group }),
                    no(IsMember({ user: member, group })),
                )
                    .then(respond({ error: "NOT_IN_CLASS" }))
                    .named("not-in-class"),
            ),
    { input: { required: ["session", "slot", "member"] }, validators: { input: idsInput("slot", "member") } },
);

const UnassignSlot = endpoint(
    "/schedule/slots/unassign",
    ({ session, slot, member, user, group }) =>
        receive({ session, slot, member })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._slot({ slot }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.unassignSlot({ slot, user: member }).responds({}))
                    .then(respond({ slot }))
                    .named("allowed"),
                where(no(ShiftScheduling._slot({ slot }))).then(respond({ error: "NO_SUCH_SLOT" })).named("no-slot"),
                where(ShiftScheduling._slot({ slot }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "slot", "member"] }, validators: { input: idsInput("slot", "member") } },
);

const SetSlotCapacity = endpoint(
    "/schedule/slots/capacity",
    ({ session, slot, capacity, user, group }) =>
        receive({ session, slot, capacity })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._slot({ slot }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.setSlotCapacity({ slot, capacity }).responds({}))
                    .then(respond({ slot }))
                    .named("allowed"),
                where(no(ShiftScheduling._slot({ slot }))).then(respond({ error: "NO_SUCH_SLOT" })).named("no-slot"),
                where(ShiftScheduling._slot({ slot }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "slot", "capacity"] }, validators: { input: capacityInput("slot") } },
);

// --- published weeks (TA/STAFF) ---

const PublishWeek = endpoint(
    "/schedule/weeks/publish",
    ({ session, group, start, name, user, week }) =>
        receive({ session, group, start, name })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.publishWeek({ context: group, start, name }).responds({ week }))
                    .then(respond({ week }))
                    .named("allowed"),
                where(no(MayEditSchedule({ user, group }))).then(respond({ error: "NOT_ALLOWED" })).named("not-allowed"),
            ),
    { input: { required: ["session", "group", "start", "name"] }, validators: { input: publishInput } },
);

const RenameWeek = endpoint(
    "/schedule/weeks/rename",
    ({ session, week, name, user, group }) =>
        receive({ session, week, name })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._week({ week }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.renameWeek({ week, name }).responds({}))
                    .then(respond({ week }))
                    .named("allowed"),
                where(no(ShiftScheduling._week({ week }))).then(respond({ error: "NO_SUCH_WEEK" })).named("no-week"),
                where(ShiftScheduling._week({ week }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "week", "name"] }, validators: { input: renameInput } },
);

const DeleteWeek = endpoint(
    "/schedule/weeks/delete",
    ({ session, week, user, group }) =>
        receive({ session, week })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._week({ week }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.deleteWeek({ week }).responds({}))
                    .then(respond({ week }))
                    .named("allowed"),
                where(no(ShiftScheduling._week({ week }))).then(respond({ error: "NO_SUCH_WEEK" })).named("no-week"),
                where(ShiftScheduling._week({ week }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "week"] }, validators: { input: idsInput("week") } },
);

// --- shifts within a published week (TA/STAFF) ---

const CreateShift = endpoint(
    "/schedule/shifts/create",
    ({ session, week, start, end, capacity, user, group, shift }) =>
        receive({ session, week, start, end, capacity })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._week({ week }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.createShift({ week, start, end, capacity }).responds({ shift }))
                    .then(respond({ shift }))
                    .named("allowed"),
                where(no(ShiftScheduling._week({ week }))).then(respond({ error: "NO_SUCH_WEEK" })).named("no-week"),
                where(ShiftScheduling._week({ week }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "week", "start", "end", "capacity"] }, validators: { input: createShiftInput } },
);

const DeleteShift = endpoint(
    "/schedule/shifts/delete",
    ({ session, shift, user, group }) =>
        receive({ session, shift })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._shift({ shift }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.deleteShift({ shift }).responds({}))
                    .then(respond({ shift }))
                    .named("allowed"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "shift"] }, validators: { input: idsInput("shift") } },
);

// assigning also requires the member to be in the shift's class
const AssignShift = endpoint(
    "/schedule/shifts/assign",
    ({ session, shift, member, user, group }) =>
        receive({ session, shift, member })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayEditSchedule({ user, group }),
                    IsMember({ user: member, group }),
                )
                    .then(ShiftScheduling.assign({ shift, user: member }).responds({}))
                    .then(respond({ shift }))
                    .named("allowed"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
                where(
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayEditSchedule({ user, group }),
                    no(IsMember({ user: member, group })),
                )
                    .then(respond({ error: "NOT_IN_CLASS" }))
                    .named("not-in-class"),
            ),
    { input: { required: ["session", "shift", "member"] }, validators: { input: idsInput("shift", "member") } },
);

const UnassignShift = endpoint(
    "/schedule/shifts/unassign",
    ({ session, shift, member, user, group }) =>
        receive({ session, shift, member })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._shift({ shift }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.unassign({ shift, user: member }).responds({}))
                    .then(respond({ shift }))
                    .named("allowed"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "shift", "member"] }, validators: { input: idsInput("shift", "member") } },
);

const SetShiftCapacity = endpoint(
    "/schedule/shifts/capacity",
    ({ session, shift, capacity, user, group }) =>
        receive({ session, shift, capacity })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._shift({ shift }).is({ context: group }), MayEditSchedule({ user, group }))
                    .then(ShiftScheduling.setShiftCapacity({ shift, capacity }).responds({}))
                    .then(respond({ shift }))
                    .named("allowed"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }).is({ context: group }), no(MayEditSchedule({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "shift", "capacity"] }, validators: { input: capacityInput("shift") } },
);

export const composition = {
    SetSlotCapacity,
    SetShiftCapacity,
    Template,
    Weeks,
    WeekView,
    ViewTemplate,
    ListWeeks,
    ViewWeek,
    CreateSlot,
    DeleteSlot,
    AssignSlot,
    UnassignSlot,
    PublishWeek,
    RenameWeek,
    DeleteWeek,
    CreateShift,
    DeleteShift,
    AssignShift,
    UnassignShift,
};
