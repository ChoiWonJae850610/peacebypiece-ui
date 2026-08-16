export function normalizeCompiledBundleText(text) {
  return text
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

export function createCompiledSemanticViews(text) {
  const decoded = normalizeCompiledBundleText(text);
  return {
    decoded,
    whitespaceNormalized: decoded.replace(/\s+/g, " ").trim(),
    syntaxNeutral: decoded.replace(/["'`\s+(),;:{}[\]]/g, ""),
  };
}

function semanticNeedle(value) {
  return createCompiledSemanticViews(String(value)).syntaxNeutral;
}

export function inspectCompiledSemantic(views, expected, options = {}) {
  const terms = (Array.isArray(expected) ? expected : [expected]).map(semanticNeedle);
  const ordered = options.ordered ?? true;
  const maxGap = options.maxGap ?? Number.POSITIVE_INFINITY;
  const source = views.syntaxNeutral;
  const positions = [];
  let cursor = 0;
  let previousEnd = 0;
  let missing = null;

  for (const term of terms) {
    const position = source.indexOf(term, ordered ? cursor : 0);
    if (position < 0 || (ordered && positions.length > 0 && position - previousEnd > maxGap)) {
      missing = term;
      break;
    }
    positions.push({ term, position });
    previousEnd = position + term.length;
    if (ordered) cursor = previousEnd;
  }

  const passed = missing === null;
  if (!passed) {
    return {
      passed: false,
      normalizedEvidence: `ABSENT:${missing}`,
      absenceReason: `normalized compiled output did not contain the required ${ordered ? "ordered " : ""}semantic sequence`,
    };
  }

  const first = Math.max(0, positions[0].position - 48);
  const lastMatch = positions.at(-1);
  const last = Math.min(source.length, lastMatch.position + lastMatch.term.length + 48);
  return {
    passed: true,
    normalizedEvidence: source.slice(first, last),
    absenceReason: null,
  };
}

export function buildNamedSemanticMarker(input) {
  return {
    key: input.key,
    meaning: input.meaning,
    source: input.source,
    expectedSemantic: input.expectedSemantic,
    normalizedCompiledCheck: input.normalizedCompiledCheck,
    passed: Boolean(input.passed),
    normalizedEvidence: input.normalizedEvidence,
    absenceReason: input.passed ? null : input.absenceReason,
  };
}

function jsxOpeningTags(source, componentName) {
  return source.match(new RegExp(`<${componentName}\\b[^\\n>]*>`, "g")) ?? [];
}

function sourceCheck(key, meaning, passed, evidence, failureReason) {
  return {
    key,
    meaning,
    passed: Boolean(passed),
    evidence,
    failureReason: passed ? null : failureReason,
  };
}

export function inspectSamePositionInlineCoreFieldSources(sources) {
  const materialUnitPriceTags = jsxOpeningTags(sources.materialView, "MaterialInlineField")
    .filter((tag) => /\bfield="unitPrice"/.test(tag));
  const editorUnitPriceTags = jsxOpeningTags(sources.materialEditor, "EditorField")
    .filter((tag) => /\bfield="unitPrice"/.test(tag));
  const unitPriceTags = [...materialUnitPriceTags, ...editorUnitPriceTags];
  const controlledSaveCalls = sources.controlledInline.match(/\bonSave\(/g) ?? [];
  const endEditingBlock = sources.controlledInline.slice(
    sources.controlledInline.indexOf("function handleEndEditing"),
    sources.controlledInline.indexOf("function handleSaveRequest"),
  );
  const submitBlock = sources.controlledInline.slice(
    sources.controlledInline.indexOf("function handleSubmitEditing"),
    sources.controlledInline.indexOf("function handleCancel"),
  );
  const activeUnitPriceSource = `${sources.materialView}\n${sources.materialEditor}\n${sources.reelPicker}`;

  const subchecks = [
    sourceCheck(
      "same-position-text-input",
      "제품명과 원단·부자재 핵심 필드는 표시값 자리의 ControlledInlineEditValue/TextInput으로 전환된다",
      /accessibilityLabel="제품명"[\s\S]{0,180}commitMode="blur-submit"/.test(sources.overview)
        && sources.materialView.includes("<ControlledInlineEditValue")
        && materialUnitPriceTags.length === 1,
      `productNameBlurSubmit=${/accessibilityLabel="제품명"[\s\S]{0,180}commitMode="blur-submit"/.test(sources.overview)}; sharedControlledInline=${sources.materialView.includes("<ControlledInlineEditValue")}; activeUnitPriceTags=${materialUnitPriceTags.length}`,
      "same-position product-name or shared material unit-price TextInput path is missing",
    ),
    sourceCheck(
      "canonical-number-pad",
      "활성 원단·부자재 단가 필드는 canonical number-pad를 사용한다",
      unitPriceTags.length === 2
        && unitPriceTags.every((tag) => /\bkeyboardType="number-pad"/.test(tag))
        && unitPriceTags.every((tag) => !/\bkeyboardType="decimal-pad"/.test(tag)),
      `activeTags=${unitPriceTags.length}; keyboards=${unitPriceTags.map((tag) => tag.match(/keyboardType="([^"]+)"/)?.[1] ?? "missing").join(",")}`,
      "an active unit-price field is missing or does not use the exact canonical number-pad keyboard",
    ),
    sourceCheck(
      "not-modal-only",
      "단가는 별도 modal/reel-only 경로가 아니라 활성 인라인 필드로 편집된다",
      materialUnitPriceTags.length === 1
        && !/reelTarget\.field === "unitPrice"|kind="currency"|field="unitPrice"[\s\S]{0,120}<WaflInputSheet/.test(activeUnitPriceSource),
      `inlineUnitPrice=${materialUnitPriceTags.length === 1}; unitPriceModalOrReel=${/reelTarget\.field === "unitPrice"|kind="currency"|field="unitPrice"[\s\S]{0,120}<WaflInputSheet/.test(activeUnitPriceSource)}`,
      "unit price is missing from the inline path or appears in a modal/reel-only path",
    ),
    sourceCheck(
      "inline-actions-hidden",
      "blur-submit 인라인 필드에는 visible X/Check action이 없다",
      sources.materialView.includes('["name", "colorOption", "unitPrice", "usageArea", "memo"].includes(field) ? "blur-submit" : "explicit"')
        && sources.controlledInline.includes("{!inlineCommit ? <View style={styles.actions}>")
        && !sources.controlledInline.includes("{inlineCommit ? <View style={styles.actions}>")
        && !materialUnitPriceTags.some((tag) => /onCancel|onSaveRequest|<Check|<X/.test(tag)),
      "unitPrice=blur-submit; visibleActions=explicit-only",
      "unit price is not blur-submit or visible X/Check actions can render in the inline branch",
    ),
    sourceCheck(
      "submit-blur-dedupe",
      "keyboard submit과 blur는 같은 finalization controller를 사용해 최대 한 번 저장한다",
      sources.controlledInline.includes("createInlineEditFinalizationController")
        && /requestSave\(\)/.test(endEditingBlock)
        && /finalizePendingSave\(/.test(endEditingBlock)
        && /requestSave\(\)/.test(submitBlock)
        && /inputRef\.current\.blur\(\)/.test(submitBlock)
        && controlledSaveCalls.length === 1,
      `endEditingGuard=${/requestSave\(\)/.test(endEditingBlock)}; submitGuard=${/requestSave\(\)/.test(submitBlock)}; controllerOnSaveCalls=${controlledSaveCalls.length}`,
      "submit/blur does not share the finalization gate or more than one controller save path exists",
    ),
    sourceCheck(
      "background-duplicate-zero",
      "background/unmount lifecycle에는 저장 호출이 없고 controller의 유일한 onSave는 finalization에만 있다",
      controlledSaveCalls.length === 1
        && /function finalizePendingSave[\s\S]*?decideInlineEditCommit\([\s\S]*?onSave\(decision\.value\)/.test(sources.controlledInline)
        && !/useEffect\([\s\S]{0,700}\bonSave\(/.test(sources.controlledInline),
      `controllerOnSaveCalls=${controlledSaveCalls.length}; effectSaveCall=${/useEffect\([\s\S]{0,700}\bonSave\(/.test(sources.controlledInline)}`,
      "an effect/unmount save path exists or save is not confined to finalization",
    ),
    sourceCheck(
      "won-view-formatting",
      "표시 상태의 단가는 천 단위 comma와 원 suffix를 사용한다",
      materialUnitPriceTags[0]?.includes("displayValue={formatWon(calculationDraft.unitPrice)}")
        && sources.display.includes('replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")')
        && sources.display.includes("${grouped}원"),
      `formatWonConsumer=${materialUnitPriceTags[0]?.includes("displayValue={formatWon(calculationDraft.unitPrice)}") ?? false}; commaAndWonFormatter=${sources.display.includes("${grouped}원")}`,
      "unit-price display does not use the canonical comma-and-won formatter",
    ),
    sourceCheck(
      "material-accessory-symmetry",
      "원단과 부자재는 materialType만 바꾸는 같은 view/controller와 단가 필드를 사용한다",
      sources.materialView.includes('materialType === "accessory" ? "부자재" : "원단"')
        && materialUnitPriceTags.length === 1
        && (sources.overview.includes("materialType={props.materialType}")
          || sources.overview.includes("materialType={materialType}"))
        && sources.experience.includes('materialCacheKey(detail.header.id, "fabric")')
        && sources.experience.includes('materialCacheKey(detail.header.id, "accessory")'),
      `sharedUnitPriceTag=${materialUnitPriceTags.length === 1}; overviewMaterialTypePassThrough=${sources.overview.includes("materialType={props.materialType}") || sources.overview.includes("materialType={materialType}")}; combinedMaterialCaches=${sources.experience.includes('materialCacheKey(detail.header.id, "fabric")') && sources.experience.includes('materialCacheKey(detail.header.id, "accessory")')}`,
      "fabric and accessory do not share the same material view/controller path",
    ),
    sourceCheck(
      "failure-conflict-restore",
      "실패 복원과 conflict 최신값 refresh 경계가 유지된다",
      sources.controlledInline.includes("activationValue: activationValueRef.current")
        && sources.controlledInline.includes("if (!decision.changed)")
        && sources.experience.includes("await refreshInlineMaterial(error.entityVersion)")
        && sources.experience.includes("rollbackInlineMaterial()"),
      "unchanged activation equality, conflict refresh, and rollback paths present",
      "unchanged, rollback, or conflict-refresh boundary is missing",
    ),
  ];

  return {
    passed: subchecks.every((check) => check.passed),
    subchecks,
    failureKeys: subchecks.filter((check) => !check.passed).map((check) => check.key),
  };
}

export function serializeMutationObservation(input) {
  if (input.observed) {
    if (!Number.isSafeInteger(input.count) || input.count < 0) {
      throw new TypeError("observed mutation evidence requires a non-negative count");
    }
    return { status: "OBSERVED", count: input.count };
  }
  if (typeof input.reason !== "string" || input.reason.trim().length === 0) {
    throw new TypeError("NOT_OBSERVED mutation evidence requires a reason");
  }
  return {
    status: "NOT_OBSERVED",
    count: null,
    reason: input.reason,
  };
}

export function serializeRuntimeResult(output) {
  return `${JSON.stringify(output, null, 2)}\n`;
}
