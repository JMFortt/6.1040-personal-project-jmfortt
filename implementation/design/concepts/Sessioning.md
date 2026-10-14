# Sessioning

## Purpose

Keep track of who is making a series of requests, without them re-entering
their credentials each time.

## Principle

After a session is started for a user, any request presenting that session is
attributed to that user. Once the session is ended, it is no longer recognized.

## Types

```types
external User
  The person a session belongs to.
```

## State

```state
a set of Sessions with
  a User
```

## Actions

```actions
start(user: User) : returns (session: Session)
  where true
  then
    create a new session for user
    returns session

end(session: Session) : returns ()
  where session exists
  then
    remove session
    returns
  where session does not exist
  then
    refuses SESSION_NOT_FOUND "There is no such session."

current(session: Session) : returns (user: User)
  where session exists
  then
    bind user to the user of session
    returns user
  where session does not exist
  then
    refuses NOT_LOGGED_IN "You are not logged in."
```

## Queries

```queries
```
