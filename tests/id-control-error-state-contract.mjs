import assert from "node:assert/strict";
import fs from "node:fs";

const client = fs.readFileSync("app/dev/test-console/DevTestConsoleClient.tsx", "utf8");
const optionsRoute = fs.readFileSync("app/api/dev/test-context/options/route.ts", "utf8");

assert.match(client, /optionsStatus/);
assert.match(client, /optionsError/);
assert.match(client, /setOptionsStatus\("loading"\)/);
assert.match(client, /setOptionsStatus\("success"\)/);
assert.match(client, /setOptionsStatus\("error"\)/);
assert.match(client, /HTTP \$\{response\.status\}/, "non-2xx responses must render a safe status-only error");
assert.match(client, /loadOptions\(\)\.catch/, "fetch or JSON failures must not leave the page in permanent loading");
assert.match(client, /!options && optionsStatus === "error"/, "error state must be handled before the loading fallback");
assert.match(client, /WaflButton[\s\S]*loadOptions/, "error UI must provide a retry button");
assert.match(client, /WaflLinkButton[\s\S]*href="\/system"/, "error UI must provide a safe system dashboard path");
assert.doesNotMatch(client, /DATABASE_URL|SECRET|TOKEN|ACCESS_KEY|PRIVATE_KEY|stack|error\.message/, "error UI must not expose secrets or raw server details");

assert.match(optionsRoute, /Cache-Control": "no-store"/);
assert.match(optionsRoute, /SYSTEM_ADMIN_REQUIRED/);

console.log("id-control error-state contract: OK");
