import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidCredentials extends Error { }
export class UsernameTaken extends Error { }
export class LoginFailed extends Error { }

interface User {
    _id: string;
    username: string;
    passwordHash: string;
}

export class UserAuthenticatingConcept {
    private readonly users: Collection<User>;
    private indexed = false;

    constructor(db: Db) {
        this.users = db.collection<User>("userAuthenticating.users");
    }

    async register({ username, password }: { username: string; password: string }) {
        if (username === "" || password === "") {
            throw new InvalidCredentials("The username and password must not be empty.");
        }
        if (!this.indexed) {
            // unique index stops two users from having the same username
            await this.users.createIndex({ username: 1 }, { unique: true });
            this.indexed = true;
        }
        const user = crypto.randomUUID();
        // hash is stored, never the password itself
        const passwordHash = await Bun.password.hash(password);
        try {
            await this.users.insertOne({ _id: user, username, passwordHash });
        } catch (error) {
            if (error instanceof MongoServerError && error.code === 11000) {
                throw new UsernameTaken("That username is already taken.");
            }
            throw error;
        }
        return { user };
    }

    async login({ username, password }: { username: string; password: string }) {
        const found = await this.users.findOne({ username });
        // same refusal for an unknown username and a wrong password
        // (so caller can't use login to find out which usernames exist)
        if (found === null || !(await Bun.password.verify(password, found.passwordHash))) {
            throw new LoginFailed("The username or password is incorrect.");
        }
        return { user: found._id };
    }

    async _username({ user }: { user: string }) {
        const found = await this.users.findOne({ _id: user });
        return found === null ? [] : [{ username: found.username }];
    }

    async _user({ username }: { username: string }) {
        const found = await this.users.findOne({ username });
        return found === null ? [] : [{ user: found._id }];
    }
}
