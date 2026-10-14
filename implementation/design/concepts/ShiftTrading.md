# ShiftTrading

## Purpose

Let staff hand off or exchange shifts without a manager reworking the schedule

## Principle

If a user posts a cover request for their shift and another user claims it, then once it's approved the claimer is responsible for the shift instead. Every request keeps a visible status, so everyone can tell whether it's still open, taken, or resolved

## Types

```types
external User
  A person who requests or claims a cover.

external Shift
  The shift a request is about.

Status is OPEN or CLAIMED or APPROVED or DENIED or WITHDRAWN
  The stages a request moves through. OPEN and CLAIMED requests are active.
```

## State

```state
a set of Requests with
  a requester User
  a Shift
  an optional claimer User
  a Status
```

## Actions

```actions
requestCover(requester: User, shift: Shift) : returns (request: Request)
  where requester has no active request for shift
  then
    create a new OPEN request by requester for shift
    returns request
  where requester already has an active request for shift
  then
    refuses ACTIVE_REQUEST_EXISTS "You already have an active request for this shift."

claim(request: Request, claimer: User) : returns ()
  where request is OPEN and claimer is not its requester
  then
    set the claimer of request to claimer and its status to CLAIMED
    returns
  where request does not exist
  then
    refuses REQUEST_NOT_FOUND "There is no such request."
  where request exists and is not OPEN
  then
    refuses NOT_OPEN "This request is no longer open."
  where request is OPEN and claimer is its requester
  then
    refuses OWN_REQUEST "You cannot claim your own request."

approve(request: Request) : returns ()
  where request is CLAIMED
  then
    set the status of request to APPROVED
    returns
  where request does not exist
  then
    refuses REQUEST_NOT_FOUND "There is no such request."
  where request exists and is not CLAIMED
  then
    refuses NOT_CLAIMED "Only a claimed request can be approved."

deny(request: Request) : returns ()
  where request is OPEN or CLAIMED
  then
    set the status of request to DENIED
    returns
  where request does not exist
  then
    refuses REQUEST_NOT_FOUND "There is no such request."
  where request exists and is not OPEN or CLAIMED
  then
    refuses ALREADY_RESOLVED "This request has already been resolved."

withdraw(request: Request) : returns ()
  where request is OPEN or CLAIMED
  then
    set the status of request to WITHDRAWN
    returns
  where request does not exist
  then
    refuses REQUEST_NOT_FOUND "There is no such request."
  where request exists and is not OPEN or CLAIMED
  then
    refuses ALREADY_RESOLVED "This request has already been resolved."
```

## Queries

```queries
_request(request: Request) : optional (requester: User, shift: Shift, claimer: User | null, status: Status)
  Returns the details of request, with a null claimer if it has not been claimed, or no row if the request does not exist.

_requestsForShift(shift: Shift) : many (request: Request, requester: User, claimer: User | null, status: Status)
  Returns every request for shift, ordered by request, and no rows if there are none.
```
