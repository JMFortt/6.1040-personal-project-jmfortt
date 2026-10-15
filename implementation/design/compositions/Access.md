# Access

TAble's access policy: what each staff role may do in a class. RoleBasedAccessing
only records who holds which role; these views give the roles their meaning, and
every other composition checks them before acting.

| Role  | Member | Edit schedule | Mark attendance | View everyone's attendance | Manage members |
| ----- | ------ | ------------- | --------------- | -------------------------- | -------------- |
| LA    | yes    | no            | no              | no (only their own)        | no             |
| TA    | yes    | yes           | yes             | yes                        | no             |
| STAFF | yes    | yes           | yes             | yes                        | yes            |

A user with any role [is a member of the class](view:Access.IsMember), which lets
them see it. A TA or STAFF member [may edit its schedule](view:Access.MayEditSchedule),
[may mark attendance](view:Access.MayMarkAttendance), and
[may view everyone's attendance](view:Access.MayViewAllAttendance).
Only a STAFF member [may manage its members](view:Access.MayManageMembers).
