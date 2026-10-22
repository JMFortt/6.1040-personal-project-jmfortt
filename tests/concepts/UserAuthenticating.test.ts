import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import {
    InvalidCredentials,
    LoginFailed,
    UserAuthenticatingConcept,
    UsernameTaken,
} from "../../src/concepts/UserAuthenticating.ts";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db("test_userAuthenticating");
let authenticating: UserAuthenticatingConcept;

beforeEach(async () => {
    await db.dropDatabase();
    authenticating = new UserAuthenticatingConcept(db);
});

afterAll(async () => {
    await db.dropDatabase();
    await client.close();
});

describe("UserAuthenticating", () => {
    test("its principle: logging in with the registered credentials identifies the same user", async () => {
        const { user } = await authenticating.register({ username: "ari", password: "hunter2" });
        expect(await authenticating.login({ username: "ari", password: "hunter2" })).toEqual({ user });
        expect(await authenticating._username({ user })).toEqual([{ username: "ari" }]);
    });

    test("the password is stored only as a hash", async () => {
        await authenticating.register({ username: "ari", password: "hunter2" });
        const stored = await db.collection("userAuthenticating.users").findOne({ username: "ari" });
        expect(stored?.passwordHash).toBeString();
        expect(stored?.passwordHash).not.toBe("hunter2");
    });

    test("an empty username or password is refused without creating a user", async () => {
        await expect(authenticating.register({ username: "", password: "hunter2" })).rejects.toThrow(InvalidCredentials);
        await expect(authenticating.register({ username: "ari", password: "" })).rejects.toThrow(
            "The username and password must not be empty.",
        );
        await expect(authenticating.login({ username: "ari", password: "" })).rejects.toThrow(LoginFailed);
        // nothing was created
        expect(await authenticating._user({ username: "" })).toEqual([]);
        expect(await authenticating._user({ username: "ari" })).toEqual([]);
    });

    test("a taken username is refused, and the existing account is unchanged", async () => {
        const { user } = await authenticating.register({ username: "ari", password: "hunter2" });
        await expect(authenticating.register({ username: "ari", password: "other" })).rejects.toThrow(UsernameTaken);
        // still the same single account, with the original password
        expect(await authenticating._user({ username: "ari" })).toEqual([{ user }]);
        expect(await authenticating.login({ username: "ari", password: "hunter2" })).toEqual({ user });
        await expect(authenticating.login({ username: "ari", password: "other" })).rejects.toThrow(LoginFailed);
    });

    test("a wrong password and an unknown username are refused the same way", async () => {
        await authenticating.register({ username: "ari", password: "hunter2" });
        await expect(authenticating.login({ username: "ari", password: "wrong" })).rejects.toThrow(
            "The username or password is incorrect.",
        );
        await expect(authenticating.login({ username: "nobody", password: "hunter2" })).rejects.toThrow(LoginFailed);
    });

    test("_username answers no row for an unknown user", async () => {
        expect(await authenticating._username({ user: "no-such-user" })).toEqual([]);
    });

    test("_user finds a user by username, and answers no row for an unknown username", async () => {
        const { user } = await authenticating.register({ username: "ari", password: "hunter2" });
        expect(await authenticating._user({ username: "ari" })).toEqual([{ user }]);
        expect(await authenticating._user({ username: "nobody" })).toEqual([]);
    });
});
