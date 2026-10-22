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

Only a user who [may manage a class's members](view:Access.MayManageMembers),
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

A user who [is a member of a class](view:Access.IsMember), in any role, can
[see its roster](reaction:Classes.ClassRoster), shown as
[each member's username and role](former:Classes.Roster), along with who the owner
is. Anyone else is refused as not allowed.

```endpoints
Classes.ClassRoster at /classes/roster
```

## Pending invites

A user who may manage a class's members can
[see its pending invites](reaction:Classes.Invites), shown as
[each invite with the invitee's username and offered role](former:Classes.PendingInvites),
and [withdraw one](reaction:Classes.WithdrawInvite), which must be an invite to that
class. Anyone else is refused as not allowed.

```endpoints
Classes.Invites at /classes/invites
Classes.WithdrawInvite at /classes/withdraw-invite
```

## Deleting a class

Only the user who [owns the class](view:Access.IsOwner) can
[delete it](reaction:Classes.Delete), which removes it with its memberships and
invites; its schedule, attendance, and cover requests are then removed by the
cleanup reactions in the same flow. Anyone else is refused as not allowed.

```endpoints
Classes.Delete at /classes/delete
```

## Managing members and leaving

A user who may manage a class's members can
[change a member's role](reaction:Classes.ChangeRole) to LA, TA, or STAFF and
[remove a member](reaction:Classes.RemoveMember). Anyone can
[leave a class themselves](reaction:Classes.Leave). The owner's role cannot be
changed, and the owner cannot be removed or leave.

```endpoints
Classes.ChangeRole at /classes/change-role
Classes.RemoveMember at /classes/remove
Classes.Leave at /classes/leave
```

When someone leaves or is removed, they
[come off the class's schedule from now on](reaction:Classes.RemoveFromSchedule):
off every template slot and every shift that has not started yet, while shifts
already started or past keep them so attendance history stays intact. Any of their
[cover requests in the class that are still active are withdrawn](reaction:Classes.WithdrawCoverRequests).
