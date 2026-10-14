import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { assembleApplication } from "./src/assembly.ts";
import { policy } from "./src/http.ts";

export default {
  assemble: assembleApplication,
  title: "TAble",
  wireName: "TAbleWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/Auth.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy, name: "TAbleWireHttp" })],
};
