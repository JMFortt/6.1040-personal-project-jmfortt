import { afterAll, describe, expect, test } from "bun:test";
import { testApi } from "./testApi.ts";

const { post, close } = await testApi("test_auth_composition");
afterAll(close);

describe("Auth", () => {
    test("registering logs you in, and the session identifies you", async () => {
        const registered = await post("/auth/register", { username: "ari", password: "hunter2" });
        expect(registered).toEqual({ user: expect.any(String), session: expect.any(String) });

        expect(await post("/auth/current", { session: registered.session })).toEqual({
            account: { user: registered.user, username: "ari" },
        });
    });

    test("logging in starts a new session for the same user", async () => {
        const registered = await post("/auth/register", { username: "bea", password: "hunter2" });
        const loggedIn = await post("/auth/login", { username: "bea", password: "hunter2" });
        expect(loggedIn).toEqual({ user: registered.user, session: expect.any(String) });
        expect(loggedIn.session).not.toBe(registered.session);

        expect(await post("/auth/current", { session: loggedIn.session })).toEqual({
            account: { user: registered.user, username: "bea" },
        });
    });

    test("logging out ends the session, so it is no longer recognized", async () => {
        const { session } = await post("/auth/register", { username: "cal", password: "hunter2" });
        expect(await post("/auth/logout", { session })).toEqual({ session });
        expect(await post("/auth/current", { session })).toEqual({ error: "UNAUTHORIZED" });
        expect(await post("/auth/logout", { session })).toEqual({ error: "NOT_FOUND" });
    });

    test("bad requests are refused with informative errors", async () => {
        await post("/auth/register", { username: "dee", password: "hunter2" });
        expect(await post("/auth/register", { username: "dee", password: "other" })).toEqual({ error: "CONFLICT" });
        expect(await post("/auth/register", { username: "", password: "hunter2" })).toEqual({ error: "INVALID_REQUEST" });
        expect(await post("/auth/login", { username: "dee", password: "wrong" })).toEqual({ error: "UNAUTHORIZED" });
        expect(await post("/auth/current", { session: "made-up" })).toEqual({ error: "UNAUTHORIZED" });
    });
});
