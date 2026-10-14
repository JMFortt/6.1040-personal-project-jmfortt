# Auth

A person [registers](reaction:Auth.Register) with a username and password, which
also starts a session for them, so registering logs them in. Later they
[log in](reaction:Auth.Login) with the same credentials to start a new session.

```endpoints
Auth.Register at /auth/register
Auth.Login at /auth/login
```

A session [identifies the current user](reaction:Auth.Current), shown through
[their account](former:Auth.Account) with its username. An unknown or ended
session is refused as not logged in. [Logging out](reaction:Auth.Logout) ends the
session.

```endpoints
Auth.Current at /auth/current
Auth.Logout at /auth/logout
```
