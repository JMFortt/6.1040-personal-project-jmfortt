import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import {
    AlreadyInGroup,
    CannotChangeOwnerRole,
    CannotRemoveOwner,
    GroupNotFound,
    InviteNotFound,
    NotAMember,
    NotInvitee,
    RoleBasedAccessingConcept,
} from "../../src/concepts/RoleBasedAccessing.ts";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db("test_roleBasedAccessing");
let rba: RoleBasedAccessingConcept;

beforeEach(async () => {
    await db.dropDatabase();
    rba = new RoleBasedAccessingConcept(db);
});

afterAll(async () => {
    await db.dropDatabase();
    await client.close();
});

// roles are arbitrary values to the concept so these ones are dummy
async function newGroup(name = "6.123") {
    const { group } = await rba.createGroup({ owner: "owner", name, ownerRole: "admin" });
    return group;
}

describe("RoleBasedAccessing", () => {
    test("its principle: invited users hold their role once they accept, it can change, and removal ends it", async () => {
        const group = await newGroup();
        const { invite } = await rba.invite({ group, user: "ari", role: "helper" });
        expect(await rba._role({ group, user: "ari" })).toEqual([]);

        await rba.accept({ invite, user: "ari" });
        expect(await rba._role({ group, user: "ari" })).toEqual([{ role: "helper" }]);

        await rba.changeRole({ group, user: "ari", role: "lead" });
        expect(await rba._role({ group, user: "ari" })).toEqual([{ role: "lead" }]);

        await rba.removeMember({ group, user: "ari" });
        expect(await rba._role({ group, user: "ari" })).toEqual([]);
    });

    test("the owner is a member with the role given at creation", async () => {
        const group = await newGroup();
        expect(await rba._members({ group })).toEqual([{ user: "owner", role: "admin" }]);
        expect(await rba._role({ group, user: "owner" })).toEqual([{ role: "admin" }]);
        expect(await rba._group({ group })).toEqual([{ name: "6.123", owner: "owner" }]);
    });

    test("_role answers no row for an unknown group", async () => {
        expect(await rba._role({ group: "nope", user: "owner" })).toEqual([]);
    });

    test("inviting is refused for an unknown group, or a user already in or invited to the group", async () => {
        await expect(rba.invite({ group: "nope", user: "ari", role: "helper" })).rejects.toThrow(GroupNotFound);

        const group = await newGroup();
        await expect(rba.invite({ group, user: "owner", role: "helper" })).rejects.toThrow(AlreadyInGroup);
        expect(await rba._invitesForUser({ user: "owner" })).toEqual([]);

        const { invite } = await rba.invite({ group, user: "ari", role: "helper" });
        await expect(rba.invite({ group, user: "ari", role: "lead" })).rejects.toThrow(
            "That user is already a member of or invited to this group.",
        );
        // still just the first invite, with its original role
        expect(await rba._invitesForUser({ user: "ari" })).toEqual([{ invite, group, role: "helper" }]);
    });

    test("accepting is refused for an unknown invite or someone else's invite, and an accepted invite is gone", async () => {
        await expect(rba.accept({ invite: "nope", user: "ari" })).rejects.toThrow(InviteNotFound);

        const group = await newGroup();
        const { invite } = await rba.invite({ group, user: "ari", role: "helper" });
        await expect(rba.accept({ invite, user: "someone-else" })).rejects.toThrow(NotInvitee);
        // the refused accept made nobody a member
        expect(await rba._role({ group, user: "someone-else" })).toEqual([]);
        expect(await rba._role({ group, user: "ari" })).toEqual([]);

        expect(await rba._invitesForUser({ user: "ari" })).toEqual([{ invite, group, role: "helper" }]);
        await rba.accept({ invite, user: "ari" });
        expect(await rba._invitesForUser({ user: "ari" })).toEqual([]);
        await expect(rba.accept({ invite, user: "ari" })).rejects.toThrow(InviteNotFound);
    });

    test("deleting a group removes it with its memberships and invites", async () => {
        const group = await newGroup();
        const { invite } = await rba.invite({ group, user: "ari", role: "helper" });
        await rba.accept({ invite, user: "ari" });
        await rba.invite({ group, user: "bea", role: "helper" });
        const other = await newGroup("other");

        await rba.deleteGroup({ group });
        expect(await rba._group({ group })).toEqual([]);
        expect(await rba._members({ group })).toEqual([]);
        expect(await rba._invitesForUser({ user: "bea" })).toEqual([]);
        expect(await rba._groupsForUser({ user: "owner" })).toEqual([{ group: other, name: "other", role: "admin" }]);
        await expect(rba.deleteGroup({ group })).rejects.toThrow(GroupNotFound);
    });

    test("the owner's role can't be changed and the owner can't be removed", async () => {
        const group = await newGroup();
        await expect(rba.changeRole({ group, user: "owner", role: "helper" })).rejects.toThrow(CannotChangeOwnerRole);
        await expect(rba.removeMember({ group, user: "owner" })).rejects.toThrow(CannotRemoveOwner);
        expect(await rba._members({ group })).toEqual([{ user: "owner", role: "admin" }]);
    });

    test("changing the role of or removing a non-member is refused", async () => {
        const group = await newGroup();
        await expect(rba.changeRole({ group, user: "stranger", role: "lead" })).rejects.toThrow(NotAMember);
        await expect(rba.removeMember({ group, user: "stranger" })).rejects.toThrow(
            "That user is not a member of this group.",
        );
        expect(await rba._members({ group })).toEqual([{ user: "owner", role: "admin" }]);
    });

    test("_groupsForUser lists a user's groups with their role, ordered by name", async () => {
        const b = await newGroup("B class");
        const { group: a } = await rba.createGroup({ owner: "other", name: "A class", ownerRole: "admin" });
        const { invite } = await rba.invite({ group: a, user: "owner", role: "helper" });
        await rba.accept({ invite, user: "owner" });

        expect(await rba._groupsForUser({ user: "owner" })).toEqual([
            { group: a, name: "A class", role: "helper" },
            { group: b, name: "B class", role: "admin" },
        ]);
        expect(await rba._groupsForUser({ user: "nobody" })).toEqual([]);
    });
});
