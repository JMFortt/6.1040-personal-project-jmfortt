import { afterAll, describe, expect, test } from "bun:test";
import { testApi } from "./testApi.ts";

const { post, close } = await testApi("test_attendance_composition");
afterAll(close);

const WEEK = "2026-10-19T00:00:00.000Z";

// registers a user and returns their session and id
async function register(username: string) {
    const { user, session } = await post("/auth/register", { username, password: "hunter2" });
    return { user: user as string, session: session as string };
}

// a class with a TA and two LAs, a published week, and one Monday 3-5pm shift with the first LA on it
async function classWithShift(prefix: string) {
    const owner = await register(`${prefix}-owner`);
    const ta = await register(`${prefix}-ta`);
    const la = await register(`${prefix}-la`);
    const la2 = await register(`${prefix}-la2`);
    const { group } = await post("/classes/create", { session: owner.session, name: `${prefix} class` });
    for (const [person, username, role] of [
        [ta, `${prefix}-ta`, "TA"],
        [la, `${prefix}-la`, "LA"],
        [la2, `${prefix}-la2`, "LA"],
    ] as const) {
        const { invite } = await post("/classes/invite", { session: owner.session, group, username, role });
        await post("/invites/accept", { session: person.session, invite });
    }
    const { slot } = await post("/schedule/slots/create", {
        session: ta.session,
        group,
        weekday: "MONDAY",
        startMinute: 900,
        endMinute: 1020,
        capacity: 2,
    });
    await post("/schedule/slots/assign", { session: ta.session, slot, member: la.user });
    const { week } = await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" });
    const shift = (await post("/schedule/week", { session: ta.session, week })).week.shifts[0].shift as string;
    return { group: group as string, shift, ta, la, la2 };
}

describe("Attendance", () => {
    test("a TA marks an LA present, and the LA sees it in their own attendance", async () => {
        const { group, shift, ta, la } = await classWithShift("journey");

        // before marking, the LA sees the shift as not marked yet
        expect(await post("/attendance/mine", { session: la.session, group })).toEqual({
            records: [{ shift, start: "2026-10-19T15:00:00.000Z", end: "2026-10-19T17:00:00.000Z", status: null }],
        });

        expect(await post("/attendance/mark", { session: ta.session, shift, member: la.user, status: "PRESENT" })).toEqual({ shift });
        expect(await post("/attendance/shift", { session: ta.session, shift })).toEqual({
            records: [{ user: la.user, username: "journey-la", status: "PRESENT" }],
        });
        expect(await post("/attendance/mine", { session: la.session, group })).toEqual({
            records: [{ shift, start: "2026-10-19T15:00:00.000Z", end: "2026-10-19T17:00:00.000Z", status: "PRESENT" }],
        });
    });

    test("a mark can be changed and cleared", async () => {
        const { group, shift, ta, la } = await classWithShift("change");
        await post("/attendance/mark", { session: ta.session, shift, member: la.user, status: "PRESENT" });
        await post("/attendance/mark", { session: ta.session, shift, member: la.user, status: "LATE" });
        expect((await post("/attendance/mine", { session: la.session, group })).records[0].status).toBe("LATE");
        await post("/attendance/mark", { session: ta.session, shift, member: la.user, status: "EXCUSED" });
        expect((await post("/attendance/mine", { session: la.session, group })).records[0].status).toBe("EXCUSED");

        expect(await post("/attendance/unmark", { session: ta.session, shift, member: la.user })).toEqual({ shift });
        expect((await post("/attendance/mine", { session: la.session, group })).records[0].status).toBeNull();
        expect(await post("/attendance/unmark", { session: ta.session, shift, member: la.user })).toEqual({ error: "NOT_FOUND" });
    });

    test("LAs only see their own records, and can't mark", async () => {
        const { shift, ta, la, la2 } = await classWithShift("perm");
        await post("/attendance/mark", { session: ta.session, shift, member: la.user, status: "ABSENT" });

        expect(await post("/attendance/shift", { session: la.session, shift })).toEqual({
            records: [{ user: la.user, username: "perm-la", status: "ABSENT" }],
        });
        expect(await post("/attendance/shift", { session: la2.session, shift })).toEqual({ records: [] });

        expect(await post("/attendance/mark", { session: la.session, shift, member: la.user, status: "PRESENT" })).toEqual({
            error: "FORBIDDEN",
        });
        expect(await post("/attendance/unmark", { session: la.session, shift, member: la.user })).toEqual({ error: "FORBIDDEN" });

        const outsider = await register("perm-outsider");
        expect(await post("/attendance/shift", { session: outsider.session, shift })).toEqual({ error: "FORBIDDEN" });
    });

    test("bad marks are refused with informative errors", async () => {
        const { shift, ta, la, la2 } = await classWithShift("bad");
        expect(await post("/attendance/mark", { session: ta.session, shift, member: la2.user, status: "PRESENT" })).toEqual({
            error: "INVALID_REQUEST",
        });
        expect(await post("/attendance/mark", { session: ta.session, shift, member: la.user, status: "SLEEPING" })).toEqual({
            error: "INVALID_REQUEST",
        });
        expect(await post("/attendance/mark", { session: ta.session, shift: "made-up", member: la.user, status: "PRESENT" })).toEqual({
            error: "NOT_FOUND",
        });
    });
});
