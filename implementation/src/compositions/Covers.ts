import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { IsMember, MayApproveRequests } from "./Access.ts";
import { idsInput } from "./validators.ts";

const { Sessioning, ShiftScheduling, ShiftTrading } = concepts;

// Cover requests are on shifts in published weeks. ShiftTrading only tracks the requests;
// the ApplyCover reaction is what changes the schedule once a request is approved.

// --- the reaction ---

// once a claimed request is approved, the claimer takes the requester's place on the shift
const ApplyCover = reaction(({ request, shift, requester, claimer }) =>
    when(ShiftTrading.approve({ request }).responds({}))
        .where(ShiftTrading._request({ request }).is({ shift, requester, claimer }))
        .then(ShiftScheduling.reassign({ shift, from: requester, to: claimer })),
);

// --- formers ---

// every request on a week's shifts, in shift order (people are user ids; the page shows usernames)
const WeekRequests = former(
    "the cover requests in (week)",
    ({ week }, { shift, start, end, request, requester, claimer, status }) =>
        each(ShiftScheduling._shiftsInWeek({ week }).is({ shift, start, end }))
            .where(ShiftTrading._requestsForShift({ shift }).is({ request, requester, claimer, status }))
            .arranged(start)
            .form({ request, shift, start, end, requester, claimer, status }),
);

// --- endpoints ---

// anyone on a shift can ask for a cover
const Request = endpoint(
    "/covers/request",
    ({ session, shift, user, request }) =>
        receive({ session, shift })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._assignees({ shift }).is({ user }))
                    .then(ShiftTrading.requestCover({ requester: user, shift }).responds({ request }))
                    .then(respond({ request }))
                    .named("on-shift"),
                where(no(ShiftScheduling._shift({ shift }))).then(respond({ error: "NO_SUCH_SHIFT" })).named("no-shift"),
                where(ShiftScheduling._shift({ shift }), no(ShiftScheduling._assignees({ shift }).is({ user })))
                    .then(respond({ error: "NOT_ON_SHIFT" }))
                    .named("not-on-shift"),
            ),
    { input: { required: ["session", "shift"] }, validators: { input: idsInput("shift") } },
);

