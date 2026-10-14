import { defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";

interface ClassRow {
    group: string;
    name: string;
    role: string;
}

// the home page once you're logged in: your classes, and a form to create one
export const ClassesPage = defineComponent({
    props: { username: { type: String, required: true } },
    emits: ["logged-out"],
    setup(_props, { emit }) {
        const classes = ref<ClassRow[]>([]);
        const loading = ref(true);
        const loadError = ref("");

        const newName = ref("");
        const createError = ref("");
        const creating = ref(false);

        const logoutError = ref("");
        const loggingOut = ref(false);

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }

        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const result = await client.classes.mine({ session });
                if (loggedOutBy(result)) return sessionExpired();
                if ("error" in result) loadError.value = errorMessage(result.error, {});
                else classes.value = result.classes;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
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

        async function logout() {
            logoutError.value = "";
            const session = savedSession();
            loggingOut.value = true;
            try {
                if (session !== null) {
                    const result = await client.auth.logout({ session });
                    // NOT_FOUND means the session had already ended, so that's still logged out
                    if ("error" in result && result.error !== "NOT_FOUND") {
                        logoutError.value = "Couldn't log out. Please try again.";
                        return;
                    }
                }
                saveSession(null);
                emit("logged-out");
            } catch {
                logoutError.value = UNREACHABLE;
            } finally {
                loggingOut.value = false;
            }
        }

        onMounted(load);

        return { classes, loading, loadError, newName, createError, creating, logoutError, loggingOut, create, logout };
    },
    template: `
        <header class="top">
            <h1>Hello {{ username }}!</h1>
            <button :disabled="loggingOut" @click="logout">Log out</button>
        </header>
        <p v-if="logoutError" class="error">{{ logoutError }}</p>

        <h2>Your classes</h2>
        <p v-if="loading">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>
        <p v-else-if="classes.length === 0">You're not in any classes yet.</p>
        <ul v-else>
            <li v-for="c in classes" :key="c.group">{{ c.name }} — {{ c.role }}</li>
        </ul>

        <h2>New class</h2>
        <form @submit.prevent="create">
            <label>
                Class name
                <input v-model="newName" />
            </label>
            <div class="buttons">
                <button type="submit" :disabled="creating">Create</button>
            </div>
            <p v-if="createError" class="error">{{ createError }}</p>
        </form>
    `,
});
