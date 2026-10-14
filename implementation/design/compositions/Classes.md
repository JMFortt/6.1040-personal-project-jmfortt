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
