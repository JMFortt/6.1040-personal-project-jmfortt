# Cleanup

Deleting something deletes what depends on it, one level at a time. Each level
deletes only itself and leaves its children in place, because a reaction runs
after its action, so the children must still be findable for the reaction to
delete them. There are no transactions across concepts, so a failure partway
through can leave unreachable leftovers; each step is still all-or-nothing on its
own.

When a shift is deleted, [its attendance records are cleared](reaction:Cleanup.ClearShiftAttendance)
and [its cover requests are cleared](reaction:Cleanup.ClearShiftRequests).

When a published week is deleted, [each of its shifts is deleted](reaction:Cleanup.DeleteWeekShifts),
which clears each shift's records and requests in turn.

When a class is deleted, [each of its published weeks is deleted](reaction:Cleanup.DeleteClassWeeks),
cascading as above, and [each of its template slots is deleted](reaction:Cleanup.DeleteClassSlots).
