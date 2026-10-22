import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { MongoClient } from "mongodb";
import {
    ActiveRequestExists,
    AlreadyResolved,
    NotClaimed,
    NotOpen,
    OwnRequest,
    RequestNotFound,
    ShiftTradingConcept,
} from "../../src/concepts/ShiftTrading.ts";

const client = new MongoClient(process.env.MONGODB_URL!);
const db = client.db("test_shiftTrading");
let trading: ShiftTradingConcept;

beforeEach(async () => {
    await db.dropDatabase();
    trading = new ShiftTradingConcept(db);
});

afterAll(async () => {
    await db.dropDatabase();
    await client.close();
});

describe("ShiftTrading", () => {
    test("its principle: a cover request is claimed, then approved, with its status visible throughout", async () => {
        const { request } = await trading.requestCover({ requester: "ari", shift: "monday" });
        expect(await trading._request({ request })).toEqual([{ requester: "ari", shift: "monday", claimer: null, status: "OPEN" }]);

        await trading.claim({ request, claimer: "bea" });
        expect(await trading._request({ request })).toEqual([{ requester: "ari", shift: "monday", claimer: "bea", status: "CLAIMED" }]);

        await trading.approve({ request });
        expect(await trading._requestsForShift({ shift: "monday" })).toEqual([
            { request, requester: "ari", claimer: "bea", status: "APPROVED" },
        ]);
    });

    test("only one active request per person per shift, but a new one is allowed once the old one is resolved", async () => {
        const { request } = await trading.requestCover({ requester: "ari", shift: "monday" });
        await expect(trading.requestCover({ requester: "ari", shift: "monday" })).rejects.toThrow(ActiveRequestExists);
        expect(await trading._requestsForShift({ shift: "monday" })).toHaveLength(1);
        // someone else, or another shift, is fine
        await trading.requestCover({ requester: "bea", shift: "monday" });
        await trading.requestCover({ requester: "ari", shift: "tuesday" });

        await trading.withdraw({ request });
        await trading.requestCover({ requester: "ari", shift: "monday" });
    });

    test("simultaneous requests only create one", async () => {
        const results = await Promise.allSettled([
            trading.requestCover({ requester: "ari", shift: "monday" }),
            trading.requestCover({ requester: "ari", shift: "monday" }),
        ]);
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    });

    test("claiming is refused for a missing request, your own request, or one that isn't open", async () => {
        await expect(trading.claim({ request: "nope", claimer: "bea" })).rejects.toThrow(RequestNotFound);
        const { request } = await trading.requestCover({ requester: "ari", shift: "monday" });
        await expect(trading.claim({ request, claimer: "ari" })).rejects.toThrow(OwnRequest);
        expect(await trading._request({ request })).toEqual([{ requester: "ari", shift: "monday", claimer: null, status: "OPEN" }]);
        await trading.claim({ request, claimer: "bea" });
        await expect(trading.claim({ request, claimer: "cal" })).rejects.toThrow(NotOpen);
        // the first claim stands
        expect(await trading._request({ request })).toEqual([{ requester: "ari", shift: "monday", claimer: "bea", status: "CLAIMED" }]);
    });

    test("simultaneous claims only let one person claim", async () => {
        const { request } = await trading.requestCover({ requester: "ari", shift: "monday" });
        const results = await Promise.allSettled([
            trading.claim({ request, claimer: "bea" }),
            trading.claim({ request, claimer: "cal" }),
        ]);
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    });

    test("only a claimed request can be approved", async () => {
        await expect(trading.approve({ request: "nope" })).rejects.toThrow(RequestNotFound);
        const { request } = await trading.requestCover({ requester: "ari", shift: "monday" });
        await expect(trading.approve({ request })).rejects.toThrow(NotClaimed);
        expect((await trading._request({ request }))[0]!.status).toBe("OPEN");
    });

    test("clearing a shift removes all of its requests and nothing else", async () => {
        await trading.requestCover({ requester: "ari", shift: "monday" });
        const { request: other } = await trading.requestCover({ requester: "ari", shift: "tuesday" });
        await trading.clearShift({ shift: "monday" });
        expect(await trading._requestsForShift({ shift: "monday" })).toEqual([]);
        expect(await trading._request({ request: other })).toHaveLength(1);
    });

    test("an active request can be denied or withdrawn, but not once it's resolved", async () => {
        const { request: denied } = await trading.requestCover({ requester: "ari", shift: "monday" });
        await trading.claim({ request: denied, claimer: "bea" });
        await trading.deny({ request: denied });
        expect((await trading._request({ request: denied }))[0]!.status).toBe("DENIED");
        await expect(trading.withdraw({ request: denied })).rejects.toThrow(AlreadyResolved);

        const { request: withdrawn } = await trading.requestCover({ requester: "ari", shift: "tuesday" });
        await trading.withdraw({ request: withdrawn });
        await expect(trading.deny({ request: withdrawn })).rejects.toThrow("This request has already been resolved.");
        await expect(trading.claim({ request: withdrawn, claimer: "bea" })).rejects.toThrow(NotOpen);
        await expect(trading.deny({ request: "nope" })).rejects.toThrow(RequestNotFound);
    });
});
