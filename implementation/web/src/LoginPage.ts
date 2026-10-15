import { defineComponent, ref } from "vue/dist/vue.esm-bundler.js";
import { client, errorMessage, saveSession, UNREACHABLE } from "./api.ts";

const EMPTY = "Please enter a username and password.";

export const LoginPage = defineComponent({
    // notice: a message to show on arrival, like "You've been logged out"
    props: { notice: { type: String, default: "" } },
    emits: ["logged-in"],
    setup(props, { emit }) {
        const username = ref("");
        const password = ref("");
        const error = ref(props.notice);
        const busy = ref(false);

        async function submit(action: "login" | "register") {
            error.value = "";
            // caught here so the user doesn't wait on a request that's sure to fail
            if (username.value === "" || password.value === "") {
                error.value = EMPTY;
                return;
            }
            busy.value = true;
            try {
                const credentials = { username: username.value, password: password.value };
                const result =
                    action === "login"
                        ? await client.auth.login(credentials)
                        : await client.auth.register(credentials);
                if ("error" in result) {
                    error.value =
                        action === "login"
                            ? errorMessage(result.error, {
                                UNAUTHORIZED: "Incorrect username or password.",
                                INVALID_REQUEST: EMPTY,
                            })
                            : errorMessage(result.error, {
                                CONFLICT: "That username is already taken.",
                                INVALID_REQUEST: EMPTY,
                            });
                    return;
                }
                saveSession(result.session);
                emit("logged-in", { username: username.value, user: result.user });
            } catch {
                error.value = UNREACHABLE;
            } finally {
                busy.value = false;
            }
        }

        return { username, password, error, busy, submit };
    },
    template: `
        <form @submit.prevent="submit('login')">
            <h1>TAble</h1>
            <label>
                Username
                <input v-model="username" autocomplete="username" />
            </label>
            <label>
                Password
                <input v-model="password" type="password" autocomplete="current-password" />
            </label>
            <div class="buttons">
                <button type="submit" :disabled="busy">Log in</button>
                <button type="button" :disabled="busy" @click="submit('register')">Register</button>
            </div>
            <p v-if="error" class="error">{{ error }}</p>
        </form>
    `,
});
