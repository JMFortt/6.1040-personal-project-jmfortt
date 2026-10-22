# Schedule

Each class has a weekly template of slots, and a published copy of it for each
week that actually happens. Attendance and covers apply to the published copies.

Every edit first finds the class that the slot, week, or shift belongs to, and is
refused as not allowed unless the caller
[may edit that class's schedule](view:Access.MayEditSchedule). Viewing only
requires that the caller [is a member of the class](view:Access.IsMember). A
slot, week, or shift that does not exist is refused as not found.

## Viewing

A member can [see the weekly template](reaction:Schedule.ViewTemplate), shown as
[each slot with its assignees' usernames](former:Schedule.Template), and
[list the published weeks](reaction:Schedule.ListWeeks), shown as
[each week's name and start](former:Schedule.Weeks). They can
[open one published week](reaction:Schedule.ViewWeek), shown as
[its shifts in time order with their assignees' usernames](former:Schedule.WeekView).

```endpoints
Schedule.ViewTemplate at /schedule/template
Schedule.ListWeeks at /schedule/weeks
Schedule.ViewWeek at /schedule/week
```

## Editing the template

A scheduler can [add a slot](reaction:Schedule.CreateSlot) on a weekday with a
start and end time and a capacity, [remove a slot](reaction:Schedule.DeleteSlot),
[assign a member of the class to a slot](reaction:Schedule.AssignSlot), and
[unassign someone from a slot](reaction:Schedule.UnassignSlot). Assigning someone
outside the class is refused.

```endpoints
Schedule.CreateSlot at /schedule/slots/create
Schedule.DeleteSlot at /schedule/slots/delete
Schedule.AssignSlot at /schedule/slots/assign
Schedule.UnassignSlot at /schedule/slots/unassign
```

## Published weeks

A scheduler can [publish a week](reaction:Schedule.PublishWeek) from a start time
and a name, which copies the current template into that week; the same week
cannot be published twice. They can [rename a published week](reaction:Schedule.RenameWeek)
to any nonempty name and [delete one](reaction:Schedule.DeleteWeek) along with its shifts.

```endpoints
Schedule.PublishWeek at /schedule/weeks/publish
Schedule.RenameWeek at /schedule/weeks/rename
Schedule.DeleteWeek at /schedule/weeks/delete
```

## Editing a published week

Changes to a published week only affect that week. A scheduler can
[add a shift to it](reaction:Schedule.CreateShift), [remove a shift](reaction:Schedule.DeleteShift),
[assign a member of the class to a shift](reaction:Schedule.AssignShift), and
[unassign someone from a shift](reaction:Schedule.UnassignShift).

```endpoints
Schedule.CreateShift at /schedule/shifts/create
Schedule.DeleteShift at /schedule/shifts/delete
Schedule.AssignShift at /schedule/shifts/assign
Schedule.UnassignShift at /schedule/shifts/unassign
```
