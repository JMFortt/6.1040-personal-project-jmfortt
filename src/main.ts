import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
// Bun bundles the Vue page (and the .ts files it loads) itself when the server starts,
// so one server handles both the page and the API, with no separate build step
import homepage from "../web/index.html";
import { assembleApplication } from "./assembly.ts";
import { policy } from "./http.ts";
import { db } from "./db.ts";

const application = assembleApplication();
const gateway = createGateway({ application });
const api = createHttpHandler({ application, gateway, policy });

const server = Bun.serve({
    hostname: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? 3000),
    routes: {
        "/": homepage,
        "/api/*": api,
        "/health": async () => {
            try {
                await db.collection("userAuthenticating.users").findOne({}, { maxTimeMS: 2000, timeoutMS: 3000 });
                return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
            } catch {
                return Response.json(
                    { status: "unavailable" },
                    { status: 503, headers: { "Cache-Control": "no-store" } },
                );
            }
        },
    },
});

console.log(`TAble ready on ${server.url}`);
