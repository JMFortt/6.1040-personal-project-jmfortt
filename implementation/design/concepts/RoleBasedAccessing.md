# RoleBasedAccessing

## Purpose

Simplify granting/revoking permissions for different groups

## Principle

An admin creates a group and can invite users under a role. Once they accept, each holds that role in the group, and so gains whatever permissions the role grants. If the admin later changes a member's role, that member gains or loses permissions to match. A member who is removed loses them entirely

## Types

```types
external User
  A person who can own, join, or be invited to a group.

external Role
  A role a member of a group can hold. What each role permits is up to the application.
```

## State

```state
a set of Groups with
  a name String
  an owner User
a set of Memberships with
  a User
  a Group
  a Role
a set of Invites with
  a Group
  an invitee User
  a Role
```

## Actions

```actions
createGroup(owner: User, name: String, ownerRole: Role) : returns (group: Group)
  where true
  then
    create a new group with the given name and owner, and a membership for owner in it with ownerRole
    returns group

invite(group: Group, user: User, role: Role) : returns (invite: Invite)
  where group exists and user is not already a member of or invited to group
  then
    create a new invite for user to group with role
    returns invite
  where group does not exist
  then
    refuses GROUP_NOT_FOUND "There is no such group."
  where group exists and user is already a member of or invited to group
  then
    refuses ALREADY_IN_GROUP "That user is already a member of or invited to this group."

accept(invite: Invite, user: User) : returns ()
  where invite exists and user is its invitee
  then
    create a membership for the invitee in the invite's group with the invite's role, and remove invite
    returns
  where invite does not exist
  then
    refuses INVITE_NOT_FOUND "There is no such invite."
  where invite exists and user is not its invitee
  then
    refuses NOT_INVITEE "This invite is for a different user."

changeRole(group: Group, user: User, role: Role) : returns ()
  where user is a member of group and is not its owner
  then
    set the role of user's membership in group to role
    returns
  where user is not a member of group
  then
    refuses NOT_A_MEMBER "That user is not a member of this group."
  where user is a member of group and is its owner
  then
    refuses CANNOT_CHANGE_OWNER_ROLE "The owner's role cannot be changed."

removeMember(group: Group, user: User) : returns ()
  where user is a member of group and is not its owner
  then
    remove user's membership in group
    returns
  where user is not a member of group
  then
    refuses NOT_A_MEMBER "That user is not a member of this group."
  where user is a member of group and is its owner
  then
    refuses CANNOT_REMOVE_OWNER "The owner cannot be removed from the group."
```

## Queries

```queries
_group(group: Group) : optional (name: String, owner: User)
  Returns the name and owner of group, or no row if the group does not exist.

_groupsForUser(user: User) : many (group: Group, name: String, role: Role)
  Returns every group that user is a member of with their role, ordered by name, and no rows if there are none.

_members(group: Group) : many (user: User, role: Role)
  Returns every member of group with their role, ordered by user, and no rows if there are none.

_invitesForUser(user: User) : many (invite: Invite, group: Group, role: Role)
  Returns every pending invite for user, ordered by invite, and no rows if there are none.

_role(group: Group, user: User) : optional (role: Role)
  Returns user's role in group, or no row if user is not a member or the group does not exist.
```
