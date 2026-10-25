<!-- Generated from the TAble assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# TAble — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### AttendanceTracking

Defined in [AttendanceTracking](../design/concepts/AttendanceTracking.md), line 1.

#### Actions

- `mark(user: User, event: Event, status: Status) : returns ()`
- `unmark(user: User, event: Event) : returns ()`
  - Refuses `NO_RECORD`: There is no attendance record to clear.
- `clearEvent(event: Event) : returns ()`

#### Queries

- `_record(user: User, event: Event) : optional (status: Status)`
- `_recordsForUser(user: User) : many (event: Event, status: Status)`
- `_recordsForEvent(event: Event) : many (user: User, status: Status)`

#### Instances

- `AttendanceTracking` — instance of `AttendanceTracking` — [Application types](../design/types.md), line 28.
  - `Event` is `ShiftScheduling.Shift` — [Application types](../design/types.md), line 30.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 29.

### RoleBasedAccessing

Defined in [RoleBasedAccessing](../design/concepts/RoleBasedAccessing.md), line 1.

#### Actions

- `createGroup(owner: User, name: String, ownerRole: Role) : returns (group: Group)`
- `invite(group: Group, user: User, role: Role) : returns (invite: Invite)`
  - Refuses `GROUP_NOT_FOUND`: There is no such group.
  - Refuses `ALREADY_IN_GROUP`: That user is already a member of or invited to this group.
- `accept(invite: Invite, user: User) : returns ()`
  - Refuses `INVITE_NOT_FOUND`: There is no such invite.
  - Refuses `NOT_INVITEE`: This invite is for a different user.
- `changeRole(group: Group, user: User, role: Role) : returns ()`
  - Refuses `NOT_A_MEMBER`: That user is not a member of this group.
  - Refuses `CANNOT_CHANGE_OWNER_ROLE`: The owner's role cannot be changed.
- `withdrawInvite(invite: Invite) : returns ()`
  - Refuses `INVITE_NOT_FOUND`: There is no such invite.
- `deleteGroup(group: Group) : returns ()`
  - Refuses `GROUP_NOT_FOUND`: There is no such group.
- `removeMember(group: Group, user: User) : returns ()`
  - Refuses `NOT_A_MEMBER`: That user is not a member of this group.
  - Refuses `CANNOT_REMOVE_OWNER`: The owner cannot be removed from the group.

#### Queries

- `_group(group: Group) : optional (name: String, owner: User)`
- `_groupsForUser(user: User) : many (group: Group, name: String, role: Role)`
- `_members(group: Group) : many (user: User, role: Role)`
- `_invitesForUser(user: User) : many (invite: Invite, group: Group, role: Role)`
- `_invitesForGroup(group: Group) : many (invite: Invite, invitee: User, role: Role)`
- `_role(group: Group, user: User) : optional (role: Role)`

#### Instances

- `RoleBasedAccessing` — instance of `RoleBasedAccessing` — [Application types](../design/types.md), line 20.
  - `Role` is `StaffRole` — [Application types](../design/types.md), line 22.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 21.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(user: User) : returns (session: Session)`
- `end(session: Session) : returns ()`
  - Refuses `SESSION_NOT_FOUND`: There is no such session.
- `current(session: Session) : returns (user: User)`
  - Refuses `NOT_LOGGED_IN`: You are not logged in.

#### Instances

- `Sessioning` — instance of `Sessioning` — [Application types](../design/types.md), line 17.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 18.

### ShiftScheduling

Defined in [ShiftScheduling](../design/concepts/ShiftScheduling.md), line 1.

#### Actions

- `createSlot(context: Context, weekday: Weekday, startMinute: Number, endMinute: Number, capacity: Number) : returns (slot: Slot)`
  - Refuses `INVALID_TIMES`: The shift must start before it ends.
  - Refuses `INVALID_CAPACITY`: The shift's capacity must be at least 1.
- `deleteSlot(slot: Slot) : returns ()`
  - Refuses `SLOT_NOT_FOUND`: There is no such slot.
- `assignSlot(slot: Slot, user: User) : returns ()`
  - Refuses `SLOT_NOT_FOUND`: There is no such slot.
  - Refuses `ALREADY_ASSIGNED`: That user is already assigned to this shift.
  - Refuses `SHIFT_FULL`: This shift is already full.
- `unassignSlot(slot: Slot, user: User) : returns ()`
  - Refuses `SLOT_NOT_FOUND`: There is no such slot.
  - Refuses `NOT_ASSIGNED`: That user is not assigned to this shift.
- `setSlotCapacity(slot: Slot, capacity: Number) : returns ()`
  - Refuses `SLOT_NOT_FOUND`: There is no such slot.
  - Refuses `INVALID_CAPACITY`: The shift's capacity must be at least 1.
  - Refuses `CAPACITY_BELOW_ASSIGNED`: More people are on this shift than that. Unassign someone first.
- `publishWeek(context: Context, start: DateTime, name: String) : returns (week: Week)`
  - Refuses `WEEK_ALREADY_PUBLISHED`: That week has already been published.
- `renameWeek(week: Week, name: String) : returns ()`
  - Refuses `WEEK_NOT_FOUND`: There is no such week.
- `deleteWeek(week: Week) : returns ()`
  - Refuses `WEEK_NOT_FOUND`: There is no such week.
- `createShift(week: Week, start: DateTime, end: DateTime, capacity: Number) : returns (shift: Shift)`
  - Refuses `WEEK_NOT_FOUND`: There is no such week.
  - Refuses `INVALID_TIMES`: The shift must start before it ends.
  - Refuses `INVALID_CAPACITY`: The shift's capacity must be at least 1.
- `deleteShift(shift: Shift) : returns ()`
  - Refuses `SHIFT_NOT_FOUND`: There is no such shift.
- `assign(shift: Shift, user: User) : returns ()`
  - Refuses `SHIFT_NOT_FOUND`: There is no such shift.
  - Refuses `ALREADY_ASSIGNED`: That user is already assigned to this shift.
  - Refuses `SHIFT_FULL`: This shift is already full.
- `unassign(shift: Shift, user: User) : returns ()`
  - Refuses `SHIFT_NOT_FOUND`: There is no such shift.
  - Refuses `NOT_ASSIGNED`: That user is not assigned to this shift.
- `setShiftCapacity(shift: Shift, capacity: Number) : returns ()`
  - Refuses `SHIFT_NOT_FOUND`: There is no such shift.
  - Refuses `INVALID_CAPACITY`: The shift's capacity must be at least 1.
  - Refuses `CAPACITY_BELOW_ASSIGNED`: More people are on this shift than that. Unassign someone first.
- `reassign(shift: Shift, from: User, to: User) : returns ()`
  - Refuses `SHIFT_NOT_FOUND`: There is no such shift.
  - Refuses `NOT_ASSIGNED`: That user is not assigned to this shift.
  - Refuses `ALREADY_ASSIGNED`: That user is already assigned to this shift.
- `removeFromSchedule(context: Context, user: User, from: DateTime) : returns ()`

#### Queries

- `_slots(context: Context) : many (slot: Slot, weekday: Weekday, startMinute: Number, endMinute: Number, capacity: Number)`
- `_slot(slot: Slot) : optional (context: Context, weekday: Weekday, startMinute: Number, endMinute: Number, capacity: Number)`
- `_slotAssignees(slot: Slot) : many (user: User)`
- `_weeks(context: Context) : many (week: Week, name: String, start: DateTime)`
- `_week(week: Week) : optional (context: Context, name: String, start: DateTime)`
- `_shiftsInWeek(week: Week) : many (shift: Shift, start: DateTime, end: DateTime, capacity: Number)`
- `_shift(shift: Shift) : optional (week: Week, context: Context, start: DateTime, end: DateTime, capacity: Number)`
- `_assignees(shift: Shift) : many (user: User)`

#### Instances

- `ShiftScheduling` — instance of `ShiftScheduling` — [Application types](../design/types.md), line 24.
  - `Context` is `RoleBasedAccessing.Group` — [Application types](../design/types.md), line 26.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 25.

### ShiftTrading

Defined in [ShiftTrading](../design/concepts/ShiftTrading.md), line 1.

#### Actions

- `requestCover(requester: User, shift: Shift) : returns (request: Request)`
  - Refuses `ACTIVE_REQUEST_EXISTS`: You already have an active request for this shift.
- `claim(request: Request, claimer: User) : returns ()`
  - Refuses `REQUEST_NOT_FOUND`: There is no such request.
  - Refuses `NOT_OPEN`: This request is no longer open.
  - Refuses `OWN_REQUEST`: You cannot claim your own request.
- `approve(request: Request) : returns ()`
  - Refuses `REQUEST_NOT_FOUND`: There is no such request.
  - Refuses `NOT_CLAIMED`: Only a claimed request can be approved.
- `deny(request: Request) : returns ()`
  - Refuses `REQUEST_NOT_FOUND`: There is no such request.
  - Refuses `ALREADY_RESOLVED`: This request has already been resolved.
- `withdraw(request: Request) : returns ()`
  - Refuses `REQUEST_NOT_FOUND`: There is no such request.
  - Refuses `ALREADY_RESOLVED`: This request has already been resolved.
- `clearShift(shift: Shift) : returns ()`

#### Queries

- `_request(request: Request) : optional (requester: User, shift: Shift, claimer: User | null, status: Status)`
- `_requestsForShift(shift: Shift) : many (request: Request, requester: User, claimer: User | null, status: Status)`

#### Instances

- `ShiftTrading` — instance of `ShiftTrading` — [Application types](../design/types.md), line 32.
  - `Shift` is `ShiftScheduling.Shift` — [Application types](../design/types.md), line 34.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 33.

### UserAuthenticating

Defined in [UserAuthenticating](../design/concepts/UserAuthenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (user: User)`
  - Refuses `INVALID_CREDENTIALS`: The username and password must not be empty.
  - Refuses `USERNAME_TAKEN`: That username is already taken.
- `login(username: String, password: String) : returns (user: User)`
  - Refuses `LOGIN_FAILED`: The username or password is incorrect.

#### Queries

- `_username(user: User) : optional (username: String)`
- `_user(username: String) : optional (user: User)`

#### Instances

- `UserAuthenticating` — instance of `UserAuthenticating` — [Application types](../design/types.md), line 15.

## Application types

Concrete types:

- `StaffRole` — [Application types](../design/types.md), line 10.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### (user) is a member of (group)

Authored path: `Access.IsMember`.
- Covered by [Access](../design/compositions/Access.md), line 13.
- Covered by [Attendance](../design/compositions/Attendance.md), line 19.
- Covered by [Classes](../design/compositions/Classes.md), line 35.
- Covered by [Covers](../design/compositions/Covers.md), line 15.
- Covered by [Schedule](../design/compositions/Schedule.md), line 9.

```view
(user) is a member of (group) — inputs (user, group); outputs (); bindings ()
  where RoleBasedAccessing._role (group, user)
```

### (user) may approve cover requests in (group)

Authored path: `Access.MayApproveRequests`.
- Covered by [Access](../design/compositions/Access.md), line 18.
- Covered by [Covers](../design/compositions/Covers.md), line 27.

```view
(user) may approve cover requests in (group) — inputs (user, group); outputs (); bindings (role)
  where
    RoleBasedAccessing._role (group, user) has (role)
    role is among ["TA", "STAFF"]
```

### (user) may edit the schedule of (group)

Authored path: `Access.MayEditSchedule`.
- Covered by [Access](../design/compositions/Access.md), line 15.
- Covered by [Schedule](../design/compositions/Schedule.md), line 8.

