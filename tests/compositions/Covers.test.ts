import { afterAll, describe, expect, test } from "bun:test";
import { testApi } from "./testApi.ts";

const { post, close } = await testApi("test_covers_composition");
afterAll(close);

const WEEK = "2026-10-19T00:00:00.000Z";

// registers a user and returns their session and id
async function register(username: string) {
    const { user, session } = await post("/auth/register", { username, password: "hunter2" });
    return { user: user as string, session: session as string };
}

// a class with a TA and two LAs, a published week, and one Monday 3-5pm shift with LA 1 on it
async function classWithShift(prefix: string) {
    const owner = await register(`${prefix}-owner`);
    const ta = await register(`${prefix}-ta`);
    const la1 = await register(`${prefix}-la1`);
    const la2 = await register(`${prefix}-la2`);
    const { group } = await post("/classes/create", { session: owner.session, name: `${prefix} class` });
    for (const [person, username, role] of [
        [ta, `${prefix}-ta`, "TA"],
        [la1, `${prefix}-la1`, "LA"],
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
    await post("/schedule/slots/assign", { session: ta.session, slot, member: la1.user });
    const { week } = await post("/schedule/weeks/publish", { session: ta.session, group, start: WEEK, name: "Week" });
    const shift = (await post("/schedule/week", { session: ta.session, week })).week.shifts[0].shift as string;
    return { group: group as string, week: week as string, slot: slot as string, shift, ta, la1, la2 };
}

describe("Covers", () => {
    test("LA 1 requests a cover, LA 2 claims it, the TA approves, and the schedule shows LA 2", async () => {
        const { group, week, shift, ta, la1, la2 } = await classWithShift("journey");

        const { request } = await post("/covers/request", { session: la1.session, shift });
        expect(await post("/covers/claim", { session: la2.session, request })).toEqual({ request });
        expect(await post("/covers/approve", { session: ta.session, request })).toEqual({ request });

        // the reaction moved LA 2 onto the shift in place of LA 1
        const { week: view } = await post("/schedule/week", { session: la2.session, week });
        expect(view.shifts[0].assignees).toEqual([{ user: la2.user, username: "journey-la2" }]);
        expect(await post("/covers/week", { session: la1.session, week })).toEqual({
            requests: [
                {
                    request,
                    shift,
                    start: "2026-10-19T15:00:00.000Z",
                    end: "2026-10-19T17:00:00.000Z",
                    requester: la1.user,
                    claimer: la2.user,
                    status: "APPROVED",
                },
            ],
        });
        // the template still has LA 1, since a cover is for that week only
        const { template } = await post("/schedule/template", { session: ta.session, group });
        expect(template[0].assignees).toEqual([{ user: la1.user, username: "journey-la1" }]);
    });

    test("a class's requests can be listed across all its weeks, in shift order, by members only", async () => {
        const { group, shift, ta, la1, la2 } = await classWithShift("all");
        // a second, earlier week with LA 1 on its shift too
        const { week: earlier } = await post("/schedule/weeks/publish", {
            session: ta.session,
            group,
            start: "2026-10-12T00:00:00.000Z",
            name: "Earlier",
        });
        const earlierShift = (await post("/schedule/week", { session: ta.session, week: earlier })).week.shifts[0].shift;
        const { request: later } = await post("/covers/request", { session: la1.session, shift });
        const { request: first } = await post("/covers/request", { session: la1.session, shift: earlierShift });

        const { requests } = await post("/covers/class", { session: la2.session, group });
        expect(requests.map((r: { request: string }) => r.request)).toEqual([first, later]);
        expect(requests[0]).toEqual({
            request: first,
            week: earlier,
            shift: earlierShift,
            start: "2026-10-12T15:00:00.000Z",
            end: "2026-10-12T17:00:00.000Z",
            requester: la1.user,
            claimer: null,
            status: "OPEN",
        });

        const outsider = await register("all-outsider");
        expect(await post("/covers/class", { session: outsider.session, group })).toEqual({ error: "FORBIDDEN" });
    });

    test("approval is refused if the schedule changed since the claim, and the request stays claimed", async () => {
        const { week, shift, ta, la1, la2 } = await classWithShift("changed");
        const { request } = await post("/covers/request", { session: la1.session, shift });
        await post("/covers/claim", { session: la2.session, request });

        // the TA puts LA 2 on the shift directly, so the cover can no longer be applied
        await post("/schedule/shifts/assign", { session: ta.session, shift, member: la2.user });
        expect(await post("/covers/approve", { session: ta.session, request })).toEqual({ error: "CONFLICT" });
        expect((await post("/covers/week", { session: ta.session, week })).requests[0].status).toBe("CLAIMED");

        // likewise if the requester is taken off the shift
        await post("/schedule/shifts/unassign", { session: ta.session, shift, member: la2.user });
        await post("/schedule/shifts/unassign", { session: ta.session, shift, member: la1.user });
        expect(await post("/covers/approve", { session: ta.session, request })).toEqual({ error: "CONFLICT" });
    });

    test("approval is refused if the claimer has left the class", async () => {
        const { group, week, shift, ta, la1, la2 } = await classWithShift("left");
        const { request } = await post("/covers/request", { session: la1.session, shift });
        await post("/covers/claim", { session: la2.session, request });
        await post("/classes/leave", { session: la2.session, group });

        expect(await post("/covers/approve", { session: ta.session, request })).toEqual({ error: "CONFLICT" });
        const { week: view } = await post("/schedule/week", { session: ta.session, week });
        expect(view.shifts[0].assignees.map((a: { user: string }) => a.user)).toEqual([la1.user]);
    });

    test("who may request, claim, approve, deny, and withdraw", async () => {
        const { shift, ta, la1, la2 } = await classWithShift("perm");

        // LA 2 isn't on the shift, so can't request a cover for it
        expect(await post("/covers/request", { session: la2.session, shift })).toEqual({ error: "INVALID_REQUEST" });

        const { request } = await post("/covers/request", { session: la1.session, shift });
        expect(await post("/covers/request", { session: la1.session, shift })).toEqual({ error: "CONFLICT" });

        // LA 1 is on the shift (and is the requester), and outsiders aren't in the class
        expect(await post("/covers/claim", { session: la1.session, request })).toEqual({ error: "CONFLICT" });
        const outsider = await register("perm-outsider");
        expect(await post("/covers/claim", { session: outsider.session, request })).toEqual({ error: "FORBIDDEN" });

        // an unclaimed request can't be approved; LAs can't approve or deny; only the requester withdraws
        expect(await post("/covers/approve", { session: ta.session, request })).toEqual({ error: "CONFLICT" });
        await post("/covers/claim", { session: la2.session, request });
        expect(await post("/covers/approve", { session: la2.session, request })).toEqual({ error: "FORBIDDEN" });
        expect(await post("/covers/deny", { session: la1.session, request })).toEqual({ error: "FORBIDDEN" });
        expect(await post("/covers/withdraw", { session: la2.session, request })).toEqual({ error: "FORBIDDEN" });

        expect(await post("/covers/withdraw", { session: la1.session, request })).toEqual({ request });
        expect(await post("/covers/deny", { session: ta.session, request })).toEqual({ error: "CONFLICT" });
        expect(await post("/covers/claim", { session: la2.session, request: "made-up" })).toEqual({ error: "NOT_FOUND" });
    });

    test("a TA can deny a request, which leaves the schedule alone", async () => {
        const { week, shift, ta, la1, la2 } = await classWithShift("deny");
        const { request } = await post("/covers/request", { session: la1.session, shift });
        await post("/covers/claim", { session: la2.session, request });
        expect(await post("/covers/deny", { session: ta.session, request })).toEqual({ request });

        const { week: view } = await post("/schedule/week", { session: ta.session, week });
        expect(view.shifts[0].assignees).toEqual([{ user: la1.user, username: "deny-la1" }]);
        expect((await post("/covers/week", { session: ta.session, week })).requests[0].status).toBe("DENIED");
    });
});
