import { afterAll, describe, expect, test } from "bun:test";
import { testApi } from "./testApi.ts";

const { post, close } = await testApi("test_classes_composition");
afterAll(close);

// registers a user and returns their session
async function sessionFor(username: string) {
    const { session } = await post("/auth/register", { username, password: "hunter2" });
    return session as string;
}

describe("Classes", () => {
    test("creating a class makes you its STAFF member, and it shows up in your classes", async () => {
        const session = await sessionFor("instructor");
        const created = await post("/classes/create", { session, name: "6.123" });
        expect(created).toEqual({ group: expect.any(String) });

        expect(await post("/classes/mine", { session })).toEqual({
            classes: [{ group: created.group, name: "6.123", role: "STAFF" }],
        });
    });

    test("you only see your own classes", async () => {
        const owner = await sessionFor("owner");
        await post("/classes/create", { session: owner, name: "6.456" });

        const other = await sessionFor("other");
        expect(await post("/classes/mine", { session: other })).toEqual({ classes: [] });
    });

    test("you must be logged in", async () => {
        expect(await post("/classes/create", { session: "made-up", name: "6.789" })).toEqual({ error: "UNAUTHORIZED" });
        expect(await post("/classes/mine", { session: "made-up" })).toEqual({ error: "UNAUTHORIZED" });
    });

    test("an empty or blank class name is refused", async () => {
        const session = await sessionFor("blank");
        expect(await post("/classes/create", { session, name: "" })).toEqual({ error: "INVALID_REQUEST" });
        expect(await post("/classes/create", { session, name: "   " })).toEqual({ error: "INVALID_REQUEST" });
        expect(await post("/classes/mine", { session })).toEqual({ classes: [] });
    });
});

describe("Inviting and rostering", () => {
    // a fresh class owned by a new STAFF user; usernames get a prefix so tests don't collide
    async function classOwnedBy(prefix: string) {
        const owner = await sessionFor(`${prefix}-owner`);
        const { group } = await post("/classes/create", { session: owner, name: `${prefix} class` });
        return { owner, group: group as string };
    }

    test("staff invite by username, the invitee sees and accepts it, and then shows up in the roster", async () => {
        const { owner, group } = await classOwnedBy("journey");
        const la = await sessionFor("journey-la");

        const invited = await post("/classes/invite", { session: owner, group, username: "journey-la", role: "LA" });
        expect(invited).toEqual({ invite: expect.any(String) });

        expect(await post("/invites/mine", { session: la })).toEqual({
            invites: [{ invite: invited.invite, group, name: "journey class", role: "LA" }],
        });

        expect(await post("/invites/accept", { session: la, invite: invited.invite })).toEqual({ invite: invited.invite });
        expect(await post("/invites/mine", { session: la })).toEqual({ invites: [] });
        expect(await post("/classes/mine", { session: la })).toEqual({
            classes: [{ group, name: "journey class", role: "LA" }],
        });

        const { roster } = await post("/classes/roster", { session: la, group });
        expect(roster).toHaveLength(2);
        expect(roster).toEqual(
            expect.arrayContaining([
                { user: expect.any(String), username: "journey-owner", role: "STAFF" },
                { user: expect.any(String), username: "journey-la", role: "LA" },
            ]),
        );
    });

    test("only staff can invite", async () => {
        const { owner, group } = await classOwnedBy("perm");
        const la = await sessionFor("perm-la");
        await sessionFor("perm-other");
        const { invite } = await post("/classes/invite", { session: owner, group, username: "perm-la", role: "LA" });
        await post("/invites/accept", { session: la, invite });

        expect(await post("/classes/invite", { session: la, group, username: "perm-other", role: "LA" })).toEqual({
            error: "FORBIDDEN",
        });
        // someone outside the class, or a made-up class, is refused the same way
        const outsider = await sessionFor("perm-outsider");
        expect(await post("/classes/invite", { session: outsider, group, username: "perm-other", role: "LA" })).toEqual({
            error: "FORBIDDEN",
        });
        expect(await post("/classes/invite", { session: owner, group: "made-up", username: "perm-other", role: "LA" })).toEqual({
            error: "FORBIDDEN",
        });
    });

    test("bad invites are refused with informative errors", async () => {
        const { owner, group } = await classOwnedBy("bad");
        await sessionFor("bad-la");

        expect(await post("/classes/invite", { session: owner, group, username: "nobody", role: "LA" })).toEqual({
            error: "NOT_FOUND",
        });
        expect(await post("/classes/invite", { session: owner, group, username: "bad-la", role: "BOSS" })).toEqual({
            error: "INVALID_REQUEST",
        });
        expect(await post("/classes/invite", { session: owner, group, username: "", role: "LA" })).toEqual({
            error: "INVALID_REQUEST",
        });

        await post("/classes/invite", { session: owner, group, username: "bad-la", role: "LA" });
        expect(await post("/classes/invite", { session: owner, group, username: "bad-la", role: "TA" })).toEqual({
            error: "CONFLICT",
        });
        expect(await post("/classes/invite", { session: owner, group, username: "bad-owner", role: "LA" })).toEqual({
            error: "CONFLICT",
        });
    });

    test("you can only accept your own invites", async () => {
        const { owner, group } = await classOwnedBy("accept");
        await sessionFor("accept-la");
        const thief = await sessionFor("accept-thief");
        const { invite } = await post("/classes/invite", { session: owner, group, username: "accept-la", role: "LA" });

        expect(await post("/invites/accept", { session: thief, invite })).toEqual({ error: "FORBIDDEN" });
        expect(await post("/invites/accept", { session: thief, invite: "made-up" })).toEqual({ error: "NOT_FOUND" });
        expect(await post("/classes/mine", { session: thief })).toEqual({ classes: [] });
    });

    test("only members can see the roster", async () => {
        const { group } = await classOwnedBy("roster");
        const outsider = await sessionFor("roster-outsider");
        expect(await post("/classes/roster", { session: outsider, group })).toEqual({ error: "FORBIDDEN" });
    });
});

