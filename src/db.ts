import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL;
if (!url) {
    throw new Error("MONGODB_URL is not set. Add it to your .env file.");
}

// the deployment platform allows 10 MongoDB connections per app, but the driver's default
// pool can open up to 100, so cap it
export const client = new MongoClient(url, { maxPoolSize: 6 });
export const db = client.db();
