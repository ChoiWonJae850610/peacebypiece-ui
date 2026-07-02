#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const signup = read("components/signup/SignupApplicationDashboard.tsx");
const companyFiles = read("components/admin/settings/AdminCompanyFilesPanel.tsx");
const companyFileRoute = read("app/api/admin/company-files/file/route.ts");
const companyFileRepo = read("lib/admin/settings/companyFileRepository.ts");
const systemCatalog = read("app/(system)/system/catalog/page.tsx");
const sizePanel = read("components/workorder/detail/WorkOrderSizeSpecPanel.tsx");

for (const token of [
  "7일 무료로",
  "WAFL을 시작하세요",
  "Google로 가입 신청하기",
  "가입 신청 제출",
  "Lite",
  "Flow",
  "Studio",
  "부가세 포함",
  "이용약관",
  "개인정보처리방침",
  "보기",
  "role=\"dialog\"",
  "uploadCertificate(file)",
  "saveApplicationDraft()",
]) {
  assert.ok(signup.includes(token), `signup UX missing ${token}`);
}

for (const forbidden of [
  "임시 저장",
  "상태 새로고침",
  "payment readiness",
  "fake readiness",
  "consent evidence",
  "raw error",
  "signed URL",
]) {
  assert.ok(!signup.includes(forbidden), `signup customer copy leaks ${forbidden}`);
}

assert.match(signup, /disabled=\{isBusy \|\| !companyInfoValid\}/, "certificate selection must wait for required company info");
assert.doesNotMatch(signup, /\{policy\.policyCode\}|\{policy\.policyVersion\}/, "signup must not render raw policy code/version");

for (const token of [
  "파일 관리",
  "파일 업로드 준비가 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.",
  "getActiveCompanyFileById",
  "fileId",
]) {
  assert.ok(`${companyFiles}\n${companyFileRoute}\n${companyFileRepo}`.includes(token), `company file cleanup missing ${token}`);
}

for (const forbidden of [
  "R2 업로드 연결",
  "DB/API",
  "storageKey: preparePayload.file.storageKey",
  "uploadTarget",
  "new URLSearchParams({ key })",
]) {
  assert.ok(!companyFiles.includes(forbidden), `company file UI/log leaks ${forbidden}`);
}
assert.match(companyFileRoute, /getActiveCompanyFileById/);
assert.match(companyFileRoute, /file\?\.storageKey/);
assert.doesNotMatch(companyFileRoute, /searchParams\.get\("key"\)/);

for (const token of [
  "기준관리",
  "생산품 분류·사이즈·치수",
  "기본 치수표",
  "생산품 분류",
  "사이즈 체계",
  "측정 항목",
]) {
  assert.ok(systemCatalog.includes(token), `system catalog missing ${token}`);
}
assert.doesNotMatch(systemCatalog, /provisioning|fake readiness|DB\/API/i);

for (const token of [
  "작업지시서 치수",
  "치수 입력 및 수정",
  "작업지시서 출력",
  "role=\"dialog\"",
  "inchFractions",
  "1/8",
  "7/8",
  "평면 단면",
  "둘레",
  "패턴 1/4 기준",
  "kind: \"auto\"",
]) {
  assert.ok(sizePanel.includes(token), `workorder size panel missing ${token}`);
}
assert.doesNotMatch(sizePanel, /aria-label="미완성 PDF"|aria-label="최종 PDF"|signedUrl|storageKey/);

console.log("customer product UX 0.24.34.2 contract: PASS");
