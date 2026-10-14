# Application types

Every concept that refers to a person uses the users that UserAuthenticating
registers, so a session belongs to a registered user.

```instances
instantiate UserAuthenticating

instantiate Sessioning with
  User is UserAuthenticating.User
```
