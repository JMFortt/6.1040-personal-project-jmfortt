<!-- Generated from the TAble assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# TAble — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(user: User) : returns (session: Session)`
- `end(session: Session) : returns ()`
  - Refuses `SESSION_NOT_FOUND`: There is no such session.
- `current(session: Session) : returns (user: User)`
  - Refuses `NOT_LOGGED_IN`: You are not logged in.

#### Instances

- `Sessioning` — instance of `Sessioning` — [Application types](../design/types.md), line 9.
  - `User` is `UserAuthenticating.User` — [Application types](../design/types.md), line 10.

### UserAuthenticating

Defined in [UserAuthenticating](../design/concepts/UserAuthenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (user: User)`
  - Refuses `INVALID_CREDENTIALS`: The username and password must not be empty.
  - Refuses `USERNAME_TAKEN`: That username is already taken.
- `login(username: String, password: String) : returns (user: User)`
  - Refuses `LOGIN_FAILED`: The username or password is incorrect.

#### Queries

- `_username(user: User) : optional (username: String)`
- `_user(username: String) : optional (user: User)`

#### Instances

- `UserAuthenticating` — instance of `UserAuthenticating` — [Application types](../design/types.md), line 7.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the account of (user)

Authored path: `Auth.Account`.
- Covered by [Auth](../design/compositions/Auth.md), line 13.

```former
Former "the account of (user)" — inputs (user); bindings (username); promises exactly one record — forms:
  a record of
    where UserAuthenticating._username (user) has (username)
    user
    username
```

## Reactions

### Auth.Current

Authored path: `Auth.Current`.
- Covered by [Auth](../design/compositions/Auth.md), line 12.
- Covered by [Auth](../design/compositions/Auth.md), line 18.

```reaction
when RequestBoundary.request (path: "/auth/current", requestId, session)
then
  Sessioning.current (session)
```

### Auth.Current#2

Authored path: `Auth.Current`.
- Covered by [Auth](../design/compositions/Auth.md), line 12.
- Covered by [Auth](../design/compositions/Auth.md), line 18.

```reaction
when Sessioning.current (session, user), asked by Auth.Current
where
  earlier, RequestBoundary.request (path: "/auth/current", requestId, session)
then
  RequestBoundary.respond (account: former "the account of (user)" with (user), requestId)
```

### Auth.Login

Authored path: `Auth.Login`.
- Covered by [Auth](../design/compositions/Auth.md), line 5.
- Covered by [Auth](../design/compositions/Auth.md), line 9.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  UserAuthenticating.login (password, username)
```

### Auth.Login#2

Authored path: `Auth.Login`.
- Covered by [Auth](../design/compositions/Auth.md), line 5.
- Covered by [Auth](../design/compositions/Auth.md), line 9.

```reaction
when UserAuthenticating.login (password, username, user), asked by Auth.Login
then
  Sessioning.start (user)
```

### Auth.Login#3

Authored path: `Auth.Login`.
- Covered by [Auth](../design/compositions/Auth.md), line 5.
- Covered by [Auth](../design/compositions/Auth.md), line 9.

```reaction
when Sessioning.start (user, session), asked by Auth.Login#2
where
  earlier, RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (requestId, session, user)
```

### Auth.Logout

Authored path: `Auth.Logout`.
- Covered by [Auth](../design/compositions/Auth.md), line 14.
- Covered by [Auth](../design/compositions/Auth.md), line 19.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Sessioning.end (session)
```

### Auth.Logout#2

Authored path: `Auth.Logout`.
- Covered by [Auth](../design/compositions/Auth.md), line 14.
- Covered by [Auth](../design/compositions/Auth.md), line 19.

```reaction
when Sessioning.end (session), asked by Auth.Logout
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (requestId, session)
```

### Auth.Register

Authored path: `Auth.Register`.
- Covered by [Auth](../design/compositions/Auth.md), line 3.
- Covered by [Auth](../design/compositions/Auth.md), line 8.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  UserAuthenticating.register (password, username)
```

### Auth.Register#2

Authored path: `Auth.Register`.
- Covered by [Auth](../design/compositions/Auth.md), line 3.
- Covered by [Auth](../design/compositions/Auth.md), line 8.

```reaction
when UserAuthenticating.register (password, username, user), asked by Auth.Register
then
  Sessioning.start (user)
```

### Auth.Register#3

Authored path: `Auth.Register`.
- Covered by [Auth](../design/compositions/Auth.md), line 3.
- Covered by [Auth](../design/compositions/Auth.md), line 8.

```reaction
when Sessioning.start (user, session), asked by Auth.Register#2
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (requestId, session, user)
```

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/current` — requires `session`
- `/auth/login` — requires `username`, `password`
- `/auth/logout` — requires `session`
- `/auth/register` — requires `username`, `password`
