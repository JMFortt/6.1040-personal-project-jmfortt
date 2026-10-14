# UserAuthenticating

## Purpose

Make sure users are who they claim to be, so one person can't act as another.

## Principle

If someone registers with a username and password and later logs in with that
same username and password, they are identified as the user who registered.

## Types

```types
```

## State

```state
a set of Users with
  a unique username String
  a passwordHash String
```

## Actions

```actions
register(username: String, password: String) : returns (user: User)
  where username and password are nonempty and username is not in use
  then
    create a new user with username and a hash of password
    returns user
  where username or password is empty
  then
    refuses INVALID_CREDENTIALS "The username and password must not be empty."
  where username and password are nonempty and username is in use
  then
    refuses USERNAME_TAKEN "That username is already taken."

login(username: String, password: String) : returns (user: User)
  where a user has the given username and password matches its passwordHash
  then
    bind user to the user with the given username
    returns user
  where no user has the given username, or password does not match its passwordHash
  then
    refuses LOGIN_FAILED "The username or password is incorrect."
```

## Queries

```queries
_username(user: User) : optional (username: String)
  Returns the username of the given user, or no row if the user does not exist.
```
