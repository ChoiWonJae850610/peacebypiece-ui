#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/system/signupReviewRepository.ts", "utf8");
const consentPolicy = fs.readFileSync("lib/signup/signupConsentPolicy.ts", "utf8");
const listView = fs.readFileSync("components/system/signup/SystemSignupReviewListView.tsx", "utf8");
const detailView = fs.readFileSync("components/system/signup/SystemSignupReviewDetailView.tsx", "utf8");

assert.match(repository, /import \{ createHash \} from "node:crypto"/, "review evidence must use Node SHA-256");
assert.match(repository, /SIGNUP_REQUIRED_CONSENT_POLICIES/, "review evidence must reuse canonical consent policy definitions");
assert.match(repository, /row\.email_verified === true/, "email_verified must be derived from the DB value");
assert.doesNotMatch(repository, /emailVerified:\s*true|googleEmailVerified:\s*true/, "email_verified must not be hardcoded true");
assert.match(repository, /emailVerified: boolean/, "emailVerified type must be boolean");
assert.match(repository, /googleEmailVerified: boolean/, "googleEmailVerified type must be boolean");

assert.match(repository, /createHash\("sha256"\)\.update\(normalized, "utf8"\)\.digest\("hex"\)\.slice\(0, 16\)/, "Google subject fingerprint must be deterministic SHA-256 16 hex");
assert.doesNotMatch(repository, /hash = \(hash \* 31|>>>\s*0|padStart\(8/, "32-bit rolling hash must not remain");
assert.match(repository, /if \(!normalized\) return "unavailable"/, "empty Google sub must be handled safely");
assert.doesNotMatch(repository + detailView, /google_sub\s+AS|googleSub\s*:|raw Google sub/i, "raw Google sub must not be exposed");

assert.match(repository, /requiredConsentTypesPresent/, "review response must expose required consent type presence");
assert.match(repository, /requiredConsentVersionsCurrent/, "review response must expose current-version status");
assert.match(repository, /requiredConsentsComplete: requiredConsentTypesPresent && requiredConsentVersionsCurrent/, "complete must require both type presence and current versions");
assert.match(repository, /policy_code, consent\.policy_version\) IN \([\s\S]*VALUES \$\{CURRENT_CONSENT_POLICY_VALUES_SQL\}/, "current policy eligibility must check type/code/version, not count only");
assert.match(repository, /consent\.revoked_at IS NULL[\s\S]*CURRENT_CONSENT_POLICY_VALUES_SQL/, "revoked consent must not count as current");
assert.match(consentPolicy, /policyCode: "wafl_terms_of_service"[\s\S]*policyVersion: "0\.24\.26"/, "terms policy must define canonical code/version");
assert.match(consentPolicy, /policyCode: "wafl_privacy_policy"[\s\S]*policyVersion: "0\.24\.26"/, "privacy policy must define canonical code/version");

assert.match(listView, /버전 불일치/, "list UI must show old-version consent state");
assert.match(detailView, /Google email_verified가 false입니다/, "detail UI must clearly show false email_verified state");
assert.match(detailView, /필수 동의 종류 충족/, "detail UI must show required consent type presence");
assert.match(detailView, /현재 정책 버전 충족/, "detail UI must show current policy version status");
assert.match(detailView, /전체 검토 조건 충족/, "detail UI must show full consent eligibility");

console.log("signup review evidence contract: OK");
