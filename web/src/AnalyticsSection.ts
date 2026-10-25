import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { usePolling } from "./polling.ts";
import type { Member } from "./ScheduleBoard.ts";
import { nowWallClock } from "./time.ts";

// one person on one shift, with their status (null if not marked yet)
interface RecordRow {
    shift: string;
    start: string;
    end: string;
    user: string;
    status: string | null;
}

interface MemberStats {
    user: string;
    username: string;
    role: string;
    // shifts they actually showed up for: present or late
    worked: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    unmarked: number;
    // (present + late) / (present + late + absent); null when there's nothing to count yet
    rate: number | null;
}

function rateOf(present: number, late: number, absent: number) {
    const counted = present + late + absent;
    return counted === 0 ? null : (present + late) / counted;
}

// TAs and staff only: attendance for everyone on the roster, over shifts that have already started
export const AnalyticsSection = defineComponent({
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
    },
    emits: ["logged-out"],
    setup(props, { emit }) {
        const roster = ref<(Member & { role: string })[]>([]);
        const records = ref<RecordRow[]>([]);
        const now = ref(nowWallClock());
        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }

        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            now.value = nowWallClock();
            try {
                const [recordsResult, rosterResult] = await Promise.all([
                    client.attendance.class({ session, group: props.group }),
                    client.classes.roster({ session, group: props.group }),
                ]);
                if (loggedOutBy(recordsResult) || loggedOutBy(rosterResult)) return sessionExpired();
                if ("error" in recordsResult) {
                    loadError.value = errorMessage(recordsResult.error, {
                        FORBIDDEN: "Only TAs and staff can see the class's attendance.",
                    });
                    return;
                }
                records.value = recordsResult.records;
                if (!("error" in rosterResult)) roster.value = rosterResult.roster;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        // future shifts would all count as "not marked", so only shifts that have started count
        const started = computed(() => records.value.filter((r) => r.start <= now.value));

        // one row per roster member, in roster order
        const members = computed<MemberStats[]>(() =>
            roster.value
                .map((m) => {
                    const mine = started.value.filter((r) => r.user === m.user);
                    const count = (status: string | null) => mine.filter((r) => r.status === status).length;
                    const present = count("PRESENT");
                    const late = count("LATE");
                    const absent = count("ABSENT");
                    return {
                        user: m.user,
                        username: m.username,
                        role: m.role,
                        worked: present + late,
                        present,
                        late,
                        absent,
                        excused: count("EXCUSED"),
                        unmarked: count(null),
                        rate: rateOf(present, late, absent),
                    };
                })
                .sort((a, b) => a.username.localeCompare(b.username)),
        );

        // the whole class at a glance
        const summary = computed(() => {
            const count = (status: string | null) => started.value.filter((r) => r.status === status).length;
            return {
                // everyone's shifts worked (present or late), added up
                worked: count("PRESENT") + count("LATE"),
                rate: rateOf(count("PRESENT"), count("LATE"), count("ABSENT")),
                absent: count("ABSENT"),
                unmarked: count(null),
            };
        });

        function percent(rate: number | null) {
            return rate === null ? "—" : `${Math.round(rate * 100)}%`;
        }

        onMounted(load);
        usePolling(load);

        return { loading, loadError, load, members, summary, percent };
    },
    template: `
        <div class="section-head">
            <div>
                <p class="eyebrow">{{ name }}</p>
                <h1>Analytics</h1>
            </div>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <p v-if="loading" class="muted">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <template v-else>
            <section class="card">
                <h2>Class attendance</h2>
                <p class="muted">Across every published shift that has already started.</p>
                <div class="stats">
                    <div class="stat"><span class="stat-number">{{ summary.worked }}</span>Shifts worked</div>
                    <div class="stat"><span class="stat-number present">{{ percent(summary.rate) }}</span>Attendance rate</div>
                    <div class="stat"><span class="stat-number absent">{{ summary.absent }}</span>Absences</div>
                    <div class="stat"><span class="stat-number">{{ summary.unmarked }}</span>Not marked yet</div>
                </div>
                <p class="muted">
                    Shifts worked counts shifts marked present or late. Attendance rate is shifts worked out of
                    everything marked present, late, or absent; excused and not-yet-marked shifts don't count for or against it.
                </p>
            </section>

            <section class="card">
                <h2>By member</h2>
                <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th class="num">Shifts worked</th>
                                <th class="num">Present</th>
                                <th class="num">Late</th>
                                <th class="num">Absent</th>
                                <th class="num">Excused</th>
                                <th class="num">Not marked</th>
                                <th class="num">Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="m in members" :key="m.user">
                                <td>{{ m.username }}</td>
                                <td><span class="badge role">{{ m.role }}</span></td>
                                <td class="num">{{ m.worked }}</td>
                                <td class="num"><span :class="{ 'count-present': m.present > 0 }">{{ m.present }}</span></td>
                                <td class="num"><span :class="{ 'count-late': m.late > 0 }">{{ m.late }}</span></td>
                                <td class="num"><span :class="{ 'count-absent': m.absent > 0 }">{{ m.absent }}</span></td>
                                <td class="num"><span :class="{ 'count-excused': m.excused > 0 }">{{ m.excused }}</span></td>
                                <td class="num">{{ m.unmarked }}</td>
                                <td class="num"><strong>{{ percent(m.rate) }}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>
    `,
});
