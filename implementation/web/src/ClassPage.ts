import { defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";

export interface ClassRow {
    group: string;
    name: string;
    role: string;
}

interface MemberRow {
    user: string;
    username: string;
    role: string;
}

// one class: its roster, and (for STAFF) a form to invite people
export const ClassPage = defineComponent({
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
    },
    emits: ["back", "logged-out"],
    setup(props, { emit }) {
        const roster = ref<MemberRow[]>([]);
        const loading = ref(true);
        const loadError = ref("");

        const inviteUsername = ref("");
        const inviteRole = ref("LA");
        const inviteError = ref("");
        const inviteMessage = ref("");
        const inviting = ref(false);

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }

        // fetches the roster; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const result = await client.classes.roster({ session, group: props.group });
                if (loggedOutBy(result)) return sessionExpired();
                if ("error" in result) {
                    loadError.value = errorMessage(result.error, {
                        FORBIDDEN: "You're no longer a member of this class.",
                    });
                } else roster.value = result.roster;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        async function invite() {
            inviteError.value = "";
            inviteMessage.value = "";
            // caught here so the user doesn't wait on a request that's sure to fail
            if (inviteUsername.value.trim() === "") {
                inviteError.value = "Please enter a username.";
                return;
            }
            const session = savedSession();
            if (session === null) return sessionExpired();
            inviting.value = true;
            try {
                const username = inviteUsername.value;
                const role = inviteRole.value;
                const result = await client.classes.invite({ session, group: props.group, username, role });
                if (loggedOutBy(result)) return sessionExpired();
                if ("error" in result) {
                    inviteError.value = errorMessage(result.error, {
                        NOT_FOUND: "No user has that username.",
                        CONFLICT: "That user is already in or invited to this class.",
                        FORBIDDEN: "Only staff can invite people.",
                        INVALID_REQUEST: "Please enter a username.",
                    });
                    return;
                }
                inviteUsername.value = "";
                // the roster won't change until they accept, so say so
                inviteMessage.value = `Invited ${username} as ${role}. They'll join once they accept.`;
            } catch {
                inviteError.value = UNREACHABLE;
            } finally {
                inviting.value = false;
            }
        }

        onMounted(load);

        return {
            roster, loading, loadError,
            inviteUsername, inviteRole, inviteError, inviteMessage, inviting,
            load, invite,
        };
    },
    template: `
        <div class="buttons">
            <button @click="$emit('back')">← Back to classes</button>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <h2>{{ name }}</h2>
        <p>You are: {{ role }}</p>

        <h3>Roster</h3>
        <p v-if="loading">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>
        <ul v-else>
            <li v-for="m in roster" :key="m.user">{{ m.username }} — {{ m.role }}</li>
        </ul>

        <template v-if="role === 'STAFF'">
            <h3>Invite someone</h3>
            <form @submit.prevent="invite">
                <label>
                    Username
                    <input v-model="inviteUsername" />
                </label>
                <label>
                    Role
                    <select v-model="inviteRole">
                        <option>LA</option>
                        <option>TA</option>
                        <option>STAFF</option>
                    </select>
                </label>
                <div class="buttons">
                    <button type="submit" :disabled="inviting">Invite</button>
                </div>
                <p v-if="inviteMessage">{{ inviteMessage }}</p>
                <p v-if="inviteError" class="error">{{ inviteError }}</p>
            </form>
        </template>
    `,
});
