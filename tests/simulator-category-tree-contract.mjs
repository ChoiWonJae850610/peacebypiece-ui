import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/simulator/commands/db-data.mjs", import.meta.url), "utf8");

assert.match(source, /PRODUCT_CATEGORY_NODE_COUNT/, "unique category node count must be calculated");
assert.match(source, /DELETE FROM item_categories WHERE company_id=\$1/, "legacy duplicated simulator categories must be cleared");
assert.match(source, /const categoryNodeIds = new Map\(\)/, "category nodes must be reused by path");
assert.match(source, /pathParts\.join\("::"\)/, "category identity must be based on the full hierarchy path");
assert.doesNotMatch(source, /category-\$\{categoryIndex \+ 1\}-\$\{levelIndex \+ 1\}/, "path rows must not create duplicate parent nodes");
assert.match(source, /itemCategories: PRODUCT_CATEGORY_NODE_COUNT/, "seed plan must report unique nodes, not three rows per path");

console.log("PASS simulator normalized category tree contract");
