import { computed, defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, savedSession, saveSession, UNREACHABLE, type ClassRow } from "./api.ts";
import { AttendanceSection } from "./AttendanceSection.ts";
import { ClassesPage } from "./ClassesPage.ts";
import { CoversSection } from "./CoversSection.ts";
import { LoginPage } from "./LoginPage.ts";
import { MembersSection } from "./MembersSection.ts";
import { ScheduleSection } from "./ScheduleSection.ts";
import { WeekPage } from "./WeekPage.ts";

// the sections of a class, in sidebar order
const SECTIONS = [
    { id: "schedule", label: "Schedule" },
    { id: "covers", label: "Cover requests" },
    { id: "attendance", label: "Attendance" },
    { id: "members", label: "Members" },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

// the login page, or (once logged in) the app shell: a top bar, a sidebar, and the current page
export const App = defineComponent({
    components: { AttendanceSection, ClassesPage, CoversSection, LoginPage, MembersSection, ScheduleSection, WeekPage },
    setup() {
        const username = ref<string | null>(null);
        // the logged-in user's id, so pages can tell which shifts are yours
        const me = ref("");
        const checking = ref(true);
        // shown on the login page, e.g. when a session has expired
        const notice = ref("");

        // where you are: the classes list, or a class's section, or (in Schedule) one published week
        const openClass = ref<ClassRow | null>(null);
        const section = ref<Section>("schedule");
        const openWeek = ref<string | null>(null);

        const logoutError = ref("");
        const loggingOut = ref(false);

        const initials = computed(() => (username.value ?? "").slice(0, 2).toUpperCase());
        const sectionLabel = computed(() => SECTIONS.find((s) => s.id === section.value)?.label ?? "");

        // if a session was saved earlier, ask the backend whether it's still valid
        onMounted(async () => {
            const session = savedSession();
            if (session !== null) {
                try {
                    const result = await client.auth.current({ session });
                    if ("error" in result) saveSession(null);
                    else {
                        username.value = result.account.username;
                        me.value = result.account.user;
                    }
                } catch {
                    // server unreachable: fall through to the login page
                }
            }
            checking.value = false;
        });

        function loggedIn(account: { username: string; user: string }) {
            notice.value = "";
            username.value = account.username;
            me.value = account.user;
        }

        function loggedOut(message?: string) {
            notice.value = message ?? "";
            showClasses();
            logoutError.value = "";
            username.value = null;
            me.value = "";
        }

        async function logout() {
            logoutError.value = "";
            const session = savedSession();
            loggingOut.value = true;
            try {
                if (session !== null) {
                    const result = await client.auth.logout({ session });
                    // NOT_FOUND means the session had already ended, so that's still logged out
                    if ("error" in result && result.error !== "NOT_FOUND") {
                        logoutError.value = "Couldn't log out. Please try again.";
                        return;
                    }
                }
                saveSession(null);
                loggedOut();
            } catch {
                logoutError.value = UNREACHABLE;
            } finally {
                loggingOut.value = false;
            }
        }

        // --- navigation ---

        function showClasses() {
            openClass.value = null;
            openWeek.value = null;
        }

        function openClassPage(row: ClassRow) {
            openClass.value = row;
            section.value = "schedule";
            openWeek.value = null;
        }

        function go(to: Section) {
            section.value = to;
            openWeek.value = null;
        }

        function openWeekPage(week: string) {
            openWeek.value = week;
        }

        return {
            SECTIONS, username, me, initials, checking, notice, openClass, section, sectionLabel, openWeek,
            logoutError, loggingOut, loggedIn, loggedOut, logout, showClasses, openClassPage, go, openWeekPage,
        };
    },
    template: `
        <p v-if="checking" class="muted">Loading…</p>
        <LoginPage v-else-if="username === null" :notice="notice" @logged-in="loggedIn" />
        <template v-else>
            <header class="topbar">
                <button class="brand" @click="showClasses">
                    <span class="logo">TA</span>TAble
                </button>
                <nav class="crumbs">
                    <button class="crumb" @click="showClasses">Classes</button>
                    <template v-if="openClass">
                        <span>/</span>
                        <button class="crumb" @click="go('schedule')">{{ openClass.name }}</button>
                        <span>/</span>
                        <span>{{ sectionLabel }}</span>
                    </template>
                </nav>
                <div class="user">
                    <span class="avatar">{{ initials }}</span>
                    <span class="username">{{ username }}</span>
                    <button class="on-dark" :disabled="loggingOut" @click="logout">Log out</button>
                </div>
            </header>
            <p v-if="logoutError" class="error">{{ logoutError }}</p>

            <div class="shell">
                <aside class="sidebar">
                    <button class="nav" :class="{ active: openClass === null }" @click="showClasses">My classes</button>
                    <template v-if="openClass">
                        <p class="nav-label">{{ openClass.name }}</p>
                        <button
                            v-for="s in SECTIONS"
                            :key="s.id"
                            class="nav"
                            :class="{ active: section === s.id }"
                            @click="go(s.id)"
                        >{{ s.label }}</button>
                    </template>
                </aside>

                <main class="content">
                    <ClassesPage v-if="openClass === null" @open-class="openClassPage" @logged-out="loggedOut" />
                    <template v-else-if="section === 'schedule'">
                        <WeekPage
                            v-if="openWeek !== null"
                            :week="openWeek"
                            :group="openClass.group"
                            :role="openClass.role"
                            :me="me"
                            @back="openWeek = null"
                            @logged-out="loggedOut"
                        />
                        <ScheduleSection
                            v-else
                            :group="openClass.group"
                            :name="openClass.name"
                            :role="openClass.role"
                            :me="me"
                            @open-week="openWeekPage"
                            @logged-out="loggedOut"
                        />
                    </template>
                    <CoversSection v-else-if="section === 'covers'" :name="openClass.name" />
                    <AttendanceSection
                        v-else-if="section === 'attendance'"
                        :group="openClass.group"
                        :name="openClass.name"
                        @logged-out="loggedOut"
                    />
                    <MembersSection
                        v-else
                        :group="openClass.group"
                        :name="openClass.name"
                        :role="openClass.role"
                        :me="me"
                        @left="showClasses"
                        @logged-out="loggedOut"
                    />
                </main>
            </div>
        </template>
    `,
});