// any member of the class who isn't already on the shift can claim it
const Claim = endpoint(
    "/covers/claim",
    ({ session, request, user, shift, group }) =>
        receive({ session, request })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(
                    ShiftTrading._request({ request }).is({ shift }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    IsMember({ user, group }),
                    no(ShiftScheduling._assignees({ shift }).is({ user })),
                )
                    .then(ShiftTrading.claim({ request, claimer: user }).responds({}))
                    .then(respond({ request }))
                    .named("allowed"),
                where(no(ShiftTrading._request({ request }))).then(respond({ error: "NO_SUCH_REQUEST" })).named("no-request"),
                where(ShiftTrading._request({ request }).is({ shift }), no(ShiftScheduling._shift({ shift })))
                    .then(respond({ error: "NO_SUCH_SHIFT" }))
                    .named("no-shift"),
                where(
                    ShiftTrading._request({ request }).is({ shift }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    no(IsMember({ user, group })),
                )
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-member"),
                where(
                    ShiftTrading._request({ request }).is({ shift }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    IsMember({ user, group }),
                    ShiftScheduling._assignees({ shift }).is({ user }),
                )
                    .then(respond({ error: "ALREADY_ON_SHIFT" }))
                    .named("already-on-shift"),
            ),
    { input: { required: ["session", "request"] }, validators: { input: idsInput("request") } },
);

// TAs and staff approve, but only if the reassignment will actually work: the requester is still
// on the shift and the claimer still isn't. Without this check, approve could succeed while the
// reaction's reassign fails, leaving the request APPROVED but the schedule unchanged.
const Approve = endpoint(
    "/covers/approve",
    ({ session, request, user, shift, group, requester, claimer }) =>
        receive({ session, request })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(
                    ShiftTrading._request({ request }).is({ shift, requester, claimer }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayApproveRequests({ user, group }),
                    ShiftScheduling._assignees({ shift }).is({ user: requester }),
                    no(ShiftScheduling._assignees({ shift }).is({ user: claimer })),
                )
                    .then(ShiftTrading.approve({ request }).responds({}))
                    .then(respond({ request }))
                    .named("allowed"),
                where(no(ShiftTrading._request({ request }))).then(respond({ error: "NO_SUCH_REQUEST" })).named("no-request"),
                where(ShiftTrading._request({ request }).is({ shift }), no(ShiftScheduling._shift({ shift })))
                    .then(respond({ error: "NO_SUCH_SHIFT" }))
                    .named("no-shift"),
                where(
                    ShiftTrading._request({ request }).is({ shift }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    no(MayApproveRequests({ user, group })),
                )
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
                where(
                    ShiftTrading._request({ request }).is({ shift, requester }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayApproveRequests({ user, group }),
                    no(ShiftScheduling._assignees({ shift }).is({ user: requester })),
                )
                    .then(respond({ error: "CANNOT_APPLY" }))
                    .named("requester-gone"),
                where(
                    ShiftTrading._request({ request }).is({ shift, requester, claimer }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayApproveRequests({ user, group }),
                    ShiftScheduling._assignees({ shift }).is({ user: requester }),
                    ShiftScheduling._assignees({ shift }).is({ user: claimer }),
                )
                    .then(respond({ error: "CANNOT_APPLY" }))
                    .named("claimer-already-on"),
            ),
    { input: { required: ["session", "request"] }, validators: { input: idsInput("request") } },
);

const Deny = endpoint(
    "/covers/deny",
    ({ session, request, user, shift, group }) =>
        receive({ session, request })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(
                    ShiftTrading._request({ request }).is({ shift }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    MayApproveRequests({ user, group }),
                )
                    .then(ShiftTrading.deny({ request }).responds({}))
                    .then(respond({ request }))
                    .named("allowed"),
                where(no(ShiftTrading._request({ request }))).then(respond({ error: "NO_SUCH_REQUEST" })).named("no-request"),
                where(ShiftTrading._request({ request }).is({ shift }), no(ShiftScheduling._shift({ shift })))
                    .then(respond({ error: "NO_SUCH_SHIFT" }))
                    .named("no-shift"),
                where(
                    ShiftTrading._request({ request }).is({ shift }),
                    ShiftScheduling._shift({ shift }).is({ context: group }),
                    no(MayApproveRequests({ user, group })),
                )
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-allowed"),
            ),
    { input: { required: ["session", "request"] }, validators: { input: idsInput("request") } },
);

// only the person who asked can withdraw their request
const Withdraw = endpoint(
    "/covers/withdraw",
    ({ session, request, user }) =>
        receive({ session, request })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftTrading._request({ request }).is({ requester: user }))
                    .then(ShiftTrading.withdraw({ request }).responds({}))
                    .then(respond({ request }))
                    .named("requester"),
                where(no(ShiftTrading._request({ request }))).then(respond({ error: "NO_SUCH_REQUEST" })).named("no-request"),
                where(ShiftTrading._request({ request }), no(ShiftTrading._request({ request }).is({ requester: user })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-requester"),
            ),
    { input: { required: ["session", "request"] }, validators: { input: idsInput("request") } },
);

const ForWeek = endpoint(
    "/covers/week",
    ({ session, week, user, group }) =>
        receive({ session, week })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(
                where(ShiftScheduling._week({ week }).is({ context: group }), IsMember({ user, group }))
                    .then(respond({ requests: WeekRequests({ week }) }))
                    .named("member"),
                where(no(ShiftScheduling._week({ week }))).then(respond({ error: "NO_SUCH_WEEK" })).named("no-week"),
                where(ShiftScheduling._week({ week }).is({ context: group }), no(IsMember({ user, group })))
                    .then(respond({ error: "NOT_ALLOWED" }))
                    .named("not-member"),
            ),
    { input: { required: ["session", "week"] }, validators: { input: idsInput("week") } },
);

export const composition = { ApplyCover, WeekRequests, Request, Claim, Approve, Deny, Withdraw, ForWeek };
