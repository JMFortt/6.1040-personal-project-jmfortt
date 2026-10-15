import { defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, savedSession, saveSession, UNREACHABLE } from "./api.ts";
import { ClassPage, type ClassRow } from "./ClassPage.ts";
import { ClassesPage } from "./ClassesPage.ts";
import { LoginPage } from "./LoginPage.ts";
import { WeekPage } from "./WeekPage.ts";

// shows the login page, or (once logged in) a header plus the classes list, one class, or one week
export const App = defineComponent({
    components: { ClassPage, ClassesPage, LoginPage, WeekPage },
    setup() {
        const username = ref<string | null>(null);
        const checking = ref(true);
        // shown on the login page, e.g. when a session has expired
        const notice = ref("");
        // the class being viewed, or null for the classes list
        const openClass = ref<ClassRow | null>(null);
        // a published week of the open class being viewed, or null
        const openWeek = ref<string | null>(null);

        const logoutError = ref("");
        const loggingOut = ref(false);

        // if a session was saved earlier, ask the backend whether it's still valid
        onMounted(async () => {
            const session = savedSession();
            if (session !== null) {
                try {
                    const result = await client.auth.current({ session });
                    if ("error" in result) saveSession(null);
                    else username.value = result.account.username;
                } catch {
                    // server unreachable: fall through to the login page
                }
            }
            checking.value = false;
        });

        function loggedIn(name: string) {
            notice.value = "";
            username.value = name;
        }

        function loggedOut(message?: string) {
            notice.value = message ?? "";
            openClass.value = null;
            openWeek.value = null;
            logoutError.value = "";
            username.value = null;
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

        function open(row: ClassRow) {
            openClass.value = row;
        }

        function back() {
            openClass.value = null;
        }

        function openWeekPage(week: string) {
            openWeek.value = week;
        }

        function backToClass() {
            openWeek.value = null;
        }

        return {
            username, checking, notice, openClass, openWeek, logoutError, loggingOut,
            loggedIn, loggedOut, logout, open, back, openWeekPage, backToClass,
        };
    },
    template: `
        <p v-if="checking">Loading…</p>
        <LoginPage v-else-if="username === null" :notice="notice" @logged-in="loggedIn" />
        <template v-else>
            <header class="top">
                <h1>Hello {{ username }}!</h1>
                <button :disabled="loggingOut" @click="logout">Log out</button>
            </header>
            <p v-if="logoutError" class="error">{{ logoutError }}</p>
            <WeekPage
                v-if="openClass !== null && openWeek !== null"
                :week="openWeek"
                :group="openClass.group"
                :role="openClass.role"
                @back="backToClass"
                @logged-out="loggedOut"
            />
            <ClassPage
                v-else-if="openClass !== null"
                :group="openClass.group"
                :name="openClass.name"
                :role="openClass.role"
                @back="back"
                @open-week="openWeekPage"
                @logged-out="loggedOut"
            />
            <ClassesPage v-else @open-class="open" @logged-out="loggedOut" />
        </template>
    `,
});
