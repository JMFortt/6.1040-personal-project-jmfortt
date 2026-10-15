# Attendance

Attendance is recorded per shift in a published week. Every endpoint first finds
the class the shift belongs to; a shift that does not exist is refused as not found.

A user who [may mark attendance](view:Access.MayMarkAttendance) in the shift's
class can [mark someone assigned to the shift](reaction:Attendance.Mark) as present,
absent, or late, and [clear a mark](reaction:Attendance.Unmark). Marking someone
who is not on the shift is refused, and anyone else is refused as not allowed.

```endpoints
Attendance.Mark at /attendance/mark
Attendance.Unmark at /attendance/unmark
```

[Seeing a shift's attendance](reaction:Attendance.ForShift) shows a user who
[may view everyone's attendance](view:Access.MayViewAllAttendance)
[every record for the shift](former:Attendance.ShiftRecords). Any other
[member of the class](view:Access.IsMember) sees only
[their own record](former:Attendance.OwnShiftRecord), and non-members are refused.

```endpoints
Attendance.ForShift at /attendance/shift
```

A member can [see their own attendance in a class](reaction:Attendance.Mine), shown
as [every shift they are on, in time order, with its status or none if not yet marked](former:Attendance.MyRecords),
so they can follow up on a missing record.

```endpoints
Attendance.Mine at /attendance/mine
```
