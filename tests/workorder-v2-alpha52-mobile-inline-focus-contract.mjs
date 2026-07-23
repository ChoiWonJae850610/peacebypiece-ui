#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const field = fs.readFileSync("apps/mobile/components/ControlledInlineEditValue.tsx", "utf8");
const detail = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");
const app = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const visibility = fs.readFileSync("apps/mobile/hooks/useFocusedFieldVisibility.ts", "utf8");

assert.match(field, /const inputRef = useRef<TextInput>/);
assert.match(field, /if \(!active\) return undefined/);
assert.match(field, /requestAnimationFrame\(\(\) => inputRef\.current\?\.focus\(\)\)/);
assert.match(field, /cancelAnimationFrame\(prepareFrame\)/);
assert.match(field, /cancelAnimationFrame\(focusFrame\)/);
assert.doesNotMatch(field, /autoFocus/);
assert.doesNotMatch(field, /setInterval|setTimeout|poll|retry/i);
assert.match(detail, /automaticallyAdjustKeyboardInsets=\{Platform\.OS === "ios"\}/);
assert.match(detail, /keyboardDismissMode="interactive"/);
assert.match(detail, /keyboardShouldPersistTaps="handled"/);
assert.match(field, /keyboardType=\{keyboardType\}/);
assert.match(field, /onFocusTarget/);
assert.match(visibility, /measureInWindow/);
assert.match(visibility, /endCoordinates\.screenY/);
assert.match(visibility, /scrollTo/);
assert.doesNotMatch(detail, /KeyboardAvoidingView/);
assert.match(field, /onCancel/);
assert.match(field, /onSave/);
assert.match(app, /activeBasicField/);
assert.match(app, /activeMaterialField/);
assert.match(app, /현재 필드 편집을 완료해 주세요/);

console.log("workorder v2 alpha.52 mobile inline focus contract: PASS");
