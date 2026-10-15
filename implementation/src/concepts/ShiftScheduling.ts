import { MongoServerError, type Collection, type Db, type Filter, type UpdateFilter } from "mongodb";

export class InvalidTimes extends Error { }
export class InvalidCapacity extends Error { }
export class SlotNotFound extends Error { }
export class WeekNotFound extends Error { }
export class WeekAlreadyPublished extends Error { }
export class ShiftNotFound extends Error { }
export class AlreadyAssigned extends Error { }
export class ShiftFull extends Error { }
export class NotAssigned extends Error { }

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_MINUTE = 60 * 1000;

// slots and shifts both have a capacity and assignees, so assigning works the same for both
interface Assignable {
    _id: string;
    capacity: number;
    assignees: string[];
}

// a template slot: a weekday and minutes past midnight, not a real date
interface Slot extends Assignable {
    context: string;
    weekday: Weekday;
    startMinute: number;
    endMinute: number;
}

// a published copy of the template for one real week
interface Week {
    _id: string;
    context: string;
    name: string;
    start: Date;
}

// a dated shift in a published week; context is copied from the week so permission checks
// can find a shift's class in one read
interface Shift extends Assignable {
    week: string;
    context: string;
    start: Date;
    end: Date;
}

// add user to a slot or shift, checking "not already on it" and "below capacity" in the same
// update, so two assigns at once can't overfill it
async function addAssignee<T extends Assignable>(collection: Collection<T>, _id: string, user: string, notFound: () => Error) {
    const result = await collection.updateOne(
        { _id, assignees: { $ne: user }, $expr: { $lt: [{ $size: "$assignees" }, "$capacity"] } } as unknown as Filter<T>,
        { $push: { assignees: user } } as unknown as UpdateFilter<T>,
    );
    if (result.modifiedCount === 1) return;
    // nothing changed: work out which condition failed
    const found = await collection.findOne({ _id } as Filter<T>);
    if (found === null) throw notFound();
    if (found.assignees.includes(user)) throw new AlreadyAssigned("That user is already assigned to this shift.");
    throw new ShiftFull("This shift is already full.");
}

async function removeAssignee<T extends Assignable>(collection: Collection<T>, _id: string, user: string, notFound: () => Error) {
    const result = await collection.updateOne(
        { _id, assignees: user } as unknown as Filter<T>,
        { $pull: { assignees: user } } as unknown as UpdateFilter<T>,
    );
    if (result.modifiedCount === 1) return;
    if ((await collection.findOne({ _id } as Filter<T>)) === null) throw notFound();
    throw new NotAssigned("That user is not assigned to this shift.");
}

const slotNotFound = () => new SlotNotFound("There is no such slot.");
const shiftNotFound = () => new ShiftNotFound("There is no such shift.");

// times arrive as ISO strings (that's how dates travel in JSON), and are returned the same way
export class ShiftSchedulingConcept {
    private readonly slots: Collection<Slot>;
    private readonly weeks: Collection<Week>;
    private readonly shifts: Collection<Shift>;
    private indexed = false;

    constructor(db: Db) {
        this.slots = db.collection<Slot>("shiftScheduling.slots");
        this.weeks = db.collection<Week>("shiftScheduling.weeks");
        this.shifts = db.collection<Shift>("shiftScheduling.shifts");
    }

