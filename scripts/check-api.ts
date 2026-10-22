import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { TAbleWireHttp } from "../generated/wire.ts";

const address = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3000";
// With --wait, keep trying for 60 seconds. That gives the containers time to start.
const deadline = Date.now() + (process.argv.includes("--wait") ? 60_000 : 0);
const client = createHttpClient<TAbleWireHttp>({ baseUrl: `${address}/api` });

while (true) {
    // a made-up session should be refused as UNAUTHORIZED, which shows the API is answering
    let answer: string;
    try {
        const result = await client.auth.current({ session: "health-check" });
        answer = "error" in result ? result.error : "a user";
    } catch (error) {
        answer = String(error);
    }
    if (answer === "UNAUTHORIZED") {
        console.log(`The API at ${address} answered.`);
        break;
    }
    if (Date.now() > deadline) {
        console.error(`Could not reach the API at ${address}. The client says ${answer}.`);
        process.exit(1);
    }
    await Bun.sleep(1000);
}
