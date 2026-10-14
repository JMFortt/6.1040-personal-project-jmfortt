import { defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, savedSession, saveSession } from "./api.ts";
import { ClassesPage } from "./ClassesPage.ts";
import { LoginPage } from "./LoginPage.ts";

// shows the login page, or the classes page once you're logged in
export const App = defineComponent({
    components: { ClassesPage, LoginPage },
    setup() {
        const username = ref<string | null>(null);
        const checking = ref(true);
        // shown on the login page, e.g. when a session has expired
        const notice = ref("");

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
            username.value = null;
        }

        return { username, checking, notice, loggedIn, loggedOut };
    },
    template: `
        <p v-if="checking">Loading…</p>
        <ClassesPage v-else-if="username !== null" :username="username" @logged-out="loggedOut" />
        <LoginPage v-else :notice="notice" @logged-in="loggedIn" />
    `,
});
