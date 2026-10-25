import { afterAll, describe, expect, test } from "bun:test";
import { testApi } from "./testApi.ts";

const { post, close } = await testApi("test_schedule_composition");
afterAll(close);

// a Monday at midnight UTC, and a Monday 3-5pm slot
const WEEK = "2026-10-19T00:00:00.000Z";
const SLOT = { weekday: "MONDAY", startMinute: 15 * 60, endMinute: 17 * 60, capacity: 2 };

// registers a user and returns their session and id
async function register(username: string) {
    const { user, session } = await post("/auth/register", { username, password: "hunter2" });
    return { user: user as string, session: session as string };
}

// a class with a STAFF owner, a TA, and an LA (usernames prefixed so tests don't collide)
async function staffedClass(prefix: string) {
    const owner = await register(`${prefix}-owner`);
    const ta = await register(`${prefix}-ta`);
    const la = await register(`${prefix}-la`);
    const { group } = await post("/classes/create", { session: owner.session, name: `${prefix} class` });
    for (const [person, username, role] of [[ta, `${prefix}-ta`, "TA"], [la, `${prefix}-la`, "LA"]] as const) {
        const { invite } = await post("/classes/invite", { session: owner.session, group, username, role });
        await post("/invites/accept", { session: person.session, invite });
    }
    return { group: group as string, owner, ta, la };
}

