import { defineComponent, onMounted, ref } from "vue/dist/vue.esm-bundler.js";
import { client, savedSession, saveSession } from "./api.ts";
import { HelloPage } from "./HelloPage.ts";
import { LoginPage } from "./LoginPage.ts";

// shows the login page, or the hello page once you're logged in
export const App = defineComponent({
    components: { HelloPage, LoginPage },
    setup() {
        const username = ref<string | null>(null);
        const checking = ref(true);

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
            username.value = name;
        }

        function loggedOut() {
            username.value = null;
        }

        return { username, checking, loggedIn, loggedOut };
    },
    template: `
        <p v-if="checking">Loading…</p>
        <HelloPage v-else-if="username !== null" :username="username" @logged-out="loggedOut" />
        <LoginPage v-else @logged-in="loggedIn" />
    `,
});
