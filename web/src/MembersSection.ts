import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, makePerform, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { usePolling } from "./polling.ts";
import type { Person } from "./ScheduleBoard.ts";

interface MemberRow extends Person {
    role: string;
}

// an invite that hasn't been accepted yet (only STAFF see these)
interface InviteRow extends Person {
    invite: string;
    role: string;
}

// a class's members: the roster, managing roles (STAFF), inviting (STAFF), and leaving or deleting the class
export const MembersSection = defineComponent({
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        me: { type: String, required: true },
    },
    // left: you left or deleted the class, so go back to your classes
    emits: ["logged-out", "left"],
    setup(props, { emit }) {
        const roster = ref<MemberRow[]>([]);
        const pending = ref<InviteRow[]>([]);
        const owner = ref("");
        // your role right now, from your own row of the latest roster
        const myRole = computed(() => roster.value.find((m) => m.user === props.me)?.role ?? props.role);
        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }
        const perform = makePerform(sessionExpired);

        // fetches the roster, then (for STAFF) the pending invites; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const result = await client.classes.roster({ session, group: props.group });
                if (loggedOutBy(result)) return sessionExpired();
                if ("error" in result) {
                    loadError.value = errorMessage(result.error, { FORBIDDEN: "You're no longer a member of this class." });
                    return;
                }
                roster.value = result.roster;
                owner.value = result.owner;

                // the roster says what your role is now, which decides whether you can see invites
                if (myRole.value !== "STAFF") {
                    pending.value = [];
                    return;
                }
                const invites = await client.classes.invites({ session, group: props.group });
                if (loggedOutBy(invites)) return sessionExpired();
                pending.value = "error" in invites ? [] : invites.invites;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        // --- managing members (STAFF) and leaving (anyone but the owner) ---

        const memberError = ref("");
        const memberBusy = ref(false);

        async function changeRole(member: string, role: string) {
            const ok = await perform(
                (session) => client.classes["change-role"]({ session, group: props.group, member, role }),
                {
                    FORBIDDEN: "Only staff can change roles, and the owner's role can't be changed.",
                    NOT_FOUND: "They're no longer in this class.",
                    INVALID_REQUEST: "The role must be LA, TA, or STAFF.",
                },
                memberError,
                memberBusy,
            );
            // reload either way, so the dropdown shows what's actually saved
            await load();
            return ok;
        }

        async function removeMember(member: string, username: string) {
            if (!confirm(`Remove ${username} from this class? They'll come off any upcoming shifts.`)) return;
            const ok = await perform(
                (session) => client.classes.remove({ session, group: props.group, member }),
                {
                    FORBIDDEN: "Only staff can remove members, and the owner can't be removed.",
                    NOT_FOUND: "They're no longer in this class.",
                },
                memberError,
                memberBusy,
            );
            if (ok) await load();
        }

        async function withdrawInvite(invite: string, username: string) {
            if (!confirm(`Withdraw ${username}'s invite?`)) return;
            const ok = await perform(
                (session) => client.classes["withdraw-invite"]({ session, group: props.group, invite }),
                {
                    FORBIDDEN: "Only staff can withdraw invites.",
                    NOT_FOUND: "That invite was already accepted or withdrawn.",
                },
                memberError,
                memberBusy,
            );
            // reload either way, so the table shows what's actually there
            await load();
            return ok;
        }

        async function leave() {
            if (!confirm("Leave this class? You'll come off any upcoming shifts.")) return;
            const ok = await perform(
                (session) => client.classes.leave({ session, group: props.group }),
                { FORBIDDEN: "The owner can't leave the class.", NOT_FOUND: "You're no longer in this class." },
                memberError,
                memberBusy,
            );
            if (ok) emit("left");
        }

        async function deleteClass() {
            if (!confirm(`Delete ${props.name} and everything in it (schedule, attendance, cover requests)? This can't be undone.`)) return;
            const ok = await perform(
                (session) => client.classes.delete({ session, group: props.group }),
                { FORBIDDEN: "Only the person who created this class can delete it." },
                memberError,
                memberBusy,
            );
            if (ok) emit("left");
        }

        // --- inviting (STAFF) ---

        const inviteUsername = ref("");
        const inviteRole = ref("LA");
        const inviteError = ref("");
        const inviteMessage = ref("");
        const inviting = ref(false);

        async function invite() {
            inviteMessage.value = "";
            inviteError.value = "";
            if (inviteUsername.value.trim() === "") {
                inviteError.value = "Please enter a username.";
                return;
            }
            const username = inviteUsername.value;
            const role = inviteRole.value;
            const ok = await perform(
                (session) => client.classes.invite({ session, group: props.group, username, role }),
                {
                    NOT_FOUND: "No user has that username.",
                    CONFLICT: "That user is already in or invited to this class.",
                    FORBIDDEN: "Only staff can invite people.",
                    INVALID_REQUEST: "Please enter a username.",
                },
                inviteError,
                inviting,
            );
            if (ok) {
                inviteUsername.value = "";
                // they show up as "Invite pending" until they accept, so say so
                inviteMessage.value = `Invited ${username} as ${role}. They'll join once they accept.`;
                await load();
            }
        }

        onMounted(load);
        usePolling(load);

        return {
            myRole, roster, pending, owner, loading, loadError, load,
            memberError, memberBusy, changeRole, removeMember, withdrawInvite, leave, deleteClass,
            inviteUsername, inviteRole, inviteError, inviteMessage, inviting, invite,
        };
    },
    template: `
        <div class="section-head">
            <div>
                <p class="eyebrow">{{ name }}</p>
                <h1>Members</h1>
            </div>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <p v-if="loading" class="muted">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <template v-else>
            <section v-if="myRole === 'STAFF'" class="card">
                <h2>Invite someone</h2>
                <p class="muted">They need to have registered first. They'll join once they accept.</p>
                <form class="inline-form" @submit.prevent="invite">
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
                        <button type="submit" class="primary" :disabled="inviting">Send invite</button>
                    </div>
                </form>
                <p v-if="inviteMessage" class="success">{{ inviteMessage }}</p>
                <p v-if="inviteError" class="error">{{ inviteError }}</p>
            </section>

            <section class="card">
                <div class="card-head">
                    <h2>Members</h2>
                    <span class="muted">
                        {{ roster.length }} {{ roster.length === 1 ? "member" : "members" }}<template
                            v-if="pending.length > 0"> · {{ pending.length }} pending</template>
                    </span>
                </div>
                <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th v-if="myRole === 'STAFF'"><span class="visually-hidden">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="m in roster" :key="m.user">
                                <td>
                                    {{ m.username }}
                                    <span v-if="m.user === me" class="muted"> (you)</span>
                                </td>
                                <td>
                                    <select
                                        v-if="myRole === 'STAFF' && m.user !== owner"
                                        :value="m.role"
                                        :disabled="memberBusy"
                                        :aria-label="'Role for ' + m.username"
                                        @change="changeRole(m.user, $event.target.value)"
                                    >
                                        <option>LA</option>
                                        <option>TA</option>
                                        <option>STAFF</option>
                                    </select>
                                    <span v-else class="badge role">{{ m.role }}</span>
                                </td>
                                <td>{{ m.user === owner ? "Owner" : "Active" }}</td>
                                <td v-if="myRole === 'STAFF'" class="actions">
                                    <button
                                        v-if="m.user !== owner"
                                        class="link danger-link"
                                        :disabled="memberBusy"
                                        @click="removeMember(m.user, m.username)"
                                    >Remove</button>
                                </td>
                            </tr>
                            <tr v-for="i in pending" :key="i.invite" class="pending">
                                <td>{{ i.username }}</td>
                                <td><span class="badge">{{ i.role }}</span></td>
                                <td><span class="badge open">Invite pending</span></td>
                                <td class="actions">
                                    <button class="link danger-link" :disabled="memberBusy" @click="withdrawInvite(i.invite, i.username)">
                                        Withdraw
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-if="memberError" class="error">{{ memberError }}</p>
            </section>

            <section class="card">
                <h2>{{ owner === me ? "Delete this class" : "Leave this class" }}</h2>
                <template v-if="owner === me">
                    <p class="muted">Deletes the class with its whole schedule, attendance, and cover requests. This can't be undone.</p>
                    <button class="danger" :disabled="memberBusy" @click="deleteClass">Delete class</button>
                </template>
                <template v-else>
                    <p class="muted">You'll come off any upcoming shifts. Past shifts and your attendance on them stay.</p>
                    <button class="danger" :disabled="memberBusy" @click="leave">Leave class</button>
                </template>
            </section>
        </template>
    `,
});
