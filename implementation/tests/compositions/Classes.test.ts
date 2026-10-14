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
