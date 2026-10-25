import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, makePerform, savedSession, saveSession, SCHEDULE_MESSAGES, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { usePolling } from "./polling.ts";
import { ScheduleBoard, type Block, type Person } from "./ScheduleBoard.ts";
import { dateLabel, mondayOf, WEEKDAYS, type Weekday } from "./time.ts";
import { WeekPage } from "./WeekPage.ts";

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

interface WeekRow {
    week: string;
    name: string;
    start: string;
}

// a class's schedule, as tabs: the master weekly template, then one tab per published week
export const ScheduleSection = defineComponent({
    components: { ScheduleBoard, WeekPage },
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        me: { type: String, required: true },
    },
    emits: ["logged-out"],
    setup(props, { emit }) {
        // which tab is showing: "master", or a published week's id
        const tab = ref("master");
        const roster = ref<MemberRow[]>([]);
        // your role right now, from your own row of the latest roster (it may have changed since the
        // class was opened); until the roster loads, the role the class was opened with
        const myRole = computed(() => roster.value.find((m) => m.user === props.me)?.role ?? props.role);
        const canEdit = computed(() => myRole.value === "TA" || myRole.value === "STAFF");
        const isLA = computed(() => myRole.value === "LA");
        const slots = ref<SlotRow[]>([]);
        const weeks = ref<WeekRow[]>([]);
        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }
        const perform = makePerform(sessionExpired);

        // fetches everything in this section; also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const group = props.group;
                const [rosterResult, templateResult, weeksResult] = await Promise.all([
                    client.classes.roster({ session, group }),
                    client.schedule.template({ session, group }),
                    client.schedule.weeks({ session, group }),
                ]);
                const results = [rosterResult, templateResult, weeksResult];
                if (results.some(loggedOutBy)) return sessionExpired();
                for (const result of results) {
                    if ("error" in result) {
                        loadError.value = errorMessage(result.error, { FORBIDDEN: "You're no longer a member of this class." });
                        return;
                    }
                }
                if (!("error" in rosterResult)) roster.value = rosterResult.roster;
                if (!("error" in templateResult)) slots.value = templateResult.template;
                if (!("error" in weeksResult)) weeks.value = weeksResult.weeks;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        // --- the master weekly template ---

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
        const setSlotCapacity = (slot: string, capacity: number) =>
            edit((session) => client.schedule.slots.capacity({ session, slot, capacity }), {
                CONFLICT: "More people are on this shift than that. Unassign someone first.",
                INVALID_REQUEST: "Capacity must be a whole number, at least 1.",
            });
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

        // after a week is deleted from its tab, go back to the master schedule
        async function weekDeleted() {
            tab.value = "master";
            await load();
        }

        onMounted(load);
        usePolling(load);

        return {
            tab, weekDeleted,
            canEdit, isLA, roster, weeks, loading, loadError, load,
            blocks, scheduleError, scheduleBusy, assignSlot, unassignSlot, deleteSlot, addSlot, setSlotCapacity,
            publishDate, publishName, publishError, publishing, publish, dateLabel,
        };
    },
    template: `
        <div class="section-head">
            <div>
                <p class="eyebrow">{{ name }}</p>
                <h1>Schedule</h1>
            </div>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <p v-if="loading" class="muted">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <template v-else>
            <nav class="tabs" aria-label="Schedule">
                <button class="tab" :class="{ active: tab === 'master' }" @click="tab = 'master'">Master schedule</button>
                <button
                    v-for="w in weeks"
                    :key="w.week"
                    class="tab"
                    :class="{ active: tab === w.week }"
                    @click="tab = w.week"
                >
                    {{ w.name }} <span class="tab-date">{{ dateLabel(w.start) }}</span>
                </button>
            </nav>

            <WeekPage
                v-if="tab !== 'master'"
                :key="tab"
                :week="tab"
                :group="group"
                :role="role"
                :me="me"
                @deleted="weekDeleted"
                @logged-out="(message) => $emit('logged-out', message)"
            />

            <template v-else>
            <section class="card">
                <h2>Master schedule</h2>
                <p class="muted">The weekly template. Publishing a week copies it, so changes here only affect weeks published later.</p>
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
                    @capacity="setSlotCapacity"
                />
            </section>

            <section v-if="canEdit" class="card">
                <h2>Publish a week</h2>
                <p class="muted">Copies the master schedule above into a real week, which then gets its own tab for covers and attendance.</p>
                <form class="inline-form" @submit.prevent="publish">
                    <label>Any day in the week
                        <input v-model="publishDate" type="date" />
                    </label>
                    <label>Name
                        <input v-model="publishName" placeholder="Week" />
                    </label>
                    <div class="buttons">
                        <button type="submit" class="primary" :disabled="publishing">Publish week</button>
                    </div>
                </form>
                <p v-if="publishError" class="error">{{ publishError }}</p>
            </section>
            </template>
        </template>
    `,
});
