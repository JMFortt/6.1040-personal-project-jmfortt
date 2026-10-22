import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, loggedOutBy, makePerform, savedSession, saveSession, SESSION_EXPIRED, UNREACHABLE } from "./api.ts";
import { usePolling } from "./polling.ts";
import type { Member } from "./ScheduleBoard.ts";
import { dateLabel, hoursLabel } from "./time.ts";

interface CoverRow {
    request: string;
    shift: string;
    start: string;
    end: string;
    requester: string;
    claimer: string | null;
    status: string;
    assignees: { user: string }[];
}

const ACTIVE = ["OPEN", "CLAIMED"];
// resolved requests pile up over a term, so the board only shows the most recent ones
const RECENT_RESOLVED = 10;

// a class's cover requests across all its published weeks, as a board: open → claimed → resolved
export const CoversSection = defineComponent({
    props: {
        group: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        me: { type: String, required: true },
    },
    emits: ["logged-out"],
    setup(props, { emit }) {
        const covers = ref<CoverRow[]>([]);
        const roster = ref<(Member & { role: string })[]>([]);
        // your role right now, from your own row of the latest roster
        const myRole = computed(() => roster.value.find((m) => m.user === props.me)?.role ?? props.role);
        const canApprove = computed(() => myRole.value === "TA" || myRole.value === "STAFF");
        const loading = ref(true);
        const loadError = ref("");

        // the session ended on the server (or was never valid): back to login with a notice
        function sessionExpired() {
            saveSession(null);
            emit("logged-out", SESSION_EXPIRED);
        }
        const perform = makePerform(sessionExpired);

        // fetches the requests and the roster (for names); also what the Refresh button does
        async function load() {
            const session = savedSession();
            if (session === null) return sessionExpired();
            loadError.value = "";
            try {
                const [coversResult, rosterResult] = await Promise.all([
                    client.covers.class({ session, group: props.group }),
                    client.classes.roster({ session, group: props.group }),
                ]);
                if (loggedOutBy(coversResult) || loggedOutBy(rosterResult)) return sessionExpired();
                if ("error" in coversResult) {
                    loadError.value = errorMessage(coversResult.error, { FORBIDDEN: "You're no longer a member of this class." });
                    return;
                }
                covers.value = coversResult.requests;
                if (!("error" in rosterResult)) roster.value = rosterResult.roster;
            } catch {
                loadError.value = UNREACHABLE;
            } finally {
                loading.value = false;
            }
        }

        // --- the board's columns ---

        const open = computed(() => covers.value.filter((c) => c.status === "OPEN"));
        const claimed = computed(() => covers.value.filter((c) => c.status === "CLAIMED"));
        // most recent shifts first, since that's what people are likely looking for
        const resolved = computed(() =>
            covers.value
                .filter((c) => !ACTIVE.includes(c.status))
                .slice()
                .reverse()
                .slice(0, RECENT_RESOLVED),
        );

        function canClaim(c: CoverRow) {
            return c.status === "OPEN" && c.requester !== props.me && !c.assignees.some((a) => a.user === props.me);
        }
        const claimable = computed(() => open.value.filter(canClaim));

        // requests list user ids; show usernames from the roster
        function nameOf(user: string | null) {
            if (user === null) return "";
            return roster.value.find((p) => p.user === user)?.username ?? "someone no longer in the class";
        }

        // --- actions ---

        const coverError = ref("");
        const coverBusy = ref(false);

        async function act(call: (session: string) => Promise<object>, messages: Record<string, string>) {
            await perform(call, messages, coverError, coverBusy);
            // reload either way, so the board shows what's actually saved
            await load();
        }

        const claim = (request: string) =>
            act((session) => client.covers.claim({ session, request }), {
                CONFLICT: "This request is no longer open, or you're already on that shift.",
                FORBIDDEN: "Only members of this class can claim covers.",
            });
        const approve = (request: string) =>
            act((session) => client.covers.approve({ session, request }), {
                CONFLICT: "This can't be approved: the schedule changed since it was claimed, or the claimer left the class.",
                FORBIDDEN: "Only TAs and staff can approve covers.",
            });
        const deny = (request: string) =>
            act((session) => client.covers.deny({ session, request }), {
                CONFLICT: "This request has already been resolved.",
                FORBIDDEN: "Only TAs and staff can deny covers.",
            });
        const withdraw = (request: string) =>
            act((session) => client.covers.withdraw({ session, request }), {
                CONFLICT: "This request has already been resolved.",
                FORBIDDEN: "Only the person who asked can withdraw it.",
            });

        onMounted(load);
        usePolling(load);

        return {
            ACTIVE, loading, loadError, load, open, claimed, resolved, claimable, canApprove,
            canClaim, nameOf, dateLabel, hoursLabel, coverError, coverBusy, claim, approve, deny, withdraw,
        };
    },
    template: `
        <div class="section-head">
            <div>
                <p class="eyebrow">{{ name }}</p>
                <h1>Cover requests</h1>
            </div>
            <button :disabled="loading" @click="load">Refresh</button>
        </div>
        <p v-if="loading" class="muted">Loading…</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <template v-else>
            <p class="muted">Ask for a cover from your shift on a published week in Schedule. Requests from every week show up here.</p>
            <p v-if="coverError" class="error">{{ coverError }}</p>

            <section v-if="claimable.length > 0" class="card highlight">
                <h2>Covers you can claim</h2>
                <ul class="plain-list">
                    <li v-for="c in claimable" :key="c.request">
                        <span><strong>{{ dateLabel(c.start) }}</strong> · {{ hoursLabel(c.start, c.end) }} · for {{ nameOf(c.requester) }}</span>
                        <button class="primary" :disabled="coverBusy" @click="claim(c.request)">Claim shift</button>
                    </li>
                </ul>
            </section>

            <div class="board">
                <section class="column">
                    <h2>Open <span class="count">{{ open.length }}</span></h2>
                    <p v-if="open.length === 0" class="muted">Nothing open.</p>
                    <article v-for="c in open" :key="c.request" class="cover-card">
                        <p class="cover-when"><strong>{{ dateLabel(c.start) }}</strong> · {{ hoursLabel(c.start, c.end) }}</p>
                        <p>Requested by {{ nameOf(c.requester) }}</p>
                        <p class="muted">Waiting for someone to claim it</p>
                        <div class="buttons">
                            <button v-if="canClaim(c)" class="primary" :disabled="coverBusy" @click="claim(c.request)">Claim</button>
                            <button v-if="canApprove" :disabled="coverBusy" @click="deny(c.request)">Deny</button>
                            <button v-if="c.requester === me" :disabled="coverBusy" @click="withdraw(c.request)">Withdraw</button>
                        </div>
                    </article>
                </section>

                <section class="column">
                    <h2>Claimed <span class="count">{{ claimed.length }}</span></h2>
                    <p class="muted column-note">Needs approval from a TA or staff member</p>
                    <p v-if="claimed.length === 0" class="muted">Nothing waiting.</p>
                    <article v-for="c in claimed" :key="c.request" class="cover-card claimed">
                        <p class="cover-when"><strong>{{ dateLabel(c.start) }}</strong> · {{ hoursLabel(c.start, c.end) }}</p>
                        <p>{{ nameOf(c.requester) }} → {{ nameOf(c.claimer) }}</p>
                        <div class="buttons">
                            <template v-if="canApprove">
                                <button class="primary" :disabled="coverBusy" @click="approve(c.request)">Approve</button>
                                <button :disabled="coverBusy" @click="deny(c.request)">Deny</button>
                            </template>
                            <button v-if="c.requester === me" :disabled="coverBusy" @click="withdraw(c.request)">Withdraw</button>
                        </div>
                    </article>
                </section>

                <section class="column">
                    <h2>Resolved</h2>
                    <p class="muted column-note">The {{ resolved.length === 1 ? "latest" : resolved.length + " latest" }}</p>
                    <p v-if="resolved.length === 0" class="muted">None yet.</p>
                    <article v-for="c in resolved" :key="c.request" class="cover-card resolved">
                        <p class="cover-when"><strong>{{ dateLabel(c.start) }}</strong> · {{ hoursLabel(c.start, c.end) }}</p>
                        <p>{{ nameOf(c.requester) }}<template v-if="c.claimer"> → {{ nameOf(c.claimer) }}</template></p>
                        <span class="badge" :class="c.status.toLowerCase()">{{ c.status.toLowerCase() }}</span>
                    </article>
                </section>
            </div>
        </template>
    `,
});
