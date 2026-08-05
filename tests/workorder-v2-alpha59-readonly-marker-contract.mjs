import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildReadOnlyMarkerEvidence,
} from "../scripts/lib/alpha59-readonly-marker-evidence.mjs";

const sources = {
  policy: `
    export function canEditWorkOrder(detail, user) {
      return Boolean(detail && detail.header.status === "draft"
        && detail.revision.status === "draft"
        && user.permissionCodes.includes("workorder.update"));
    }
  `,
  experience: `
    const edit = useEditor({ canEdit: canEditWorkOrder(detail, user) });
    return <Overview sizeColorEdit={edit} />;
  `,
  editor: `
    function StructureCard({ editable, onAdd }) { return editable ? <Pressable onPress={onAdd}>추가</Pressable> : <Text>3개</Text>; }
    export default function Editor({ edit, matrix, chooser, editor }) {
      return <View><StructureCard editable={edit.canEdit} onAdd={() => openChooser()} />{edit.canEdit && chooser ? <Chooser /> : null}{edit.canEdit && editor ? <ReelEditor /> : null}<ReadOnly /></View>;
    }
  `,
  readOnly: `
    export default function ReadOnly({ matrix, specifications }) {
      return <View><Text>색상×사이즈 생산수량</Text>{matrix.sizes.map((size) => <Text>{size.label}</Text>)}<Matrix value={matrix} /><Spec value={specifications} /></View>;
    }
  `,
};

const compiled = {
  readOnlyMatrix: { passed: true, normalizedEvidence: "색상×사이즈생산수량", absenceReason: null },
  canonicalPolicy: { passed: true, normalizedEvidence: "draft|workorder.update", absenceReason: null },
  addControls: { passed: true, normalizedEvidence: "추가|편집", absenceReason: null },
  dragHandle: { passed: true, normalizedEvidence: "ABSENT:manual-drag", absenceReason: null },
  reorderAccessibility: { passed: true, normalizedEvidence: "ABSENT:mobile-reorder", absenceReason: null },
};

const runtime = {
  editability: { canEdit: false, reason: "issued-work-order" },
  projection: { sizes: 3, colors: 3, quantityCells: 9, pomColumns: 5, specificationCells: 15 },
  requestLedger: {
    addCommandRequests: 0,
    dragCommandRequests: 0,
    reorderCommandRequests: 0,
    commandRequests: 0,
    commandAllowlistInvocations: 0,
  },
};

const evidence = buildReadOnlyMarkerEvidence({ compiled, runtime, sources });
assert.deepEqual(evidence.subchecks.map((check) => check.key), [
  "readOnlyMatrixPresent",
  "canonicalEditPolicyGuardPresent",
  "addControlsInsideEditableBranch",
  "dragHandleInsideEditableBranch",
  "reorderAccessibilityInsideEditableBranch",
  "readOnlyTargetCommandRequestsZero",
  "readOnlyProjectionStill3x3x9x5x15",
]);
assert.equal(evidence.aggregate.key, "readOnlyControlsAbsent");
assert.equal(evidence.aggregate.pass, true);
assert.ok(evidence.subchecks.every((check) => (
  typeof check.semanticClaim === "string"
  && typeof check.sourceEvidence === "string"
  && typeof check.normalizedCompiledEvidence === "string"
  && typeof check.runtimeEvidence === "string"
  && typeof check.pass === "boolean"
  && Object.hasOwn(check, "failureReason")
  && typeof check.normalizedSnippetOrAbsenceClassification === "string"
)));

// Add is guarded, while manual drag/reorder is absent under automatic ordering.
assert.equal(compiled.addControls.passed, true);
assert.equal(compiled.dragHandle.passed, true);
assert.equal(compiled.reorderAccessibility.passed, true);

const exposed = buildReadOnlyMarkerEvidence({
  compiled,
  runtime,
  sources: { ...sources, readOnly: `${sources.readOnly}\n<GripVertical onPress={onReorderColorIds} />` },
});
assert.equal(exposed.aggregate.pass, false);
assert.equal(exposed.subchecks.find((check) => check.key === "dragHandleInsideEditableBranch")?.pass, false);

const mutated = buildReadOnlyMarkerEvidence({
  compiled,
  runtime: {
    ...runtime,
    requestLedger: { ...runtime.requestLedger, commandRequests: 1, commandAllowlistInvocations: 1 },
  },
  sources,
});
assert.equal(mutated.subchecks.find((check) => check.key === "readOnlyTargetCommandRequestsZero")?.pass, false);

const sparse = buildReadOnlyMarkerEvidence({
  compiled,
  runtime: { ...runtime, projection: { ...runtime.projection, specificationCells: 14 } },
  sources,
});
assert.equal(sparse.subchecks.find((check) => check.key === "readOnlyProjectionStill3x3x9x5x15")?.pass, false);

const root = process.cwd();
const actual = buildReadOnlyMarkerEvidence({
  compiled,
  runtime,
  sources: {
    policy: fs.readFileSync(path.join(root, "apps/mobile/domain/workOrderPolicy.ts"), "utf8"),
    experience: fs.readFileSync(path.join(root, "apps/mobile/features/MobileWorkOrderExperience.tsx"), "utf8"),
    editor: fs.readFileSync(path.join(root, "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx"), "utf8"),
    readOnly: fs.readFileSync(path.join(root, "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx"), "utf8"),
  },
});
assert.equal(actual.aggregate.pass, true);

console.log("alpha59 read-only marker contracts: 5/5 PASS");
