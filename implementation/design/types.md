# Application types

Every concept that refers to a person uses the users that UserAuthenticating
registers, so a session belongs to a registered user. Each class is a
RoleBasedAccessing group, and its members hold one of TAble's staff roles.
Every shift belongs to a class, and attendance and cover requests are per shift
in a published week.

```types
concrete StaffRole
  One of LA, TA, or STAFF. A class's creator is STAFF.
```

```instances
instantiate UserAuthenticating

instantiate Sessioning with
  User is UserAuthenticating.User

instantiate RoleBasedAccessing with
  User is UserAuthenticating.User
  Role is StaffRole

instantiate ShiftScheduling with
  User is UserAuthenticating.User
  Context is RoleBasedAccessing.Group

instantiate AttendanceTracking with
  User is UserAuthenticating.User
  Event is ShiftScheduling.Shift

instantiate ShiftTrading with
  User is UserAuthenticating.User
  Shift is ShiftScheduling.Shift
```
