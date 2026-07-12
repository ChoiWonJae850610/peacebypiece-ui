#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import pg from "pg";

const { Client } = pg;
const TARGET_NUMBER = "WAFN-26FWA-A25CMD-260711-001-R0";
const TARGET_BASE = TARGET_NUMBER.replace(/-R\d+$/, "");
const COMPANIES = { a: "wafl-fn-company-a", b: "wafl-fn-company-b", c: "wafl-fn-company-c", h: "wafl-fn-company-h" };
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const GET = "GET";
const MAX_SERVER_TAIL_BYTES = 12 * 1024;

function sanitizeServerTail(value) {
  return value
    .replaceAll(process.env.DATABASE_URL ?? "__NO_DATABASE_URL__", "[REDACTED_DB_URL]")
    .replace(/(?:postgres(?:ql)?:\/\/|https?:\/\/)[^\s]+/gi, "[REDACTED_URL]")
    .replace(/(token|secret|password|storage[_ -]?key)\s*[:=]\s*[^\s,}]+/gi, "$1=[REDACTED]")
    .slice(-MAX_SERVER_TAIL_BYTES);
}

function appendTail(current, chunk) {
  return sanitizeServerTail(`${current}${String(chunk)}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return { forced: false, exitCode: child.exitCode };
  const closed = new Promise((resolve) => child.once("close", (exitCode) => resolve({ forced: false, exitCode })));
  child.kill();
  const timeout = new Promise((resolve) => setTimeout(() => {
    if (child.exitCode === null) child.kill("SIGKILL");
    resolve({ forced: true, exitCode: child.exitCode });
  }, 5_000));
  return Promise.race([closed, timeout]);
}

function fingerprint(url) { const parsed = new URL(url); return crypto.createHash("sha256").update(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).digest("hex").slice(0, 12); }
function sessionCookie(companyId) { const secret = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(); assert.ok(secret, "session-secret-missing"); const payload = Buffer.from(JSON.stringify({ userId:`alpha28-${companyId}`,companyId,companyMemberId:`alpha28-member-${companyId}`,companyName:"synthetic",role:"company_admin",email:`alpha28-${companyId}@example.invalid`,name:"alpha28 reader",issuedAt:new Date().toISOString() }),"utf8").toString("base64url"); return `wafl_auth_session=${payload}.${crypto.createHmac("sha256",secret).update(payload).digest("base64url")}`; }
async function freePort() { return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on("error",reject);server.listen(0,"127.0.0.1",()=>{const address=server.address();if(!address||typeof address==="string") return reject(new Error("port-unavailable"));server.close(()=>resolve(address.port));});}); }
async function wait(baseUrl, child) { const start=Date.now(); while(Date.now()-start<60000){ if(child.exitCode!==null) throw new Error(`server-exited:${child.exitCode}`); try{const response=await fetch(`${baseUrl}/api/v2/work-orders?limit=1`);if(response.status===401)return;}catch{} await new Promise((r)=>setTimeout(r,250));} throw new Error("server-timeout"); }
async function request(baseUrl, companyId, targetPath) { const started=performance.now(); const response=await fetch(`${baseUrl}${targetPath}`,{method:GET,headers:{Cookie:sessionCookie(companyId)}}); const body=await response.json(); return {status:response.status,body,bytes:Buffer.byteLength(JSON.stringify(body)),apiMs:Number((performance.now()-started).toFixed(2)),dbMs:Number(response.headers.get("x-wafl-preview-db-ms")||0),queryCount:Number(response.headers.get("x-wafl-preview-query-count")||0)}; }
function safe(value) { const source=JSON.stringify(value).toLowerCase(); for(const token of ["storage_object_key","thumbnail_object_key","token_hash","rawtoken","signedurl","snapshot"]) assert.equal(source.includes(token),false,`forbidden payload token:${token}`); }
async function snapshot(client) { await client.query("BEGIN READ ONLY"); try { const result=await client.query(`SELECT (SELECT count(*)::integer FROM wafl_v2_migration_ledger) ledger_count,(SELECT count(*)::integer FROM work_orders) work_orders,(SELECT count(*)::integer FROM work_order_revisions) revisions,(SELECT count(*)::integer FROM work_order_command_receipts) receipts,(SELECT count(*)::integer FROM domain_events) events,(SELECT count(*)::integer FROM generated_documents) documents`); await client.query("COMMIT"); return result.rows[0]; } catch(error){await client.query("ROLLBACK");throw error;} }

async function main(){
  const url=process.env.DATABASE_URL; assert.ok(url,"database-url-missing"); assert.equal(fingerprint(url),REQUIRED_FINGERPRINT,"target-fingerprint-mismatch"); assert.equal(process.env.WAFL_V2_READ_APPROVED,"1","read-approval-missing");
  const manifest=fs.readdirSync(path.join(process.cwd(),"db/v2/migrations")).filter((name)=>/^\d{3}_.*\.sql$/.test(name)).sort();
  const client=new Client({connectionString:url}); await client.connect();
  let child;
  let serverStdoutTail = "";
  let serverStderrTail = "";
  try{
    const before=await snapshot(client);
    await client.query("BEGIN READ ONLY");
    const targetResult=await client.query(`SELECT w.id work_order_id,r.id revision_id,w.entity_version work_order_version,r.entity_version revision_version,w.status,r.revision_status FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.work_order_id=w.id WHERE w.company_id=$1 AND w.document_number_base=$2 AND r.revision_no=0`,[COMPANIES.a,TARGET_BASE]);
    const draftResult=await client.query(`SELECT w.id work_order_id,r.id revision_id FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.work_order_id=w.id WHERE w.company_id=$1 AND w.status='draft' AND r.revision_status='draft' ORDER BY w.created_at LIMIT 1`,[COMPANIES.a]);
    const ledger=await client.query("SELECT filename FROM wafl_v2_migration_ledger ORDER BY filename"); await client.query("COMMIT");
    assert.deepEqual(ledger.rows.map((row)=>row.filename),manifest,"migration-ledger-manifest-mismatch");
    const target=targetResult.rows[0]; assert.ok(target,"issued-target-missing"); assert.equal(target.status,"issued"); assert.equal(target.revision_status,"finalized"); assert.equal(Number(target.work_order_version),15); assert.equal(Number(target.revision_version),15);
    const port=await freePort(); const baseUrl=`http://127.0.0.1:${port}`;
    child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p",String(port)],{cwd:process.cwd(),env:{...process.env,WAFL_V2_READ_API_ENABLED:"1",WAFL_V2_READ_APPROVED:"1",WAFL_V2_RUNTIME:"test",WAFL_V2_TEST_PREFIX:"wafl-fn",WAFL_V2_APPROVED_DB_FINGERPRINT:REQUIRED_FINGERPRINT},stdio:["ignore","pipe","pipe"]});
    child.stdout.on("data", (chunk) => { serverStdoutTail = appendTail(serverStdoutTail, chunk); });
    child.stderr.on("data", (chunk) => { serverStderrTail = appendTail(serverStderrTail, chunk); });
    await wait(baseUrl,child);
    const routePath=`/api/v2/work-orders/${target.work_order_id}/revisions/${target.revision_id}/preview`;
    const first=await request(baseUrl,COMPANIES.a,routePath); const second=await request(baseUrl,COMPANIES.a,routePath);
    assert.equal(first.status,200); assert.deepEqual(first.body,second.body,"repeated-preview-not-deterministic"); assert.equal(first.body.data.document.displayDocumentNumber,TARGET_NUMBER); assert.equal(first.body.data.header.workOrderId,target.work_order_id); assert.equal(first.body.data.header.revisionId,target.revision_id); assert.equal(first.body.data.materials.fabrics.length,2); assert.equal(first.body.data.materials.accessories.length,1); assert.deepEqual(first.body.data.layoutMetadata.sectionOrder,["basic","assets","fabrics","accessories","sizeColor","sizeSpec","processes","memo","issue"]); assert.equal(first.queryCount,9); assert.ok(first.bytes<=300*1024,"preview-payload-over-budget"); safe(first.body);
    for(const companyId of [COMPANIES.b,COMPANIES.h]){const cross=await request(baseUrl,companyId,routePath);assert.equal(cross.status,404);assert.equal(cross.body.error.code,"NOT_FOUND");}
    const blocked=await request(baseUrl,COMPANIES.c,routePath); assert.equal(blocked.status,403); assert.equal(blocked.body.error.code,"FORBIDDEN");
    if(draftResult.rows[0]){const draft=draftResult.rows[0];const result=await request(baseUrl,COMPANIES.a,`/api/v2/work-orders/${draft.work_order_id}/revisions/${draft.revision_id}/preview`);assert.equal(result.status,409);assert.equal(result.body.error.code,"DOCUMENT_NOT_READY");}
    const after=await snapshot(client); assert.deepEqual(after,before,"read-only-preview-mutated-database");
    console.log("WAFL v2 alpha.28 issued preview runtime: PASS");
    console.log(`Target fingerprint: ${REQUIRED_FINGERPRINT}`); console.log(`Migration ledger: ${manifest.length}/${manifest.length}`); console.log(`Preview GET count: ${draftResult.rows[0]?6:5}`); console.log(`Query count: ${first.queryCount}`); console.log(`Payload bytes: ${first.bytes}`); console.log(`DB ms: ${first.dbMs}`); console.log(`API ms: ${first.apiMs}`); console.log("Tenant isolation: A PASS, B/H NOT_FOUND, C FORBIDDEN"); console.log("Immutable repeat GET: PASS"); console.log("DB/schema/business/R2/Worker/PDF/production mutation: false");
  } catch (error) {
    if (serverStderrTail) console.error("Sanitized Next stderr tail:", serverStderrTail);
    else if (serverStdoutTail) console.error("Sanitized Next stdout tail:", serverStdoutTail);
    throw error;
  } finally { if(child) await stopServer(child); await client.end(); }
}
main().catch((error)=>{console.error("WAFL v2 alpha.28 issued preview runtime: FAILED",{name:error instanceof Error?error.name:"UnknownError",message:error instanceof Error?error.message:"unknown"});process.exitCode=1;});
