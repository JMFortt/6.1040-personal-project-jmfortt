import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { form, former, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { UserAuthenticating, Sessioning } = concepts;

// looks up the username to show for a logged-in user
const Account = former("the account of (user)", ({ user }, { username }) =>
    where(UserAuthenticating._username({ user }).is({ username })).form({ user, username }),
);

// registering also logs you in
const Register = endpoint(
    "/auth/register",
    ({ username, password, user, session }) =>
        receive({ username, password })
            .then(UserAuthenticating.register({ username, password }).responds({ user }))
            .then(Sessioning.start({ user }).responds({ session }))
            .then(respond({ user, session })),
    { input: { required: ["username", "password"] } },
);

const Login = endpoint(
    "/auth/login",
    ({ username, password, user, session }) =>
        receive({ username, password })
            .then(UserAuthenticating.login({ username, password }).responds({ user }))
            .then(Sessioning.start({ user }).responds({ session }))
            .then(respond({ user, session })),
    { input: { required: ["username", "password"] } },
);

const Current = endpoint(
    "/auth/current",
    ({ session, user }) =>
        receive({ session })
            .then(Sessioning.current({ session }).responds({ user }))
            .then(respond({ account: Account({ user }) })),
    { input: { required: ["session"] } },
);

const Logout = endpoint(
    "/auth/logout",
    ({ session }) =>
        receive({ session })
            .then(Sessioning.end({ session }).responds({}))
            .then(respond({ session })),
    { input: { required: ["session"] } },
);

export const composition = { Account, Register, Login, Current, Logout };
