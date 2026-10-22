import { defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { usePolling } from "./polling.ts";
import { dateLabel, hoursLabel } from "./time.ts";

// one of your shifts in this class, with your status (null if not marked yet)
interface MyAttendanceRow {
    shift: string;
    start: string;
    end: string;
    status: string | null;
}

// a class's attendance: for now, your own record (marking moves here in a later step)
export const AttendanceSection = defineComponent({
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
    },
    emits: ["logged-out"],
    setup(props, { emit }) {
        const records = ref<MyAttendanceRow[]>([]);
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
            try {
                const result = await client.attendance.mine({ session, group: props.group });
                if (loggedOutBy(result)) return sessionExpired();
                if ("error" in result) {
                    loadError.value = errorMessage(result.error, { FORBIDDEN: "You're no longer a member of this class." });
                    return;
                }
                records.value = result.records;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        onMounted(load);
        usePolling(load);

        return { records, loading, loadError, load, dateLabel, hoursLabel };
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

        <section v-else class="card">
            <h2>My attendance</h2>
            <p v-if="records.length === 0" class="muted">You haven't been on any published shifts yet.</p>
            <ul v-else>
                <li v-for="r in records" :key="r.shift">
                    {{ dateLabel(r.start) }} · {{ hoursLabel(r.start, r.end) }}
                    <span class="badge" :class="r.status === null ? 'unmarked' : r.status.toLowerCase()">
                        {{ r.status ?? "not marked" }}
                    </span>
                </li>
            </ul>
        </section>
    `,
});
