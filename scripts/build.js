import { access } from "node:fs/promises";

const required = [
  "apps/web/index.html",
  "apps/web/styles.css",
  "apps/web/app.js",
  "apps/api/server.js",
  "apps/mcp-server/tools.js",
  "packages/policy-engine/index.js",
  "contracts/agent-safe-core/src/lib.rs",
  "README.md"
];

for (const file of required) {
  await access(file);
}

console.log("build ok");
