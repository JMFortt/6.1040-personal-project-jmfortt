import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";

// point the app at its own test database before loading it
// since src/db.ts connects using MONGODB_URL as soon as it's imported
const url = new URL(process.env.MONGODB_URL!);
url.pathname = "/test_auth_composition";
process.env.MONGODB_URL = url.toString();

const { assembleApplication } = await import("../../src/assembly.ts");
const { policy } = await import("../../src/http.ts");
const { client, db } = await import("../../src/db.ts");

// the same handler main.ts serves at /api/* called directly with no server running
let api: ReturnType<typeof createHttpHandler>;

beforeAll(async () => {
    await db.dropDatabase();
    const application = assembleApplication();
    const gateway = createGateway({ application });
    api = createHttpHandler({ application, gateway, policy });
});

afterAll(async () => {
    await db.dropDatabase();
    await client.close();
});

async function post(path: string, body: unknown) {
    const response = await api(
        new Request(`http://localhost/api${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }),
    );
    return response.json();
}

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
