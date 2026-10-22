import { onMounted, onUnmounted } from "vue/dist/vue.esm-bundler.js";

// Keeps a page up to date with other people's changes: calls refresh every few seconds while the
// page is showing. Skips a tick if the browser tab is in the background or the last refresh
// hasn't finished yet, and stops when the page is closed.
export function usePolling(refresh: () => Promise<unknown>, everyMs = 5000) {
    let timer: ReturnType<typeof setInterval> | undefined;
    let running = false;

    async function tick() {
        if (document.hidden || running) return;
        running = true;
        try {
            await refresh();
        } finally {
            running = false;
        }
    }

    onMounted(() => {
        timer = setInterval(tick, everyMs);
    });
    onUnmounted(() => clearInterval(timer));
}
