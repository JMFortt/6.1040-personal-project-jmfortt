# Classes

A logged-in user [creates a class](reaction:Classes.Create) with a nonempty name.
They become its owner and a STAFF member, so they can do everything in it.

```endpoints
Classes.Create at /classes/create
```

A logged-in user [lists their classes](reaction:Classes.Mine), shown as
[each class they are in with their role](former:Classes.MyClasses).

```endpoints
Classes.Mine at /classes/mine
```

Only a user who [may manage a class's members](view:Classes.MayManageMembers),
meaning they are STAFF in it, can [invite someone](reaction:Classes.Invite) by
username as an LA, TA, or STAFF. Anyone else is refused as not allowed, and an
unknown username is refused as no such user.

```endpoints
Classes.Invite at /classes/invite
```

A logged-in user [lists their pending invites](reaction:Classes.MyInvitesList), shown
as [each invite with the class's name and the offered role](former:Classes.MyInvites),
and [accepts one](reaction:Classes.Accept) to join that class with that role.

```endpoints
Classes.MyInvitesList at /invites/mine
Classes.Accept at /invites/accept
```

A user who [is a member of a class](view:Classes.IsMember), in any role, can
[see its roster](reaction:Classes.ClassRoster), shown as
[each member's username and role](former:Classes.Roster). Anyone else is refused
as not allowed.

```endpoints
Classes.ClassRoster at /classes/roster
```