```view
(user) may edit the schedule of (group) — inputs (user, group); outputs (); bindings (role)
  where
    RoleBasedAccessing._role (group, user) has (role)
    role is among ["TA", "STAFF"]
```

### (user) may manage the members of (group)

Authored path: `Access.MayManageMembers`.
- Covered by [Access](../design/compositions/Access.md), line 19.
- Covered by [Classes](../design/compositions/Classes.md), line 17.

```view
(user) may manage the members of (group) — inputs (user, group); outputs (); bindings ()
  where RoleBasedAccessing._role (group, user) has (role: "STAFF")
```

### (user) may mark attendance in (group)

Authored path: `Access.MayMarkAttendance`.
- Covered by [Access](../design/compositions/Access.md), line 16.
- Covered by [Attendance](../design/compositions/Attendance.md), line 6.

```view
(user) may mark attendance in (group) — inputs (user, group); outputs (); bindings (role)
  where
    RoleBasedAccessing._role (group, user) has (role)
    role is among ["TA", "STAFF"]
```

### (user) may view everyone's attendance in (group)

Authored path: `Access.MayViewAllAttendance`.
- Covered by [Access](../design/compositions/Access.md), line 17.
- Covered by [Attendance](../design/compositions/Attendance.md), line 17.

```view
(user) may view everyone's attendance in (group) — inputs (user, group); outputs (); bindings (role)
  where
    RoleBasedAccessing._role (group, user) has (role)
    role is among ["TA", "STAFF"]
```

### (user) owns (group)

Authored path: `Access.IsOwner`.
- Covered by [Access](../design/compositions/Access.md), line 20.
- Covered by [Classes](../design/compositions/Classes.md), line 59.

```view
(user) owns (group) — inputs (user, group); outputs (); bindings ()
  where RoleBasedAccessing._group (group) has (owner: user)
```

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the account of (user)

Authored path: `Auth.Account`.
- Covered by [Auth](../design/compositions/Auth.md), line 13.

```former
Former "the account of (user)" — inputs (user); bindings (username); promises exactly one record — forms:
  a record of
    where UserAuthenticating._username (user) has (username)
    user
    username
```

### the attendance of (user) in (group)

Authored path: `Attendance.MyRecords`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 27.

```former
Former "the attendance of (user) in (group)" — inputs (user, group); bindings (week, shift, start, end, status); promises exactly one record — forms:
  each ShiftScheduling._weeks (context: group) has (week)
    where ShiftScheduling._shiftsInWeek (week) has (end, shift, start)
    where ShiftScheduling._assignees (shift) has (user)
    where whether AttendanceTracking._record (event: shift, user) has (status)
    arranged by start
    form a record of
      end
      shift
      start
      status
```

### the attendance record of (user) for (shift)

Authored path: `Attendance.OwnShiftRecord`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 20.

```former
Former "the attendance record of (user) for (shift)" — inputs (user, shift); bindings (username, status); promises exactly one record — forms:
  each AttendanceTracking._record (event: shift, user) has (status)
    where UserAuthenticating._username (user) has (username)
    form a record of
      status
      user
      username
```

### the attendance records of (shift)

Authored path: `Attendance.ShiftRecords`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 18.

```former
Former "the attendance records of (shift)" — inputs (shift); bindings (member, username, status); promises exactly one record — forms:
  each AttendanceTracking._recordsForEvent (event: shift) has (status, user: member)
    where UserAuthenticating._username (user: member) has (username)
    form a record of
      status
      user: member
      username
```

### the classes of (user)

Authored path: `Classes.MyClasses`.
- Covered by [Classes](../design/compositions/Classes.md), line 11.

```former
Former "the classes of (user)" — inputs (user); bindings (group, name, role); promises exactly one record — forms:
  each RoleBasedAccessing._groupsForUser (user) has (group, name, role)
    form a record of
      group
      name
      role
```

### the cover requests in (group)

Authored path: `Covers.ClassRequests`.
- Covered by [Covers](../design/compositions/Covers.md), line 51.

```former
Former "the cover requests in (group)" — inputs (group); bindings (week, shift, start, end, request, requester, claimer, status, assignee); promises exactly one record — forms:
  each ShiftScheduling._weeks (context: group) has (week)
    where ShiftScheduling._shiftsInWeek (week) has (end, shift, start)
    where ShiftTrading._requestsForShift (shift) has (claimer, request, requester, status)
    arranged by start
    form a record of
      assignees: each ShiftScheduling._assignees (shift) has (user: assignee)
        form a record of
          user: assignee
      claimer
      end
      request
      requester
      shift
      start
      status
      week
```

### the cover requests in (week)

Authored path: `Covers.WeekRequests`.
- Covered by [Covers](../design/compositions/Covers.md), line 44.

```former
Former "the cover requests in (week)" — inputs (week); bindings (shift, start, end, request, requester, claimer, status); promises exactly one record — forms:
  each ShiftScheduling._shiftsInWeek (week) has (end, shift, start)
    where ShiftTrading._requestsForShift (shift) has (claimer, request, requester, status)
    arranged by start
    form a record of
      claimer
      end
      request
      requester
      shift
      start
      status
```

### the invites of (user)

Authored path: `Classes.MyInvites`.
- Covered by [Classes](../design/compositions/Classes.md), line 27.

```former
Former "the invites of (user)" — inputs (user); bindings (invite, group, name, role); promises exactly one record — forms:
  each RoleBasedAccessing._invitesForUser (user) has (group, invite, role)
    where RoleBasedAccessing._group (group) has (name)
    form a record of
      group
      invite
      name
      role
```

### the pending invites of (group)

Authored path: `Classes.PendingInvites`.
- Covered by [Classes](../design/compositions/Classes.md), line 48.

```former
Former "the pending invites of (group)" — inputs (group); bindings (invite, invitee, username, role); promises exactly one record — forms:
  each RoleBasedAccessing._invitesForGroup (group) has (invite, invitee, role)
    where UserAuthenticating._username (user: invitee) has (username)
    form a record of
      invite
      role
      user: invitee
      username
```

### the published week (week)

Authored path: `Schedule.WeekView`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 19.

```former
Former "the published week (week)" — inputs (week); bindings (name, start, shift, shiftStart, end, capacity, member, username); promises exactly one record — forms:
  a record of
    where ShiftScheduling._week (week) has (name, start)
    name
    shifts: each ShiftScheduling._shiftsInWeek (week) has (capacity, end, shift, start: shiftStart)
      form a record of
        assignees: each ShiftScheduling._assignees (shift) has (user: member)
          where UserAuthenticating._username (user: member) has (username)
          form a record of
            user: member
            username
        capacity
        end
        shift
        start: shiftStart
    start
    week
```

### the published weeks of (group)

Authored path: `Schedule.Weeks`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 17.

```former
Former "the published weeks of (group)" — inputs (group); bindings (week, name, start); promises exactly one record — forms:
  each ShiftScheduling._weeks (context: group) has (name, start, week)
    form a record of
      name
      start
      week
```

### the roster of (group)

Authored path: `Classes.Roster`.
- Covered by [Classes](../design/compositions/Classes.md), line 37.

```former
Former "the roster of (group)" — inputs (group); bindings (member, username, role); promises exactly one record — forms:
  each RoleBasedAccessing._members (group) has (role, user: member)
    where UserAuthenticating._username (user: member) has (username)
    form a record of
      role
      user: member
      username
```

### the weekly template of (group)

Authored path: `Schedule.Template`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 15.

```former
Former "the weekly template of (group)" — inputs (group); bindings (slot, weekday, startMinute, endMinute, capacity, member, username); promises exactly one record — forms:
  each ShiftScheduling._slots (context: group) has (capacity, endMinute, slot, startMinute, weekday)
    form a record of
      assignees: each ShiftScheduling._slotAssignees (slot) has (user: member)
        where UserAuthenticating._username (user: member) has (username)
        form a record of
          user: member
          username
      capacity
      endMinute
      slot
      startMinute
      weekday
```

## Reactions

### Attendance.ForShift

Authored path: `Attendance.ForShift`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 16.
- Covered by [Attendance](../design/compositions/Attendance.md), line 23.

```reaction
when RequestBoundary.request (path: "/attendance/shift", requestId, session, shift)
then
  Sessioning.current (session)
```

### Attendance.ForShift:everyone#2

