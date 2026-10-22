import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, makePerform, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { usePolling } from "./polling.ts";
import type { Member, Person } from "./ScheduleBoard.ts";
import { dateLabel, hoursLabel, nowWallClock, weekContains } from "./time.ts";

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

interface ShiftRow {
    shift: string;
    start: string;
    end: string;
    assignees: Person[];
}

interface RecordRow {
    user: string;
    status: string;
}

const STATUSES = ["PRESENT", "LATE", "ABSENT"];

// a class's attendance: taking it for shifts happening now, marking any past shift, and your own record
export const AttendanceSection = defineComponent({
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        me: { type: String, required: true },
    },
    emits: ["logged-out"],
    setup(props, { emit }) {
        const roster = ref<(Member & { role: string })[]>([]);
        // your role right now, from your own row of the latest roster
        const myRole = computed(() => roster.value.find((m) => m.user === props.me)?.role ?? props.role);
        const canMark = computed(() => myRole.value === "TA" || myRole.value === "STAFF");

        const mine = ref<MyAttendanceRow[]>([]);
        const weeks = ref<WeekRow[]>([]);
        // each loaded week's shifts, and each loaded shift's records, by id
        const shiftsOf = ref<Record<string, ShiftRow[]>>({});
        const recordsOf = ref<Record<string, RecordRow[]>>({});
        const now = ref(nowWallClock());

        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }
        const perform = makePerform(sessionExpired);

        // --- what's happening now ---

        // the published week that contains today, if any
        const currentWeek = computed(() => weeks.value.find((w) => weekContains(w.start, now.value)) ?? null);
        const currentShifts = computed(() => {
            const week = currentWeek.value;
            if (week === null) return [];
            return (shiftsOf.value[week.week] ?? []).filter((s) => s.start <= now.value && now.value < s.end);
        });
        const nextShift = computed(() => {
            const week = currentWeek.value;
            if (week === null) return null;
            return (shiftsOf.value[week.week] ?? []).find((s) => s.start > now.value) ?? null;
        });

        // --- marking any shift after the fact ---

        const markWeek = ref("");
        const markShift = ref("");
        const markShifts = computed(() => shiftsOf.value[markWeek.value] ?? []);
        const markShiftRow = computed(() => markShifts.value.find((s) => s.shift === markShift.value) ?? null);

        // --- your own record ---

        const counts = computed(() => ({
            present: mine.value.filter((r) => r.status === "PRESENT").length,
            late: mine.value.filter((r) => r.status === "LATE").length,
            absent: mine.value.filter((r) => r.status === "ABSENT").length,
            unmarked: mine.value.filter((r) => r.status === null).length,
        }));

        // --- loading ---

        async function loadWeek(session: string, week: string) {
            const result = await client.schedule.week({ session, week });
            if (loggedOutBy(result)) throw sessionExpiredError;
            if (!("error" in result)) shiftsOf.value = { ...shiftsOf.value, [week]: result.week.shifts };
        }

        async function loadRecords(session: string, shift: string) {
            const result = await client.attendance.shift({ session, shift });
            if (loggedOutBy(result)) throw sessionExpiredError;
            if (!("error" in result)) recordsOf.value = { ...recordsOf.value, [shift]: result.records };
        }

        // thrown by the loaders above so load() can stop and send you to login
        const sessionExpiredError = new Error("session expired");

        // fetches everything in this section; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            now.value = nowWallClock();
            try {
                const [rosterResult, mineResult, weeksResult] = await Promise.all([
                    client.classes.roster({ session, group: props.group }),
                    client.attendance.mine({ session, group: props.group }),
                    client.schedule.weeks({ session, group: props.group }),
                ]);
                if ([rosterResult, mineResult, weeksResult].some(loggedOutBy)) return sessionExpired();
                for (const result of [rosterResult, mineResult, weeksResult]) {
                    if ("error" in result) {
                        loadError.value = errorMessage(result.error, { FORBIDDEN: "You're no longer a member of this class." });
                        return;
                    }
                }
                if (!("error" in rosterResult)) roster.value = rosterResult.roster;
                if (!("error" in mineResult)) mine.value = mineResult.records;
                if (!("error" in weeksResult)) weeks.value = weeksResult.weeks;

                // only TAs and staff take attendance, so only they need the weeks' shifts and everyone's records
                if (!canMark.value) return;
                // default the "mark attendance" picker to this week, or else the latest week
                if (markWeek.value === "" || !weeks.value.some((w) => w.week === markWeek.value)) {
                    markWeek.value = currentWeek.value?.week ?? weeks.value.at(-1)?.week ?? "";
                }
                const weekIds = new Set([currentWeek.value?.week, markWeek.value].filter((w): w is string => !!w));
                await Promise.all([...weekIds].map((w) => loadWeek(session, w)));
                const shiftIds = new Set([...currentShifts.value.map((s) => s.shift), markShift.value].filter((s) => s !== ""));
                await Promise.all([...shiftIds].map((s) => loadRecords(session, s)));
            } catch (error) {
                if (error === sessionExpiredError) return sessionExpired();
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        // picking a week or shift in the "mark attendance" card loads what it needs
        async function chooseWeek(week: string) {
            markWeek.value = week;
            markShift.value = "";
            const session = savedSession();
            if (session === null) return sessionExpired();
            try {
                await loadWeek(session, week);
            } catch (error) {
                if (error === sessionExpiredError) sessionExpired();
            }
        }

        async function chooseShift(shift: string) {
            markShift.value = shift;
            const session = savedSession();
            if (session === null) return sessionExpired();
            try {
                await loadRecords(session, shift);
            } catch (error) {
                if (error === sessionExpiredError) sessionExpired();
            }
        }

        // --- marking ---

        // "" means not marked
        function statusOf(shift: string, user: string) {
            return recordsOf.value[shift]?.find((r) => r.user === user)?.status ?? "";
        }

        const markError = ref("");
        const marking = ref(false);

        // an empty status clears the mark; anything else sets it
        async function setStatus(shift: string, member: string, status: string) {
            await perform(
                (session) =>
                    status === ""
                        ? client.attendance.unmark({ session, shift, member })
                        : client.attendance.mark({ session, shift, member, status: status as "PRESENT" | "ABSENT" | "LATE" }),
                {
                    FORBIDDEN: "Only TAs and staff can take attendance.",
                    INVALID_REQUEST: "They aren't on this shift.",
                    NOT_FOUND: "There was nothing to clear. Try refreshing.",
                },
                markError,
                marking,
            );
            // reload that shift's records either way, so what's shown is what's actually saved
            const session = savedSession();
            if (session === null) return sessionExpired();
            try {
                await loadRecords(session, shift);
            } catch (error) {
                if (error === sessionExpiredError) sessionExpired();
            }
        }

        onMounted(load);
        usePolling(load);

        return {
            STATUSES, canMark, loading, loadError, load, weeks, now,
            currentWeek, currentShifts, nextShift,
            markWeek, markShift, markShifts, markShiftRow, chooseWeek, chooseShift,
            statusOf, setStatus, markError, marking,
            mine, counts, dateLabel, hoursLabel,
        };
    },
    template: `
        <div class="section-head">
            <div>
                <p class="eyebrow">{{ name }}</p>
                <h1>Attendance</h1>
            </div>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <p v-if="loading" class="muted">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <template v-else>
            <p v-if="markError" class="error">{{ markError }}</p>

            <section v-if="canMark" class="card">
                <h2>Happening now</h2>
                <template v-if="currentShifts.length > 0">
                    <div v-for="s in currentShifts" :key="s.shift" class="now-shift">
                        <div class="card-head">
                            <h3>{{ dateLabel(s.start) }} · {{ hoursLabel(s.start, s.end) }}</h3>
                            <span class="badge approved">In progress</span>
                        </div>
                        <p v-if="s.assignees.length === 0" class="muted">Nobody is on this shift.</p>
                        <div v-for="a in s.assignees" :key="a.user" class="mark-row">
                            <span class="mark-name">{{ a.username }}</span>
                            <div class="segmented" role="group" :aria-label="'Attendance for ' + a.username">
                                <button
                                    v-for="status in STATUSES"
                                    :key="status"
                                    class="seg"
                                    :class="[status.toLowerCase(), { active: statusOf(s.shift, a.user) === status }]"
                                    :aria-pressed="statusOf(s.shift, a.user) === status"
                                    :disabled="marking"
                                    @click="setStatus(s.shift, a.user, status)"
                                >{{ status.charAt(0) + status.slice(1).toLowerCase() }}</button>
                            </div>
                            <button
                                v-if="statusOf(s.shift, a.user) !== ''"
                                class="link"
                                :disabled="marking"
                                @click="setStatus(s.shift, a.user, '')"
                            >Clear</button>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <p class="muted">Nothing is happening right now.</p>
                    <p v-if="nextShift">
                        Next: <strong>{{ dateLabel(nextShift.start) }}</strong> · {{ hoursLabel(nextShift.start, nextShift.end) }}
                    </p>
                    <p v-else-if="currentWeek === null" class="muted">No published week covers today.</p>
                    <p v-else class="muted">No more shifts this week.</p>
                </template>
            </section>

            <section v-if="canMark" class="card">
                <h2>Mark attendance</h2>
                <p class="muted">For any shift in a published week, e.g. to fill in or fix a mark afterwards.</p>
                <p v-if="weeks.length === 0" class="muted">No weeks published yet.</p>
                <template v-else>
                    <div class="inline-form">
                        <label>Week
                            <select :value="markWeek" @change="chooseWeek($event.target.value)">
                                <option v-for="w in weeks" :key="w.week" :value="w.week">{{ w.name }} · {{ dateLabel(w.start) }}</option>
                            </select>
                        </label>
                        <label>Shift
                            <select :value="markShift" @change="chooseShift($event.target.value)">
                                <option value="" disabled>Choose a shift…</option>
                                <option v-for="s in markShifts" :key="s.shift" :value="s.shift">
                                    {{ dateLabel(s.start) }} · {{ hoursLabel(s.start, s.end) }}
                                </option>
                            </select>
                        </label>
                    </div>
                    <template v-if="markShiftRow">
                        <p v-if="markShiftRow.assignees.length === 0" class="muted">Nobody is on this shift.</p>
                        <div v-for="a in markShiftRow.assignees" :key="a.user" class="mark-row">
                            <span class="mark-name">{{ a.username }}</span>
                            <select
                                :value="statusOf(markShiftRow.shift, a.user)"
                                :disabled="marking"
                                :aria-label="'Attendance for ' + a.username"
                                @change="setStatus(markShiftRow.shift, a.user, $event.target.value)"
                            >
                                <option value="">not marked</option>
                                <option v-for="status in STATUSES" :key="status" :value="status">{{ status }}</option>
                            </select>
                        </div>
                    </template>
                </template>
            </section>

            <section class="card">
                <h2>My attendance</h2>
                <div class="stats">
                    <div class="stat"><span class="stat-number present">{{ counts.present }}</span>Present</div>
                    <div class="stat"><span class="stat-number late">{{ counts.late }}</span>Late</div>
                    <div class="stat"><span class="stat-number absent">{{ counts.absent }}</span>Absent</div>
                    <div class="stat"><span class="stat-number">{{ counts.unmarked }}</span>Not marked</div>
                </div>
                <p v-if="mine.length === 0" class="muted">You haven't been on any published shifts yet.</p>
                <ul v-else class="plain-list">
                    <li v-for="r in mine" :key="r.shift">
                        <span>{{ dateLabel(r.start) }} · {{ hoursLabel(r.start, r.end) }}</span>
                        <span class="badge" :class="r.status === null ? 'unmarked' : r.status.toLowerCase()">
                            {{ r.status === null ? "not marked" : r.status.toLowerCase() }}
                        </span>
                    </li>
                </ul>
            </section>
        </template>
    `,
});
