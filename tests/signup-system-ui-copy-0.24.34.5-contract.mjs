#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const publicSignup = read("app/(public)/signup/page.tsx");
const listView = read("components/system/signup/SystemSignupReviewListView.tsx");
const detailView = read("components/system/signup/SystemSignupReviewDetailView.tsx");
const detailActions = read("components/system/signup/SystemSignupReviewDetailActions.tsx");

for (const token of [
  "WAFL 검토와 승인 후 Trial이 시작됩니다",
  "카드 번호는 WAFL에 저장하지 않습니다",
  "Google로 가입 신청 시작",
  "공개 가입은 신규 회사 Trial 신청 전용입니다",
]) {
  assert.ok(publicSignup.includes(token), `public signup copy missing ${token}`);
}

for (const forbidden of [
  "system-admin",
  "fake readiness",
  "dev/test",
  "consent evidence",
  "readiness가",
  "PG payload",
]) {
  assert.ok(!publicSignup.includes(forbidden), `public signup copy exposes ${forbidden}`);
}

for (const token of [
  "가입 신청 검토",
  "결제수단 미준비",
  "승인 실패",
  "승인 준비 상태",
  "승인 실행 계획",
  "카드번호, CVC, 원본 결제 응답은 저장하거나 표시하지 않습니다",
]) {
  const source = `${listView}\n${detailView}\n${detailActions}`;
  assert.ok(source.includes(token), `system signup UI copy missing ${token}`);
}

for (const forbidden of [
  "fake readiness",
  "Provisioning plan:",
  "compare-and-set",
  "Google subject fingerprint",
  "provider-neutral",
  "dev/test 승인 실행 gate",
]) {
  const source = `${listView}\n${detailView}\n${detailActions}`;
  assert.ok(!source.includes(forbidden), `system signup UI exposes ${forbidden}`);
}

console.log("signup/system UI copy 0.24.34.5 contract: PASS");