describe("Schedule", () => {
    test("a TA builds the template and publishes a week, and every member sees both", async () => {
        const { group, owner, ta, la } = await staffedClass("journey");

        const { slot } = await post("/schedule/slots/create", { session: ta.session, group, ...SLOT });
        expect(await post("/schedule/slots/assign", { session: ta.session, slot, member: la.user })).toEqual({ slot });

        const template = {
            template: [{ slot, ...SLOT, assignees: [{ user: la.user, username: "journey-la" }] }],
        };
        for (const person of [owner, ta, la]) {
            expect(await post("/schedule/template", { session: person.session, group })).toEqual(template);
        }

        const { week } = await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" });
        expect(await post("/schedule/weeks", { session: la.session, group })).toEqual({
            weeks: [{ week, name: "Week", start: WEEK }],
        });
        expect(await post("/schedule/week", { session: la.session, week })).toEqual({
            week: {
                week,
                name: "Week",
                start: WEEK,
                shifts: [
                    {
                        shift: expect.any(String),
                        start: "2026-10-19T15:00:00.000Z",
                        end: "2026-10-19T17:00:00.000Z",
                        capacity: 2,
                        assignees: [{ user: la.user, username: "journey-la" }],
                    },
                ],
            },
        });
    });

    test("a published week can be edited without touching the template, renamed, and deleted", async () => {
        const { group, ta, la } = await staffedClass("edit");
        const { slot } = await post("/schedule/slots/create", { session: ta.session, group, ...SLOT });
        await post("/schedule/slots/assign", { session: ta.session, slot, member: la.user });
        const { week } = await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" });
        const shiftOf = async () => (await post("/schedule/week", { session: ta.session, week })).week.shifts;
        const [copied] = await shiftOf();

        // unassign in the week; the template keeps the LA
        await post("/schedule/shifts/unassign", { session: ta.session, shift: copied.shift, member: la.user });
        expect((await shiftOf())[0].assignees).toEqual([]);
        expect((await post("/schedule/template", { session: ta.session, group })).template[0].assignees).toHaveLength(1);

        // add and remove an extra shift in just this week
        const { shift: extra } = await post("/schedule/shifts/create", {
            session: ta.session,
            week,
            start: "2026-10-20T15:00:00.000Z",
            end: "2026-10-20T16:00:00.000Z",
            capacity: 1,
        });
        expect(await post("/schedule/shifts/assign", { session: ta.session, shift: extra, member: ta.user })).toEqual({ shift: extra });
        expect(await shiftOf()).toHaveLength(2);
        await post("/schedule/shifts/delete", { session: ta.session, shift: extra });
        expect(await shiftOf()).toHaveLength(1);

        await post("/schedule/weeks/rename", { session: ta.session, week, name: "Midterm week" });
        expect((await post("/schedule/weeks", { session: ta.session, group })).weeks[0].name).toBe("Midterm week");

        expect(await post("/schedule/weeks/delete", { session: ta.session, week })).toEqual({ week });
        expect(await post("/schedule/weeks", { session: ta.session, group })).toEqual({ weeks: [] });
        expect(await post("/schedule/week", { session: ta.session, week })).toEqual({ error: "NOT_FOUND" });
    });

    test("only TAs and staff can edit, and only members can view", async () => {
        const { group, ta, la } = await staffedClass("perm");
        const { slot } = await post("/schedule/slots/create", { session: ta.session, group, ...SLOT });
        const { week } = await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" });
        const FORBIDDEN = { error: "FORBIDDEN" };

        expect(await post("/schedule/slots/create", { session: la.session, group, ...SLOT })).toEqual(FORBIDDEN);
        expect(await post("/schedule/slots/assign", { session: la.session, slot, member: la.user })).toEqual(FORBIDDEN);
        expect(await post("/schedule/slots/delete", { session: la.session, slot })).toEqual(FORBIDDEN);
        expect(await post("/schedule/weeks/publish", { session: la.session, group, start: WEEK, name: "x" })).toEqual(FORBIDDEN);
        expect(await post("/schedule/weeks/rename", { session: la.session, week, name: "x" })).toEqual(FORBIDDEN);
        expect(await post("/schedule/weeks/delete", { session: la.session, week })).toEqual(FORBIDDEN);

        const outsider = await register("perm-outsider");
        expect(await post("/schedule/template", { session: outsider.session, group })).toEqual(FORBIDDEN);
        expect(await post("/schedule/weeks", { session: outsider.session, group })).toEqual(FORBIDDEN);
        expect(await post("/schedule/week", { session: outsider.session, week })).toEqual(FORBIDDEN);
    });

    test("TAs can change slot and shift capacities, within limits; LAs can't", async () => {
        const { group, ta, la } = await staffedClass("capacity");
        const { slot } = await post("/schedule/slots/create", { session: ta.session, group, ...SLOT });
        await post("/schedule/slots/assign", { session: ta.session, slot, member: la.user });

        expect(await post("/schedule/slots/capacity", { session: ta.session, slot, capacity: 3 })).toEqual({ slot });
        expect((await post("/schedule/template", { session: ta.session, group })).template[0].capacity).toBe(3);

        const { week } = await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" });
        const shift = (await post("/schedule/week", { session: ta.session, week })).week.shifts[0].shift;
        expect(await post("/schedule/shifts/capacity", { session: ta.session, shift, capacity: 1 })).toEqual({ shift });

        expect(await post("/schedule/shifts/capacity", { session: la.session, shift, capacity: 5 })).toEqual({ error: "FORBIDDEN" });
        expect(await post("/schedule/slots/capacity", { session: la.session, slot, capacity: 5 })).toEqual({ error: "FORBIDDEN" });
        // below 1, or not a whole number, is refused
        expect(await post("/schedule/shifts/capacity", { session: ta.session, shift, capacity: 0 })).toEqual({
            error: "INVALID_REQUEST",
        });
        expect(await post("/schedule/shifts/capacity", { session: ta.session, shift, capacity: 1.5 })).toEqual({
            error: "INVALID_REQUEST",
        });
        expect(await post("/schedule/shifts/capacity", { session: ta.session, shift: "made-up", capacity: 2 })).toEqual({
            error: "NOT_FOUND",
        });
    });

    test("a capacity below the number of people already on the shift is refused", async () => {
        const { group, ta, la } = await staffedClass("below");
        const { slot } = await post("/schedule/slots/create", { session: ta.session, group, ...SLOT });
        await post("/schedule/slots/assign", { session: ta.session, slot, member: la.user });
        await post("/schedule/slots/assign", { session: ta.session, slot, member: ta.user });

        expect(await post("/schedule/slots/capacity", { session: ta.session, slot, capacity: 1 })).toEqual({ error: "CONFLICT" });
        expect((await post("/schedule/template", { session: ta.session, group })).template[0].capacity).toBe(2);
    });

    test("bad edits are refused with informative errors", async () => {
        const { group, ta, la } = await staffedClass("bad");
        const INVALID = { error: "INVALID_REQUEST" };

        // bad slots
        expect(await post("/schedule/slots/create", { session: ta.session, group, ...SLOT, weekday: "FUNDAY" })).toEqual(INVALID);
        expect(await post("/schedule/slots/create", { session: ta.session, group, ...SLOT, startMinute: 1000, endMinute: 900 })).toEqual(INVALID);
        expect(await post("/schedule/slots/create", { session: ta.session, group, ...SLOT, capacity: 0 })).toEqual(INVALID);

        // assigning someone outside the class
        const { slot } = await post("/schedule/slots/create", { session: ta.session, group, ...SLOT });
        const outsider = await register("bad-outsider");
        expect(await post("/schedule/slots/assign", { session: ta.session, slot, member: outsider.user })).toEqual(INVALID);

        // publishing twice, or with a blank name
        await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" });
        expect(await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" })).toEqual({
            error: "CONFLICT",
        });
        expect(await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: " " })).toEqual(INVALID);

        // things that don't exist
        expect(await post("/schedule/slots/assign", { session: ta.session, slot: "made-up", member: la.user })).toEqual({
            error: "NOT_FOUND",
        });
        expect(await post("/schedule/weeks/rename", { session: ta.session, week: "made-up", name: "x" })).toEqual({
            error: "NOT_FOUND",
        });
        expect(await post("/schedule/shifts/assign", { session: ta.session, shift: "made-up", member: la.user })).toEqual({
            error: "NOT_FOUND",
        });
    });
});
