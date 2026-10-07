# Section 3: Concept Specifications, Essential Reactions, and Their Roles

## Concept Specifications

### Concept: UserAuthenticating

```
purpose
  Make sure users are who they claim

principle
  If one registers and logs in with the same username and password, they'll be treated as the same person

state
  a set of Users with
    a unique username String
    a password String

actions
  register (username: String, password: String) : returns (user: User)
    where username is not already in use
    then create a new user with the given username and password and return it

  login (username: String, password: String) : returns (user: User)
    where a user exists with the given username and password
    then return that user
```

### Concept: RoleBasedAccessing [User]

```
purpose
  Simplify granting/revoking permissions for different groups

principle
  An admin creates a group and role with some permissions and can invite users under that role. Once they accept, each gains those permissions. If the admin later changes the role's permissions, every member holding that role gains or loses them in sync. A member who is removed loses them entirely

state
  a set of Groups with
    a name String
    an owner User
  a set of Roles with
    a Group
    a name String
    a permissions set of String
  a set of Memberships with
    a User
    a Group
    a Role
  a set of Invites with
    a Group
    an invitee User
    a Role

actions
  createGroup (owner: User, name: String) : returns (group: Group)
    then create a new group with the given name and owner and return it

  createRole (group: Group, name: String, permissions: set of String) : returns (role: Role)
    where no role in group has the given name
    then create a new role in group with the given name and permissions and return it

  setPermissions (role: Role, permissions: set of String)
    where role exists
    then set the permissions of role to the given permissions

  invite (group: Group, user: User, role: Role) : returns (invite: Invite)
    where role belongs to group and user is not already a member of or invited to group
    then create a new invite for user to group with role and return it

  accept (invite: Invite)
    then create a membership for the invitee in the invite's group with the invite's role, and remove invite

  changeRole (group: Group, user: User, role: Role)
    where user is a member of group and role belongs to group
    then set the role of user's membership in group to role

  removeMember (group: Group, user: User)
    where user is a member of group and is not its owner
    then remove user's membership in group
```

### Concept: ShiftScheduling [User, Context]

```
purpose
  Keep a record of who is on shift for each time slot

principle
  After shifts are created and users are assigned to them, everyone sees the same schedule. If a shift is reassigned from one user to another, everyone sees the new assignee in place of the old one

state
  a set of Shifts with
    a Context
    a start DateTime
    an end DateTime
    a capacity Number
    an assignees set of Users

actions
  createShift (context: Context, start: DateTime, end: DateTime, capacity: Number) : returns (shift: Shift)
    where start is before end and capacity is at least 1
    then create a new shift in context with the given times and capacity and no assignees, and return it

  deleteShift (shift: Shift)
    where shift exists
    then remove shift

  assign (shift: Shift, user: User)
    where user is not assigned to shift and shift is below capacity
    then add user to the assignees of shift

  unassign (shift: Shift, user: User)
    where user is assigned to shift
    then remove user from the assignees of shift

  reassign (shift: Shift, from: User, to: User)
    where from is assigned to shift and to is not
    then replace from with to in the assignees of shift
```

### Concept: ShiftTrading [User, Shift]

```
purpose
  Let staff hand off or exchange shifts without a manager reworking the schedule

principle
  If a user posts a cover request for their shift and another user claims it, then once it's approved the claimer is responsible for the shift instead. Every request keeps a visible status, so everyone can tell whether it's still open, taken, or resolved

state
  a set of Requests with
    a requester User
    a Shift
    a kind of COVER or SWAP
    an optional target User
    an optional targetShift Shift
    an optional claimer User
    a status of OPEN or CLAIMED or APPROVED or DENIED or WITHDRAWN

actions
  requestCover (requester: User, shift: Shift) : returns (request: Request)
    where requester has no active request for shift
    then create a new OPEN COVER request and return it

  proposeSwap (requester: User, shift: Shift, target: User, targetShift: Shift) : returns (request: Request)
    where requester is not target and has no active request for shift
    then create a new OPEN SWAP request with the given target and targetShift and return it

  claim (request: Request, claimer: User)
    where request is OPEN, claimer is not its requester, and request is a COVER or claimer is its target
    then set the claimer of request to claimer and its status to CLAIMED

  approve (request: Request)
    where request is CLAIMED
    then set the status of request to APPROVED

  deny (request: Request)
    where request is OPEN or CLAIMED
    then set the status of request to DENIED

  withdraw (request: Request)
    where request is OPEN or CLAIMED
    then set the status of request to WITHDRAWN
```

### Concept: AttendanceTracking [User, Session]

```
purpose
  Keep a reliable record of whether people showed up, so absences aren't recorded by mistake

principle
  If a marker marks an attendee present for a session, the attendee can see that they were marked present. If the marker forgets, the attendee can see they have no record and follow up before it becomes an absence

state
  a set of Records with
    a User
    a Session
    a status String

actions
  mark (user: User, session: Session, status: String)
    then set user's record for session to status (creating it if needed)
```

## Essential Reactions


### Reaction: applyCover
```
when
    ShiftTrading.approve(request)

where
    request is a cover of requester's shift, claimed by claimer

then
    ShiftScheduling.reassign(shift, requester, claimer)
```

### Reaction: applySwap
```
when
    ShiftTrading.approve(request)

where
    request is a swap of requester's shift for claimer's targetShift

then
    ShiftScheduling.reassign(shift, requester, claimer)
    ShiftScheduling.reassign(targetShift, claimer, requester)
```

### Reaction: markAttendance
```
when
    Requesting.markAttendance(caller, user, shift, status)

where
    caller has permission to mark attendance

then
    AttendanceTracking.mark(user, shift, status)
```

### Reaction: requestCover
```
when
    Requesting.requestCover(caller, shift)

where
    caller is assigned to shift

then
    ShiftTrading.requestCover(caller, shift)
```

### Reaction: removeFromShifts

```
when
    RoleBasedAccessing.removeMember(group, user)

where
    user is assigned to future shift in group

then
    ShiftScheduling.unassign(shift, user)
```

## Note

These five concepts set up the login and role-based infrastructure for each class, with the schedule, shift trading, and attendance features built on top of it. An admin creates a class (a "group"), defines roles with permissions, and invites staff to join under those roles. The group's members are the class's staff roster. Users with the right permissions can then build the schedule, approve shift changes, and mark attendance, all in the app.


- **UserAuthenticating** handles account creation for the app.

- **RoleBasedAccessing** handles class creation, staff rosters and role-based permissions that limit access to other concept functions. The group's owner has all permissions.

- **ShiftScheduling** handles schedule creation capabilities, as well as schedule edit options.

- **ShiftTrading** handles the shift swap and cover process.

- **AttendanceTracking** handles, as the name suggests, attendance tracking.

**Generic types.**
- `Context` in ShiftScheduling is intended to be a `Group` from RoleBasedAccessing, so each shift belongs to one class.
- `Shift` in ShiftTrading is the same as a shift from ShiftScheduling. ShiftTrading never changes the schedule itself (approved requests are applied via a reaction).
- `Session` in AttendanceTracking is also the same as a shift from ShiftScheduling.
