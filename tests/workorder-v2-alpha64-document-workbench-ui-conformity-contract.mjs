import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const picker = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");

const orderedOwners = [
  'testID="document-workbench"',
  'testID="document-production-overview"',
  'testID="document-attachment-selection"',
  'testID="document-action-cluster"',
  'testID="document-secondary-controls"',
];
let previousIndex = -1;
for (const owner of orderedOwners) {
  const index = workbench.indexOf(owner);
  assert.ok(index > previousIndex, `document workbench semantic owner order: ${owner}`);
  previousIndex = index;
}

for (const token of [
  "첨부 자료",
  "문서 첨부",
  "작업지시서 생성",
  "작업지시서를 생성할까요?",
  "현재 제작 정보가 작업지시서로 확정되며, 이 R0은 생성 후 수정할 수 없습니다.",
  "보기",
  "공유",
  "저장",
  "공유·QR 관리",
]) assert.match(workbench, new RegExp(token), `document workbench copy: ${token}`);

for (const realField of [
  "detail.header.productName",
  "detail.header.representativeImage",
  "detail.header.totalQuantity",
  "detail.header.dueDate",
  "detail.tabCounts.fabric",
  "detail.tabCounts.accessory",
  "detail.revision.factoryDeliveryMemo",
]) assert.match(workbench, new RegExp(realField.replaceAll(".", "\\.")), `real production overview field: ${realField}`);

for (const apiOwner of [
  "getWorkOrderDocuments",
  "issueWorkOrderR0",
  "generateWorkOrderR0",
  "setAttachmentOutputInclude",
  "createDocumentShare",
  "listDocumentAccessTokens",
  "revokeDocumentAccessToken",
]) assert.match(workbench, new RegExp(`\\b${apiOwner}\\b`), `real document API retained: ${apiOwner}`);

for (const sharedOwner of [
  'from "@/constants/fonts"',
  'from "@/constants/theme"',
  'from "@/features/inputs/WaflInputSheet"',
  'from "@/features/inputs/WaflChoiceButtons"',
  'from "@/features/inputs/WaflActionTile"',
  'from "@/lib/displayPlaceholder"',
]) assert.match(workbench, new RegExp(sharedOwner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `shared WAFL owner: ${sharedOwner}`);

assert.match(workbench, /marginHorizontal: WAFL_THEME\.spacing\.md/);
assert.match(workbench, /borderRadius: WAFL_THEME\.radius\.card/);
assert.match(workbench, /borderWidth: WAFL_THEME\.border\.hairline/);
assert.match(workbench, /fontSize: WAFL_THEME\.typography\.title/);
assert.match(workbench, /minHeight: 44/);
assert.match(workbench, /selectedDays[^\n]*"7"/);
assert.match(workbench, /SUPPORTED_OUTPUT_IMAGE/);
assert.match(workbench, /WAFL_UNSET_PLACEHOLDER/);
assert.match(workbench, /label="공장" placeholder/);

assert.doesNotMatch(workbench, /document-business-list|document-included-summary|includedInformation|styles\.infoChip/);
assert.doesNotMatch(workbench, /제작 정보를 확정해 출력하고 안전하게 전달합니다|발행 전 확인|확정하고 문서 만들기|작업 내용을 확정할까요/);
assert.doesNotMatch(workbench, /<InfoRow label="(?:문서 번호|문서 버전|문서 상태|사이즈·색상|원단·부자재)"/);
assert.doesNotMatch(workbench, /workOrderKind|orderType|reorderRound/);
assert.doesNotMatch(workbench, /ProductionCardMock|mockProductionCard|배송요청/);
assert.match(workbench, /QuickDeliveryFoundation/);
assert.doesNotMatch(workbench, /detail\.amounts\.(?:unitPrice|estimatedTotal|fabricTotal|accessoryTotal|processTotal)/);

assert.match(picker, /<WaflInputModeSwitch[\s\S]*mode=\{state\.mode === "reel" \? "picker" : "direct"\}/);
assert.doesNotMatch(picker, /릴로 선택|릴 선택|릴 피커로 입력/);
assert.match(picker, /resolveWaflPickerRenderPath\(kind, state\.mode\)/);
assert.match(picker, /dispatch\(\{ type: "set-mode", mode: nextMode \}\)/);

assert.match(overview, /\{ id: "output", label: "문서"/);
assert.doesNotMatch(overview, /const locked = tab\.id === "flow"/);
assert.match(overview, /tab\.id === "output"[\s\S]*openSection\("output"\)/);
assert.match(overview, /activeSection === "output"[\s\S]*<WorkOrderDocumentWorkbench/);

console.log("workorder-v2-alpha64-document-workbench-ui-conformity-contract: PASS");
