#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { isMakerQaCapabilityEnabled, MAKER_QA_APPROVAL, MAKER_QA_CAPABILITY, MAKER_QA_PROFILE, resolveMakerQaProfile } from "../lib/external-qa/makerQaCapabilities.mjs";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const read=(path)=>fs.readFileSync(path,"utf8");
const ui=read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const overview=read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const repository=read("lib/domain/work-orders/command/processCommandRepository.ts");
const validation=read("lib/domain/work-orders/command/processValidation.ts");
const options=read("lib/domain/work-orders/read/productionOptionsRepository.ts");
const basic=read("lib/domain/work-orders/command/commandRepository.ts");
const sizeColor=read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const policy=read("lib/domain/work-orders/productionProcessPolicy.ts");

assert.match(overview,/WorkOrderProductionAuthoring/u);
assert.doesNotMatch(ui,/제작 흐름|현재 제작 단계와 등록된 세부 공정을 읽기 전용/u);
assert.match(ui,/production-category-switch/u);
assert.match(ui,/label: "기본 공정", count: factory \? 1 : 0/u);
assert.match(ui,/label: "추가 공정", count: additional\.length/u);
assert.match(ui,/container: \{ gap: WAFL_THEME\.layout\.sectionGap, paddingBottom: WAFL_THEME\.layout\.sectionGapLarge \}/u,"Production must not add a local outer inset");
for(const shared of ["ControlledInlineEditValue","WaflReelPickerSheet","WaflSectionHeaderAction","createSerializedMutationQueue"])assert.match(ui,new RegExp(shared));
assert.doesNotMatch(ui,/WaflInputSheet|WaflSheetValueField/u);
assert.match(ui,/useWaflNestedSheetHandoff/u);
assert.doesNotMatch(ui,/예상 공임/u);
assert.match(ui,/expanded \? <WaflCompactEntityExpanded>\{inlineField\(process, "memo", "메모", WAFL_UNSET_PLACEHOLDER\)\}/u);
assert.match(ui,/commitMode="blur-submit"/u);
assert.doesNotMatch(ui,/예상 공임|수량 입력|로스 비용|납기|적용부위|적용색상/u);

assert.match(policy,/WORK_ORDER_FACTORY_PROCESS_CODE = "production_factory"/u);
assert.match(repository,/factory_exists/u);
assert.match(repository,/status='ready'/u);
assert.match(repository,/work_order_command_receipts/u);
assert.match(repository,/domain_events/u);
assert.match(repository,/round\(\$8::numeric\*\$10::numeric,2\)/u);
assert.match(repository,/process_total=t\.total,estimated_total=r\.fabric_total\+r\.accessory_total\+t\.total/u);
assert.doesNotMatch(validation,/quantity|amount|dueDate|applicationArea|applicationColorTarget/u,"client-authoritative projection fields must be rejected");
assert.match(options,/company_enabled_process_standards/u);
assert.match(options,/item_type='factory'/u);
assert.match(options,/item_type='outsourcing'/u);
assert.match(options,/p\.company_id=\$1/u);
assert.match(basic,/UPDATE work_order_processes[\s\S]*amount = round\(\$3::numeric \* unit_price, 2\)/u);
assert.match(sizeColor,/updated_processes AS[\s\S]*quantity = \$6::numeric[\s\S]*process_total = totals\.total/u);

const env={WAFL_SERVER_RUNTIME_MODE:"dev",WAFL_V2_COMMAND_API_ENABLED:"1",WAFL_V2_COMMAND_MUTATION_APPROVED:MAKER_QA_APPROVAL.ALPHA65_CURRENT,WAFL_EXTERNAL_QA_ALPHA65_PRODUCTION_AUTHORING_MUTATION_ENABLED:"true",WAFL_V2_DOCUMENT_VIEWER_ENABLED:"1",WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED:MAKER_QA_APPROVAL.ALPHA65_CURRENT};
assert.equal(resolveMakerQaProfile(env)?.id,MAKER_QA_PROFILE.ALPHA65_CURRENT);
assert.equal(isMakerQaCapabilityEnabled(env,MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING),true);
const uuid="10000000-0000-4000-8000-000000000001";
for(const [path,method] of [[`/api/v2/work-orders/${uuid}/production-options`,"GET"],[`/api/v2/work-orders/${uuid}/processes`,"POST"],[`/api/v2/work-orders/${uuid}/processes/${uuid}`,"PATCH"],[`/api/v2/work-orders/${uuid}/processes/${uuid}`,"DELETE"]])assert.equal(isTailscaleServePathAllowed(path,method,env),true,`${method} ${path}`);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${uuid}/processes`,"POST",{...env,WAFL_SERVER_RUNTIME_MODE:"production"}),false);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_production_authoring.sql"),false);

console.log(JSON.stringify({contract:"workorder-v2-alpha65-production-factory-process-authoring",previousPermanentInventoryRetained:138,addedPermanentChecks:1,finalPermanentInventory:139,migrationLedger:"18/18",productionMutation:0}));