    // the unique index stops the same week from being published twice, even by two clicks at once
    // (# keeps helpers private at runtime, so the engine only sees actions and queries)
    async #ensureIndexes() {
        if (this.indexed) return;
        await this.weeks.createIndex({ context: 1, start: 1 }, { unique: true });
        this.indexed = true;
    }

    // --- the weekly template ---

    async createSlot({ context, weekday, startMinute, endMinute, capacity }: {
        context: string;
        weekday: Weekday;
        startMinute: number;
        endMinute: number;
        capacity: number;
    }) {
        if (!(0 <= startMinute && startMinute < endMinute && endMinute <= MINUTES_PER_DAY)) {
            throw new InvalidTimes("The shift must start before it ends.");
        }
        if (!(capacity >= 1)) {
            throw new InvalidCapacity("The shift's capacity must be at least 1.");
        }
        const slot = crypto.randomUUID();
        await this.slots.insertOne({ _id: slot, context, weekday, startMinute, endMinute, capacity, assignees: [] });
        return { slot };
    }

    async deleteSlot({ slot }: { slot: string }) {
        const result = await this.slots.deleteOne({ _id: slot });
        if (result.deletedCount === 0) throw slotNotFound();
        return {};
    }

    async assignSlot({ slot, user }: { slot: string; user: string }) {
        await addAssignee(this.slots, slot, user, slotNotFound);
        return {};
    }

    async unassignSlot({ slot, user }: { slot: string; user: string }) {
        await removeAssignee(this.slots, slot, user, slotNotFound);
        return {};
    }

    // --- published weeks ---

    // copies every slot in the template into a dated shift in the new week
    async publishWeek({ context, start, name }: { context: string; start: string; name: string }) {
        await this.#ensureIndexes();
        const weekStart = new Date(start);
        const week = crypto.randomUUID();
        try {
            await this.weeks.insertOne({ _id: week, context, name, start: weekStart });
        } catch (error) {
            if (error instanceof MongoServerError && error.code === 11000) {
                throw new WeekAlreadyPublished("That week has already been published.");
            }
            throw error;
        }
        const slots = await this.slots.find({ context }).toArray();
        if (slots.length > 0) {
            await this.shifts.insertMany(
                slots.map((slot) => {
                    // minutes from the start of the week to the slot's day, then to its start/end time
                    const dayOffset = WEEKDAYS.indexOf(slot.weekday) * MINUTES_PER_DAY;
                    const at = (minute: number) => new Date(weekStart.getTime() + (dayOffset + minute) * MS_PER_MINUTE);
                    return {
                        _id: crypto.randomUUID(),
                        week,
                        context,
                        start: at(slot.startMinute),
                        end: at(slot.endMinute),
                        capacity: slot.capacity,
                        assignees: [...slot.assignees],
                    };
                }),
            );
        }
        return { week };
    }

    async renameWeek({ week, name }: { week: string; name: string }) {
        const result = await this.weeks.updateOne({ _id: week }, { $set: { name } });
        if (result.matchedCount === 0) throw new WeekNotFound("There is no such week.");
        return {};
    }

    async deleteWeek({ week }: { week: string }) {
        if ((await this.weeks.findOne({ _id: week })) === null) throw new WeekNotFound("There is no such week.");
        await this.shifts.deleteMany({ week });
        await this.weeks.deleteOne({ _id: week });
        return {};
    }

    // --- shifts within a published week ---

    async createShift({ week, start, end, capacity }: { week: string; start: string; end: string; capacity: number }) {
        const found = await this.weeks.findOne({ _id: week });
        if (found === null) throw new WeekNotFound("There is no such week.");
        const startDate = new Date(start);
        const endDate = new Date(end);
        // an unparseable time is NaN, which is never "before" anything, so it's refused here too
        if (!(startDate < endDate)) {
            throw new InvalidTimes("The shift must start before it ends.");
        }
        if (!(capacity >= 1)) {
            throw new InvalidCapacity("The shift's capacity must be at least 1.");
        }
        const shift = crypto.randomUUID();
        await this.shifts.insertOne({
            _id: shift,
            week,
            context: found.context,
            start: startDate,
            end: endDate,
            capacity,
            assignees: [],
        });
        return { shift };
    }

    async deleteShift({ shift }: { shift: string }) {
        const result = await this.shifts.deleteOne({ _id: shift });
        if (result.deletedCount === 0) throw shiftNotFound();
        return {};
    }

    async assign({ shift, user }: { shift: string; user: string }) {
        await addAssignee(this.shifts, shift, user, shiftNotFound);
        return {};
    }

    async unassign({ shift, user }: { shift: string; user: string }) {
        await removeAssignee(this.shifts, shift, user, shiftNotFound);
        return {};
    }

    async reassign({ shift, from, to }: { shift: string; from: string; to: string }) {
        // swap from for to in place, only if from is assigned and to isn't, in one update
        const result = await this.shifts.updateOne(
            { _id: shift, $and: [{ assignees: from }, { assignees: { $ne: to } }] },
            { $set: { "assignees.$[old]": to } },
            { arrayFilters: [{ old: from }] },
        );
        if (result.modifiedCount === 1) return {};
        const found = await this.shifts.findOne({ _id: shift });
        if (found === null) throw shiftNotFound();
        if (!found.assignees.includes(from)) throw new NotAssigned("That user is not assigned to this shift.");
        throw new AlreadyAssigned("That user is already assigned to this shift.");
    }

    // --- queries ---

    async _slots({ context }: { context: string }) {
        const rows = await this.slots.find({ context }).toArray();
        return rows
            .sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) || a.startMinute - b.startMinute)
            .map(({ _id, weekday, startMinute, endMinute, capacity }) => ({ slot: _id, weekday, startMinute, endMinute, capacity }));
    }

    async _slot({ slot }: { slot: string }) {
        const found = await this.slots.findOne({ _id: slot });
        if (found === null) return [];
        const { context, weekday, startMinute, endMinute, capacity } = found;
        return [{ context, weekday, startMinute, endMinute, capacity }];
    }

    async _slotAssignees({ slot }: { slot: string }) {
        const found = await this.slots.findOne({ _id: slot });
        return found === null ? [] : [...found.assignees].sort().map((user) => ({ user }));
    }

    async _weeks({ context }: { context: string }) {
        const rows = await this.weeks.find({ context }).sort({ start: 1 }).toArray();
        return rows.map(({ _id, name, start }) => ({ week: _id, name, start: start.toISOString() }));
    }

    async _week({ week }: { week: string }) {
        const found = await this.weeks.findOne({ _id: week });
        return found === null ? [] : [{ context: found.context, name: found.name, start: found.start.toISOString() }];
    }

    async _shiftsInWeek({ week }: { week: string }) {
        const rows = await this.shifts.find({ week }).sort({ start: 1 }).toArray();
        return rows.map(({ _id, start, end, capacity }) => ({
            shift: _id,
            start: start.toISOString(),
            end: end.toISOString(),
            capacity,
        }));
    }

    async _shift({ shift }: { shift: string }) {
        const found = await this.shifts.findOne({ _id: shift });
        if (found === null) return [];
        const { week, context, start, end, capacity } = found;
        return [{ week, context, start: start.toISOString(), end: end.toISOString(), capacity }];
    }

    async _assignees({ shift }: { shift: string }) {
        const found = await this.shifts.findOne({ _id: shift });
        return found === null ? [] : [...found.assignees].sort().map((user) => ({ user }));
    }
}
