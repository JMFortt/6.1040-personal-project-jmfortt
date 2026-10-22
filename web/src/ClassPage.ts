import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, makePerform, savedSession, saveSession, SCHEDULE_MESSAGES, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { ScheduleBoard, type Block, type Person } from "./ScheduleBoard.ts";
import { dateLabel, hoursLabel, mondayOf, WEEKDAYS, type Weekday } from "./time.ts";

export interface ClassRow {
    group: string;
    name: string;
    role: string;
}

interface MemberRow extends Person {
    role: string;
}

interface SlotRow {
    slot: string;
    weekday: Weekday;
    startMinute: number;
    endMinute: number;
    capacity: number;
    assignees: Person[];
}

// one of your shifts in this class, with your status (null if not marked yet)
interface MyAttendanceRow {
    shift: string;
    start: string;
    end: string;
    status: string | null;
}

interface WeekRow {
    week: string;
    name: string;
    start: string;
}

// one class: its weekly template, its published weeks, its roster, and (for STAFF) inviting
export const ClassPage = defineComponent({
    components: { ScheduleBoard },
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        me: { type: String, required: true },
    },
    emits: ["back", "logged-out", "open-week"],
    setup(props, { emit }) {
        const roster = ref<MemberRow[]>([]);
        // your role right now, from your own row of the latest roster (it may have changed since the
        // class was opened); until the roster loads, the role the class was opened with
        const myRole = computed(() => roster.value.find((m) => m.user === props.me)?.role ?? props.role);
        const canEdit = computed(() => myRole.value === "TA" || myRole.value === "STAFF");
        const isLA = computed(() => myRole.value === "LA");
        const owner = ref("");
        const slots = ref<SlotRow[]>([]);
        const weeks = ref<WeekRow[]>([]);
        const myAttendance = ref<MyAttendanceRow[]>([]);
        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }
        const perform = makePerform(sessionExpired);

        // fetches everything on the page; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const group = props.group;
                const [rosterResult, templateResult, weeksResult, attendanceResult] = await Promise.all([
                    client.classes.roster({ session, group }),
                    client.schedule.template({ session, group }),
                    client.schedule.weeks({ session, group }),
                    client.attendance.mine({ session, group }),
                ]);
                const results = [rosterResult, templateResult, weeksResult, attendanceResult];
                if (results.some(loggedOutBy)) return sessionExpired();
                for (const result of results) {
                    if ("error" in result) {
                        loadError.value = errorMessage(result.error, { FORBIDDEN: "You're no longer a member of this class." });
                        return;
                    }
                }
                if (!("error" in rosterResult)) {
                    roster.value = rosterResult.roster;
                    owner.value = rosterResult.owner;
                }
                if (!("error" in templateResult)) slots.value = templateResult.template;
                if (!("error" in weeksResult)) weeks.value = weeksResult.weeks;
                if (!("error" in attendanceResult)) myAttendance.value = attendanceResult.records;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        // --- the weekly template ---

        const blocks = computed<Block[]>(() =>
            slots.value.map((s) => ({
                id: s.slot,
                day: WEEKDAYS.indexOf(s.weekday),
                startHour: s.startMinute / 60,
                endHour: s.endMinute / 60,
                capacity: s.capacity,
                assignees: s.assignees,
            })),
        );
        const scheduleError = ref("");
        const scheduleBusy = ref(false);

        async function edit(call: (session: string) => Promise<object>, messages: Record<string, string> = {}) {
            if (await perform(call, { ...SCHEDULE_MESSAGES, ...messages }, scheduleError, scheduleBusy)) await load();
        }

        const assignSlot = (slot: string, member: string) =>
            edit((session) => client.schedule.slots.assign({ session, slot, member }));
        const unassignSlot = (slot: string, member: string) =>
            edit((session) => client.schedule.slots.unassign({ session, slot, member }));
        const deleteSlot = (slot: string) => edit((session) => client.schedule.slots.delete({ session, slot }));
        const addSlot = (b: { day: number; startHour: number; endHour: number; capacity: number }) =>
            edit(
                (session) =>
                    client.schedule.slots.create({
                        session,
                        group: props.group,
                        weekday: WEEKDAYS[b.day]!,
                        startMinute: b.startHour * 60,
                        endMinute: b.endHour * 60,
                        capacity: b.capacity,
                    }),
                { INVALID_REQUEST: "Check the day, hours, and capacity." },
            );

        // --- published weeks ---

        const publishDate = ref("");
        const publishName = ref("");
        const publishError = ref("");
        const publishing = ref(false);

        async function publish() {
            publishError.value = "";
            if (publishDate.value === "") {
                publishError.value = "Pick any day in the week to publish.";
                return;
            }
            const start = mondayOf(publishDate.value);
            const name = publishName.value.trim() || "Week";
            const ok = await perform(
                (session) => client.schedule.weeks.publish({ session, group: props.group, start, name }),
                { ...SCHEDULE_MESSAGES, CONFLICT: "That week has already been published." },
                publishError,
                publishing,
            );
            if (ok) {
                publishDate.value = "";
                publishName.value = "";
                await load();
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

        async function leave() {
            if (!confirm("Leave this class? You'll come off any upcoming shifts.")) return;
            const ok = await perform(
                (session) => client.classes.leave({ session, group: props.group }),
                { FORBIDDEN: "The owner can't leave the class.", NOT_FOUND: "You're no longer in this class." },
                memberError,
                memberBusy,
            );
            if (ok) emit("back");
        }

        async function deleteClass() {
            if (!confirm(`Delete ${props.name} and everything in it (schedule, attendance, cover requests)? This can't be undone.`)) return;
            const ok = await perform(
                (session) => client.classes.delete({ session, group: props.group }),
                { FORBIDDEN: "Only the person who created this class can delete it." },
                memberError,
                memberBusy,
            );
            if (ok) emit("back");
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
                // the roster won't change until they accept, so say so
                inviteMessage.value = `Invited ${username} as ${role}. They'll join once they accept.`;
            }
        }

        onMounted(load);

        return {
            myRole, owner, memberError, memberBusy, changeRole, removeMember, leave, deleteClass,
            isLA, myAttendance, hoursLabel,
            canEdit, roster, weeks, loading, loadError, load,
            blocks, scheduleError, scheduleBusy, assignSlot, unassignSlot, deleteSlot, addSlot,
            publishDate, publishName, publishError, publishing, publish, dateLabel,
            inviteUsername, inviteRole, inviteError, inviteMessage, inviting, invite,
        };
    },
    template: `
        <div class="buttons">
            <button @click="$emit('back')">← Back to classes</button>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <h2>{{ name }}</h2>
        <p>You are: {{ myRole }}</p>
        <p v-if="loading">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <template v-else>
            <h3>Weekly schedule</h3>
            <ScheduleBoard
                :blocks="blocks"
                :roster="roster"
                :can-edit="canEdit"
                add-label="Add slot"
                :error="scheduleError"
                :busy="scheduleBusy"
                :me="me"
                :grey-others="isLA"
                @assign="assignSlot"
                @unassign="unassignSlot"
                @remove="deleteSlot"
                @add="addSlot"
            />

            <h3>Published weeks</h3>
            <p v-if="weeks.length === 0">No weeks published yet.</p>
            <ul v-else>
                <li v-for="w in weeks" :key="w.week">
                    <button class="link" @click="$emit('open-week', w.week)">{{ w.name }}</button> · {{ dateLabel(w.start) }}
                </li>
            </ul>
            <form v-if="canEdit" class="inline-form" @submit.prevent="publish">
                <label>Any day in the week
                    <input v-model="publishDate" type="date" />
                </label>
                <label>Name
                    <input v-model="publishName" placeholder="Week" />
                </label>
                <div class="buttons">
                    <button type="submit" :disabled="publishing">Publish week</button>
                </div>
                <p v-if="publishError" class="error">{{ publishError }}</p>
            </form>

            <h3>My attendance</h3>
            <p v-if="myAttendance.length === 0">You haven't been on any published shifts yet.</p>
            <ul v-else>
                <li v-for="r in myAttendance" :key="r.shift">
                    {{ dateLabel(r.start) }} · {{ hoursLabel(r.start, r.end) }} — {{ r.status ?? "not marked" }}
                </li>
            </ul>

            <h3>Roster</h3>
            <ul>
                <li v-for="m in roster" :key="m.user">
                    {{ m.username }} —
                    <template v-if="myRole === 'STAFF' && m.user !== owner">
                        <select :value="m.role" :disabled="memberBusy" @change="changeRole(m.user, $event.target.value)">
                            <option>LA</option>
                            <option>TA</option>
                            <option>STAFF</option>
                        </select>
                        <button class="link" :disabled="memberBusy" @click="removeMember(m.user, m.username)">Remove</button>
                    </template>
                    <template v-else>
                        {{ m.role }}<span v-if="m.user === owner"> (owner)</span>
                    </template>
                </li>
            </ul>
            <p v-if="memberError" class="error">{{ memberError }}</p>
            <div v-if="owner !== '' && me !== owner" class="buttons">
                <button :disabled="memberBusy" @click="leave">Leave class</button>
            </div>
            <div v-if="owner !== '' && me === owner" class="buttons">
                <button :disabled="memberBusy" @click="deleteClass">Delete class</button>
            </div>

            <template v-if="myRole === 'STAFF'">
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
        </template>
    `,
});
