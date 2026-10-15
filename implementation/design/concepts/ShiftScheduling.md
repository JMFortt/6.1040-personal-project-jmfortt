# ShiftScheduling

## Purpose

Keep a weekly schedule of who is on shift, and a dated copy of it for each week that actually happens

## Principle

A scheduler sets up a weekly template of time slots and assigns people to them. When a week is published, every slot becomes a dated shift in that week with the same assignees, and everyone sees the same shifts. Changing the template afterwards only affects weeks published later, and a published week's shifts can be changed on their own, such as reassigning a shift from one user to another for that week only

## Types

```types
external User
  A person who can be assigned to a slot or shift.

external Context
  What a schedule belongs to, such as a class.

Weekday is MONDAY or TUESDAY or WEDNESDAY or THURSDAY or FRIDAY or SATURDAY or SUNDAY
  The day of the week a template slot falls on.
```

## State

```state
a set of Slots with
  a Context
  a Weekday
  a startMinute Number
  an endMinute Number
  a capacity Number
  an assignees set of Users
a set of Weeks with
  a Context
  a name String
  a start DateTime
a set of Shifts with
  a Week
  a start DateTime
  an end DateTime
  a capacity Number
  an assignees set of Users
```

## Actions

```actions
createSlot(context: Context, weekday: Weekday, startMinute: Number, endMinute: Number, capacity: Number) : returns (slot: Slot)
  where startMinute is before endMinute, both are within one day (0 to 1440), and capacity is at least 1
  then
    create a new slot in context on weekday with the given times and capacity and no assignees
    returns slot
  where startMinute is not before endMinute, or either is outside 0 to 1440
  then
    refuses INVALID_TIMES "The shift must start before it ends."
  where the times are valid and capacity is less than 1
  then
    refuses INVALID_CAPACITY "The shift's capacity must be at least 1."

deleteSlot(slot: Slot) : returns ()
  where slot exists
  then
    remove slot
    returns
  where slot does not exist
  then
    refuses SLOT_NOT_FOUND "There is no such slot."

assignSlot(slot: Slot, user: User) : returns ()
  where slot exists, user is not assigned to slot, and slot is below capacity
  then
    add user to the assignees of slot
    returns
  where slot does not exist
  then
    refuses SLOT_NOT_FOUND "There is no such slot."
  where slot exists and user is already assigned to slot
  then
    refuses ALREADY_ASSIGNED "That user is already assigned to this shift."
  where slot exists, user is not assigned to slot, and slot is at capacity
  then
    refuses SHIFT_FULL "This shift is already full."

unassignSlot(slot: Slot, user: User) : returns ()
  where slot exists and user is assigned to slot
  then
    remove user from the assignees of slot
    returns
  where slot does not exist
  then
    refuses SLOT_NOT_FOUND "There is no such slot."
  where slot exists and user is not assigned to slot
  then
    refuses NOT_ASSIGNED "That user is not assigned to this shift."

publishWeek(context: Context, start: DateTime, name: String) : returns (week: Week)
  where no week in context has the given start
  then
    create a new week in context with name and start, and for every slot in context a shift in that week on the slot's weekday and times, with the slot's capacity and assignees
    returns week
  where a week in context already has the given start
  then
    refuses WEEK_ALREADY_PUBLISHED "That week has already been published."

renameWeek(week: Week, name: String) : returns ()
  where week exists
  then
    set the name of week to name
    returns
  where week does not exist
  then
    refuses WEEK_NOT_FOUND "There is no such week."

deleteWeek(week: Week) : returns ()
  where week exists
  then
    remove week and every shift in it
    returns
  where week does not exist
  then
    refuses WEEK_NOT_FOUND "There is no such week."

createShift(week: Week, start: DateTime, end: DateTime, capacity: Number) : returns (shift: Shift)
  where week exists, start is before end, and capacity is at least 1
  then
    create a new shift in week with the given times and capacity and no assignees
    returns shift
  where week does not exist
  then
    refuses WEEK_NOT_FOUND "There is no such week."
  where week exists and start is not before end
  then
    refuses INVALID_TIMES "The shift must start before it ends."
  where week exists, start is before end, and capacity is less than 1
  then
    refuses INVALID_CAPACITY "The shift's capacity must be at least 1."

deleteShift(shift: Shift) : returns ()
  where shift exists
  then
    remove shift
    returns
  where shift does not exist
  then
    refuses SHIFT_NOT_FOUND "There is no such shift."

assign(shift: Shift, user: User) : returns ()
  where shift exists, user is not assigned to shift, and shift is below capacity
  then
    add user to the assignees of shift
    returns
  where shift does not exist
  then
    refuses SHIFT_NOT_FOUND "There is no such shift."
  where shift exists and user is already assigned to shift
  then
    refuses ALREADY_ASSIGNED "That user is already assigned to this shift."
  where shift exists, user is not assigned to shift, and shift is at capacity
  then
    refuses SHIFT_FULL "This shift is already full."

unassign(shift: Shift, user: User) : returns ()
  where shift exists and user is assigned to shift
  then
    remove user from the assignees of shift
    returns
  where shift does not exist
  then
    refuses SHIFT_NOT_FOUND "There is no such shift."
  where shift exists and user is not assigned to shift
  then
    refuses NOT_ASSIGNED "That user is not assigned to this shift."

reassign(shift: Shift, from: User, to: User) : returns ()
  where shift exists, from is assigned to shift, and to is not
  then
    replace from with to in the assignees of shift
    returns
  where shift does not exist
  then
    refuses SHIFT_NOT_FOUND "There is no such shift."
  where shift exists and from is not assigned to shift
  then
    refuses NOT_ASSIGNED "That user is not assigned to this shift."
  where shift exists, from is assigned to shift, and to is also assigned
  then
    refuses ALREADY_ASSIGNED "That user is already assigned to this shift."

removeFromSchedule(context: Context, user: User, from: DateTime) : returns ()
  where true
  then
    remove user from the assignees of every slot in context, and of every shift in context that starts at or after from
    returns
```

## Queries

```queries
_slots(context: Context) : many (slot: Slot, weekday: Weekday, startMinute: Number, endMinute: Number, capacity: Number)
  Returns every template slot in context, ordered by weekday then start, and no rows if there are none.

_slot(slot: Slot) : optional (context: Context, weekday: Weekday, startMinute: Number, endMinute: Number, capacity: Number)
  Returns the details of slot, or no row if the slot does not exist.

_slotAssignees(slot: Slot) : many (user: User)
  Returns every user assigned to slot, ordered by user, and no rows if there are none or the slot does not exist.

_weeks(context: Context) : many (week: Week, name: String, start: DateTime)
  Returns every published week in context, ordered by start, and no rows if there are none.

_week(week: Week) : optional (context: Context, name: String, start: DateTime)
  Returns the details of week, or no row if the week does not exist.

_shiftsInWeek(week: Week) : many (shift: Shift, start: DateTime, end: DateTime, capacity: Number)
  Returns every shift in week, ordered by start, and no rows if there are none or the week does not exist.

_shift(shift: Shift) : optional (week: Week, context: Context, start: DateTime, end: DateTime, capacity: Number)
  Returns the details of shift, including its week's context, or no row if the shift does not exist.

_assignees(shift: Shift) : many (user: User)
  Returns every user assigned to shift, ordered by user, and no rows if there are none or the shift does not exist.
```