describe("Managing members and leaving", () => {
    // registers a user and returns their session and id
    async function register(username: string) {
        const { user, session } = await post("/auth/register", { username, password: "hunter2" });
        return { user: user as string, session: session as string };
    }

    // a class with a STAFF owner and one LA
    async function classWithLA(prefix: string) {
        const owner = await register(`${prefix}-owner`);
        const la = await register(`${prefix}-la`);
        const { group } = await post("/classes/create", { session: owner.session, name: `${prefix} class` });
        const { invite } = await post("/classes/invite", { session: owner.session, group, username: `${prefix}-la`, role: "LA" });
        await post("/invites/accept", { session: la.session, invite });
        return { group: group as string, owner, la };
    }

    const roleOf = async (session: string, group: string) =>
        (await post("/classes/mine", { session })).classes.find((c: { group: string }) => c.group === group)?.role;

    test("the roster says who the owner is", async () => {
        const { group, owner, la } = await classWithLA("owner");
        expect((await post("/classes/roster", { session: la.session, group })).owner).toBe(owner.user);
    });

    test("staff can change roles, and the new role's permissions apply", async () => {
        const { group, owner, la } = await classWithLA("role");
        const SLOT = { group, weekday: "MONDAY", startMinute: 900, endMinute: 1020, capacity: 1 };
        expect(await post("/schedule/slots/create", { session: la.session, ...SLOT })).toEqual({ error: "FORBIDDEN" });

        expect(await post("/classes/change-role", { session: owner.session, group, member: la.user, role: "TA" })).toEqual({
            member: la.user,
        });
        expect(await roleOf(la.session, group)).toBe("TA");
        expect(await post("/schedule/slots/create", { session: la.session, ...SLOT })).toEqual({ slot: expect.any(String) });
    });

    test("staff can remove members, and anyone but the owner can leave", async () => {
        const { group, owner, la } = await classWithLA("remove");
        expect(await post("/classes/remove", { session: owner.session, group, member: la.user })).toEqual({ member: la.user });
        expect(await post("/classes/mine", { session: la.session })).toEqual({ classes: [] });

        const { group: other, la: leaver } = await classWithLA("leave");
        expect(await post("/classes/leave", { session: leaver.session, group: other })).toEqual({ group: other });
        expect(await roleOf(leaver.session, other)).toBeUndefined();
    });

    test("the owner can't be changed, removed, or leave, and LAs can't manage members", async () => {
        const { group, owner, la } = await classWithLA("guard");
        const FORBIDDEN = { error: "FORBIDDEN" };
        expect(await post("/classes/change-role", { session: owner.session, group, member: owner.user, role: "LA" })).toEqual(FORBIDDEN);
        expect(await post("/classes/remove", { session: owner.session, group, member: owner.user })).toEqual(FORBIDDEN);
        expect(await post("/classes/leave", { session: owner.session, group })).toEqual(FORBIDDEN);

        expect(await post("/classes/change-role", { session: la.session, group, member: la.user, role: "STAFF" })).toEqual(FORBIDDEN);
        expect(await post("/classes/remove", { session: la.session, group, member: owner.user })).toEqual(FORBIDDEN);
        expect(await post("/classes/change-role", { session: owner.session, group, member: la.user, role: "BOSS" })).toEqual({
            error: "INVALID_REQUEST",
        });
    });

    test("leaving takes you off the template and future shifts, keeps past shifts, and withdraws your requests", async () => {
        const { group, owner, la } = await classWithLA("cleanup");
        const { slot } = await post("/schedule/slots/create", {
            session: owner.session,
            group,
            weekday: "MONDAY",
            startMinute: 900,
            endMinute: 1020,
            capacity: 1,
        });
        await post("/schedule/slots/assign", { session: owner.session, slot, member: la.user });
        // one week long past, one far in the future
        const { week: past } = await post("/schedule/weeks/publish", { session: owner.session, group, start: "2020-01-06T00:00:00.000Z", name: "Past" });
        const { week: future } = await post("/schedule/weeks/publish", { session: owner.session, group, start: "2099-01-05T00:00:00.000Z", name: "Future" });
        const shiftIn = async (week: string) => (await post("/schedule/week", { session: owner.session, week })).week.shifts[0];
        const { request } = await post("/covers/request", { session: la.session, shift: (await shiftIn(future)).shift });

        await post("/classes/leave", { session: la.session, group });

        expect((await post("/schedule/template", { session: owner.session, group })).template[0].assignees).toEqual([]);
        expect((await shiftIn(future)).assignees).toEqual([]);
        expect((await shiftIn(past)).assignees.map((a: { user: string }) => a.user)).toEqual([la.user]);
        const covers = await post("/covers/week", { session: owner.session, week: future });
        expect(covers.requests.find((r: { request: string }) => r.request === request).status).toBe("WITHDRAWN");
    });
});
