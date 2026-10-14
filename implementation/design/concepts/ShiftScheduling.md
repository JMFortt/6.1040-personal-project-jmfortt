# ShiftScheduling

## Purpose

Keep a record of who is on shift for each time slot

## Principle

After shifts are created and users are assigned to them, everyone sees the same schedule. If a shift is reassigned from one user to another, everyone sees the new assignee in place of the old one

## Types

```types
external User
  A person who can be assigned to a shift.

external Context
  What a shift belongs to, such as a class.
```

## State

```state
a set of Shifts with
  a Context
  a start DateTime
  an end DateTime
  a capacity Number
  an assignees set of Users
```

## Actions

```actions
createShift(context: Context, start: DateTime, end: DateTime, capacity: Number) : returns (shift: Shift)
  where start is before end and capacity is at least 1
  then
    create a new shift in context with the given times and capacity and no assignees
    returns shift
  where start is not before end
  then
    refuses INVALID_TIMES "The shift must start before it ends."
  where start is before end and capacity is less than 1
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
```

## Queries

```queries
_shift(shift: Shift) : optional (context: Context, start: DateTime, end: DateTime, capacity: Number)
  Returns the details of shift, or no row if the shift does not exist.

_shiftsInContext(context: Context) : many (shift: Shift, start: DateTime, end: DateTime, capacity: Number)
  Returns every shift in context, ordered by start, and no rows if there are none.

_assignees(shift: Shift) : many (user: User)
  Returns every user assigned to shift, ordered by user, and no rows if there are none or the shift does not exist.
```
