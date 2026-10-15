<!-- Generated from the TAble assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# TAble — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

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
- `removeMember(group: Group, user: User) : returns ()`
  - Refuses `NOT_A_MEMBER`: That user is not a member of this group.
  - Refuses `CANNOT_REMOVE_OWNER`: The owner cannot be removed from the group.

#### Queries

- `_group(group: Group) : optional (name: String, owner: User)`
- `_groupsForUser(user: User) : many (group: Group, name: String, role: Role)`
- `_members(group: Group) : many (user: User, role: Role)`
- `_invitesForUser(user: User) : many (invite: Invite, group: Group, role: Role)`
- `_role(group: Group, user: User) : optional (role: Role)`

#### Instances

- `RoleBasedAccessing` — instance of `RoleBasedAccessing` — [Application types](../design/types.md), line 19.
  - `Role` is `StaffRole` — [Application types](../design/types.md), line 21.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 20.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(user: User) : returns (session: Session)`
- `end(session: Session) : returns ()`
  - Refuses `SESSION_NOT_FOUND`: There is no such session.
- `current(session: Session) : returns (user: User)`
  - Refuses `NOT_LOGGED_IN`: You are not logged in.

#### Instances

- `Sessioning` — instance of `Sessioning` — [Application types](../design/types.md), line 16.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 17.

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
- `reassign(shift: Shift, from: User, to: User) : returns ()`
  - Refuses `SHIFT_NOT_FOUND`: There is no such shift.
  - Refuses `NOT_ASSIGNED`: That user is not assigned to this shift.
  - Refuses `ALREADY_ASSIGNED`: That user is already assigned to this shift.

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

- `ShiftScheduling` — instance of `ShiftScheduling` — [Application types](../design/types.md), line 23.
  - `Context` is `RoleBasedAccessing.Group` — [Application types](../design/types.md), line 25.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 24.

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

- `UserAuthenticating` — instance of `UserAuthenticating` — [Application types](../design/types.md), line 14.

## Application types

Concrete types:

- `StaffRole` — [Application types](../design/types.md), line 9.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### (user) is a member of (group)

Authored path: `Access.IsMember`.
- Covered by [Access](../design/compositions/Access.md), line 13.
- Covered by [Classes](../design/compositions/Classes.md), line 35.
- Covered by [Schedule](../design/compositions/Schedule.md), line 9.

```view
(user) is a member of (group) — inputs (user, group); outputs (); bindings ()
  where RoleBasedAccessing._role (group, user)
```

### (user) may edit the schedule of (group)

Authored path: `Access.MayEditSchedule`.
- Covered by [Access](../design/compositions/Access.md), line 14.
- Covered by [Schedule](../design/compositions/Schedule.md), line 8.

```view
(user) may edit the schedule of (group) — inputs (user, group); outputs (); bindings (role)
  where
    RoleBasedAccessing._role (group, user) has (role)
    role is among ["TA", "STAFF"]
```

### (user) may manage the members of (group)

Authored path: `Access.MayManageMembers`.
- Covered by [Access](../design/compositions/Access.md), line 15.
- Covered by [Classes](../design/compositions/Classes.md), line 17.

```view
(user) may manage the members of (group) — inputs (user, group); outputs (); bindings ()
  where RoleBasedAccessing._role (group, user) has (role: "STAFF")
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
then
  RequestBoundary.respond (requestId, roster: former "the roster of (group)" with (group))
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
- Covered by [Schedule](../design/compositions/Schedule.md), line 59.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.

```reaction
when RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
then
  Sessioning.current (session)
```

### Schedule.AssignShift:allowed#2

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 59.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 59.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.

```reaction
when ShiftScheduling.assign (shift, user: member), asked by Schedule.AssignShift:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/assign", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.AssignShift:no-shift#2

Authored path: `Schedule.AssignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 59.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 59.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 59.
- Covered by [Schedule](../design/compositions/Schedule.md), line 65.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 38.

