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
