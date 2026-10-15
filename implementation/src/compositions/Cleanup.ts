import { reaction, when } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { RoleBasedAccessing, ShiftScheduling, AttendanceTracking, ShiftTrading } = concepts;

// Deleting something deletes what depends on it, one level at a time. Each level deletes only
// itself and leaves its children in place, because a reaction runs *after* its action: the
// children must still be findable for the reaction to delete them.
//
//   class  -> each of its weeks, and each of its template slots
//   week   -> each of its shifts
//   shift  -> its attendance records and its cover requests

const ClearShiftAttendance = reaction(({ shift }) =>
    when(ShiftScheduling.deleteShift({ shift }).responds({})).then(AttendanceTracking.clearEvent({ event: shift })),
);

const ClearShiftRequests = reaction(({ shift }) =>
    when(ShiftScheduling.deleteShift({ shift }).responds({})).then(ShiftTrading.clearShift({ shift })),
);

const DeleteWeekShifts = reaction(({ week, shift }) =>
    when(ShiftScheduling.deleteWeek({ week }).responds({}))
        .where(ShiftScheduling._shiftsInWeek({ week }).is({ shift }))
        .then(ShiftScheduling.deleteShift({ shift })),
);

const DeleteClassWeeks = reaction(({ group, week }) =>
    when(RoleBasedAccessing.deleteGroup({ group }).responds({}))
        .where(ShiftScheduling._weeks({ context: group }).is({ week }))
        .then(ShiftScheduling.deleteWeek({ week })),
);

const DeleteClassSlots = reaction(({ group, slot }) =>
    when(RoleBasedAccessing.deleteGroup({ group }).responds({}))
        .where(ShiftScheduling._slots({ context: group }).is({ slot }))
        .then(ShiftScheduling.deleteSlot({ slot })),
);

export const composition = {
    ClearShiftAttendance,
    ClearShiftRequests,
    DeleteWeekShifts,
    DeleteClassWeeks,
    DeleteClassSlots,
};
