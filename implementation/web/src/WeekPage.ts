import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, makePerform, savedSession, saveSession, SCHEDULE_MESSAGES, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { ScheduleBoard, type Block, type Person } from "./ScheduleBoard.ts";
import { dateLabel, dayAndHours, timeIn, weekDayLabels } from "./time.ts";

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
    },
    emits: ["back", "logged-out"],
    setup(props, { emit }) {
        const canEdit = computed(() => props.role === "TA" || props.role === "STAFF");

        const name = ref("");
        const start = ref("");
        const shifts = ref<ShiftRow[]>([]);
        const roster = ref<Person[]>([]);
        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }
        const perform = makePerform(sessionExpired);

        // fetches the week and the roster; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const [weekResult, rosterResult] = await Promise.all([
                    client.schedule.week({ session, week: props.week }),
                    client.classes.roster({ session, group: props.group }),
                ]);
                if (loggedOutBy(weekResult) || loggedOutBy(rosterResult)) return sessionExpired();
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

        return {
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
                @assign="assignShift"
                @unassign="unassignShift"
                @remove="deleteShift"
                @add="addShift"
            />

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
