import { afterAll, describe, expect, test } from "bun:test";
import { testApi } from "./testApi.ts";

const { post, idle, db, close } = await testApi("test_cleanup_composition");
afterAll(close);

// how many documents in a concept's collection match, to check deleted data is really gone
const count = (collection: string, filter: object) => db.collection(collection).countDocuments(filter);

// registers a user and returns their session and id
async function register(username: string) {
    const { user, session } = await post("/auth/register", { username, password: "hunter2" });
    return { user: user as string, session: session as string };
}

// a class with a STAFF owner, a TA, and an LA; a template slot with the LA on it; a published week
// whose shift has an attendance record and a cover request; and a pending invite
async function fullClass(prefix: string) {
    const owner = await register(`${prefix}-owner`);
    const ta = await register(`${prefix}-ta`);
    const la = await register(`${prefix}-la`);
    await register(`${prefix}-invitee`);
    const { group } = await post("/classes/create", { session: owner.session, name: `${prefix} class` });
    for (const [person, username, role] of [[ta, `${prefix}-ta`, "TA"], [la, `${prefix}-la`, "LA"]] as const) {
        const { invite } = await post("/classes/invite", { session: owner.session, group, username, role });
        await post("/invites/accept", { session: person.session, invite });
    }
    await post("/classes/invite", { session: owner.session, group, username: `${prefix}-invitee`, role: "LA" });

    const { slot } = await post("/schedule/slots/create", {
        session: ta.session,
        group,
        weekday: "MONDAY",
        startMinute: 900,
        endMinute: 1020,
        capacity: 2,
    });
    await post("/schedule/slots/assign", { session: ta.session, slot, member: la.user });
    const { week } = await post("/schedule/weeks/publish", {
        session: ta.session,
        group,
        start: "2026-10-19T00:00:00.000Z",
        name: "Week",
    });
    const shift = (await post("/schedule/week", { session: ta.session, week })).week.shifts[0].shift as string;
    await post("/attendance/mark", { session: ta.session, shift, member: la.user, status: "PRESENT" });
    await post("/covers/request", { session: la.session, shift });

    return { group: group as string, week: week as string, slot: slot as string, shift, owner, ta, la };
}

describe("Cleanup", () => {
    test("deleting a shift clears its attendance records and cover requests", async () => {
        const { shift, ta } = await fullClass("shift");
        expect(await count("attendanceTracking.records", { event: shift })).toBe(1);
        expect(await count("shiftTrading.requests", { shift })).toBe(1);

        await post("/schedule/shifts/delete", { session: ta.session, shift });
        await idle();
        expect(await count("attendanceTracking.records", { event: shift })).toBe(0);
        expect(await count("shiftTrading.requests", { shift })).toBe(0);
    });

    test("deleting a week deletes its shifts, and with them their records and requests", async () => {
        const { group, week, shift, ta } = await fullClass("week");

        await post("/schedule/weeks/delete", { session: ta.session, week });
        await idle();
        expect(await count("shiftScheduling.shifts", { week })).toBe(0);
        expect(await count("attendanceTracking.records", { event: shift })).toBe(0);
        expect(await count("shiftTrading.requests", { shift })).toBe(0);
        // the template is untouched
        expect((await post("/schedule/template", { session: ta.session, group })).template).toHaveLength(1);
    });

    test("the owner deleting a class removes everything in it", async () => {
        const { group, week, slot, shift, owner, la } = await fullClass("class");

        expect(await post("/classes/delete", { session: owner.session, group })).toEqual({ group });
        await idle();

        expect(await post("/classes/mine", { session: owner.session })).toEqual({ classes: [] });
        expect(await post("/classes/mine", { session: la.session })).toEqual({ classes: [] });
        expect(await count("roleBasedAccessing.groups", { _id: group })).toBe(0);
        expect(await count("roleBasedAccessing.memberships", { group })).toBe(0);
        expect(await count("roleBasedAccessing.invites", { group })).toBe(0);
        expect(await count("shiftScheduling.slots", { _id: slot })).toBe(0);
        expect(await count("shiftScheduling.weeks", { _id: week })).toBe(0);
        expect(await count("shiftScheduling.shifts", { context: group })).toBe(0);
        expect(await count("attendanceTracking.records", { event: shift })).toBe(0);
        expect(await count("shiftTrading.requests", { shift })).toBe(0);
    });

    test("only the owner can delete a class, not even other staff", async () => {
        const { group, owner, ta } = await fullClass("guard");
        const staff = await register("guard-staff");
        const { invite } = await post("/classes/invite", { session: owner.session, group, username: "guard-staff", role: "STAFF" });
        await post("/invites/accept", { session: staff.session, invite });

        expect(await post("/classes/delete", { session: staff.session, group })).toEqual({ error: "FORBIDDEN" });
        expect(await post("/classes/delete", { session: ta.session, group })).toEqual({ error: "FORBIDDEN" });
        expect(await post("/classes/delete", { session: owner.session, group: "made-up" })).toEqual({ error: "FORBIDDEN" });
        expect(await count("roleBasedAccessing.groups", { _id: group })).toBe(1);
    });
});
