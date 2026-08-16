const EXPECTED_PROJECTION = Object.freeze({
  sizes: 3,
  colors: 3,
  quantityCells: 9,
  pomColumns: 5,
  specificationCells: 15,
});

function normalized(source) {
  return String(source ?? "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\r\n]*/g, " ")
    .replace(/[\r\n\t ]+/g, " ")
    .trim();
}

function snippet(source, needle, radius = 160) {
  const text = normalized(source);
  const index = text.indexOf(needle);
  if (index < 0) return `ABSENT:${needle}`;
  return text.slice(Math.max(0, index - radius), Math.min(text.length, index + needle.length + radius));
}

function compiledEvidence(check, query) {
  if (!check) return { pass: false, text: `QUERY:${query} | ABSENT_CLASSIFICATION:not-inspected` };
  return {
    pass: check.passed === true,
    text: `QUERY:${query} | ${check.passed ? check.normalizedEvidence : `ABSENT_CLASSIFICATION:${check.absenceReason ?? "not-found"}`}`,
  };
}

function makeCheck({
  key,
  semanticClaim,
  sourceLocation,
  sourceEvidence,
  normalizedCompiledEvidence,
  runtimeEvidence,
  pass,
  failureReason,
  normalizedSnippetOrAbsenceClassification,
}) {
  return {
    key,
    semanticClaim,
    sourceLocation,
    sourceEvidence,
    normalizedCompiledEvidence,
    runtimeEvidence,
    pass: Boolean(pass),
    failureReason: pass ? null : failureReason,
    normalizedSnippetOrAbsenceClassification,
  };
}

function isExactProjection(projection) {
  return Object.entries(EXPECTED_PROJECTION).every(([key, value]) => projection?.[key] === value);
}

export function buildReadOnlyMarkerEvidence({ compiled, runtime, sources }) {
  const policy = normalized(sources?.policy);
  const experience = normalized(sources?.experience);
  const editor = normalized(sources?.editor);
  const readOnly = normalized(sources?.readOnly);

  const policyOwnsDraftAndPermission = [
    "header.status",
    "revision.status",
    '"draft"',
    "workorder.update",
  ].every((term) => policy.includes(term));
  const experienceUsesCanonicalPolicy = experience.includes("canEditWorkOrder(")
    && /canEdit\s*:\s*canEditWorkOrder\s*\(/.test(experience);
  const currentCatalogGuardPresent = editor.includes("edit.canEdit && chooser === \"size\"")
    && editor.includes("edit.canEdit && chooser === \"color\"");
  const historicalNestedEditorGuardPresent = editor.includes("edit.canEdit && chooser")
    && editor.includes("edit.canEdit && editor");
  const currentHeaderActionGuardPresent = readOnly.includes("edit?.canEdit && onEditSize && onEditColor")
    && readOnly.includes("WaflSectionHeaderAction");
  const historicalEditorGuardPresent = editor.includes("editable={edit.canEdit}")
    && historicalNestedEditorGuardPresent;
  const editorGuardPresent = (currentCatalogGuardPresent && currentHeaderActionGuardPresent)
    || historicalEditorGuardPresent;
  const addReachableOnlyThroughGuard = editorGuardPresent
    && (currentHeaderActionGuardPresent || editor.includes("StructureCard"))
    && !/\bon(?:Add|Create)(?:Size|Color|Sizes|Colors)?\b|StructureCard|SizeChooser|ColorChooser/.test(readOnly);
  const manualDragAbsent = !/GripVertical|dragHandle|onLongPress|PanResponder/.test(`${editor} ${readOnly}`);
  const mobileReorderAbsent = !/accessibilityMoveActions|accessibilityActions\s*=|onReorder(?:Size|Color)Ids/.test(`${editor} ${readOnly}`);
  const readOnlyMatrixSourcePresent = (readOnly.includes("size-color-expanded-matrix-card")
      || readOnly.includes("색상×사이즈")
      || readOnly.includes("색상·사이즈"))
    && /matrix\.sizes/.test(readOnly)
    && /specifications/.test(readOnly);

  const matrixCompiled = compiledEvidence(compiled?.readOnlyMatrix, "normalized:색상×사이즈");
  const policyCompiled = compiledEvidence(compiled?.canonicalPolicy, "normalized:draft + workorder.update");
  const addCompiled = compiledEvidence(compiled?.addControls, "shared-bundle:추가 + 편집");
  const dragCompiled = compiledEvidence(compiled?.dragHandle, "shared-bundle:adjustable + long-press drag semantics");
  const reorderCompiled = compiledEvidence(compiled?.reorderAccessibility, "shared-bundle:위로 이동 + 아래로 이동");
  const requestLedger = runtime?.requestLedger ?? {};
  const projection = runtime?.projection ?? {};
  const runtimeReadOnly = runtime?.editability?.canEdit === false;

  const subchecks = [
    makeCheck({
      key: "readOnlyMatrixPresent",
      semanticClaim: "read-only branch keeps the size/color matrix and finished-measurement projection visible",
      sourceLocation: "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx",
      sourceEvidence: `matrixHeading=${readOnlyMatrixSourcePresent}; matrix/spec render model present`,
      normalizedCompiledEvidence: matrixCompiled.text,
      runtimeEvidence: `GET projection=${projection.sizes}/${projection.colors}/${projection.quantityCells}/${projection.pomColumns}/${projection.specificationCells}`,
      pass: readOnlyMatrixSourcePresent && matrixCompiled.pass && isExactProjection(projection),
      failureReason: "matrix source, compiled heading, or exact Runtime projection is missing",
      normalizedSnippetOrAbsenceClassification: snippet(readOnly, "색상×사이즈"),
    }),
    makeCheck({
      key: "canonicalEditPolicyGuardPresent",
      semanticClaim: "canonical draft/status/permission policy determines whether the edit boundary is active",
      sourceLocation: "apps/mobile/domain/workOrderPolicy.ts + apps/mobile/features/MobileWorkOrderExperience.tsx",
      sourceEvidence: `policyDraftPermission=${policyOwnsDraftAndPermission}; experienceWiring=${experienceUsesCanonicalPolicy}; editorGuard=${editorGuardPresent}`,
      normalizedCompiledEvidence: policyCompiled.text,
      runtimeEvidence: `canEdit=${runtime?.editability?.canEdit}; reason=${runtime?.editability?.reason ?? "unknown"}`,
      pass: policyOwnsDraftAndPermission && experienceUsesCanonicalPolicy && editorGuardPresent && policyCompiled.pass && runtimeReadOnly,
      failureReason: "canonical policy wiring, compiled policy support, editor guard, or Runtime read-only decision failed",
      normalizedSnippetOrAbsenceClassification: `${snippet(policy, "header.status")} | ${snippet(experience, "canEditWorkOrder(")}`,
    }),
    makeCheck({
      key: "addControlsInsideEditableBranch",
      semanticClaim: "size/color add cards and chooser entry points are reachable only through the editable branch",
      sourceLocation: "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx + WorkOrderSizeColorReadOnly.tsx",
      sourceEvidence: `editableGuard=${editorGuardPresent}; addReachability=${addReachableOnlyThroughGuard}`,
      normalizedCompiledEvidence: `${addCompiled.text} | CLASSIFICATION:expected-present-in-shared-editable-bundle`,
      runtimeEvidence: `readOnlyAddCommandRequests=${requestLedger.addCommandRequests}`,
      pass: addReachableOnlyThroughGuard && addCompiled.pass && requestLedger.addCommandRequests === 0,
      failureReason: "add controls escaped the editable branch or the read-only target issued an add command",
      normalizedSnippetOrAbsenceClassification: `${snippet(editor, "edit.canEdit")} | READ_ONLY_ACTION_MODEL:${addReachableOnlyThroughGuard ? "ABSENT" : "PRESENT_OR_UNPROVEN"}`,
    }),
    makeCheck({
      key: "dragHandleInsideEditableBranch",
      semanticClaim: "manual drag handles are absent after the owner-selected automatic ordering change",
      sourceLocation: "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx + WorkOrderSizeColorReadOnly.tsx",
      sourceEvidence: `automaticOrdering=true; manualDragAbsent=${manualDragAbsent}`,
      normalizedCompiledEvidence: `${dragCompiled.text} | CLASSIFICATION:expected-absent-from-shared-bundle`,
      runtimeEvidence: `readOnlyDragCommandRequests=${requestLedger.dragCommandRequests}`,
      pass: manualDragAbsent && dragCompiled.pass && requestLedger.dragCommandRequests === 0,
      failureReason: "manual drag remains in the bundle or the read-only target issued a drag command",
      normalizedSnippetOrAbsenceClassification: `MANUAL_DRAG_MODEL:${manualDragAbsent ? "ABSENT" : "PRESENT"}`,
    }),
    makeCheck({
      key: "reorderAccessibilityInsideEditableBranch",
      semanticClaim: "mobile reorder actions are absent because server-authoritative automatic ordering owns display order",
      sourceLocation: "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx + WorkOrderSizeColorReadOnly.tsx",
      sourceEvidence: `automaticOrdering=true; mobileReorderAbsent=${mobileReorderAbsent}`,
      normalizedCompiledEvidence: `${reorderCompiled.text} | CLASSIFICATION:expected-absent-from-shared-bundle`,
      runtimeEvidence: `readOnlyReorderCommandRequests=${requestLedger.reorderCommandRequests}`,
      pass: mobileReorderAbsent && reorderCompiled.pass && requestLedger.reorderCommandRequests === 0,
      failureReason: "a mobile reorder action remains or the read-only target issued a reorder command",
      normalizedSnippetOrAbsenceClassification: `MOBILE_REORDER_MODEL:${mobileReorderAbsent ? "ABSENT" : "PRESENT"}`,
    }),
    makeCheck({
      key: "readOnlyTargetCommandRequestsZero",
      semanticClaim: "the read-only Runtime target invokes no command route or command allowlist entry",
      sourceLocation: "Runtime request ledger scoped to 리넨 라운드 셔츠 원피스",
      sourceEvidence: "branch absence is proven by source reachability plus a target-scoped Runtime ledger, not global bundle string absence",
      normalizedCompiledEvidence: "CLASSIFICATION:not-a-global-bundle-absence-query",
      runtimeEvidence: `commandRequests=${requestLedger.commandRequests}; commandAllowlistInvocations=${requestLedger.commandAllowlistInvocations}`,
      pass: requestLedger.commandRequests === 0 && requestLedger.commandAllowlistInvocations === 0,
      failureReason: "the read-only target invoked a command route or command allowlist entry",
      normalizedSnippetOrAbsenceClassification: "RUNTIME_TARGET_COMMAND_ROUTE:ABSENT",
    }),
    makeCheck({
      key: "readOnlyProjectionStill3x3x9x5x15",
      semanticClaim: "the read-only target retains the canonical 3/3/9/5/15 matrix/spec projection",
      sourceLocation: "GET /size-color + GET /size-spec Runtime responses",
      sourceEvidence: "projection is read through existing matrix/spec APIs without mutation",
      normalizedCompiledEvidence: matrixCompiled.text,
      runtimeEvidence: `projection=${projection.sizes}/${projection.colors}/${projection.quantityCells}/${projection.pomColumns}/${projection.specificationCells}`,
      pass: isExactProjection(projection),
      failureReason: "the read-only matrix/spec projection differs from 3/3/9/5/15",
      normalizedSnippetOrAbsenceClassification: isExactProjection(projection) ? "PROJECTION:3/3/9/5/15" : "PROJECTION:MISMATCH",
    }),
  ];

  const failedKeys = subchecks.filter((check) => !check.pass).map((check) => check.key);
  return {
    subchecks,
    aggregate: {
      key: "readOnlyControlsAbsent",
      semanticClaim: "read-only matrix/spec remains visible, add stays guarded, and manual reorder is absent under automatic ordering",
      pass: failedKeys.length === 0,
      failedKeys,
      classification: failedKeys.length === 0
        ? "PASS_BRANCH_AWARE_SOURCE_COMPILED_RUNTIME_EVIDENCE"
        : "FAIL_BRANCH_AWARE_SUBCHECK",
    },
  };
}

export { EXPECTED_PROJECTION };
