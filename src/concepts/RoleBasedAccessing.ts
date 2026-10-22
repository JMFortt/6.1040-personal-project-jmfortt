import { MongoServerError, type Collection, type Db } from "mongodb";

export class GroupNotFound extends Error { }
export class AlreadyInGroup extends Error { }
export class InviteNotFound extends Error { }
export class NotInvitee extends Error { }
export class NotAMember extends Error { }
export class CannotChangeOwnerRole extends Error { }
export class CannotRemoveOwner extends Error { }

// what each role permits is decided by the app
interface Group {
    _id: string;
    name: string;
    owner: string;
}

interface Membership {
    _id: string;
    user: string;
    group: string;
    role: string;
}

interface Invite {
    _id: string;
    group: string;
    invitee: string;
    role: string;
}

export class RoleBasedAccessingConcept {
    private readonly groups: Collection<Group>;
    private readonly memberships: Collection<Membership>;
    private readonly invites: Collection<Invite>;
    private indexed = false;

    constructor(db: Db) {
        this.groups = db.collection<Group>("roleBasedAccessing.groups");
        this.memberships = db.collection<Membership>("roleBasedAccessing.memberships");
        this.invites = db.collection<Invite>("roleBasedAccessing.invites");
    }

    // unique indexes stop a user from being in, or invited to, the same group twice
    // (# keeps helpers private at runtime, so the engine only sees actions and queries)
    async #ensureIndexes() {
        if (this.indexed) return;
        await this.memberships.createIndex({ user: 1, group: 1 }, { unique: true });
        await this.invites.createIndex({ group: 1, invitee: 1 }, { unique: true });
        this.indexed = true;
    }

    async createGroup({ owner, name, ownerRole }: { owner: string; name: string; ownerRole: string }) {
        await this.#ensureIndexes();
        const group = crypto.randomUUID();
        await this.groups.insertOne({ _id: group, name, owner });
        await this.memberships.insertOne({ _id: crypto.randomUUID(), user: owner, group, role: ownerRole });
        return { group };
    }

    async invite({ group, user, role }: { group: string; user: string; role: string }) {
        await this.#ensureIndexes();
        if ((await this.groups.findOne({ _id: group })) === null) {
            throw new GroupNotFound("There is no such group.");
        }
        if ((await this.memberships.findOne({ user, group })) !== null) {
            throw new AlreadyInGroup("That user is already a member of or invited to this group.");
        }
        const invite = crypto.randomUUID();
        try {
            await this.invites.insertOne({ _id: invite, group, invitee: user, role });
        } catch (error) {
            // duplicate (group, invitee) means they're already invited
            if (error instanceof MongoServerError && error.code === 11000) {
                throw new AlreadyInGroup("That user is already a member of or invited to this group.");
            }
            throw error;
        }
        return { invite };
    }

    async accept({ invite, user }: { invite: string; user: string }) {
        await this.#ensureIndexes();
        const found = await this.invites.findOne({ _id: invite });
        if (found === null) {
            throw new InviteNotFound("There is no such invite.");
        }
        if (found.invitee !== user) {
            throw new NotInvitee("This invite is for a different user.");
        }
        await this.memberships.insertOne({ _id: crypto.randomUUID(), user, group: found.group, role: found.role });
        await this.invites.deleteOne({ _id: invite });
        return {};
    }

    async changeRole({ group, user, role }: { group: string; user: string; role: string }) {
        await this.#checkRemovableMember(group, user, () =>
            new CannotChangeOwnerRole("The owner's role cannot be changed."));
        await this.memberships.updateOne({ user, group }, { $set: { role } });
        return {};
    }

    async withdrawInvite({ invite }: { invite: string }) {
        const result = await this.invites.deleteOne({ _id: invite });
        if (result.deletedCount === 0) {
            throw new InviteNotFound("There is no such invite.");
        }
        return {};
    }

    // memberships and invites go first, so if this stops partway, what's left is a group nobody is
    // in (which no one can see) rather than members of a group that doesn't exist
    async deleteGroup({ group }: { group: string }) {
        if ((await this.groups.findOne({ _id: group })) === null) {
            throw new GroupNotFound("There is no such group.");
        }
        await this.memberships.deleteMany({ group });
        await this.invites.deleteMany({ group });
        await this.groups.deleteOne({ _id: group });
        return {};
    }

    async removeMember({ group, user }: { group: string; user: string }) {
        await this.#checkRemovableMember(group, user, () =>
            new CannotRemoveOwner("The owner cannot be removed from the group."));
        await this.memberships.deleteOne({ user, group });
        return {};
    }

    // shared by changeRole and removeMember: user must be a member, and not the owner
    async #checkRemovableMember(group: string, user: string, ownerError: () => Error) {
        if ((await this.memberships.findOne({ user, group })) === null) {
            throw new NotAMember("That user is not a member of this group.");
        }
        if ((await this.groups.findOne({ _id: group }))?.owner === user) {
            throw ownerError();
        }
    }

    async _group({ group }: { group: string }) {
        const found = await this.groups.findOne({ _id: group });
        return found === null ? [] : [{ name: found.name, owner: found.owner }];
    }

    async _groupsForUser({ user }: { user: string }) {
        const memberships = await this.memberships.find({ user }).toArray();
        const groups = await this.groups.find({ _id: { $in: memberships.map((m) => m.group) } }).toArray();
        const names = new Map(groups.map((g) => [g._id, g.name]));
        return memberships
            .map((m) => ({ group: m.group, name: names.get(m.group) ?? "", role: m.role }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    async _members({ group }: { group: string }) {
        const rows = await this.memberships.find({ group }).sort({ user: 1 }).toArray();
        return rows.map(({ user, role }) => ({ user, role }));
    }

    async _invitesForUser({ user }: { user: string }) {
        const rows = await this.invites.find({ invitee: user }).sort({ _id: 1 }).toArray();
        return rows.map(({ _id, group, role }) => ({ invite: _id, group, role }));
    }

    async _invitesForGroup({ group }: { group: string }) {
        const rows = await this.invites.find({ group }).sort({ _id: 1 }).toArray();
        return rows.map(({ _id, invitee, role }) => ({ invite: _id, invitee, role }));
    }

    async _role({ group, user }: { group: string; user: string }) {
        const membership = await this.memberships.findOne({ user, group });
        return membership === null ? [] : [{ role: membership.role }];
    }
}
