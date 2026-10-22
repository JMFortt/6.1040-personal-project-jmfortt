import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, makePerform, savedSession, saveSession, SCHEDULE_MESSAGES, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { usePolling } from "./polling.ts";
import { ScheduleBoard, type Block, type Person } from "./ScheduleBoard.ts";
import { dateLabel, dayAndHours, hoursLabel, timeIn, weekDayLabels } from "./time.ts";

interface CoverRow {
    request: string;
    shift: string;
    start: string;
    end: string;
    requester: string;
    claimer: string | null;
    status: string;
}

interface AttendanceRow {
    user: string;
    username: string;
    status: string;
}

interface ShiftRow {
    shift: string;
    start: string;
    end: string;
    capacity: number;
    assignees: Person[];
}

// one published week: its shifts on the grid, and (for TAs and staff) editing, renaming, deleting
export const WeekPage = defineComponent({
    components: { ScheduleBoard },
    props: {
        week: { type: String, required: true },
        group: { type: String, required: true },
        role: { type: String, required: true },
        me: { type: String, required: true },
    },
    emits: ["back", "logged-out"],
    setup(props, { emit }) {

        const name = ref("");
        const start = ref("");
        const shifts = ref<ShiftRow[]>([]);
        const roster = ref<(Person & { role: string })[]>([]);
        // your role right now, from your own row of the latest roster (it may have changed since the
        // class was opened); until the roster loads, the role the class was opened with
        const myRole = computed(() => roster.value.find((m) => m.user === props.me)?.role ?? props.role);
        const canEdit = computed(() => myRole.value === "TA" || myRole.value === "STAFF");
        const isLA = computed(() => myRole.value === "LA");
        const covers = ref<CoverRow[]>([]);
        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }
        const perform = makePerform(sessionExpired);

        // fetches the week, the roster, and the week's cover requests; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const [weekResult, rosterResult, coversResult] = await Promise.all([
                    client.schedule.week({ session, week: props.week }),
                    client.classes.roster({ session, group: props.group }),
                    client.covers.week({ session, week: props.week }),
                ]);
                if ([weekResult, rosterResult, coversResult].some(loggedOutBy)) return sessionExpired();
                if (!("error" in coversResult)) covers.value = coversResult.requests;
                if ("error" in weekResult) {
                    loadError.value = errorMessage(weekResult.error, {
                        NOT_FOUND: "This week no longer exists.",
                        FORBIDDEN: "You're no longer a member of this class.",
                    });
                    return;
                }
                name.value = weekResult.week.name;
                start.value = weekResult.week.start;
                shifts.value = weekResult.week.shifts;
                if (!("error" in rosterResult)) roster.value = rosterResult.roster;
                if (renameTo.value === "") renameTo.value = name.value;
                if (selectedShift.value !== null) await loadAttendance(selectedShift.value);
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        const dayLabels = computed(() => (start.value === "" ? undefined : weekDayLabels(start.value)));
        const blocks = computed<Block[]>(() =>
            shifts.value.map((s) => ({ id: s.shift, ...dayAndHours(s.start, s.end), capacity: s.capacity, assignees: s.assignees })),
        );

        // --- editing shifts ---

        const scheduleError = ref("");
        const scheduleBusy = ref(false);

        async function edit(call: (session: string) => Promise<object>, messages: Record<string, string> = {}) {
            if (await perform(call, { ...SCHEDULE_MESSAGES, ...messages }, scheduleError, scheduleBusy)) await load();
        }

        const assignShift = (shift: string, member: string) =>
            edit((session) => client.schedule.shifts.assign({ session, shift, member }));
        const unassignShift = (shift: string, member: string) =>
            edit((session) => client.schedule.shifts.unassign({ session, shift, member }));
        const deleteShift = (shift: string) => edit((session) => client.schedule.shifts.delete({ session, shift }));
        const addShift = (b: { day: number; startHour: number; endHour: number; capacity: number }) =>
            edit(
                (session) =>
                    client.schedule.shifts.create({
                        session,
                        week: props.week,
                        start: timeIn(start.value, b.day, b.startHour),
                        end: timeIn(start.value, b.day, b.endHour),
                        capacity: b.capacity,
                    }),
                { INVALID_REQUEST: "Check the day, hours, and capacity." },
            );

        // --- attendance for the selected shift ---

        const selectedShift = ref<string | null>(null);
        // records per shift id (TAs and staff get everyone's; others get only their own)
        const attendance = ref<Record<string, AttendanceRow[]>>({});
        const attendanceError = ref("");
        const attendanceBusy = ref(false);

        async function loadAttendance(shift: string) {
            const ok = await perform(
                async (session) => {
                    const result = await client.attendance.shift({ session, shift });
                    if (!("error" in result)) attendance.value = { ...attendance.value, [shift]: result.records };
                    return result;
                },
                { NOT_FOUND: "That shift no longer exists. Try refreshing." },
                attendanceError,
                attendanceBusy,
            );
            return ok;
        }

        async function select(shift: string | null) {
            selectedShift.value = shift;
            attendanceError.value = "";
            if (shift !== null) await loadAttendance(shift);
        }

        // "" means not marked
        function statusOf(shift: string, user: string) {
            return attendance.value[shift]?.find((r) => r.user === user)?.status ?? "";
        }

        // picking "not marked" clears the mark; anything else sets it
        async function setStatus(shift: string, member: string, status: string) {
            const ok = await perform(
                (session) =>
                    status === ""
                        ? client.attendance.unmark({ session, shift, member })
                        : client.attendance.mark({ session, shift, member, status: status as "PRESENT" | "ABSENT" | "LATE" }),
                {
                    FORBIDDEN: "Only TAs and staff can take attendance.",
                    INVALID_REQUEST: "They aren't on this shift.",
                    NOT_FOUND: "There was nothing to clear. Try refreshing.",
                },
                attendanceError,
                attendanceBusy,
            );
            // reload either way, so the dropdown shows what's actually saved
            await loadAttendance(shift);
            return ok;
        }

        // --- cover requests ---

        const coverError = ref("");
        const coverBusy = ref(false);
        const ACTIVE = ["OPEN", "CLAIMED"];

        // requests list user ids; show usernames from the roster
        function nameOf(user: string | null) {
            if (user === null) return "";
            return roster.value.find((p) => p.user === user)?.username ?? "someone no longer in the class";
        }

        function isOn(shift: string, user: string) {
            return shifts.value.find((s) => s.shift === shift)?.assignees.some((a) => a.user === user) ?? false;
        }

        // your active request for a shift, if you've asked for a cover on it
        function myActiveRequest(shift: string) {
            return covers.value.find((c) => c.shift === shift && c.requester === props.me && ACTIVE.includes(c.status)) ?? null;
        }

        function canClaim(c: CoverRow) {
            return c.status === "OPEN" && c.requester !== props.me && !isOn(c.shift, props.me);
        }

        async function cover(call: (session: string) => Promise<object>, messages: Record<string, string>) {
            if (await perform(call, messages, coverError, coverBusy)) await load();
        }

        const requestCover = (shift: string) =>
            cover((session) => client.covers.request({ session, shift }), {
                CONFLICT: "You already have an open request for this shift.",
                INVALID_REQUEST: "You're not on this shift.",
            });
        const claim = (request: string) =>
            cover((session) => client.covers.claim({ session, request }), {
                CONFLICT: "This request is no longer open, or you're already on that shift.",
                FORBIDDEN: "Only members of this class can claim covers.",
            });
        const approve = (request: string) =>
            cover((session) => client.covers.approve({ session, request }), {
                CONFLICT: "This can't be approved: it isn't claimed, or the schedule changed since it was claimed.",
                FORBIDDEN: "Only TAs and staff can approve covers.",
            });
        const deny = (request: string) =>
            cover((session) => client.covers.deny({ session, request }), {
                CONFLICT: "This request has already been resolved.",
                FORBIDDEN: "Only TAs and staff can deny covers.",
            });
        const withdraw = (request: string) =>
            cover((session) => client.covers.withdraw({ session, request }), {
                CONFLICT: "This request has already been resolved.",
                FORBIDDEN: "Only the person who asked can withdraw it.",
            });

        // --- renaming and deleting the week ---

        const renameTo = ref("");
        const weekError = ref("");
        const weekBusy = ref(false);

        async function rename() {
            if (renameTo.value.trim() === "") {
                weekError.value = "The name can't be empty.";
                return;
            }
            const ok = await perform(
                (session) => client.schedule.weeks.rename({ session, week: props.week, name: renameTo.value.trim() }),
                { ...SCHEDULE_MESSAGES, INVALID_REQUEST: "The name can't be empty." },
                weekError,
                weekBusy,
            );
            if (ok) await load();
        }

        async function deleteWeek() {
            if (!confirm("Delete this week and all its shifts?")) return;
            const ok = await perform(
                (session) => client.schedule.weeks.delete({ session, week: props.week }),
                SCHEDULE_MESSAGES,
                weekError,
                weekBusy,
            );
            if (ok) emit("back");
        }

        onMounted(load);
        usePolling(load);

        return {
            covers, coverError, coverBusy, nameOf, isOn, myActiveRequest, canClaim, hoursLabel,
            requestCover, claim, approve, deny, withdraw, ACTIVE,
            isLA, select, statusOf, setStatus, attendanceError, attendanceBusy,
            canEdit, name, start, roster, loading, loadError, load, dayLabels, blocks, dateLabel,
            scheduleError, scheduleBusy, assignShift, unassignShift, deleteShift, addShift,
            renameTo, weekError, weekBusy, rename, deleteWeek,
        };
    },
    template: `
        <div class="buttons">
            <button @click="$emit('back')">← Back to class</button>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <p v-if="loading">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <template v-else>
            <h2>{{ name }}</h2>
            <p>Week of {{ dateLabel(start) }}</p>

            <ScheduleBoard
                :blocks="blocks"
                :roster="roster"
                :can-edit="canEdit"
                :day-labels="dayLabels"
                add-label="Add shift"
                :error="scheduleError"
                :busy="scheduleBusy"
                :me="me"
                :grey-others="isLA"
                @assign="assignShift"
                @unassign="unassignShift"
                @remove="deleteShift"
                @add="addShift"
                @select="select"
            >
                <template #panel="{ block }">
                    <h4>Attendance</h4>
                    <template v-if="canEdit">
                        <p v-if="block.assignees.length === 0">Nobody to mark.</p>
                        <div v-for="a in block.assignees" :key="a.user" class="buttons">
                            <span>{{ a.username }}</span>
                            <select
                                :value="statusOf(block.id, a.user)"
                                :disabled="attendanceBusy"
                                @change="setStatus(block.id, a.user, $event.target.value)"
                            >
                                <option value="">not marked</option>
                                <option>PRESENT</option>
                                <option>ABSENT</option>
                                <option>LATE</option>
                            </select>
                        </div>
                    </template>
                    <p v-else-if="block.assignees.some((a) => a.user === me)">
                        You: {{ statusOf(block.id, me) || "not marked" }}
                    </p>
                    <p v-else>You're not on this shift.</p>
                    <p v-if="attendanceError" class="error">{{ attendanceError }}</p>

                    <template v-if="isOn(block.id, me)">
                        <h4>Cover</h4>
                        <div v-if="myActiveRequest(block.id)" class="buttons">
                            <span>You asked for a cover ({{ myActiveRequest(block.id).status.toLowerCase() }}).</span>
                            <button :disabled="coverBusy" @click="withdraw(myActiveRequest(block.id).request)">Withdraw</button>
                        </div>
                        <button v-else :disabled="coverBusy" @click="requestCover(block.id)">Request cover</button>
                    </template>
                </template>
            </ScheduleBoard>

            <h3>Cover requests</h3>
            <p v-if="coverError" class="error">{{ coverError }}</p>
            <p v-if="covers.length === 0">No cover requests this week.</p>
            <ul v-else>
                <li v-for="c in covers" :key="c.request">
                    {{ dateLabel(c.start) }} · {{ hoursLabel(c.start, c.end) }} ·
                    {{ nameOf(c.requester) }} → {{ c.claimer === null ? "(open)" : nameOf(c.claimer) }}
                    · {{ c.status }}
                    <button v-if="canClaim(c)" :disabled="coverBusy" @click="claim(c.request)">Claim</button>
                    <template v-if="canEdit && ACTIVE.includes(c.status)">
                        <button v-if="c.status === 'CLAIMED'" :disabled="coverBusy" @click="approve(c.request)">Approve</button>
                        <button :disabled="coverBusy" @click="deny(c.request)">Deny</button>
                    </template>
                    <button
                        v-if="c.requester === me && ACTIVE.includes(c.status)"
                        :disabled="coverBusy"
                        @click="withdraw(c.request)"
                    >Withdraw</button>
                </li>
            </ul>

            <template v-if="canEdit">
                <h3>This week</h3>
                <form class="inline-form" @submit.prevent="rename">
                    <label>Name
                        <input v-model="renameTo" />
                    </label>
                    <div class="buttons">
                        <button type="submit" :disabled="weekBusy">Rename</button>
                        <button type="button" :disabled="weekBusy" @click="deleteWeek">Delete week</button>
                    </div>
                </form>
                <p v-if="weekError" class="error">{{ weekError }}</p>
            </template>
        </template>
    `,
});
