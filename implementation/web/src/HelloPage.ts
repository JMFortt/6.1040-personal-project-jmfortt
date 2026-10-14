import { defineComponent, ref } from "vue/dist/vue.esm-bundler.js";
import { client, savedSession, saveSession, UNREACHABLE } from "./api.ts";

export const HelloPage = defineComponent({
    props: { username: { type: String, required: true } },
    emits: ["logged-out"],
    setup(_props, { emit }) {
        const error = ref("");
        const busy = ref(false);

        async function logout() {
            error.value = "";
            const session = savedSession();
            busy.value = true;
            try {
                if (session !== null) {
                    const result = await client.auth.logout({ session });
                    // NOT_FOUND means the session had already ended, so that's still logged out
                    if ("error" in result && result.error !== "NOT_FOUND") {
                        error.value = "Couldn't log out. Please try again.";
                        return;
                    }
                }
                saveSession(null);
                emit("logged-out");
            } catch {
                error.value = UNREACHABLE;
            } finally {
                busy.value = false;
            }
        }

        return { error, busy, logout };
    },
    template: `
        <h1>Hello {{ username }}!</h1>
        <button :disabled="busy" @click="logout">Log out</button>
        <p v-if="error" class="error">{{ error }}</p>
    `,
});
