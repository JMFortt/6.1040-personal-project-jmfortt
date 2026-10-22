import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import { NotLoggedIn, SessioningConcept, SessionNotFound } from "../../src/concepts/Sessioning.ts";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db("test_sessioning");
let sessioning: SessioningConcept;

beforeEach(async () => {
    await db.dropDatabase();
    sessioning = new SessioningConcept(db);
});

afterAll(async () => {
    await db.dropDatabase();
    await client.close();
});

describe("Sessioning", () => {
    test("its principle: a started session is attributed to its user until it is ended", async () => {
        const { session } = await sessioning.start({ user: "ari" });
        expect(await sessioning.current({ session })).toEqual({ user: "ari" });
        expect(await sessioning.end({ session })).toEqual({});
        await expect(sessioning.current({ session })).rejects.toThrow(NotLoggedIn);
    });

    test("an unknown session is not logged in", async () => {
        await expect(sessioning.current({ session: "made-up" })).rejects.toThrow("You are not logged in.");
    });

    test("ending an unknown or already ended session is refused, and other sessions are untouched", async () => {
        const other = await sessioning.start({ user: "bea" });
        await expect(sessioning.end({ session: "made-up" })).rejects.toThrow(SessionNotFound);
        const { session } = await sessioning.start({ user: "ari" });
        await sessioning.end({ session });
        await expect(sessioning.end({ session })).rejects.toThrow("There is no such session.");
        expect(await sessioning.current(other)).toEqual({ user: "bea" });
    });

    test("a user's sessions are separate, so ending one leaves the other", async () => {
        const first = await sessioning.start({ user: "ari" });
        const second = await sessioning.start({ user: "ari" });
        expect(first.session).not.toBe(second.session);
        await sessioning.end(first);
        expect(await sessioning.current(second)).toEqual({ user: "ari" });
    });
});
