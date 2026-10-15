import { computed, defineComponent, ref, type PropType } from "vue/dist/vue.esm-bundler.js";
import { DAYS, hourLabel } from "./time.ts";

export interface Person {
    user: string;
    username: string;
}

// one slot (template) or shift (published week), already placed in the week
export interface Block {
    id: string;
    day: number; // 0 = Monday
    startHour: number;
    endHour: number;
    capacity: number;
    assignees: Person[];
}

const ROW_PX = 40;

// A weekly grid (days across, hours down) of blocks. Clicking a block shows its details; TAs and
// staff can assign, unassign, delete, and add. The board doesn't call the API itself: it tells the
// page what was asked for, and the page (which knows whether these are slots or shifts) does it.
export const ScheduleBoard = defineComponent({
    props: {
        blocks: { type: Array as PropType<Block[]>, required: true },
        roster: { type: Array as PropType<Person[]>, required: true },
        canEdit: { type: Boolean, default: false },
        dayLabels: { type: Array as PropType<string[]>, default: () => DAYS },
        addLabel: { type: String, default: "Add" },
        error: { type: String, default: "" },
        busy: { type: Boolean, default: false },
    },
    emits: ["assign", "unassign", "remove", "add"],
    setup(props, { emit }) {
        const selectedId = ref<string | null>(null);
        const selected = computed(() => props.blocks.find((b) => b.id === selectedId.value) ?? null);

        // show at least 9 AM-5 PM, stretched to fit every block
        const firstHour = computed(() => Math.min(9, ...props.blocks.map((b) => b.startHour)));
        const lastHour = computed(() => Math.max(17, ...props.blocks.map((b) => b.endHour)));
        const hours = computed(() => Array.from({ length: lastHour.value - firstHour.value }, (_, i) => firstHour.value + i));

        // overlapping blocks on the same day go side by side: each gets the first "lane" free at its start
        const columns = computed(() =>
            DAYS.map((_, day) => {
                const laneEnds: number[] = [];
                const placed = props.blocks
                    .filter((b) => b.day === day)
                    .sort((a, b) => a.startHour - b.startHour)
                    .map((block) => {
                        let lane = laneEnds.findIndex((end) => end <= block.startHour);
                        if (lane === -1) lane = laneEnds.push(0) - 1;
                        laneEnds[lane] = block.endHour;
                        return { block, lane };
                    });
                return placed.map(({ block, lane }) => ({ block, lane, lanes: laneEnds.length }));
            }),
        );

        function position(p: { block: Block; lane: number; lanes: number }) {
            return {
                top: `${(p.block.startHour - firstHour.value) * ROW_PX}px`,
                height: `${(p.block.endHour - p.block.startHour) * ROW_PX - 2}px`,
                left: `${(p.lane / p.lanes) * 100}%`,
                width: `calc(${100 / p.lanes}% - 2px)`,
            };
        }

        function summary(b: Block) {
            const names = b.assignees.map((a) => a.username).join(", ") || "nobody";
            return `${names} · ${b.assignees.length}/${b.capacity}`;
        }

        function timeRange(b: Block) {
            return `${props.dayLabels[b.day]} ${hourLabel(b.startHour)}–${hourLabel(b.endHour)}`;
        }

        // roster members not already on the selected block
        const assignable = computed(() => {
            const block = selected.value;
            if (block === null) return [];
            return props.roster.filter((p) => !block.assignees.some((a) => a.user === p.user));
        });
        const member = ref("");

        function assign() {
            if (selected.value === null || member.value === "") return;
            emit("assign", selected.value.id, member.value);
            member.value = "";
        }

        // the add form; checked here so the user doesn't wait on a request that's sure to fail
        const day = ref(0);
        const startHour = ref(9);
        const endHour = ref(10);
        const capacity = ref(1);
        const formError = ref("");
        const hourOptions = Array.from({ length: 25 }, (_, h) => h);

        function add() {
            formError.value = "";
            if (!(startHour.value < endHour.value)) {
                formError.value = "The end must be after the start.";
            } else if (!(capacity.value >= 1) || !Number.isInteger(capacity.value)) {
                formError.value = "Capacity must be a whole number, at least 1.";
            } else {
                emit("add", { day: day.value, startHour: startHour.value, endHour: endHour.value, capacity: capacity.value });
            }
        }

        return {
            ROW_PX, DAYS, hours, columns, selected, selectedId, assignable, member,
            day, startHour, endHour, capacity, formError, hourOptions,
            position, summary, timeRange, hourLabel, assign, add,
        };
    },
    template: `
        <div class="grid-scroll">
            <div class="grid">
                <div class="grid-hours">
                    <div class="grid-head"></div>
                    <div v-for="h in hours" :key="h" class="grid-hour" :style="{ height: ROW_PX + 'px' }">{{ hourLabel(h) }}</div>
                </div>
                <div v-for="(column, d) in columns" :key="d" class="grid-day">
                    <div class="grid-head">{{ dayLabels[d] }}</div>
                    <div class="grid-body" :style="{ height: hours.length * ROW_PX + 'px', backgroundSize: '100% ' + ROW_PX + 'px' }">
                        <button
                            v-for="p in column"
                            :key="p.block.id"
                            class="block"
                            :class="{ full: p.block.assignees.length >= p.block.capacity, selected: p.block.id === selectedId }"
                            :style="position(p)"
                            @click="selectedId = p.block.id === selectedId ? null : p.block.id"
                        >{{ summary(p.block) }}</button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="selected" class="panel">
            <strong>{{ timeRange(selected) }}</strong> · {{ selected.assignees.length }}/{{ selected.capacity }}
            <ul>
                <li v-for="a in selected.assignees" :key="a.user">
                    {{ a.username }}
                    <button v-if="canEdit" class="link" :disabled="busy" @click="$emit('unassign', selected.id, a.user)">× remove</button>
                </li>
                <li v-if="selected.assignees.length === 0">Nobody yet.</li>
            </ul>
            <div v-if="canEdit" class="buttons">
                <template v-if="selected.assignees.length < selected.capacity && assignable.length > 0">
                    <select v-model="member">
                        <option value="" disabled>Choose someone…</option>
                        <option v-for="p in assignable" :key="p.user" :value="p.user">{{ p.username }}</option>
                    </select>
                    <button :disabled="busy || member === ''" @click="assign">Assign</button>
                </template>
                <button :disabled="busy" @click="$emit('remove', selected.id)">Delete</button>
            </div>
        </div>
        <p v-if="error" class="error">{{ error }}</p>

        <form v-if="canEdit" class="inline-form" @submit.prevent="add">
            <label>Day
                <select v-model.number="day">
                    <option v-for="(label, i) in dayLabels" :key="i" :value="i">{{ label }}</option>
                </select>
            </label>
            <label>From
                <select v-model.number="startHour">
                    <option v-for="h in hourOptions.slice(0, 24)" :key="h" :value="h">{{ hourLabel(h) }}</option>
                </select>
            </label>
            <label>To
                <select v-model.number="endHour">
                    <option v-for="h in hourOptions.slice(1)" :key="h" :value="h">{{ hourLabel(h) }}</option>
                </select>
            </label>
            <label>Capacity
                <input v-model.number="capacity" type="number" min="1" step="1" />
            </label>
            <div class="buttons">
                <button type="submit" :disabled="busy">{{ addLabel }}</button>
            </div>
            <p v-if="formError" class="error">{{ formError }}</p>
        </form>
    `,
});
