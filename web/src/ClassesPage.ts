import { defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE, type ClassRow } from "./api.ts";
import { usePolling } from "./polling.ts";

interface InviteRow {
    invite: string;
    group: string;
    name: string;
    role: string;
}

// the home page once you're logged in: your invites, your classes, and a form to create one
export const ClassesPage = defineComponent({
    emits: ["logged-out", "open-class"],
    setup(_props, { emit }) {
        const classes = ref<ClassRow[]>([]);
        const invites = ref<InviteRow[]>([]);
        const loading = ref(true);
        const loadError = ref("");

        const acceptError = ref("");
        const accepting = ref(false);

        const newName = ref("");
        const createError = ref("");
        const creating = ref(false);

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }

        // fetches both lists; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const [mine, pending] = await Promise.all([
                    client.classes.mine({ session }),
                    client.invites.mine({ session }),
                ]);
                if (loggedOutBy(mine) || loggedOutBy(pending)) return sessionExpired();
                if ("error" in mine) loadError.value = errorMessage(mine.error, {});
                else classes.value = mine.classes;
                if ("error" in pending) loadError.value = errorMessage(pending.error, {});
                else invites.value = pending.invites;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        async function accept(invite: string) {
            acceptError.value = "";
            const session = savedSession();
            if (session === null) return sessionExpired();
            accepting.value = true;
            try {
                const result = await client.invites.accept({ session, invite });
                if (loggedOutBy(result)) return sessionExpired();
                if ("error" in result) {
                    acceptError.value = errorMessage(result.error, {
                        NOT_FOUND: "That invite no longer exists.",
                        FORBIDDEN: "That invite is for someone else.",
                    });
                }
                // re-fetch either way, so the class moves from invites to classes
                await load();
            } catch {
                acceptError.value = UNREACHABLE;
            } finally {
                accepting.value = false;
            }
        }

        async function create() {
            createError.value = "";
            // caught here so the user doesn't wait on a request that's sure to fail
            if (newName.value.trim() === "") {
                createError.value = "Please enter a class name.";
                return;
            }
            const session = savedSession();
            if (session === null) return sessionExpired();
            creating.value = true;
            try {
                const result = await client.classes.create({ session, name: newName.value });
                if (loggedOutBy(result)) return sessionExpired();
                if ("error" in result) {
                    createError.value = errorMessage(result.error, { INVALID_REQUEST: "Please enter a class name." });
                    return;
                }
                newName.value = "";
                // re-fetch so the new class shows up without a page refresh
                await load();
            } catch {
                createError.value = UNREACHABLE;
            } finally {
                creating.value = false;
            }
        }

        function open(row: ClassRow) {
            emit("open-class", row);
        }

        onMounted(load);
        usePolling(load);

        return {
            classes, invites, loading, loadError, acceptError, accepting,
            newName, createError, creating, load, accept, create, open,
        };
    },
    template: `
        <div class="section-head">
            <h1>My classes</h1>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <p v-if="loadError" class="error">{{ loadError }}</p>

        <section v-if="invites.length > 0" class="card">
            <h2>Your invites</h2>
            <ul>
                <li v-for="i in invites" :key="i.invite">
                    {{ i.name }} <span class="badge role">{{ i.role }}</span>
                    <button class="primary" :disabled="accepting" @click="accept(i.invite)">Accept</button>
                </li>
            </ul>
            <p v-if="acceptError" class="error">{{ acceptError }}</p>
        </section>

        <section class="card">
            <h2>Your classes</h2>
            <p v-if="loading" class="muted">Loading…</p>
            <p v-else-if="classes.length === 0" class="muted">You're not in any classes yet. Create one below, or ask for an invite.</p>
            <ul v-else>
                <li v-for="c in classes" :key="c.group">
                    <button class="link" @click="open(c)">{{ c.name }}</button> <span class="badge role">{{ c.role }}</span>
                </li>
            </ul>
        </section>

        <section class="card">
            <h2>New class</h2>
            <form class="inline-form" @submit.prevent="create">
                <label>
                    Class name
                    <input v-model="newName" placeholder="e.g. 6.1040" />
                </label>
                <div class="buttons">
                    <button type="submit" class="primary" :disabled="creating">Create class</button>
                </div>
            </form>
            <p v-if="createError" class="error">{{ createError }}</p>
        </section>
    `,
});
