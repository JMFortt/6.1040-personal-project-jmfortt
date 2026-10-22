import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { AttendanceTrackingConcept, NoRecord } from "../../src/concepts/AttendanceTracking.ts";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db("test_attendanceTracking");
let attendance: AttendanceTrackingConcept;

beforeEach(async () => {
    await db.dropDatabase();
    attendance = new AttendanceTrackingConcept(db);
});

afterAll(async () => {
    await db.dropDatabase();
    await client.close();
});

describe("AttendanceTracking", () => {
    test("its principle: a marked attendee sees their record, and an unmarked one sees none", async () => {
        await attendance.mark({ user: "ari", event: "monday", status: "PRESENT" });
        expect(await attendance._record({ user: "ari", event: "monday" })).toEqual([{ status: "PRESENT" }]);
        expect(await attendance._record({ user: "bea", event: "monday" })).toEqual([]);
    });

    test("marking again changes the status instead of adding a second record", async () => {
        await attendance.mark({ user: "ari", event: "monday", status: "PRESENT" });
        await attendance.mark({ user: "ari", event: "monday", status: "LATE" });
        expect(await attendance._recordsForUser({ user: "ari" })).toEqual([{ event: "monday", status: "LATE" }]);
    });

    test("simultaneous marks still leave one record", async () => {
        await Promise.allSettled([
            attendance.mark({ user: "ari", event: "monday", status: "PRESENT" }),
            attendance.mark({ user: "ari", event: "monday", status: "ABSENT" }),
        ]);
        expect(await attendance._recordsForUser({ user: "ari" })).toHaveLength(1);
    });

    test("unmarking clears a record, and is refused if there is none", async () => {
        await attendance.mark({ user: "ari", event: "monday", status: "ABSENT" });
        await attendance.unmark({ user: "ari", event: "monday" });
        expect(await attendance._record({ user: "ari", event: "monday" })).toEqual([]);
        await expect(attendance.unmark({ user: "ari", event: "monday" })).rejects.toThrow(NoRecord);
        await expect(attendance.unmark({ user: "bea", event: "monday" })).rejects.toThrow(
            "There is no attendance record to clear.",
        );
    });

    test("clearing an event removes all of its records and nothing else", async () => {
        await attendance.mark({ user: "ari", event: "monday", status: "PRESENT" });
        await attendance.mark({ user: "bea", event: "monday", status: "LATE" });
        await attendance.mark({ user: "ari", event: "tuesday", status: "ABSENT" });

        await attendance.clearEvent({ event: "monday" });
        expect(await attendance._recordsForEvent({ event: "monday" })).toEqual([]);
        expect(await attendance._recordsForUser({ user: "ari" })).toEqual([{ event: "tuesday", status: "ABSENT" }]);
        // clearing an event with no records is fine
        await attendance.clearEvent({ event: "monday" });
    });

    test("records can be listed per user and per event", async () => {
        await attendance.mark({ user: "bea", event: "monday", status: "PRESENT" });
        await attendance.mark({ user: "ari", event: "monday", status: "LATE" });
        await attendance.mark({ user: "ari", event: "tuesday", status: "ABSENT" });

        expect(await attendance._recordsForEvent({ event: "monday" })).toEqual([
            { user: "ari", status: "LATE" },
            { user: "bea", status: "PRESENT" },
        ]);
        expect(await attendance._recordsForUser({ user: "ari" })).toEqual([
            { event: "monday", status: "LATE" },
            { event: "tuesday", status: "ABSENT" },
        ]);
        expect(await attendance._recordsForEvent({ event: "wednesday" })).toEqual([]);
    });
});