```reaction
when RequestBoundary.request (member, path: "/schedule/slots/assign", requestId, session, slot)
then
  Sessioning.current (session)
```

### Schedule.AssignSlot:allowed#2

Authored path: `Schedule.AssignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 31.
- Covered by [Schedule](../design/compositions/Schedule.md), line 38.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 38.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 38.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 38.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 38.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.

```reaction
when RequestBoundary.request (capacity, end, path: "/schedule/shifts/create", requestId, session, start, week)
then
  Sessioning.current (session)
```

### Schedule.CreateShift:allowed#2

Authored path: `Schedule.CreateShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.

```reaction
when ShiftScheduling.createShift (capacity, end, start, week, shift), asked by Schedule.CreateShift:allowed#2
where
  earlier, RequestBoundary.request (capacity, end, path: "/schedule/shifts/create", requestId, session, start, week)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.CreateShift:no-week#2

Authored path: `Schedule.CreateShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 63.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 36.

```reaction
when RequestBoundary.request (capacity, endMinute, group, path: "/schedule/slots/create", requestId, session, startMinute, weekday)
then
  Sessioning.current (session)
```

### Schedule.CreateSlot:allowed#2

Authored path: `Schedule.CreateSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 29.
- Covered by [Schedule](../design/compositions/Schedule.md), line 36.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 36.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 36.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.

```reaction
when RequestBoundary.request (path: "/schedule/shifts/delete", requestId, session, shift)
then
  Sessioning.current (session)
```

### Schedule.DeleteShift:allowed#2

Authored path: `Schedule.DeleteShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.

```reaction
when ShiftScheduling.deleteShift (shift), asked by Schedule.DeleteShift:allowed#2
where
  earlier, RequestBoundary.request (path: "/schedule/shifts/delete", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.DeleteShift:no-shift#2

Authored path: `Schedule.DeleteShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 58.
- Covered by [Schedule](../design/compositions/Schedule.md), line 64.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 37.

```reaction
when RequestBoundary.request (path: "/schedule/slots/delete", requestId, session, slot)
then
  Sessioning.current (session)
```

### Schedule.DeleteSlot:allowed#2

Authored path: `Schedule.DeleteSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 30.
- Covered by [Schedule](../design/compositions/Schedule.md), line 37.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 37.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 37.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 37.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 47.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.

```reaction
when RequestBoundary.request (path: "/schedule/weeks/delete", requestId, session, week)
then
  Sessioning.current (session)
```

### Schedule.DeleteWeek:allowed#2

Authored path: `Schedule.DeleteWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 47.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 47.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.

```reaction
when ShiftScheduling.deleteWeek (week), asked by Schedule.DeleteWeek:allowed#2
where
  earlier, RequestBoundary.request (path: "/schedule/weeks/delete", requestId, session, week)
then
  RequestBoundary.respond (requestId, week)
```

### Schedule.DeleteWeek:no-week#2

Authored path: `Schedule.DeleteWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 47.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 47.
- Covered by [Schedule](../design/compositions/Schedule.md), line 52.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.
- Covered by [Schedule](../design/compositions/Schedule.md), line 50.

```reaction
when RequestBoundary.request (group, name, path: "/schedule/weeks/publish", requestId, session, start)
then
  Sessioning.current (session)
```

### Schedule.PublishWeek:allowed#2

Authored path: `Schedule.PublishWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.
- Covered by [Schedule](../design/compositions/Schedule.md), line 50.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.
- Covered by [Schedule](../design/compositions/Schedule.md), line 50.

```reaction
when ShiftScheduling.publishWeek (context: group, name, start, week), asked by Schedule.PublishWeek:allowed#2
where
  earlier, RequestBoundary.request (group, name, path: "/schedule/weeks/publish", requestId, session, start)
then
  RequestBoundary.respond (requestId, week)
```

### Schedule.PublishWeek:not-allowed#2

Authored path: `Schedule.PublishWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 44.
- Covered by [Schedule](../design/compositions/Schedule.md), line 50.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 46.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.

```reaction
when RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
then
  Sessioning.current (session)
