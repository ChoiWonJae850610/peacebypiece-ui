import fs from "node:fs";
import path from "node:path";

/**
 * Canonical current-source reader for historical mobile API contracts. The
 * runtime facade is intentionally small after alpha.63; behavior ownership
 * lives in apiTransport plus typed domain modules.
 */
export function readMobileApiSource(root = process.cwd()) {
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const domainDirectory = path.join(root, "apps/mobile/lib/api");
  const domainFiles = fs.readdirSync(domainDirectory)
    .filter((name) => name.endsWith(".ts"))
    .sort();
  return [
    read("apps/mobile/lib/apiClient.ts"),
    read("apps/mobile/lib/apiTransport.ts"),
    ...domainFiles.map((name) => read(`apps/mobile/lib/api/${name}`)),
  ].join("\n");
}
