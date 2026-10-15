import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import {
    AlreadyAssigned,
    InvalidCapacity,
    InvalidTimes,
    NotAssigned,
    ShiftFull,
    ShiftNotFound,
    ShiftSchedulingConcept,
    SlotNotFound,
    WeekAlreadyPublished,
    WeekNotFound,
} from "../../src/concepts/ShiftScheduling.ts";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db("test_shiftScheduling");
let scheduling: ShiftSchedulingConcept;

beforeEach(async () => {
    await db.dropDatabase();
    scheduling = new ShiftSchedulingConcept(db);
});

afterAll(async () => {
    await db.dropDatabase();
    await client.close();
});

// a Monday at midnight (UTC, so the expected times below are easy to read)
const WEEK = "2026-10-19T00:00:00.000Z";
const NEXT_WEEK = "2026-10-26T00:00:00.000Z";
const THREE_PM = 15 * 60;
const FIVE_PM = 17 * 60;

// publishes WEEK from the template and returns the id of its only shift
async function onlyShiftOfPublishedWeek() {
    const { week } = await scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" });
    const [first] = await scheduling._shiftsInWeek({ week });
    return first!.shift;
}

// a Monday 3-5pm slot in class "6.123"
async function mondaySlot(capacity = 2) {
    const { slot } = await scheduling.createSlot({
        context: "6.123",
        weekday: "MONDAY",
        startMinute: THREE_PM,
        endMinute: FIVE_PM,
        capacity,
    });
    return slot;
}

