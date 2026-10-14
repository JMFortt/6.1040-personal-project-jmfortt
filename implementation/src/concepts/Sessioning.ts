import { type Collection, type Db } from "mongodb";

export class SessionNotFound extends Error { }
export class NotLoggedIn extends Error { }

interface Session {
    _id: string;
    user: string;
}

export class SessioningConcept {
    private readonly sessions: Collection<Session>;

    constructor(db: Db) {
        this.sessions = db.collection<Session>("sessioning.sessions");
    }

    async start({ user }: { user: string }) {
        // random UUID so a session can't be guessed from another one
        const session = crypto.randomUUID();
        await this.sessions.insertOne({ _id: session, user });
        return { session };
    }

    async end({ session }: { session: string }) {
        const result = await this.sessions.deleteOne({ _id: session });
        if (result.deletedCount === 0) {
            throw new SessionNotFound("There is no such session.");
        }
        return {};
    }

    async current({ session }: { session: string }) {
        const found = await this.sessions.findOne({ _id: session });
        if (found === null) {
            throw new NotLoggedIn("You are not logged in.");
        }
        return { user: found.user };
    }
}
