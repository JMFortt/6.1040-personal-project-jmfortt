import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { MongoClient } from "mongodb";
import { assembleApplication } from "../../src/assembly.ts";
import { policy } from "../../src/http.ts";

// the same handler main.ts serves at /api/*, called directly with no server running,
// backed by its own empty test database
export async function testApi(databaseName: string) {
    const client = new MongoClient(process.env.MONGODB_URL!);
    const db = client.db(databaseName);
    await db.dropDatabase();

    const application = assembleApplication(db);
    const gateway = createGateway({ application });
    const api = createHttpHandler({ application, gateway, policy });

    async function post(path: string, body: unknown) {
        const response = await api(
            new Request(`http://localhost/api${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }),
        );
        return response.json();
    }

    async function close() {
        await db.dropDatabase();
        await client.close();
    }

    return { post, close };
}
