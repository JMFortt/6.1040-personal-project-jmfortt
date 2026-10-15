# Access

TAble's access policy: what each staff role may do in a class. RoleBasedAccessing
only records who holds which role; these views give the roles their meaning, and
every other composition checks them before acting.

| Role  | Member | Edit schedule | Manage members |
| ----- | ------ | ------------- | -------------- |
| LA    | yes    | no            | no             |
| TA    | yes    | yes           | no             |
| STAFF | yes    | yes           | yes            |

A user with any role [is a member of the class](view:Access.IsMember), which lets
them see it. A TA or STAFF member [may edit its schedule](view:Access.MayEditSchedule).
Only a STAFF member [may manage its members](view:Access.MayManageMembers).