```

### Schedule.RenameWeek:allowed#2

Authored path: `Schedule.RenameWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 46.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 46.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.

```reaction
when ShiftScheduling.renameWeek (name, week), asked by Schedule.RenameWeek:allowed#2
where
  earlier, RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
then
  RequestBoundary.respond (requestId, week)
```

### Schedule.RenameWeek:no-week#2

Authored path: `Schedule.RenameWeek`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 46.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 46.
- Covered by [Schedule](../design/compositions/Schedule.md), line 51.

```reaction
when Sessioning.current (session, user), asked by Schedule.RenameWeek
where
  earlier, RequestBoundary.request (name, path: "/schedule/weeks/rename", requestId, session, week)
  ShiftScheduling._week (week) has (context: group)
  no view "(user) may edit the schedule of (group)" with (group, user)
then
  RequestBoundary.respond (error: "NOT_ALLOWED", requestId)
```

### Schedule.UnassignShift

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 60.
- Covered by [Schedule](../design/compositions/Schedule.md), line 66.

```reaction
when RequestBoundary.request (member, path: "/schedule/shifts/unassign", requestId, session, shift)
then
  Sessioning.current (session)
```

### Schedule.UnassignShift:allowed#2

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 60.
- Covered by [Schedule](../design/compositions/Schedule.md), line 66.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 60.
- Covered by [Schedule](../design/compositions/Schedule.md), line 66.

```reaction
when ShiftScheduling.unassign (shift, user: member), asked by Schedule.UnassignShift:allowed#2
where
  earlier, RequestBoundary.request (member, path: "/schedule/shifts/unassign", requestId, session, shift)
then
  RequestBoundary.respond (requestId, shift)
```

### Schedule.UnassignShift:no-shift#2

Authored path: `Schedule.UnassignShift`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 60.
- Covered by [Schedule](../design/compositions/Schedule.md), line 66.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 60.
- Covered by [Schedule](../design/compositions/Schedule.md), line 66.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 39.

```reaction
when RequestBoundary.request (member, path: "/schedule/slots/unassign", requestId, session, slot)
then
  Sessioning.current (session)
```

### Schedule.UnassignSlot:allowed#2

Authored path: `Schedule.UnassignSlot`.
- Covered by [Schedule](../design/compositions/Schedule.md), line 32.
- Covered by [Schedule](../design/compositions/Schedule.md), line 39.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 39.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 39.

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
- Covered by [Schedule](../design/compositions/Schedule.md), line 39.

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

- `/auth/current` — requires `session`
- `/auth/login` — requires `username`, `password`
- `/auth/logout` — requires `session`
- `/auth/register` — requires `username`, `password`
- `/classes/create` — requires `session`, `name`
- `/classes/invite` — requires `session`, `group`, `username`, `role`
- `/classes/mine` — requires `session`
- `/classes/roster` — requires `session`, `group`
- `/invites/accept` — requires `session`, `invite`
- `/invites/mine` — requires `session`
- `/schedule/shifts/assign` — requires `session`, `shift`, `member`
- `/schedule/shifts/create` — requires `session`, `week`, `start`, `end`, `capacity`
- `/schedule/shifts/delete` — requires `session`, `shift`
- `/schedule/shifts/unassign` — requires `session`, `shift`, `member`
- `/schedule/slots/assign` — requires `session`, `slot`, `member`
- `/schedule/slots/create` — requires `session`, `group`, `weekday`, `startMinute`, `endMinute`, `capacity`
- `/schedule/slots/delete` — requires `session`, `slot`
- `/schedule/slots/unassign` — requires `session`, `slot`, `member`
- `/schedule/template` — requires `session`, `group`
- `/schedule/week` — requires `session`, `week`
- `/schedule/weeks` — requires `session`, `group`
- `/schedule/weeks/delete` — requires `session`, `week`
- `/schedule/weeks/publish` — requires `session`, `group`, `start`, `name`
- `/schedule/weeks/rename` — requires `session`, `week`, `name`