Authored path: `Attendance.ForShift`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 16.
- Covered by [Attendance](../design/compositions/Attendance.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Attendance.ForShift
where
  earlier, RequestBoundary.request (path: "/attendance/shift", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may view everyone's attendance in (group)" with (group, user)
then
  RequestBoundary.respond (records: former "the attendance records of (shift)" with (shift), requestId)
```

### Attendance.ForShift:no-shift#2

Authored path: `Attendance.ForShift`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 16.
- Covered by [Attendance](../design/compositions/Attendance.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Attendance.ForShift
where
  earlier, RequestBoundary.request (path: "/attendance/shift", requestId, session, shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Attendance.ForShift:not-member#2

Authored path: `Attendance.ForShift`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 16.
- Covered by [Attendance](../design/compositions/Attendance.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Attendance.ForShift
where
  earlier, RequestBoundary.request (path: "/attendance/shift", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Attendance.ForShift:own#2

Authored path: `Attendance.ForShift`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 16.
- Covered by [Attendance](../design/compositions/Attendance.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Attendance.ForShift
where
  earlier, RequestBoundary.request (path: "/attendance/shift", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) is a member of (group)" with (group, user)
  no view "(user) may view everyone's attendance in (group)" with (group, user)
then
  RequestBoundary.respond (records: former "the attendance record of (user) for (shift)" with (shift, user), requestId)
```

### Attendance.Mark

Authored path: `Attendance.Mark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 7.
- Covered by [Attendance](../design/compositions/Attendance.md), line 12.

```reaction
when RequestBoundary.request (member, path: "/attendance/mark", requestId, session, shift, status)
then
  Sessioning.current (session)
```

### Attendance.Mark:allowed#2

Authored path: `Attendance.Mark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 7.
- Covered by [Attendance](../design/compositions/Attendance.md), line 12.

```reaction
when Sessioning.current (session, user), asked by Attendance.Mark
where
  earlier, RequestBoundary.request (member, path: "/attendance/mark", requestId, session, shift, status)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may mark attendance in (group)" with (group, user)
  ShiftScheduling._assignees (shift) has (user: member)
then
  AttendanceTracking.mark (event: shift, status, user: member)
```

### Attendance.Mark:allowed#3

Authored path: `Attendance.Mark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 7.
- Covered by [Attendance](../design/compositions/Attendance.md), line 12.

```reaction
when AttendanceTracking.mark (event: shift, status, user: member), asked by Attendance.Mark:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/attendance/mark", requestId, session, shift, status)
then
  RequestBoundary.respond (requestId, shift)
```

### Attendance.Mark:no-shift#2

Authored path: `Attendance.Mark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 7.
- Covered by [Attendance](../design/compositions/Attendance.md), line 12.

```reaction
when Sessioning.current (session, user), asked by Attendance.Mark
where
  earlier, RequestBoundary.request (member, path: "/attendance/mark", requestId, session, shift, status)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Attendance.Mark:not-allowed#2

Authored path: `Attendance.Mark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 7.
- Covered by [Attendance](../design/compositions/Attendance.md), line 12.

```reaction
when Sessioning.current (session, user), asked by Attendance.Mark
where
  earlier, RequestBoundary.request (member, path: "/attendance/mark", requestId, session, shift, status)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may mark attendance in (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Attendance.Mark:not-on-shift#2

Authored path: `Attendance.Mark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 7.
- Covered by [Attendance](../design/compositions/Attendance.md), line 12.

```reaction
when Sessioning.current (session, user), asked by Attendance.Mark
where
  earlier, RequestBoundary.request (member, path: "/attendance/mark", requestId, session, shift, status)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may mark attendance in (group)" with (group, user)
  no ShiftScheduling._assignees (shift) has (user: member)
then
  RequestBoundary.respond (error: "NOT_ON_SHIFT", requestId)
```

### Attendance.Mine

Authored path: `Attendance.Mine`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 26.
- Covered by [Attendance](../design/compositions/Attendance.md), line 31.

```reaction
when RequestBoundary.request (group, path: "/attendance/mine", requestId, session)
then
  Sessioning.current (session)
```

### Attendance.Mine:member#2

Authored path: `Attendance.Mine`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 26.
- Covered by [Attendance](../design/compositions/Attendance.md), line 31.

```reaction
when Sessioning.current (session, user), asked by Attendance.Mine
where
  earlier, RequestBoundary.request (group, path: "/attendance/mine", requestId, session)
  view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (records: former "the attendance of (user) in (group)" with (group, user), requestId)
```

### Attendance.Mine:not-member#2

Authored path: `Attendance.Mine`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 26.
- Covered by [Attendance](../design/compositions/Attendance.md), line 31.

```reaction
when Sessioning.current (session, user), asked by Attendance.Mine
where
  earlier, RequestBoundary.request (group, path: "/attendance/mine", requestId, session)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Attendance.Unmark

Authored path: `Attendance.Unmark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 8.
- Covered by [Attendance](../design/compositions/Attendance.md), line 13.

```reaction
when RequestBoundary.request (member, path: "/attendance/unmark", requestId, session, shift)
then
  Sessioning.current (session)
```

### Attendance.Unmark:allowed#2

Authored path: `Attendance.Unmark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 8.
- Covered by [Attendance](../design/compositions/Attendance.md), line 13.

```reaction
when Sessioning.current (session, user), asked by Attendance.Unmark
where
  earlier, RequestBoundary.request (member, path: "/attendance/unmark", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may mark attendance in (group)" with (group, user)
then
  AttendanceTracking.unmark (event: shift, user: member)
```

### Attendance.Unmark:allowed#3

Authored path: `Attendance.Unmark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 8.
- Covered by [Attendance](../design/compositions/Attendance.md), line 13.

```reaction
when AttendanceTracking.unmark (event: shift, user: member), asked by Attendance.Unmark:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/attendance/unmark", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Attendance.Unmark:no-shift#2

Authored path: `Attendance.Unmark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 8.
- Covered by [Attendance](../design/compositions/Attendance.md), line 13.

```reaction
when Sessioning.current (session, user), asked by Attendance.Unmark
where
  earlier, RequestBoundary.request (member, path: "/attendance/unmark", requestId, session, shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Attendance.Unmark:not-allowed#2

Authored path: `Attendance.Unmark`.
- Covered by [Attendance](../design/compositions/Attendance.md), line 8.
- Covered by [Attendance](../design/compositions/Attendance.md), line 13.

```reaction
when Sessioning.current (session, user), asked by Attendance.Unmark
where
  earlier, RequestBoundary.request (member, path: "/attendance/unmark", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may mark attendance in (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Auth.Current

Authored path: `Auth.Current`.
- Covered by [Auth](../design/compositions/Auth.md), line 12.
- Covered by [Auth](../design/compositions/Auth.md), line 18.

```reaction
when RequestBoundary.request (path: "/auth/current", requestId, session)
then
  Sessioning.current (session)
```

### Auth.Current#2

Authored path: `Auth.Current`.
- Covered by [Auth](../design/compositions/Auth.md), line 12.
- Covered by [Auth](../design/compositions/Auth.md), line 18.

```reaction
when Sessioning.current (session, user), asked by Auth.Current
where
  earlier, RequestBoundary.request (path: "/auth/current", requestId, session)
then
  RequestBoundary.respond (account: former "the account of (user)" with (user), requestId)
```

### Auth.Login

Authored path: `Auth.Login`.
- Covered by [Auth](../design/compositions/Auth.md), line 5.
- Covered by [Auth](../design/compositions/Auth.md), line 9.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  UserAuthenticating.login (password, username)
```

### Auth.Login#2

Authored path: `Auth.Login`.
- Covered by [Auth](../design/compositions/Auth.md), line 5.
- Covered by [Auth](../design/compositions/Auth.md), line 9.

```reaction
when UserAuthenticating.login (password, username, user), asked by Auth.Login
then
  Sessioning.start (user)
```

### Auth.Login#3

Authored path: `Auth.Login`.
- Covered by [Auth](../design/compositions/Auth.md), line 5.
- Covered by [Auth](../design/compositions/Auth.md), line 9.

```reaction
when Sessioning.start (user, session), asked by Auth.Login#2
where
  earlier, RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (requestId, session, user)
```

### Auth.Logout

Authored path: `Auth.Logout`.
- Covered by [Auth](../design/compositions/Auth.md), line 14.
- Covered by [Auth](../design/compositions/Auth.md), line 19.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Sessioning.end (session)
```

### Auth.Logout#2

Authored path: `Auth.Logout`.
- Covered by [Auth](../design/compositions/Auth.md), line 14.
- Covered by [Auth](../design/compositions/Auth.md), line 19.

```reaction
when Sessioning.end (session), asked by Auth.Logout
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (requestId, session)
```

### Auth.Register

Authored path: `Auth.Register`.
- Covered by [Auth](../design/compositions/Auth.md), line 3.
- Covered by [Auth](../design/compositions/Auth.md), line 8.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  UserAuthenticating.register (password, username)
```

### Auth.Register#2

Authored path: `Auth.Register`.
- Covered by [Auth](../design/compositions/Auth.md), line 3.
- Covered by [Auth](../design/compositions/Auth.md), line 8.

```reaction
when UserAuthenticating.register (password, username, user), asked by Auth.Register
then
  Sessioning.start (user)
```

### Auth.Register#3

Authored path: `Auth.Register`.
- Covered by [Auth](../design/compositions/Auth.md), line 3.
- Covered by [Auth](../design/compositions/Auth.md), line 8.

```reaction
when Sessioning.start (user, session), asked by Auth.Register#2
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (requestId, session, user)
```

### Classes.Accept

Authored path: `Classes.Accept`.
- Covered by [Classes](../design/compositions/Classes.md), line 28.
- Covered by [Classes](../design/compositions/Classes.md), line 32.

```reaction
when RequestBoundary.request (invite, path: "/invites/accept", requestId, session)
then
  Sessioning.current (session)
```

### Classes.Accept#2

Authored path: `Classes.Accept`.
- Covered by [Classes](../design/compositions/Classes.md), line 28.
- Covered by [Classes](../design/compositions/Classes.md), line 32.

```reaction
when Sessioning.current (session, user), asked by Classes.Accept
where
  earlier, RequestBoundary.request (invite, path: "/invites/accept", requestId, session)
then
  RoleBasedAccessing.accept (invite, user)
```

### Classes.Accept#3

Authored path: `Classes.Accept`.
- Covered by [Classes](../design/compositions/Classes.md), line 28.
- Covered by [Classes](../design/compositions/Classes.md), line 32.

```reaction
when RoleBasedAccessing.accept (invite, user), asked by Classes.Accept#2
where
  earlier, RequestBoundary.request (invite, path: "/invites/accept", requestId, session)
then
  RequestBoundary.respond (invite, requestId)
```

### Classes.ChangeRole

Authored path: `Classes.ChangeRole`.
- Covered by [Classes](../design/compositions/Classes.md), line 71.
- Covered by [Classes](../design/compositions/Classes.md), line 77.

```reaction
when RequestBoundary.request (group, member, path: "/classes/change-role", requestId, role, session)
then
  Sessioning.current (session)
```

### Classes.ChangeRole:allowed#2

Authored path: `Classes.ChangeRole`.
- Covered by [Classes](../design/compositions/Classes.md), line 71.
- Covered by [Classes](../design/compositions/Classes.md), line 77.

```reaction
when Sessioning.current (session, user), asked by Classes.ChangeRole
where
  earlier, RequestBoundary.request (group, member, path: "/classes/change-role", requestId, role, session)
  view "(user) may manage the members of (group)" with (group, user)
then
  RoleBasedAccessing.changeRole (group, role, user: member)
```

### Classes.ChangeRole:allowed#3

Authored path: `Classes.ChangeRole`.
- Covered by [Classes](../design/compositions/Classes.md), line 71.
- Covered by [Classes](../design/compositions/Classes.md), line 77.

```reaction
when RoleBasedAccessing.changeRole (group, role, user: member), asked by Classes.ChangeRole:allowed#2
where
  earlier, RequestBoundary.request (group, member, path: "/classes/change-role", requestId, role, session)
then
  RequestBoundary.respond (member, requestId)
```

### Classes.ChangeRole:not-allowed#2

Authored path: `Classes.ChangeRole`.
- Covered by [Classes](../design/compositions/Classes.md), line 71.
- Covered by [Classes](../design/compositions/Classes.md), line 77.

```reaction
when Sessioning.current (session, user), asked by Classes.ChangeRole
where
  earlier, RequestBoundary.request (group, member, path: "/classes/change-role", requestId, role, session)
  no view "(user) may manage the members of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Classes.ClassRoster

Authored path: `Classes.ClassRoster`.
- Covered by [Classes](../design/compositions/Classes.md), line 36.
- Covered by [Classes](../design/compositions/Classes.md), line 41.

```reaction
when RequestBoundary.request (group, path: "/classes/roster", requestId, session)
then
  Sessioning.current (session)
```

### Classes.ClassRoster:member#2

Authored path: `Classes.ClassRoster`.
- Covered by [Classes](../design/compositions/Classes.md), line 36.
- Covered by [Classes](../design/compositions/Classes.md), line 41.

```reaction
when Sessioning.current (session, user), asked by Classes.ClassRoster
where
  earlier, RequestBoundary.request (group, path: "/classes/roster", requestId, session)
  view "(user) is a member of (group)" with (group, user)
  RoleBasedAccessing._group (group) has (owner)
then
  RequestBoundary.respond (owner, requestId, roster: former "the roster of (group)" with (group))
```

### Classes.ClassRoster:not-member#2

Authored path: `Classes.ClassRoster`.
- Covered by [Classes](../design/compositions/Classes.md), line 36.
- Covered by [Classes](../design/compositions/Classes.md), line 41.

```reaction
when Sessioning.current (session, user), asked by Classes.ClassRoster
where
  earlier, RequestBoundary.request (group, path: "/classes/roster", requestId, session)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Classes.Create

Authored path: `Classes.Create`.
- Covered by [Classes](../design/compositions/Classes.md), line 3.
- Covered by [Classes](../design/compositions/Classes.md), line 7.

```reaction
when RequestBoundary.request (name, path: "/classes/create", requestId, session)
then
  Sessioning.current (session)
```

### Classes.Create#2

Authored path: `Classes.Create`.
- Covered by [Classes](../design/compositions/Classes.md), line 3.
- Covered by [Classes](../design/compositions/Classes.md), line 7.

```reaction
when Sessioning.current (session, user), asked by Classes.Create
where
  earlier, RequestBoundary.request (name, path: "/classes/create", requestId, session)
then
  RoleBasedAccessing.createGroup (name, owner: user, ownerRole: "STAFF")
```

### Classes.Create#3

Authored path: `Classes.Create`.
- Covered by [Classes](../design/compositions/Classes.md), line 3.
- Covered by [Classes](../design/compositions/Classes.md), line 7.

```reaction
when RoleBasedAccessing.createGroup (name, owner: user, ownerRole: "STAFF", group), asked by Classes.Create#2
where
  earlier, RequestBoundary.request (name, path: "/classes/create", requestId, session)
then
  RequestBoundary.respond (group, requestId)
```

### Classes.Delete

Authored path: `Classes.Delete`.
- Covered by [Classes](../design/compositions/Classes.md), line 60.
- Covered by [Classes](../design/compositions/Classes.md), line 65.

```reaction
when RequestBoundary.request (group, path: "/classes/delete", requestId, session)
then
  Sessioning.current (session)
```

### Classes.Delete:not-owner#2

Authored path: `Classes.Delete`.
- Covered by [Classes](../design/compositions/Classes.md), line 60.
- Covered by [Classes](../design/compositions/Classes.md), line 65.

```reaction
when Sessioning.current (session, user), asked by Classes.Delete
where
  earlier, RequestBoundary.request (group, path: "/classes/delete", requestId, session)
  no view "(user) owns (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Classes.Delete:owner#2

Authored path: `Classes.Delete`.
- Covered by [Classes](../design/compositions/Classes.md), line 60.
- Covered by [Classes](../design/compositions/Classes.md), line 65.

```reaction
when Sessioning.current (session, user), asked by Classes.Delete
where
  earlier, RequestBoundary.request (group, path: "/classes/delete", requestId, session)
  view "(user) owns (group)" with (group, user)
then
  RoleBasedAccessing.deleteGroup (group)
```

### Classes.Delete:owner#3

Authored path: `Classes.Delete`.
- Covered by [Classes](../design/compositions/Classes.md), line 60.
- Covered by [Classes](../design/compositions/Classes.md), line 65.

```reaction
when RoleBasedAccessing.deleteGroup (group), asked by Classes.Delete:owner#2
where
  earlier, RequestBoundary.request (group, path: "/classes/delete", requestId, session)
then
  RequestBoundary.respond (group, requestId)
```

### Classes.Invite

Authored path: `Classes.Invite`.
- Covered by [Classes](../design/compositions/Classes.md), line 18.
- Covered by [Classes](../design/compositions/Classes.md), line 23.

```reaction
when RequestBoundary.request (group, path: "/classes/invite", requestId, role, session, username)
then
  Sessioning.current (session)
```

### Classes.Invite:allowed#2

Authored path: `Classes.Invite`.
- Covered by [Classes](../design/compositions/Classes.md), line 18.
- Covered by [Classes](../design/compositions/Classes.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Classes.Invite
where
  earlier, RequestBoundary.request (group, path: "/classes/invite", requestId, role, session, username)
  view "(user) may manage the members of (group)" with (group, user)
  UserAuthenticating._user (username) has (user: invitee)
then
  RoleBasedAccessing.invite (group, role, user: invitee)
```

### Classes.Invite:allowed#3

Authored path: `Classes.Invite`.
- Covered by [Classes](../design/compositions/Classes.md), line 18.
- Covered by [Classes](../design/compositions/Classes.md), line 23.

```reaction
when RoleBasedAccessing.invite (group, role, user: invitee, invite), asked by Classes.Invite:allowed#2
where
  earlier, RequestBoundary.request (group, path: "/classes/invite", requestId, role, session, username)
then
  RequestBoundary.respond (invite, requestId)
```

### Classes.Invite:not-allowed#2

Authored path: `Classes.Invite`.
- Covered by [Classes](../design/compositions/Classes.md), line 18.
- Covered by [Classes](../design/compositions/Classes.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Classes.Invite
where
  earlier, RequestBoundary.request (group, path: "/classes/invite", requestId, role, session, username)
  no view "(user) may manage the members of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Classes.Invite:unknown-user#2

Authored path: `Classes.Invite`.
- Covered by [Classes](../design/compositions/Classes.md), line 18.
- Covered by [Classes](../design/compositions/Classes.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Classes.Invite
where
  earlier, RequestBoundary.request (group, path: "/classes/invite", requestId, role, session, username)
  view "(user) may manage the members of (group)" with (group, user)
  no UserAuthenticating._user (username)
then
  RequestBoundary.respond (error: "NO_SUCH_USER", requestId)
```

### Classes.Invites

Authored path: `Classes.Invites`.
- Covered by [Classes](../design/compositions/Classes.md), line 47.
- Covered by [Classes](../design/compositions/Classes.md), line 53.

```reaction
when RequestBoundary.request (group, path: "/classes/invites", requestId, session)
then
  Sessioning.current (session)
```

### Classes.Invites:allowed#2

Authored path: `Classes.Invites`.
- Covered by [Classes](../design/compositions/Classes.md), line 47.
- Covered by [Classes](../design/compositions/Classes.md), line 53.

```reaction
when Sessioning.current (session, user), asked by Classes.Invites
where
  earlier, RequestBoundary.request (group, path: "/classes/invites", requestId, session)
  view "(user) may manage the members of (group)" with (group, user)
then
  RequestBoundary.respond (invites: former "the pending invites of (group)" with (group), requestId)
```

### Classes.Invites:not-allowed#2

Authored path: `Classes.Invites`.
- Covered by [Classes](../design/compositions/Classes.md), line 47.
- Covered by [Classes](../design/compositions/Classes.md), line 53.

```reaction
when Sessioning.current (session, user), asked by Classes.Invites
where
  earlier, RequestBoundary.request (group, path: "/classes/invites", requestId, session)
  no view "(user) may manage the members of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Classes.Leave

Authored path: `Classes.Leave`.
- Covered by [Classes](../design/compositions/Classes.md), line 73.
- Covered by [Classes](../design/compositions/Classes.md), line 79.

```reaction
when RequestBoundary.request (group, path: "/classes/leave", requestId, session)
then
  Sessioning.current (session)
```

### Classes.Leave#2

Authored path: `Classes.Leave`.
- Covered by [Classes](../design/compositions/Classes.md), line 73.
- Covered by [Classes](../design/compositions/Classes.md), line 79.

```reaction
when Sessioning.current (session, user), asked by Classes.Leave
where
  earlier, RequestBoundary.request (group, path: "/classes/leave", requestId, session)
then
  RoleBasedAccessing.removeMember (group, user)
```

### Classes.Leave#3

Authored path: `Classes.Leave`.
- Covered by [Classes](../design/compositions/Classes.md), line 73.
- Covered by [Classes](../design/compositions/Classes.md), line 79.

```reaction
when RoleBasedAccessing.removeMember (group, user), asked by Classes.Leave#2
where
  earlier, RequestBoundary.request (group, path: "/classes/leave", requestId, session)
then
  RequestBoundary.respond (group, requestId)
```

### Classes.Mine

Authored path: `Classes.Mine`.
- Covered by [Classes](../design/compositions/Classes.md), line 10.
- Covered by [Classes](../design/compositions/Classes.md), line 14.

```reaction
when RequestBoundary.request (path: "/classes/mine", requestId, session)
then
  Sessioning.current (session)
```

### Classes.Mine#2

Authored path: `Classes.Mine`.
- Covered by [Classes](../design/compositions/Classes.md), line 10.
- Covered by [Classes](../design/compositions/Classes.md), line 14.

```reaction
when Sessioning.current (session, user), asked by Classes.Mine
where
  earlier, RequestBoundary.request (path: "/classes/mine", requestId, session)
then
  RequestBoundary.respond (classes: former "the classes of (user)" with (user), requestId)
```

### Classes.MyInvitesList

Authored path: `Classes.MyInvitesList`.
- Covered by [Classes](../design/compositions/Classes.md), line 26.
- Covered by [Classes](../design/compositions/Classes.md), line 31.

```reaction
when RequestBoundary.request (path: "/invites/mine", requestId, session)
then
  Sessioning.current (session)
```

### Classes.MyInvitesList#2

Authored path: `Classes.MyInvitesList`.
- Covered by [Classes](../design/compositions/Classes.md), line 26.
- Covered by [Classes](../design/compositions/Classes.md), line 31.

```reaction
when Sessioning.current (session, user), asked by Classes.MyInvitesList
where
  earlier, RequestBoundary.request (path: "/invites/mine", requestId, session)
then
  RequestBoundary.respond (invites: former "the invites of (user)" with (user), requestId)
```

### Classes.RemoveFromSchedule

Authored path: `Classes.RemoveFromSchedule`.
- Covered by [Classes](../design/compositions/Classes.md), line 83.

```reaction
when RoleBasedAccessing.removeMember (group, user)
where
  instant is the current flow's instant
then
  ShiftScheduling.removeFromSchedule (context: group, from: instant, user)
```

### Classes.RemoveMember

Authored path: `Classes.RemoveMember`.
- Covered by [Classes](../design/compositions/Classes.md), line 72.
- Covered by [Classes](../design/compositions/Classes.md), line 78.

```reaction
when RequestBoundary.request (group, member, path: "/classes/remove", requestId, session)
then
  Sessioning.current (session)
```

### Classes.RemoveMember:allowed#2

Authored path: `Classes.RemoveMember`.
- Covered by [Classes](../design/compositions/Classes.md), line 72.
- Covered by [Classes](../design/compositions/Classes.md), line 78.

```reaction
when Sessioning.current (session, user), asked by Classes.RemoveMember
where
  earlier, RequestBoundary.request (group, member, path: "/classes/remove", requestId, session)
  view "(user) may manage the members of (group)" with (group, user)
then
  RoleBasedAccessing.removeMember (group, user: member)
```

### Classes.RemoveMember:allowed#3

Authored path: `Classes.RemoveMember`.
- Covered by [Classes](../design/compositions/Classes.md), line 72.
- Covered by [Classes](../design/compositions/Classes.md), line 78.

```reaction
when RoleBasedAccessing.removeMember (group, user: member), asked by Classes.RemoveMember:allowed#2
where
  earlier, RequestBoundary.request (group, member, path: "/classes/remove", requestId, session)
then
  RequestBoundary.respond (member, requestId)
```

### Classes.RemoveMember:not-allowed#2

Authored path: `Classes.RemoveMember`.
- Covered by [Classes](../design/compositions/Classes.md), line 72.
- Covered by [Classes](../design/compositions/Classes.md), line 78.

```reaction
when Sessioning.current (session, user), asked by Classes.RemoveMember
where
  earlier, RequestBoundary.request (group, member, path: "/classes/remove", requestId, session)
  no view "(user) may manage the members of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Classes.WithdrawCoverRequests

Authored path: `Classes.WithdrawCoverRequests`.
- Covered by [Classes](../design/compositions/Classes.md), line 86.

```reaction
when RoleBasedAccessing.removeMember (group, user)
where
  ShiftScheduling._weeks (context: group) has (week)
  ShiftScheduling._shiftsInWeek (week) has (shift)
  ShiftTrading._requestsForShift (shift) has (request, requester: user, status)
  status is among ["OPEN", "CLAIMED"]
then
  ShiftTrading.withdraw (request)
```

### Classes.WithdrawInvite

Authored path: `Classes.WithdrawInvite`.
- Covered by [Classes](../design/compositions/Classes.md), line 49.
- Covered by [Classes](../design/compositions/Classes.md), line 54.

```reaction
when RequestBoundary.request (group, invite, path: "/classes/withdraw-invite", requestId, session)
then
  Sessioning.current (session)
```

### Classes.WithdrawInvite:allowed#2

Authored path: `Classes.WithdrawInvite`.
- Covered by [Classes](../design/compositions/Classes.md), line 49.
- Covered by [Classes](../design/compositions/Classes.md), line 54.

```reaction
when Sessioning.current (session, user), asked by Classes.WithdrawInvite
where
  earlier, RequestBoundary.request (group, invite, path: "/classes/withdraw-invite", requestId, session)
  view "(user) may manage the members of (group)" with (group, user)
  RoleBasedAccessing._invitesForGroup (group) has (invite)
then
  RoleBasedAccessing.withdrawInvite (invite)
```

### Classes.WithdrawInvite:allowed#3

Authored path: `Classes.WithdrawInvite`.
- Covered by [Classes](../design/compositions/Classes.md), line 49.
- Covered by [Classes](../design/compositions/Classes.md), line 54.

```reaction
when RoleBasedAccessing.withdrawInvite (invite), asked by Classes.WithdrawInvite:allowed#2
where
  earlier, RequestBoundary.request (group, invite, path: "/classes/withdraw-invite", requestId, session)
then
  RequestBoundary.respond (invite, requestId)
```

### Classes.WithdrawInvite:no-invite#2

Authored path: `Classes.WithdrawInvite`.
- Covered by [Classes](../design/compositions/Classes.md), line 49.
- Covered by [Classes](../design/compositions/Classes.md), line 54.

```reaction
when Sessioning.current (session, user), asked by Classes.WithdrawInvite
where
  earlier, RequestBoundary.request (group, invite, path: "/classes/withdraw-invite", requestId, session)
  view "(user) may manage the members of (group)" with (group, user)
  no RoleBasedAccessing._invitesForGroup (group) has (invite)
then
  RequestBoundary.respond (error: "NO_SUCH_INVITE", requestId)
```

### Classes.WithdrawInvite:not-allowed#2

Authored path: `Classes.WithdrawInvite`.
- Covered by [Classes](../design/compositions/Classes.md), line 49.
- Covered by [Classes](../design/compositions/Classes.md), line 54.

```reaction
when Sessioning.current (session, user), asked by Classes.WithdrawInvite
where
  earlier, RequestBoundary.request (group, invite, path: "/classes/withdraw-invite", requestId, session)
  no view "(user) may manage the members of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Cleanup.ClearShiftAttendance

Authored path: `Cleanup.ClearShiftAttendance`.
- Covered by [Cleanup](../design/compositions/Cleanup.md), line 10.

```reaction
when ShiftScheduling.deleteShift (shift)
then
  AttendanceTracking.clearEvent (event: shift)
```

### Cleanup.ClearShiftRequests

Authored path: `Cleanup.ClearShiftRequests`.
- Covered by [Cleanup](../design/compositions/Cleanup.md), line 11.

```reaction
when ShiftScheduling.deleteShift (shift)
then
  ShiftTrading.clearShift (shift)
```

### Cleanup.DeleteClassSlots

Authored path: `Cleanup.DeleteClassSlots`.
- Covered by [Cleanup](../design/compositions/Cleanup.md), line 17.

```reaction
when RoleBasedAccessing.deleteGroup (group)
where
  ShiftScheduling._slots (context: group) has (slot)
then
  ShiftScheduling.deleteSlot (slot)
```

### Cleanup.DeleteClassWeeks

Authored path: `Cleanup.DeleteClassWeeks`.
- Covered by [Cleanup](../design/compositions/Cleanup.md), line 16.

```reaction
when RoleBasedAccessing.deleteGroup (group)
where
  ShiftScheduling._weeks (context: group) has (week)
then
  ShiftScheduling.deleteWeek (week)
```

### Cleanup.DeleteWeekShifts

Authored path: `Cleanup.DeleteWeekShifts`.
- Covered by [Cleanup](../design/compositions/Cleanup.md), line 13.

```reaction
when ShiftScheduling.deleteWeek (week)
where
  ShiftScheduling._shiftsInWeek (week) has (shift)
then
  ShiftScheduling.deleteShift (shift)
```

### Covers.ApplyCover

Authored path: `Covers.ApplyCover`.
- Covered by [Covers](../design/compositions/Covers.md), line 7.

```reaction
when ShiftTrading.approve (request)
where
  ShiftTrading._request (request) has (claimer, requester, shift)
then
  ShiftScheduling.reassign (from: requester, shift, to: claimer)
```

### Covers.Approve

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when RequestBoundary.request (path: "/covers/approve", request, requestId, session)
then
  Sessioning.current (session)
```

### Covers.Approve:allowed#2

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when Sessioning.current (session, user), asked by Covers.Approve
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
  ShiftTrading._request (request) has (claimer, requester, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may approve cover requests in (group)" with (group, user)
  ShiftScheduling._assignees (shift) has (user: requester)
  no ShiftScheduling._assignees (shift) has (user: claimer)
  view "(user) is a member of (group)" with (group, user: claimer)
then
  ShiftTrading.approve (request)
```

### Covers.Approve:allowed#3

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when ShiftTrading.approve (request), asked by Covers.Approve:allowed#2
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
then
  RequestBoundary.respond (request, requestId)
```

### Covers.Approve:claimer-already-on#2

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when Sessioning.current (session, user), asked by Covers.Approve
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
  ShiftTrading._request (request) has (claimer, requester, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may approve cover requests in (group)" with (group, user)
  ShiftScheduling._assignees (shift) has (user: requester)
  ShiftScheduling._assignees (shift) has (user: claimer)
then
  RequestBoundary.respond (error: "CANNOT_APPLY", requestId)
```

### Covers.Approve:claimer-not-member#2

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when Sessioning.current (session, user), asked by Covers.Approve
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
  ShiftTrading._request (request) has (claimer, requester, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may approve cover requests in (group)" with (group, user)
  ShiftScheduling._assignees (shift) has (user: requester)
  no ShiftScheduling._assignees (shift) has (user: claimer)
  no view "(user) is a member of (group)" with (group, user: claimer)
then
  RequestBoundary.respond (error: "CANNOT_APPLY", requestId)
```

### Covers.Approve:no-request#2

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when Sessioning.current (session, user), asked by Covers.Approve
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
  no ShiftTrading._request (request)
then
  RequestBoundary.respond (error: "NO_SUCH_REQUEST", requestId)
```

### Covers.Approve:no-shift#2

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when Sessioning.current (session, user), asked by Covers.Approve
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Covers.Approve:not-allowed#2

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when Sessioning.current (session, user), asked by Covers.Approve
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may approve cover requests in (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Covers.Approve:requester-gone#2

Authored path: `Covers.Approve`.
- Covered by [Covers](../design/compositions/Covers.md), line 28.
- Covered by [Covers](../design/compositions/Covers.md), line 37.

```reaction
when Sessioning.current (session, user), asked by Covers.Approve
where
  earlier, RequestBoundary.request (path: "/covers/approve", request, requestId, session)
  ShiftTrading._request (request) has (requester, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may approve cover requests in (group)" with (group, user)
  no ShiftScheduling._assignees (shift) has (user: requester)
then
  RequestBoundary.respond (error: "CANNOT_APPLY", requestId)
```

### Covers.Claim

Authored path: `Covers.Claim`.
- Covered by [Covers](../design/compositions/Covers.md), line 16.
- Covered by [Covers](../design/compositions/Covers.md), line 21.

```reaction
when RequestBoundary.request (path: "/covers/claim", request, requestId, session)
then
  Sessioning.current (session)
```

### Covers.Claim:allowed#2

Authored path: `Covers.Claim`.
- Covered by [Covers](../design/compositions/Covers.md), line 16.
- Covered by [Covers](../design/compositions/Covers.md), line 21.

```reaction
when Sessioning.current (session, user), asked by Covers.Claim
where
  earlier, RequestBoundary.request (path: "/covers/claim", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) is a member of (group)" with (group, user)
  no ShiftScheduling._assignees (shift) has (user)
then
  ShiftTrading.claim (claimer: user, request)
```

### Covers.Claim:allowed#3

Authored path: `Covers.Claim`.
- Covered by [Covers](../design/compositions/Covers.md), line 16.
- Covered by [Covers](../design/compositions/Covers.md), line 21.

```reaction
when ShiftTrading.claim (claimer: user, request), asked by Covers.Claim:allowed#2
where
  earlier, RequestBoundary.request (path: "/covers/claim", request, requestId, session)
then
  RequestBoundary.respond (request, requestId)
```

### Covers.Claim:already-on-shift#2

Authored path: `Covers.Claim`.
- Covered by [Covers](../design/compositions/Covers.md), line 16.
- Covered by [Covers](../design/compositions/Covers.md), line 21.

```reaction
when Sessioning.current (session, user), asked by Covers.Claim
where
  earlier, RequestBoundary.request (path: "/covers/claim", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) is a member of (group)" with (group, user)
  ShiftScheduling._assignees (shift) has (user)
then
  RequestBoundary.respond (error: "ALREADY_ON_SHIFT", requestId)
```

### Covers.Claim:no-request#2

Authored path: `Covers.Claim`.
- Covered by [Covers](../design/compositions/Covers.md), line 16.
- Covered by [Covers](../design/compositions/Covers.md), line 21.

```reaction
when Sessioning.current (session, user), asked by Covers.Claim
where
  earlier, RequestBoundary.request (path: "/covers/claim", request, requestId, session)
  no ShiftTrading._request (request)
then
  RequestBoundary.respond (error: "NO_SUCH_REQUEST", requestId)
```

### Covers.Claim:no-shift#2

Authored path: `Covers.Claim`.
- Covered by [Covers](../design/compositions/Covers.md), line 16.
- Covered by [Covers](../design/compositions/Covers.md), line 21.

```reaction
when Sessioning.current (session, user), asked by Covers.Claim
where
  earlier, RequestBoundary.request (path: "/covers/claim", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Covers.Claim:not-member#2

Authored path: `Covers.Claim`.
- Covered by [Covers](../design/compositions/Covers.md), line 16.
- Covered by [Covers](../design/compositions/Covers.md), line 21.

```reaction
when Sessioning.current (session, user), asked by Covers.Claim
where
  earlier, RequestBoundary.request (path: "/covers/claim", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Covers.Deny

Authored path: `Covers.Deny`.
- Covered by [Covers](../design/compositions/Covers.md), line 29.
- Covered by [Covers](../design/compositions/Covers.md), line 38.

```reaction
when RequestBoundary.request (path: "/covers/deny", request, requestId, session)
then
  Sessioning.current (session)
```

### Covers.Deny:allowed#2

Authored path: `Covers.Deny`.
- Covered by [Covers](../design/compositions/Covers.md), line 29.
- Covered by [Covers](../design/compositions/Covers.md), line 38.

```reaction
when Sessioning.current (session, user), asked by Covers.Deny
where
  earlier, RequestBoundary.request (path: "/covers/deny", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may approve cover requests in (group)" with (group, user)
then
  ShiftTrading.deny (request)
```

### Covers.Deny:allowed#3

Authored path: `Covers.Deny`.
- Covered by [Covers](../design/compositions/Covers.md), line 29.
- Covered by [Covers](../design/compositions/Covers.md), line 38.

```reaction
when ShiftTrading.deny (request), asked by Covers.Deny:allowed#2
where
  earlier, RequestBoundary.request (path: "/covers/deny", request, requestId, session)
then
  RequestBoundary.respond (request, requestId)
```

### Covers.Deny:no-request#2

Authored path: `Covers.Deny`.
- Covered by [Covers](../design/compositions/Covers.md), line 29.
- Covered by [Covers](../design/compositions/Covers.md), line 38.

```reaction
when Sessioning.current (session, user), asked by Covers.Deny
where
  earlier, RequestBoundary.request (path: "/covers/deny", request, requestId, session)
  no ShiftTrading._request (request)
then
  RequestBoundary.respond (error: "NO_SUCH_REQUEST", requestId)
```

### Covers.Deny:no-shift#2

Authored path: `Covers.Deny`.
- Covered by [Covers](../design/compositions/Covers.md), line 29.
- Covered by [Covers](../design/compositions/Covers.md), line 38.

```reaction
when Sessioning.current (session, user), asked by Covers.Deny
where
  earlier, RequestBoundary.request (path: "/covers/deny", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Covers.Deny:not-allowed#2

Authored path: `Covers.Deny`.
- Covered by [Covers](../design/compositions/Covers.md), line 29.
- Covered by [Covers](../design/compositions/Covers.md), line 38.

```reaction
when Sessioning.current (session, user), asked by Covers.Deny
where
  earlier, RequestBoundary.request (path: "/covers/deny", request, requestId, session)
  ShiftTrading._request (request) has (shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may approve cover requests in (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Covers.ForClass

Authored path: `Covers.ForClass`.
- Covered by [Covers](../design/compositions/Covers.md), line 50.
- Covered by [Covers](../design/compositions/Covers.md), line 54.

```reaction
when RequestBoundary.request (group, path: "/covers/class", requestId, session)
then
  Sessioning.current (session)
```

### Covers.ForClass:member#2

Authored path: `Covers.ForClass`.
- Covered by [Covers](../design/compositions/Covers.md), line 50.
- Covered by [Covers](../design/compositions/Covers.md), line 54.

```reaction
when Sessioning.current (session, user), asked by Covers.ForClass
where
  earlier, RequestBoundary.request (group, path: "/covers/class", requestId, session)
  view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (requestId, requests: former "the cover requests in (group)" with (group))
```

### Covers.ForClass:not-member#2

Authored path: `Covers.ForClass`.
- Covered by [Covers](../design/compositions/Covers.md), line 50.
- Covered by [Covers](../design/compositions/Covers.md), line 54.

```reaction
when Sessioning.current (session, user), asked by Covers.ForClass
where
  earlier, RequestBoundary.request (group, path: "/covers/class", requestId, session)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Covers.ForWeek

Authored path: `Covers.ForWeek`.
- Covered by [Covers](../design/compositions/Covers.md), line 43.
- Covered by [Covers](../design/compositions/Covers.md), line 47.

```reaction
when RequestBoundary.request (path: "/covers/week", requestId, session, week)
then
  Sessioning.current (session)
```

### Covers.ForWeek:member#2

Authored path: `Covers.ForWeek`.
- Covered by [Covers](../design/compositions/Covers.md), line 43.
- Covered by [Covers](../design/compositions/Covers.md), line 47.

```reaction
when Sessioning.current (session, user), asked by Covers.ForWeek
where
  earlier, RequestBoundary.request (path: "/covers/week", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (requestId, requests: former "the cover requests in (week)" with (week))
```

### Covers.ForWeek:no-week#2

Authored path: `Covers.ForWeek`.
- Covered by [Covers](../design/compositions/Covers.md), line 43.
- Covered by [Covers](../design/compositions/Covers.md), line 47.

```reaction
when Sessioning.current (session, user), asked by Covers.ForWeek
where
  earlier, RequestBoundary.request (path: "/covers/week", requestId, session, week)
  no ShiftScheduling._week (week)
then
  RequestBoundary.respond (error: "NO_SUCH_WEEK", requestId)
```

### Covers.ForWeek:not-member#2

Authored path: `Covers.ForWeek`.
- Covered by [Covers](../design/compositions/Covers.md), line 43.
- Covered by [Covers](../design/compositions/Covers.md), line 47.

```reaction
when Sessioning.current (session, user), asked by Covers.ForWeek
where
  earlier, RequestBoundary.request (path: "/covers/week", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Covers.Request

Authored path: `Covers.Request`.
- Covered by [Covers](../design/compositions/Covers.md), line 13.
- Covered by [Covers](../design/compositions/Covers.md), line 20.

```reaction
when RequestBoundary.request (path: "/covers/request", requestId, session, shift)
then
  Sessioning.current (session)
```

### Covers.Request:no-shift#2

Authored path: `Covers.Request`.
- Covered by [Covers](../design/compositions/Covers.md), line 13.
- Covered by [Covers](../design/compositions/Covers.md), line 20.

```reaction
when Sessioning.current (session, user), asked by Covers.Request
where
  earlier, RequestBoundary.request (path: "/covers/request", requestId, session, shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Covers.Request:not-on-shift#2

Authored path: `Covers.Request`.
- Covered by [Covers](../design/compositions/Covers.md), line 13.
- Covered by [Covers](../design/compositions/Covers.md), line 20.

```reaction
when Sessioning.current (session, user), asked by Covers.Request
where
  earlier, RequestBoundary.request (path: "/covers/request", requestId, session, shift)
  ShiftScheduling._shift (shift)
  no ShiftScheduling._assignees (shift) has (user)
then
  RequestBoundary.respond (error: "NOT_ON_SHIFT", requestId)
```

### Covers.Request:on-shift#2

Authored path: `Covers.Request`.
- Covered by [Covers](../design/compositions/Covers.md), line 13.
- Covered by [Covers](../design/compositions/Covers.md), line 20.

```reaction
when Sessioning.current (session, user), asked by Covers.Request
where
  earlier, RequestBoundary.request (path: "/covers/request", requestId, session, shift)
  ShiftScheduling._assignees (shift) has (user)
then
  ShiftTrading.requestCover (requester: user, shift)
```

### Covers.Request:on-shift#3

Authored path: `Covers.Request`.
- Covered by [Covers](../design/compositions/Covers.md), line 13.
- Covered by [Covers](../design/compositions/Covers.md), line 20.

```reaction
when ShiftTrading.requestCover (requester: user, shift, request), asked by Covers.Request:on-shift#2
where
  earlier, RequestBoundary.request (path: "/covers/request", requestId, session, shift)
then
  RequestBoundary.respond (request, requestId)
```

### Covers.Withdraw

Authored path: `Covers.Withdraw`.
- Covered by [Covers](../design/compositions/Covers.md), line 17.
- Covered by [Covers](../design/compositions/Covers.md), line 22.

```reaction
when RequestBoundary.request (path: "/covers/withdraw", request, requestId, session)
then
  Sessioning.current (session)
```

### Covers.Withdraw:no-request#2

Authored path: `Covers.Withdraw`.
- Covered by [Covers](../design/compositions/Covers.md), line 17.
- Covered by [Covers](../design/compositions/Covers.md), line 22.

```reaction
when Sessioning.current (session, user), asked by Covers.Withdraw
where
  earlier, RequestBoundary.request (path: "/covers/withdraw", request, requestId, session)
  no ShiftTrading._request (request)
then
  RequestBoundary.respond (error: "NO_SUCH_REQUEST", requestId)
```

### Covers.Withdraw:not-requester#2

Authored path: `Covers.Withdraw`.
- Covered by [Covers](../design/compositions/Covers.md), line 17.
- Covered by [Covers](../design/compositions/Covers.md), line 22.

```reaction
when Sessioning.current (session, user), asked by Covers.Withdraw
where
  earlier, RequestBoundary.request (path: "/covers/withdraw", request, requestId, session)
  ShiftTrading._request (request)
  no ShiftTrading._request (request) has (requester: user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Covers.Withdraw:requester#2

Authored path: `Covers.Withdraw`.
- Covered by [Covers](../design/compositions/Covers.md), line 17.
- Covered by [Covers](../design/compositions/Covers.md), line 22.

```reaction
when Sessioning.current (session, user), asked by Covers.Withdraw
where
  earlier, RequestBoundary.request (path: "/covers/withdraw", request, requestId, session)
  ShiftTrading._request (request) has (requester: user)
then
  ShiftTrading.withdraw (request)
```

### Covers.Withdraw:requester#3

Authored path: `Covers.Withdraw`.
- Covered by [Covers](../design/compositions/Covers.md), line 17.
- Covered by [Covers](../design/compositions/Covers.md), line 22.

```reaction
when ShiftTrading.withdraw (request), asked by Covers.Withdraw:requester#2
where
  earlier, RequestBoundary.request (path: "/covers/withdraw", request, requestId, session)
then
  RequestBoundary.respond (request, requestId)
```

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Schedule.AssignShift

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.
- Covered by [Schedule](../design/compositions/Schedule.md), line 74.

```reaction
when RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
then
  Sessioning.current (session)
```

### Schedule.AssignShift:allowed#2

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.
- Covered by [Schedule](../design/compositions/Schedule.md), line 74.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignShift
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
  view "(user) is a member of (group)" with (group, user: member)
then
  ShiftScheduling.assign (shift, user: member)
```

### Schedule.AssignShift:allowed#3

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.
- Covered by [Schedule](../design/compositions/Schedule.md), line 74.

```reaction
when ShiftScheduling.assign (shift, user: member), asked by Schedule.AssignShift:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.AssignShift:no-shift#2

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.
- Covered by [Schedule](../design/compositions/Schedule.md), line 74.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignShift
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Schedule.AssignShift:not-allowed#2

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.
- Covered by [Schedule](../design/compositions/Schedule.md), line 74.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignShift
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.AssignShift:not-in-class#2

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.
- Covered by [Schedule](../design/compositions/Schedule.md), line 74.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignShift
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
  no view "(user) is a member of (group)" with (group, user: member)
then
  RequestBoundary.respond (error: "NOT_IN_CLASS", requestId)
```

### Schedule.AssignSlot

Authored path: `Schedule.AssignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 31.
- Covered by [Schedule](../design/compositions/Schedule.md), line 43.

```reaction
when RequestBoundary.request (member, path: "/schedule/slots/assign", requestId, session, slot)
then
  Sessioning.current (session)
```

### Schedule.AssignSlot:allowed#2

Authored path: `Schedule.AssignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 31.
- Covered by [Schedule](../design/compositions/Schedule.md), line 43.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignSlot
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/assign", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
  view "(user) is a member of (group)" with (group, user: member)
then
  ShiftScheduling.assignSlot (slot, user: member)
```

### Schedule.AssignSlot:allowed#3

Authored path: `Schedule.AssignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 31.
- Covered by [Schedule](../design/compositions/Schedule.md), line 43.

```reaction
when ShiftScheduling.assignSlot (slot, user: member), asked by Schedule.AssignSlot:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/assign", requestId, session, slot)
then
  RequestBoundary.respond (requestId, slot)
```

### Schedule.AssignSlot:no-slot#2

Authored path: `Schedule.AssignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 31.
- Covered by [Schedule](../design/compositions/Schedule.md), line 43.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignSlot
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/assign", requestId, session, slot)
  no ShiftScheduling._slot (slot)
then
  RequestBoundary.respond (error: "NO_SUCH_SLOT", requestId)
```

### Schedule.AssignSlot:not-allowed#2

Authored path: `Schedule.AssignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 31.
- Covered by [Schedule](../design/compositions/Schedule.md), line 43.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignSlot
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/assign", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.AssignSlot:not-in-class#2

Authored path: `Schedule.AssignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 31.
- Covered by [Schedule](../design/compositions/Schedule.md), line 43.

```reaction
when Sessioning.current (session, user), asked by Schedule.AssignSlot
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/assign", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
  no view "(user) is a member of (group)" with (group, user: member)
then
  RequestBoundary.respond (error: "NOT_IN_CLASS", requestId)
```

### Schedule.CreateShift

Authored path: `Schedule.CreateShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 72.

```reaction
when RequestBoundary.request (capacity, end, path: "/schedule/shifts/create", requestId, session, start, week)
then
  Sessioning.current (session)
```

### Schedule.CreateShift:allowed#2

Authored path: `Schedule.CreateShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 72.

```reaction
when Sessioning.current (session, user), asked by Schedule.CreateShift
where
  earlier, RequestBoundary.request (capacity, end, path: "/schedule/shifts/create", requestId, session, start, week)
  ShiftScheduling._week (week) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.createShift (capacity, end, start, week)
```

### Schedule.CreateShift:allowed#3

Authored path: `Schedule.CreateShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 72.

```reaction
when ShiftScheduling.createShift (capacity, end, start, week, shift), asked by Schedule.CreateShift:allowed#2
where
  earlier, RequestBoundary.request (capacity, end, path: "/schedule/shifts/create", requestId, session, start, week)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.CreateShift:no-week#2

Authored path: `Schedule.CreateShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 72.

```reaction
when Sessioning.current (session, user), asked by Schedule.CreateShift
where
  earlier, RequestBoundary.request (capacity, end, path: "/schedule/shifts/create", requestId, session, start, week)
  no ShiftScheduling._week (week)
then
  RequestBoundary.respond (error: "NO_SUCH_WEEK", requestId)
```

### Schedule.CreateShift:not-allowed#2

Authored path: `Schedule.CreateShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 72.

```reaction
when Sessioning.current (session, user), asked by Schedule.CreateShift
where
  earlier, RequestBoundary.request (capacity, end, path: "/schedule/shifts/create", requestId, session, start, week)
  ShiftScheduling._week (week) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.CreateSlot

Authored path: `Schedule.CreateSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 29.
- Covered by [Schedule](../design/compositions/Schedule.md), line 41.

```reaction
when RequestBoundary.request (capacity, endMinute, group, path: "/schedule/slots/create", requestId, session, startMinute, weekday)
then
  Sessioning.current (session)
```

### Schedule.CreateSlot:allowed#2

Authored path: `Schedule.CreateSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 29.
- Covered by [Schedule](../design/compositions/Schedule.md), line 41.

```reaction
when Sessioning.current (session, user), asked by Schedule.CreateSlot
where
  earlier, RequestBoundary.request (capacity, endMinute, group, path: "/schedule/slots/create", requestId, session, startMinute, weekday)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.createSlot (capacity, context: group, endMinute, startMinute, weekday)
```

### Schedule.CreateSlot:allowed#3

Authored path: `Schedule.CreateSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 29.
- Covered by [Schedule](../design/compositions/Schedule.md), line 41.

```reaction
when ShiftScheduling.createSlot (capacity, context: group, endMinute, startMinute, weekday, slot), asked by Schedule.CreateSlot:allowed#2
where
  earlier, RequestBoundary.request (capacity, endMinute, group, path: "/schedule/slots/create", requestId, session, startMinute, weekday)
then
  RequestBoundary.respond (requestId, slot)
```

### Schedule.CreateSlot:not-allowed#2

Authored path: `Schedule.CreateSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 29.
- Covered by [Schedule](../design/compositions/Schedule.md), line 41.

```reaction
when Sessioning.current (session, user), asked by Schedule.CreateSlot
where
  earlier, RequestBoundary.request (capacity, endMinute, group, path: "/schedule/slots/create", requestId, session, startMinute, weekday)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.DeleteShift

Authored path: `Schedule.DeleteShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 73.

```reaction
when RequestBoundary.request (path: "/schedule/shifts/delete", requestId, session, shift)
then
  Sessioning.current (session)
```

### Schedule.DeleteShift:allowed#2

Authored path: `Schedule.DeleteShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 73.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteShift
where
  earlier, RequestBoundary.request (path: "/schedule/shifts/delete", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.deleteShift (shift)
```

### Schedule.DeleteShift:allowed#3

Authored path: `Schedule.DeleteShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 73.

```reaction
when ShiftScheduling.deleteShift (shift), asked by Schedule.DeleteShift:allowed#2
where
  earlier, RequestBoundary.request (path: "/schedule/shifts/delete", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.DeleteShift:no-shift#2

Authored path: `Schedule.DeleteShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 73.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteShift
where
  earlier, RequestBoundary.request (path: "/schedule/shifts/delete", requestId, session, shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Schedule.DeleteShift:not-allowed#2

Authored path: `Schedule.DeleteShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.
- Covered by [Schedule](../design/compositions/Schedule.md), line 73.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteShift
where
  earlier, RequestBoundary.request (path: "/schedule/shifts/delete", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.DeleteSlot

Authored path: `Schedule.DeleteSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 30.
- Covered by [Schedule](../design/compositions/Schedule.md), line 42.

```reaction
when RequestBoundary.request (path: "/schedule/slots/delete", requestId, session, slot)
then
  Sessioning.current (session)
```

### Schedule.DeleteSlot:allowed#2

Authored path: `Schedule.DeleteSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 30.
- Covered by [Schedule](../design/compositions/Schedule.md), line 42.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteSlot
where
  earlier, RequestBoundary.request (path: "/schedule/slots/delete", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.deleteSlot (slot)
```

### Schedule.DeleteSlot:allowed#3

Authored path: `Schedule.DeleteSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 30.
- Covered by [Schedule](../design/compositions/Schedule.md), line 42.

```reaction
when ShiftScheduling.deleteSlot (slot), asked by Schedule.DeleteSlot:allowed#2
where
  earlier, RequestBoundary.request (path: "/schedule/slots/delete", requestId, session, slot)
then
  RequestBoundary.respond (requestId, slot)
```

### Schedule.DeleteSlot:no-slot#2

Authored path: `Schedule.DeleteSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 30.
- Covered by [Schedule](../design/compositions/Schedule.md), line 42.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteSlot
where
  earlier, RequestBoundary.request (path: "/schedule/slots/delete", requestId, session, slot)
  no ShiftScheduling._slot (slot)
then
  RequestBoundary.respond (error: "NO_SUCH_SLOT", requestId)
```

### Schedule.DeleteSlot:not-allowed#2

Authored path: `Schedule.DeleteSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 30.
- Covered by [Schedule](../design/compositions/Schedule.md), line 42.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteSlot
where
  earlier, RequestBoundary.request (path: "/schedule/slots/delete", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.DeleteWeek

Authored path: `Schedule.DeleteWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.
- Covered by [Schedule](../design/compositions/Schedule.md), line 57.

```reaction
when RequestBoundary.request (path: "/schedule/weeks/delete", requestId, session, week)
then
  Sessioning.current (session)
```

### Schedule.DeleteWeek:allowed#2

Authored path: `Schedule.DeleteWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.
- Covered by [Schedule](../design/compositions/Schedule.md), line 57.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteWeek
where
  earlier, RequestBoundary.request (path: "/schedule/weeks/delete", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.deleteWeek (week)
```

### Schedule.DeleteWeek:allowed#3

Authored path: `Schedule.DeleteWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.
- Covered by [Schedule](../design/compositions/Schedule.md), line 57.

```reaction
when ShiftScheduling.deleteWeek (week), asked by Schedule.DeleteWeek:allowed#2
where
  earlier, RequestBoundary.request (path: "/schedule/weeks/delete", requestId, session, week)
then
  RequestBoundary.respond (requestId, week)
```

### Schedule.DeleteWeek:no-week#2

Authored path: `Schedule.DeleteWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.
- Covered by [Schedule](../design/compositions/Schedule.md), line 57.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteWeek
where
  earlier, RequestBoundary.request (path: "/schedule/weeks/delete", requestId, session, week)
  no ShiftScheduling._week (week)
then
  RequestBoundary.respond (error: "NO_SUCH_WEEK", requestId)
```

### Schedule.DeleteWeek:not-allowed#2

Authored path: `Schedule.DeleteWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.
- Covered by [Schedule](../design/compositions/Schedule.md), line 57.

```reaction
when Sessioning.current (session, user), asked by Schedule.DeleteWeek
where
  earlier, RequestBoundary.request (path: "/schedule/weeks/delete", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.ListWeeks

Authored path: `Schedule.ListWeeks`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 16.
- Covered by [Schedule](../design/compositions/Schedule.md), line 23.

```reaction
when RequestBoundary.request (group, path: "/schedule/weeks", requestId, session)
then
  Sessioning.current (session)
```

### Schedule.ListWeeks:member#2

Authored path: `Schedule.ListWeeks`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 16.
- Covered by [Schedule](../design/compositions/Schedule.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Schedule.ListWeeks
where
  earlier, RequestBoundary.request (group, path: "/schedule/weeks", requestId, session)
  view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (requestId, weeks: former "the published weeks of (group)" with (group))
```

### Schedule.ListWeeks:not-member#2

Authored path: `Schedule.ListWeeks`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 16.
- Covered by [Schedule](../design/compositions/Schedule.md), line 23.

```reaction
when Sessioning.current (session, user), asked by Schedule.ListWeeks
where
  earlier, RequestBoundary.request (group, path: "/schedule/weeks", requestId, session)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.PublishWeek

Authored path: `Schedule.PublishWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 49.
- Covered by [Schedule](../design/compositions/Schedule.md), line 55.

```reaction
when RequestBoundary.request (group, name, path: "/schedule/weeks/publish", requestId, session, start)
then
  Sessioning.current (session)
```

### Schedule.PublishWeek:allowed#2

Authored path: `Schedule.PublishWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 49.
- Covered by [Schedule](../design/compositions/Schedule.md), line 55.

```reaction
when Sessioning.current (session, user), asked by Schedule.PublishWeek
where
  earlier, RequestBoundary.request (group, name, path: "/schedule/weeks/publish", requestId, session, start)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.publishWeek (context: group, name, start)
```

### Schedule.PublishWeek:allowed#3

Authored path: `Schedule.PublishWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 49.
- Covered by [Schedule](../design/compositions/Schedule.md), line 55.

```reaction
when ShiftScheduling.publishWeek (context: group, name, start, week), asked by Schedule.PublishWeek:allowed#2
where
  earlier, RequestBoundary.request (group, name, path: "/schedule/weeks/publish", requestId, session, start)
then
  RequestBoundary.respond (requestId, week)
```

### Schedule.PublishWeek:not-allowed#2

Authored path: `Schedule.PublishWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 49.
- Covered by [Schedule](../design/compositions/Schedule.md), line 55.

```reaction
when Sessioning.current (session, user), asked by Schedule.PublishWeek
where
  earlier, RequestBoundary.request (group, name, path: "/schedule/weeks/publish", requestId, session, start)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.RenameWeek

Authored path: `Schedule.RenameWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.
- Covered by [Schedule](../design/compositions/Schedule.md), line 56.

```reaction
when RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
then
  Sessioning.current (session)
```

### Schedule.RenameWeek:allowed#2

Authored path: `Schedule.RenameWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.
- Covered by [Schedule](../design/compositions/Schedule.md), line 56.

```reaction
when Sessioning.current (session, user), asked by Schedule.RenameWeek
where
  earlier, RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.renameWeek (name, week)
```

### Schedule.RenameWeek:allowed#3

Authored path: `Schedule.RenameWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.
- Covered by [Schedule](../design/compositions/Schedule.md), line 56.

```reaction
when ShiftScheduling.renameWeek (name, week), asked by Schedule.RenameWeek:allowed#2
where
  earlier, RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
then
  RequestBoundary.respond (requestId, week)
```

### Schedule.RenameWeek:no-week#2

Authored path: `Schedule.RenameWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.
- Covered by [Schedule](../design/compositions/Schedule.md), line 56.

```reaction
when Sessioning.current (session, user), asked by Schedule.RenameWeek
where
  earlier, RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
  no ShiftScheduling._week (week)
then
  RequestBoundary.respond (error: "NO_SUCH_WEEK", requestId)
```

### Schedule.RenameWeek:not-allowed#2

Authored path: `Schedule.RenameWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.
- Covered by [Schedule](../design/compositions/Schedule.md), line 56.

```reaction
when Sessioning.current (session, user), asked by Schedule.RenameWeek
where
  earlier, RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.SetShiftCapacity

Authored path: `Schedule.SetShiftCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 67.
- Covered by [Schedule](../design/compositions/Schedule.md), line 71.

```reaction
when RequestBoundary.request (capacity, path: "/schedule/shifts/capacity", requestId, session, shift)
then
  Sessioning.current (session)
```

### Schedule.SetShiftCapacity:allowed#2

Authored path: `Schedule.SetShiftCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 67.
- Covered by [Schedule](../design/compositions/Schedule.md), line 71.

```reaction
when Sessioning.current (session, user), asked by Schedule.SetShiftCapacity
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/shifts/capacity", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.setShiftCapacity (capacity, shift)
```

### Schedule.SetShiftCapacity:allowed#3

Authored path: `Schedule.SetShiftCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 67.
- Covered by [Schedule](../design/compositions/Schedule.md), line 71.

```reaction
when ShiftScheduling.setShiftCapacity (capacity, shift), asked by Schedule.SetShiftCapacity:allowed#2
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/shifts/capacity", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.SetShiftCapacity:no-shift#2

Authored path: `Schedule.SetShiftCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 67.
- Covered by [Schedule](../design/compositions/Schedule.md), line 71.

```reaction
when Sessioning.current (session, user), asked by Schedule.SetShiftCapacity
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/shifts/capacity", requestId, session, shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Schedule.SetShiftCapacity:not-allowed#2

Authored path: `Schedule.SetShiftCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 67.
- Covered by [Schedule](../design/compositions/Schedule.md), line 71.

```reaction
when Sessioning.current (session, user), asked by Schedule.SetShiftCapacity
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/shifts/capacity", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.SetSlotCapacity

Authored path: `Schedule.SetSlotCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 35.
- Covered by [Schedule](../design/compositions/Schedule.md), line 40.

```reaction
when RequestBoundary.request (capacity, path: "/schedule/slots/capacity", requestId, session, slot)
then
  Sessioning.current (session)
```

### Schedule.SetSlotCapacity:allowed#2

Authored path: `Schedule.SetSlotCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 35.
- Covered by [Schedule](../design/compositions/Schedule.md), line 40.

```reaction
when Sessioning.current (session, user), asked by Schedule.SetSlotCapacity
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/slots/capacity", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.setSlotCapacity (capacity, slot)
```

### Schedule.SetSlotCapacity:allowed#3

Authored path: `Schedule.SetSlotCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 35.
- Covered by [Schedule](../design/compositions/Schedule.md), line 40.

```reaction
when ShiftScheduling.setSlotCapacity (capacity, slot), asked by Schedule.SetSlotCapacity:allowed#2
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/slots/capacity", requestId, session, slot)
then
  RequestBoundary.respond (requestId, slot)
```

### Schedule.SetSlotCapacity:no-slot#2

Authored path: `Schedule.SetSlotCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 35.
- Covered by [Schedule](../design/compositions/Schedule.md), line 40.

```reaction
when Sessioning.current (session, user), asked by Schedule.SetSlotCapacity
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/slots/capacity", requestId, session, slot)
  no ShiftScheduling._slot (slot)
then
  RequestBoundary.respond (error: "NO_SUCH_SLOT", requestId)
```

### Schedule.SetSlotCapacity:not-allowed#2

Authored path: `Schedule.SetSlotCapacity`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 35.
- Covered by [Schedule](../design/compositions/Schedule.md), line 40.

```reaction
when Sessioning.current (session, user), asked by Schedule.SetSlotCapacity
where
  earlier, RequestBoundary.request (capacity, path: "/schedule/slots/capacity", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.UnassignShift

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.
- Covered by [Schedule](../design/compositions/Schedule.md), line 75.

```reaction
when RequestBoundary.request (member, path: "/schedule/shifts/unassign", requestId, session, shift)
then
  Sessioning.current (session)
```

### Schedule.UnassignShift:allowed#2

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.
- Covered by [Schedule](../design/compositions/Schedule.md), line 75.

```reaction
when Sessioning.current (session, user), asked by Schedule.UnassignShift
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/unassign", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.unassign (shift, user: member)
```

### Schedule.UnassignShift:allowed#3

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.
- Covered by [Schedule](../design/compositions/Schedule.md), line 75.

```reaction
when ShiftScheduling.unassign (shift, user: member), asked by Schedule.UnassignShift:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/unassign", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.UnassignShift:no-shift#2

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.
- Covered by [Schedule](../design/compositions/Schedule.md), line 75.

```reaction
when Sessioning.current (session, user), asked by Schedule.UnassignShift
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/unassign", requestId, session, shift)
  no ShiftScheduling._shift (shift)
then
  RequestBoundary.respond (error: "NO_SUCH_SHIFT", requestId)
```

### Schedule.UnassignShift:not-allowed#2

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.
- Covered by [Schedule](../design/compositions/Schedule.md), line 75.

```reaction
when Sessioning.current (session, user), asked by Schedule.UnassignShift
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/unassign", requestId, session, shift)
  ShiftScheduling._shift (shift) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.UnassignSlot

Authored path: `Schedule.UnassignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 32.
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.

```reaction
when RequestBoundary.request (member, path: "/schedule/slots/unassign", requestId, session, slot)
then
  Sessioning.current (session)
```

### Schedule.UnassignSlot:allowed#2

Authored path: `Schedule.UnassignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 32.
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.

```reaction
when Sessioning.current (session, user), asked by Schedule.UnassignSlot
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/unassign", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  view "(user) may edit the schedule of (group)" with (group, user)
then
  ShiftScheduling.unassignSlot (slot, user: member)
```

### Schedule.UnassignSlot:allowed#3

Authored path: `Schedule.UnassignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 32.
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.

```reaction
when ShiftScheduling.unassignSlot (slot, user: member), asked by Schedule.UnassignSlot:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/unassign", requestId, session, slot)
then
  RequestBoundary.respond (requestId, slot)
```

### Schedule.UnassignSlot:no-slot#2

Authored path: `Schedule.UnassignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 32.
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.

```reaction
when Sessioning.current (session, user), asked by Schedule.UnassignSlot
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/unassign", requestId, session, slot)
  no ShiftScheduling._slot (slot)
then
  RequestBoundary.respond (error: "NO_SUCH_SLOT", requestId)
```

### Schedule.UnassignSlot:not-allowed#2

Authored path: `Schedule.UnassignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 32.
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.

```reaction
when Sessioning.current (session, user), asked by Schedule.UnassignSlot
where
  earlier, RequestBoundary.request (member, path: "/schedule/slots/unassign", requestId, session, slot)
  ShiftScheduling._slot (slot) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.ViewTemplate

Authored path: `Schedule.ViewTemplate`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 14.
- Covered by [Schedule](../design/compositions/Schedule.md), line 22.

```reaction
when RequestBoundary.request (group, path: "/schedule/template", requestId, session)
then
  Sessioning.current (session)
```

### Schedule.ViewTemplate:member#2

Authored path: `Schedule.ViewTemplate`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 14.
- Covered by [Schedule](../design/compositions/Schedule.md), line 22.

```reaction
when Sessioning.current (session, user), asked by Schedule.ViewTemplate
where
  earlier, RequestBoundary.request (group, path: "/schedule/template", requestId, session)
  view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (requestId, template: former "the weekly template of (group)" with (group))
```

### Schedule.ViewTemplate:not-member#2

Authored path: `Schedule.ViewTemplate`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 14.
- Covered by [Schedule](../design/compositions/Schedule.md), line 22.

```reaction
when Sessioning.current (session, user), asked by Schedule.ViewTemplate
where
  earlier, RequestBoundary.request (group, path: "/schedule/template", requestId, session)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.ViewWeek

Authored path: `Schedule.ViewWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 18.
- Covered by [Schedule](../design/compositions/Schedule.md), line 24.

```reaction
when RequestBoundary.request (path: "/schedule/week", requestId, session, week)
then
  Sessioning.current (session)
```

### Schedule.ViewWeek:member#2

Authored path: `Schedule.ViewWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 18.
- Covered by [Schedule](../design/compositions/Schedule.md), line 24.

```reaction
when Sessioning.current (session, user), asked by Schedule.ViewWeek
where
  earlier, RequestBoundary.request (path: "/schedule/week", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (requestId, week: former "the published week (week)" with (week))
```

### Schedule.ViewWeek:no-week#2

Authored path: `Schedule.ViewWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 18.
- Covered by [Schedule](../design/compositions/Schedule.md), line 24.

```reaction
when Sessioning.current (session, user), asked by Schedule.ViewWeek
where
  earlier, RequestBoundary.request (path: "/schedule/week", requestId, session, week)
  no ShiftScheduling._week (week)
then
  RequestBoundary.respond (error: "NO_SUCH_WEEK", requestId)
```

### Schedule.ViewWeek:not-member#2

Authored path: `Schedule.ViewWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 18.
- Covered by [Schedule](../design/compositions/Schedule.md), line 24.

```reaction
when Sessioning.current (session, user), asked by Schedule.ViewWeek
where
  earlier, RequestBoundary.request (path: "/schedule/week", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  no view "(user) is a member of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/attendance/mark` — requires `session`, `shift`, `member`, `status`
- `/attendance/mine` — requires `session`, `group`
- `/attendance/shift` — requires `session`, `shift`
- `/attendance/unmark` — requires `session`, `shift`, `member`
- `/auth/current` — requires `session`
- `/auth/login` — requires `username`, `password`
- `/auth/logout` — requires `session`
- `/auth/register` — requires `username`, `password`
- `/classes/change-role` — requires `session`, `group`, `member`, `role`
- `/classes/create` — requires `session`, `name`
- `/classes/delete` — requires `session`, `group`
- `/classes/invite` — requires `session`, `group`, `username`, `role`
- `/classes/invites` — requires `session`, `group`
- `/classes/leave` — requires `session`, `group`
- `/classes/mine` — requires `session`
- `/classes/remove` — requires `session`, `group`, `member`
- `/classes/roster` — requires `session`, `group`
- `/classes/withdraw-invite` — requires `session`, `group`, `invite`
- `/covers/approve` — requires `session`, `request`
- `/covers/claim` — requires `session`, `request`
- `/covers/class` — requires `session`, `group`
- `/covers/deny` — requires `session`, `request`
- `/covers/request` — requires `session`, `shift`
- `/covers/week` — requires `session`, `week`
- `/covers/withdraw` — requires `session`, `request`
- `/invites/accept` — requires `session`, `invite`
- `/invites/mine` — requires `session`
- `/schedule/shifts/assign` — requires `session`, `shift`, `member`
- `/schedule/shifts/capacity` — requires `session`, `shift`, `capacity`
- `/schedule/shifts/create` — requires `session`, `week`, `start`, `end`, `capacity`
- `/schedule/shifts/delete` — requires `session`, `shift`
- `/schedule/shifts/unassign` — requires `session`, `shift`, `member`
- `/schedule/slots/assign` — requires `session`, `slot`, `member`
- `/schedule/slots/capacity` — requires `session`, `slot`, `capacity`
- `/schedule/slots/create` — requires `session`, `group`, `weekday`, `startMinute`, `endMinute`, `capacity`
- `/schedule/slots/delete` — requires `session`, `slot`
- `/schedule/slots/unassign` — requires `session`, `slot`, `member`
- `/schedule/template` — requires `session`, `group`
- `/schedule/week` — requires `session`, `week`
- `/schedule/weeks` — requires `session`, `group`
- `/schedule/weeks/delete` — requires `session`, `week`
- `/schedule/weeks/publish` — requires `session`, `group`, `start`, `name`
- `/schedule/weeks/rename` — requires `session`, `week`, `name`