describe("ShiftScheduling", () => {
    test("its principle: a published week copies the template, and afterwards each changes independently", async () => {
        const slot = await mondaySlot();
        await scheduling.assignSlot({ slot, user: "ari" });

        const { week } = await scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week 7" });
        const [shift] = await scheduling._shiftsInWeek({ week });
        expect(shift).toEqual({
            shift: expect.any(String),
            start: "2026-10-19T15:00:00.000Z",
            end: "2026-10-19T17:00:00.000Z",
            capacity: 2,
        });
        expect(await scheduling._assignees({ shift: shift!.shift })).toEqual([{ user: "ari" }]);

        // a template edit after publishing doesn't touch the published week
        await scheduling.assignSlot({ slot, user: "bea" });
        expect(await scheduling._assignees({ shift: shift!.shift })).toEqual([{ user: "ari" }]);

        // a change in the week (like a cover) doesn't touch the template
        await scheduling.reassign({ shift: shift!.shift, from: "ari", to: "cal" });
        expect(await scheduling._assignees({ shift: shift!.shift })).toEqual([{ user: "cal" }]);
        expect(await scheduling._slotAssignees({ slot })).toEqual([{ user: "ari" }, { user: "bea" }]);

        // the next week published picks up the template as it is now
        const { week: next } = await scheduling.publishWeek({ context: "6.123", start: NEXT_WEEK, name: "Week 8" });
        const [nextShift] = await scheduling._shiftsInWeek({ week: next });
        expect(await scheduling._assignees({ shift: nextShift!.shift })).toEqual([{ user: "ari" }, { user: "bea" }]);
    });

    test("publishing places each slot on its weekday and time, and only copies that class's slots", async () => {
        await scheduling.createSlot({ context: "6.123", weekday: "WEDNESDAY", startMinute: 600, endMinute: 660, capacity: 1 });
        await scheduling.createSlot({ context: "6.123", weekday: "SUNDAY", startMinute: 0, endMinute: 1440, capacity: 1 });
        await scheduling.createSlot({ context: "other", weekday: "MONDAY", startMinute: 600, endMinute: 660, capacity: 1 });

        const { week } = await scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" });
        const shifts = await scheduling._shiftsInWeek({ week });
        expect(shifts.map(({ start, end }) => ({ start, end }))).toEqual([
            { start: "2026-10-21T10:00:00.000Z", end: "2026-10-21T11:00:00.000Z" },
            { start: "2026-10-25T00:00:00.000Z", end: "2026-10-26T00:00:00.000Z" },
        ]);
        expect(await scheduling._shift({ shift: shifts[0]!.shift })).toEqual([
            {
                week,
                context: "6.123",
                start: "2026-10-21T10:00:00.000Z",
                end: "2026-10-21T11:00:00.000Z",
                capacity: 1,
            },
        ]);
    });

    test("_slots lists a class's template ordered by weekday then start", async () => {
        const { slot: wed } = await scheduling.createSlot({ context: "6.123", weekday: "WEDNESDAY", startMinute: 600, endMinute: 660, capacity: 1 });
        const late = await mondaySlot();
        const { slot: early } = await scheduling.createSlot({ context: "6.123", weekday: "MONDAY", startMinute: 540, endMinute: 600, capacity: 3 });

        expect(await scheduling._slots({ context: "6.123" })).toEqual([
            { slot: early, weekday: "MONDAY", startMinute: 540, endMinute: 600, capacity: 3 },
            { slot: late, weekday: "MONDAY", startMinute: THREE_PM, endMinute: FIVE_PM, capacity: 2 },
            { slot: wed, weekday: "WEDNESDAY", startMinute: 600, endMinute: 660, capacity: 1 },
        ]);
    });

    test("a slot must fit in one day, start before it ends, and have capacity of at least 1", async () => {
        const bad = (startMinute: number, endMinute: number, capacity = 1) =>
            scheduling.createSlot({ context: "6.123", weekday: "MONDAY", startMinute, endMinute, capacity });
        await expect(bad(FIVE_PM, THREE_PM)).rejects.toThrow(InvalidTimes);
        await expect(bad(THREE_PM, THREE_PM)).rejects.toThrow(InvalidTimes);
        await expect(bad(-10, THREE_PM)).rejects.toThrow(InvalidTimes);
        await expect(bad(THREE_PM, 1500)).rejects.toThrow("The shift must start before it ends.");
        await expect(bad(THREE_PM, FIVE_PM, 0)).rejects.toThrow(InvalidCapacity);
        expect(await scheduling._slots({ context: "6.123" })).toEqual([]);
    });

    test("slot assignments are refused for a missing slot, someone already on it, or a full slot", async () => {
        await expect(scheduling.assignSlot({ slot: "nope", user: "ari" })).rejects.toThrow(SlotNotFound);
        const slot = await mondaySlot(1);
        await scheduling.assignSlot({ slot, user: "ari" });
        await expect(scheduling.assignSlot({ slot, user: "ari" })).rejects.toThrow(AlreadyAssigned);
        await expect(scheduling.assignSlot({ slot, user: "bea" })).rejects.toThrow(ShiftFull);

        await scheduling.unassignSlot({ slot, user: "ari" });
        expect(await scheduling._slotAssignees({ slot })).toEqual([]);
        await expect(scheduling.unassignSlot({ slot, user: "ari" })).rejects.toThrow(NotAssigned);
        await expect(scheduling.unassignSlot({ slot: "nope", user: "ari" })).rejects.toThrow(SlotNotFound);
    });

    test("deleting a slot removes it from the template", async () => {
        const slot = await mondaySlot();
        expect(await scheduling._slot({ slot })).toEqual([
            { context: "6.123", weekday: "MONDAY", startMinute: THREE_PM, endMinute: FIVE_PM, capacity: 2 },
        ]);
        await scheduling.deleteSlot({ slot });
        expect(await scheduling._slot({ slot })).toEqual([]);
        expect(await scheduling._slots({ context: "6.123" })).toEqual([]);
        await expect(scheduling.deleteSlot({ slot })).rejects.toThrow(SlotNotFound);
    });

    test("a week can only be published once per class, and can be renamed and listed", async () => {
        const { week } = await scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" });
        await expect(scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Again" })).rejects.toThrow(WeekAlreadyPublished);
        // another class can publish the same dates
        await scheduling.publishWeek({ context: "other", start: WEEK, name: "Week" });

        await scheduling.renameWeek({ week, name: "Midterm week" });
        expect(await scheduling._week({ week })).toEqual([{ context: "6.123", name: "Midterm week", start: WEEK }]);
        expect(await scheduling._weeks({ context: "6.123" })).toEqual([{ week, name: "Midterm week", start: WEEK }]);
        await expect(scheduling.renameWeek({ week: "nope", name: "x" })).rejects.toThrow(WeekNotFound);
    });

    test("simultaneous publishes of the same week only create it once", async () => {
        const results = await Promise.allSettled([
            scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" }),
            scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" }),
        ]);
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        expect(await scheduling._weeks({ context: "6.123" })).toHaveLength(1);
    });

    test("deleting a week removes it and its shifts", async () => {
        await mondaySlot();
        const { week } = await scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" });
        const [shift] = await scheduling._shiftsInWeek({ week });

        await scheduling.deleteWeek({ week });
        expect(await scheduling._weeks({ context: "6.123" })).toEqual([]);
        expect(await scheduling._shift({ shift: shift!.shift })).toEqual([]);
        await expect(scheduling.deleteWeek({ week })).rejects.toThrow(WeekNotFound);
    });

    test("shifts can be added to and deleted from a published week", async () => {
        await expect(
            scheduling.createShift({ week: "nope", start: "2026-10-20T15:00:00.000Z", end: "2026-10-20T17:00:00.000Z", capacity: 1 }),
        ).rejects.toThrow(WeekNotFound);

        const { week } = await scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" });
        const { shift } = await scheduling.createShift({
            week,
            start: "2026-10-20T15:00:00.000Z",
            end: "2026-10-20T17:00:00.000Z",
            capacity: 1,
        });
        expect(await scheduling._shift({ shift })).toEqual([
            { week, context: "6.123", start: "2026-10-20T15:00:00.000Z", end: "2026-10-20T17:00:00.000Z", capacity: 1 },
        ]);
        await expect(
            scheduling.createShift({ week, start: "2026-10-20T17:00:00.000Z", end: "2026-10-20T15:00:00.000Z", capacity: 1 }),
        ).rejects.toThrow(InvalidTimes);
        await expect(
            scheduling.createShift({ week, start: "2026-10-20T15:00:00.000Z", end: "2026-10-20T17:00:00.000Z", capacity: 0 }),
        ).rejects.toThrow(InvalidCapacity);

        await scheduling.deleteShift({ shift });
        expect(await scheduling._shiftsInWeek({ week })).toEqual([]);
        await expect(scheduling.deleteShift({ shift })).rejects.toThrow(ShiftNotFound);
    });

    test("shift assignments are refused for a missing shift, someone already on it, or a full shift", async () => {
        await expect(scheduling.assign({ shift: "nope", user: "ari" })).rejects.toThrow(ShiftNotFound);
        await mondaySlot(1);
        const shift = await onlyShiftOfPublishedWeek();

        await scheduling.assign({ shift, user: "ari" });
        await expect(scheduling.assign({ shift, user: "ari" })).rejects.toThrow(AlreadyAssigned);
        await expect(scheduling.assign({ shift, user: "bea" })).rejects.toThrow(ShiftFull);

        await scheduling.unassign({ shift, user: "ari" });
        await expect(scheduling.unassign({ shift, user: "ari" })).rejects.toThrow(NotAssigned);
    });

    test("simultaneous assigns can't overfill a shift", async () => {
        await mondaySlot(1);
        const shift = await onlyShiftOfPublishedWeek();

        const results = await Promise.allSettled([
            scheduling.assign({ shift, user: "ari" }),
            scheduling.assign({ shift, user: "bea" }),
        ]);
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        expect(await scheduling._assignees({ shift })).toHaveLength(1);
    });

    test("removing someone from a schedule takes them off the template and later shifts, but not earlier ones", async () => {
        const slot = await mondaySlot(2);
        await scheduling.assignSlot({ slot, user: "ari" });
        await scheduling.assignSlot({ slot, user: "bea" });
        const { week } = await scheduling.publishWeek({ context: "6.123", start: WEEK, name: "Week" });
        const { week: next } = await scheduling.publishWeek({ context: "6.123", start: NEXT_WEEK, name: "Week" });
        const [past] = await scheduling._shiftsInWeek({ week });
        const [future] = await scheduling._shiftsInWeek({ week: next });
        // another class's schedule isn't touched
        const { slot: other } = await scheduling.createSlot({ context: "other", weekday: "MONDAY", startMinute: 0, endMinute: 60, capacity: 1 });
        await scheduling.assignSlot({ slot: other, user: "ari" });

        // "now" is between the two weeks
        await scheduling.removeFromSchedule({ context: "6.123", user: "ari", from: "2026-10-22T00:00:00.000Z" });

        expect(await scheduling._slotAssignees({ slot })).toEqual([{ user: "bea" }]);
        expect(await scheduling._assignees({ shift: future!.shift })).toEqual([{ user: "bea" }]);
        expect(await scheduling._assignees({ shift: past!.shift })).toEqual([{ user: "ari" }, { user: "bea" }]);
        expect(await scheduling._slotAssignees({ slot: other })).toEqual([{ user: "ari" }]);
    });

    test("reassigning is refused for a missing shift, if from isn't on it, or if to already is", async () => {
        await expect(scheduling.reassign({ shift: "nope", from: "ari", to: "bea" })).rejects.toThrow(ShiftNotFound);
        await mondaySlot(2);
        const shift = await onlyShiftOfPublishedWeek();

        await expect(scheduling.reassign({ shift, from: "ari", to: "bea" })).rejects.toThrow(NotAssigned);
        await scheduling.assign({ shift, user: "ari" });
        await scheduling.assign({ shift, user: "bea" });
        await expect(scheduling.reassign({ shift, from: "ari", to: "bea" })).rejects.toThrow(AlreadyAssigned);
    });
});
