import { type Collection, type Db } from "mongodb";

export class NoRecord extends Error { }

export type Status = "PRESENT" | "ABSENT" | "LATE";

interface AttendanceRecord {
    _id: string;
    user: string;
    event: string;
    status: Status;
}

export class AttendanceTrackingConcept {
    private readonly records: Collection<AttendanceRecord>;
    private indexed = false;

    constructor(db: Db) {
        this.records = db.collection<AttendanceRecord>("attendanceTracking.records");
    }

    // the unique index keeps one record per user per event, even if two marks arrive at once
    // (# keeps helpers private at runtime, so the engine only sees actions and queries)
    async #ensureIndexes() {
        if (this.indexed) return;
        await this.records.createIndex({ user: 1, event: 1 }, { unique: true });
        this.indexed = true;
    }

    async mark({ user, event, status }: { user: string; event: string; status: Status }) {
        await this.#ensureIndexes();
        // update the existing record, or create one if there isn't one yet
        await this.records.updateOne(
            { user, event },
            { $set: { status }, $setOnInsert: { _id: crypto.randomUUID() } },
            { upsert: true },
        );
        return {};
    }

    async unmark({ user, event }: { user: string; event: string }) {
        const result = await this.records.deleteOne({ user, event });
        if (result.deletedCount === 0) {
            throw new NoRecord("There is no attendance record to clear.");
        }
        return {};
    }

    async _record({ user, event }: { user: string; event: string }) {
        const found = await this.records.findOne({ user, event });
        return found === null ? [] : [{ status: found.status }];
    }

    async _recordsForUser({ user }: { user: string }) {
        const rows = await this.records.find({ user }).sort({ event: 1 }).toArray();
        return rows.map(({ event, status }) => ({ event, status }));
    }

    async _recordsForEvent({ event }: { event: string }) {
        const rows = await this.records.find({ event }).sort({ user: 1 }).toArray();
        return rows.map(({ user, status }) => ({ user, status }));
    }
}
