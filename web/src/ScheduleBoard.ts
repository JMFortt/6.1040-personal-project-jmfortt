import { computed, defineComponent, ref, watch, type PropType } from "vue/dist/vue.esm-bundler.js";
import { DAYS, hourLabel } from "./time.ts";

export interface Person {
    user: string;
    username: string;
}

// a roster entry; the role colors each person's chip on the grid
export interface Member extends Person {
    role?: string;
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

const ROW_PX = 48;

// A weekly grid (days across, hours down) of blocks. Clicking a block shows its details; TAs and
// staff can assign, unassign, delete, and add. The board doesn't call the API itself: it tells the
// page what was asked for, and the page (which knows whether these are slots or shifts) does it.
export const ScheduleBoard = defineComponent({
    props: {
        blocks: { type: Array as PropType<Block[]>, required: true },
        roster: { type: Array as PropType<Member[]>, required: true },
        canEdit: { type: Boolean, default: false },
        dayLabels: { type: Array as PropType<string[]>, default: () => DAYS },
        addLabel: { type: String, default: "Add" },
        error: { type: String, default: "" },
        busy: { type: Boolean, default: false },
        // the viewer's user id; with greyOthers, blocks they aren't on are greyed out (used for LAs)
        me: { type: String, default: "" },
        greyOthers: { type: Boolean, default: false },
        // on a published week: each block's attendance records, by block id. When given, chips are
        // colored by attendance status (the more useful thing there), with the role as a small label
        attendance: {
            type: Object as PropType<Record<string, { user: string; status: string }[]> | null>,
            default: null,
        },
    },
    emits: ["assign", "unassign", "remove", "add", "select", "capacity"],
    setup(props, { emit }) {
        const selectedId = ref<string | null>(null);
        const selected = computed(() => props.blocks.find((b) => b.id === selectedId.value) ?? null);

        // clicking a block selects it, clicking it again deselects; the page hears about either
        function toggle(id: string) {
            selectedId.value = selectedId.value === id ? null : id;
            emit("select", selectedId.value);
        }

        function isMine(b: Block) {
            return b.assignees.some((a) => a.user === props.me);
        }

        // greyed out: on a published week, any shift you're not on; on the template, only for LAs
        function isOther(b: Block) {
            return (props.greyOthers || props.attendance !== null) && !isMine(b);
        }

        // on a published week, a shift you're on is colored by your own attendance on it
        function blockStatus(b: Block) {
            if (props.attendance === null || !isMine(b)) return "";
            const status = props.attendance[b.id]?.find((r) => r.user === props.me)?.status;
            return status ? `status-${status.toLowerCase()}` : "";
        }

        function roleOf(user: string) {
            return props.roster.find((m) => m.user === user)?.role ?? "";
        }

        const byStatus = computed(() => props.attendance !== null);

        // a chip in the detail panel: colored by attendance status on a published week, neutral otherwise
        function chipClass(blockId: string, user: string) {
            if (!byStatus.value) return "";
            const status = props.attendance?.[blockId]?.find((r) => r.user === user)?.status;
            return status ? `status-${status.toLowerCase()}` : "status-none";
        }

        // who's on a block, as one line of text; the block cuts it off with "…" if it doesn't fit,
        // and the full list shows as a tooltip on hover (and as chips in the panel on click)
        function namesOf(b: Block) {
            return b.assignees.map((a) => a.username).join(", ");
        }

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

        // editing the selected block's capacity; starts at its current capacity whenever a block is picked
        const newCapacity = ref(1);
        const capacityError = ref("");
        watch(
            () => selected.value?.id,
            () => {
                newCapacity.value = selected.value?.capacity ?? 1;
                capacityError.value = "";
            },
            { immediate: true },
        );

        // checked here too so the user doesn't wait on a request that's sure to fail
        function saveCapacity() {
            const block = selected.value;
            if (block === null) return;
            capacityError.value = "";
            if (!Number.isInteger(newCapacity.value) || newCapacity.value < 1) {
                capacityError.value = "Capacity must be a whole number, at least 1.";
            } else if (newCapacity.value < block.assignees.length) {
                capacityError.value = `${block.assignees.length} people are on this shift. Unassign someone first.`;
            } else {
                emit("capacity", block.id, newCapacity.value);
            }
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
            position, timeRange, hourLabel, assign, add, toggle, isMine, isOther, blockStatus,
            chipClass, namesOf, roleOf, byStatus, newCapacity, capacityError, saveCapacity,
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
                            :class="[blockStatus(p.block), {
                                other: isOther(p.block),
                                selected: p.block.id === selectedId,
                            }]"
                            :style="position(p)"
                            :aria-label="timeRange(p.block) + ', ' + p.block.assignees.length + (p.block.assignees.length === 1 ? ' person' : ' people')"
                            :title="namesOf(p.block) || 'Nobody yet'"
                            @click="toggle(p.block.id)"
                        >
                            <span class="block-head">
                                <span class="block-names">{{ namesOf(p.block) }}</span>
                                <span class="block-count" aria-hidden="true">{{ p.block.assignees.length }}</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="legend">
            <template v-if="byStatus">
                <span class="muted">Your attendance:</span>
                <span class="legend-item"><span class="swatch status-present"></span>Present</span>
                <span class="legend-item"><span class="swatch status-late"></span>Late</span>
                <span class="legend-item"><span class="swatch status-absent"></span>Absent</span>
                <span class="legend-item"><span class="swatch status-excused"></span>Excused</span>
                <span class="legend-item"><span class="swatch"></span>Not marked</span>
                <span class="legend-item"><span class="swatch other"></span>Not your shift</span>
            </template>
            <span v-else-if="greyOthers" class="legend-item"><span class="swatch other"></span>Not your shift</span>
            <span class="muted">Click a block for details.</span>
        </div>

        <div v-if="selected" class="panel">
            <div class="card-head">
                <h3>{{ timeRange(selected) }}</h3>
                <span class="muted">{{ selected.assignees.length }} of {{ selected.capacity }} spots filled</span>
            </div>
            <p v-if="selected.assignees.length === 0" class="muted">Nobody yet.</p>
            <div v-else class="chips">
                <span v-for="a in selected.assignees" :key="a.user" class="chip" :class="chipClass(selected.id, a.user)">
                    {{ a.username }}<span v-if="byStatus && roleOf(a.user)" class="chip-role">· {{ roleOf(a.user) }}</span>
                    <button
                        v-if="canEdit"
                        class="chip-remove"
                        :disabled="busy"
                        :aria-label="'Remove ' + a.username"
                        @click="$emit('unassign', selected.id, a.user)"
                    >×</button>
                </span>
            </div>
            <div v-if="canEdit" class="buttons panel-actions">
                <template v-if="selected.assignees.length < selected.capacity && assignable.length > 0">
                    <select v-model="member" aria-label="Person to assign">
                        <option value="" disabled>Choose someone…</option>
                        <option v-for="p in assignable" :key="p.user" :value="p.user">{{ p.username }}</option>
                    </select>
                    <button class="primary" :disabled="busy || member === ''" @click="assign">Assign</button>
                </template>
                <button class="danger" :disabled="busy" @click="$emit('remove', selected.id)">Delete</button>
            </div>
            <form v-if="canEdit" class="inline-form" @submit.prevent="saveCapacity">
                <label>Capacity
                    <input v-model.number="newCapacity" type="number" min="1" step="1" />
                </label>
                <div class="buttons">
                    <button type="submit" :disabled="busy || newCapacity === selected.capacity">Save capacity</button>
                </div>
            </form>
            <p v-if="capacityError" class="error">{{ capacityError }}</p>
            <!-- pages can add more to the panel here (the week page adds attendance) -->
            <slot name="panel" :block="selected"></slot>
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
                <button type="submit" class="primary" :disabled="busy">{{ addLabel }}</button>
            </div>
            <p v-if="formError" class="error">{{ formError }}</p>
        </form>
    `,
});
