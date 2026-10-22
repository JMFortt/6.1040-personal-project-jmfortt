import { MongoServerError, type Collection, type Db } from "mongodb";

export class ActiveRequestExists extends Error { }
export class RequestNotFound extends Error { }
export class NotOpen extends Error { }
export class OwnRequest extends Error { }
export class NotClaimed extends Error { }
export class AlreadyResolved extends Error { }

export type Status = "OPEN" | "CLAIMED" | "APPROVED" | "DENIED" | "WITHDRAWN";

interface CoverRequest {
    _id: string;
    requester: string;
    shift: string;
    claimer: string | null;
    status: Status;
}

const notFound = () => new RequestNotFound("There is no such request.");

export class ShiftTradingConcept {
    private readonly requests: Collection<CoverRequest>;
    private indexed = false;

    constructor(db: Db) {
        this.requests = db.collection<CoverRequest>("shiftTrading.requests");
    }

    // only one *active* (OPEN or CLAIMED) request per requester per shift, enforced by the database
    // so two clicks at once can't make two; resolved requests don't count
    // (# keeps helpers private at runtime, so the engine only sees actions and queries)
    async #ensureIndexes() {
        if (this.indexed) return;
        await this.requests.createIndex(
            { requester: 1, shift: 1 },
            { unique: true, partialFilterExpression: { status: { $in: ["OPEN", "CLAIMED"] } } },
        );
        this.indexed = true;
    }

    async requestCover({ requester, shift }: { requester: string; shift: string }) {
        await this.#ensureIndexes();
        const request = crypto.randomUUID();
        try {
            await this.requests.insertOne({ _id: request, requester, shift, claimer: null, status: "OPEN" });
        } catch (error) {
            if (error instanceof MongoServerError && error.code === 11000) {
                throw new ActiveRequestExists("You already have an active request for this shift.");
            }
            throw error;
        }
        return { request };
    }

    // each action checks the request's status and changes it in one update, so two people can't
    // both claim it, and it can't be approved and withdrawn at once
    async claim({ request, claimer }: { request: string; claimer: string }) {
        const result = await this.requests.updateOne(
            { _id: request, status: "OPEN", requester: { $ne: claimer } },
            { $set: { claimer, status: "CLAIMED" } },
        );
        if (result.modifiedCount === 1) return {};
        const found = await this.requests.findOne({ _id: request });
        if (found === null) throw notFound();
        if (found.status !== "OPEN") throw new NotOpen("This request is no longer open.");
        throw new OwnRequest("You cannot claim your own request.");
    }

    async approve({ request }: { request: string }) {
        const result = await this.requests.updateOne({ _id: request, status: "CLAIMED" }, { $set: { status: "APPROVED" } });
        if (result.modifiedCount === 1) return {};
        if ((await this.requests.findOne({ _id: request })) === null) throw notFound();
        throw new NotClaimed("Only a claimed request can be approved.");
    }

    async deny({ request }: { request: string }) {
        await this.#resolve(request, "DENIED");
        return {};
    }

    async withdraw({ request }: { request: string }) {
        await this.#resolve(request, "WITHDRAWN");
        return {};
    }

    // deny and withdraw: an active request becomes resolved with the given status
    async #resolve(request: string, status: "DENIED" | "WITHDRAWN") {
        const result = await this.requests.updateOne(
            { _id: request, status: { $in: ["OPEN", "CLAIMED"] } },
            { $set: { status } },
        );
        if (result.modifiedCount === 1) return;
        if ((await this.requests.findOne({ _id: request })) === null) throw notFound();
        throw new AlreadyResolved("This request has already been resolved.");
    }

    // e.g. when the shift itself is deleted
    async clearShift({ shift }: { shift: string }) {
        await this.requests.deleteMany({ shift });
        return {};
    }

    async _request({ request }: { request: string }) {
        const found = await this.requests.findOne({ _id: request });
        if (found === null) return [];
        const { requester, shift, claimer, status } = found;
        return [{ requester, shift, claimer, status }];
    }

    async _requestsForShift({ shift }: { shift: string }) {
        const rows = await this.requests.find({ shift }).sort({ _id: 1 }).toArray();
        return rows.map(({ _id, requester, claimer, status }) => ({ request: _id, requester, claimer, status }));
    }
}
