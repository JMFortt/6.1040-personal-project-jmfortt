# Covers

Cover requests are on shifts in published weeks. ShiftTrading only tracks each
request and its status; the schedule changes through one reaction.

When a cover request is approved, the
[claimer takes the requester's place on the shift](reaction:Covers.ApplyCover)
through ShiftScheduling's reassign, so the published week shows the claimer
instead of the requester. The template is unchanged.

## Requesting and claiming

Anyone assigned to a shift can [ask for a cover](reaction:Covers.Request); anyone
else is refused as not on the shift. Any user who
[is a member of the shift's class](view:Access.IsMember) and is not already on the
shift can [claim the request](reaction:Covers.Claim). Only the person who asked can
[withdraw it](reaction:Covers.Withdraw).

```endpoints
Covers.Request at /covers/request
Covers.Claim at /covers/claim
Covers.Withdraw at /covers/withdraw
```

## Approving and denying

A user who [may approve cover requests](view:Access.MayApproveRequests) in the
shift's class can [approve a claimed request](reaction:Covers.Approve) or
[deny an active one](reaction:Covers.Deny). Because there are no multi-action
transactions, approval first checks that the reassignment will succeed, meaning
the requester is still on the shift and the claimer still is not. If the schedule
has changed since the claim, approval is refused and the request stays claimed,
so a request is never approved without the schedule changing to match.

```endpoints
Covers.Approve at /covers/approve
Covers.Deny at /covers/deny
```

## Viewing

A member can [see a published week's cover requests](reaction:Covers.ForWeek),
shown as [each request with its shift, requester, claimer, and status](former:Covers.WeekRequests).

```endpoints
Covers.ForWeek at /covers/week
```
