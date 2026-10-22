# AttendanceTracking

## Purpose

Keep a reliable record of whether people showed up, so absences aren't recorded by mistake

## Principle

If a marker marks an attendee present for a session, the attendee can see that they were marked present. If the marker forgets, the attendee can see they have no record and follow up before it becomes an absence

## Types

```types
external User
  A person whose attendance is recorded.

external Event
  Something a person is expected to attend, such as a shift.

Status is PRESENT or ABSENT or LATE
  The attendance outcomes a record can hold.
```

## State

```state
a set of Records with
  a User
  an Event
  a Status
```

## Actions

```actions
mark(user: User, event: Event, status: Status) : returns ()
  where true
  then
    set user's record for event to status (creating it if needed)
    returns

unmark(user: User, event: Event) : returns ()
  where user has a record for event
  then
    remove user's record for event
    returns
  where user has no record for event
  then
    refuses NO_RECORD "There is no attendance record to clear."

clearEvent(event: Event) : returns ()
  where true
  then
    remove every record for event
    returns
```

## Queries

```queries
_record(user: User, event: Event) : optional (status: Status)
  Returns user's status for event, or no row if they have no record for it.

_recordsForUser(user: User) : many (event: Event, status: Status)
  Returns every record for user, ordered by event, and no rows if there are none.

_recordsForEvent(event: Event) : many (user: User, status: Status)
  Returns every record for event, ordered by user, and no rows if there are none.
```
