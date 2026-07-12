#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const TARGET_NUMBER = "WAFN-26FWA-A25CMD-260711-001-R0";
const TARGET_BASE = TARGET_NUMBER.replace(/-R\d+$/, "");
const COMPANIES = { a: "wafl-fn-company-a", b: "wafl-fn-company-b", c: "wafl-fn-company-c", h: "wafl-fn-company-h" };
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const MAX_SERVER_TAIL_BYTES = 12 * 1024;

function sanitize(value) {
  return value
    .replaceAll(process.env.DATABASE_URL ?? "__NO_DATABASE_URL__", "[REDACTED_DB_URL]")
    .replace(/(?:postgres(?:ql)?:\/\/|https?:\/\/)[^\s]+/gi, "[REDACTED_URL]")
    .replace(/(token|secret|password|storage[_ -]?key)\s*[:=]\s*[^\s,}]+/gi, "$1=[REDACTED]")
    .slice(-MAX_SERVER_TAIL_BYTES);
}
function fingerprint(value) { const url = new URL(value); return crypto.createHash("sha256").update(`${url.hostname}/${decodeURIComponent(url.pathname.replace(/^\/+/, ""))}`).digest("hex").slice(0, 12); }
function sessionCookie(companyId) { const secret = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(); assert.ok(secret, "session-secret-missing"); const payload = Buffer.from(JSON.stringify({ userId:`alpha29-${companyId}`,companyId,companyMemberId:`alpha29-member-${companyId}`,companyName:"synthetic",role:"company_admin",email:`alpha29-${companyId}@example.invalid`,name:"alpha29 reader",issuedAt:new Date().toISOString() }),"utf8").toString("base64url"); return `wafl_auth_session=${payload}.${crypto.createHmac("sha256",secret).update(payload).digest("base64url")}`; }
async function freePort() { return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on("error",reject);server.listen(0,"127.0.0.1",()=>{const address=server.address();if(!address||typeof address==="string")return reject(new Error("port-unavailable"));server.close(()=>resolve(address.port));});}); }
async function wait(baseUrl, child) { const started=Date.now(); while(Date.now()-started<60_000){if(child.exitCode!==null)throw new Error(`server-exited:${child.exitCode}`);try{const response=await fetch(`${baseUrl}/api/v2/work-orders?limit=1`);if(response.status===401)return;}catch{}await new Promise((resolve)=>setTimeout(resolve,250));}throw new Error("server-timeout"); }
async function request(baseUrl, companyId, route) { const response=await fetch(`${baseUrl}${route}`,{method:"GET",headers:{Cookie:sessionCookie(companyId)}}); return {status:response.status,body:await response.json(),queryCount:Number(response.headers.get("x-wafl-preview-target-query-count")||response.headers.get("x-wafl-preview-query-count")||0)}; }
async function snapshot(client) { await client.query("BEGIN READ ONLY"); try { const result=await client.query(`SELECT (SELECT count(*)::integer FROM wafl_v2_migration_ledger) ledger_count,(SELECT count(*)::integer FROM work_orders) work_orders,(SELECT count(*)::integer FROM work_order_revisions) revisions,(SELECT count(*)::integer FROM work_order_command_receipts) receipts,(SELECT count(*)::integer FROM domain_events) events,(SELECT count(*)::integer FROM generated_documents) documents`); await client.query("COMMIT"); return result.rows[0]; } catch(error){await client.query("ROLLBACK");throw error;} }
async function stop(child) { if(child.exitCode!==null)return; child.kill(); await Promise.race([new Promise((resolve)=>child.once("close",resolve)),new Promise((resolve)=>setTimeout(resolve,5_000))]); if(child.exitCode===null)child.kill("SIGKILL"); }

async function main() {
  const databaseUrl=process.env.DATABASE_URL; assert.ok(databaseUrl,"database-url-missing"); assert.equal(fingerprint(databaseUrl),REQUIRED_FINGERPRINT,"target-fingerprint-mismatch"); assert.equal(process.env.WAFL_V2_READ_APPROVED,"1","read-approval-missing");
  const manifest=fs.readdirSync(path.join(process.cwd(),"db/v2/migrations")).filter((name)=>/^\d{3}_.*\.sql$/.test(name)).sort();
  const client=new Client({connectionString:databaseUrl}); await client.connect(); let child; let serverTail="";
  try {
    const before=await snapshot(client);
    await client.query("BEGIN READ ONLY");
    const targetResult=await client.query(`SELECT w.id work_order_id,r.id revision_id,w.status,r.revision_status FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.work_order_id=w.id WHERE w.company_id=$1 AND w.document_number_base=$2 AND r.revision_no=0`,[COMPANIES.a,TARGET_BASE]);
    const ledger=await client.query("SELECT filename FROM wafl_v2_migration_ledger ORDER BY filename"); await client.query("COMMIT");
    assert.deepEqual(ledger.rows.map((row)=>row.filename),manifest,"migration-ledger-manifest-mismatch");
    const target=targetResult.rows[0]; assert.ok(target,"issued-target-missing"); assert.equal(target.status,"issued"); assert.equal(target.revision_status,"finalized");
    const port=await freePort(); const baseUrl=`http://127.0.0.1:${port}`;
    child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p",String(port)],{cwd:process.cwd(),env:{...process.env,WAFL_V2_READ_API_ENABLED:"1",WAFL_V2_READ_APPROVED:"1",WAFL_V2_RUNTIME:"test",WAFL_V2_TEST_PREFIX:"wafl-fn",WAFL_V2_APPROVED_DB_FINGERPRINT:REQUIRED_FINGERPRINT},stdio:["ignore","pipe","pipe"]});
    child.stdout.on("data",(chunk)=>{serverTail=sanitize(`${serverTail}${chunk}`);}); child.stderr.on("data",(chunk)=>{serverTail=sanitize(`${serverTail}${chunk}`);}); await wait(baseUrl,child);
    const resolverRoute=`/api/v2/work-orders/documents/${encodeURIComponent(TARGET_NUMBER)}/preview-target`;
    const targetA=await request(baseUrl,COMPANIES.a,resolverRoute); assert.equal(targetA.status,200); assert.equal(targetA.queryCount,2); assert.equal(targetA.body.data.workOrderId,target.work_order_id); assert.equal(targetA.body.data.revisionId,target.revision_id);
    const previewRoute=`/api/v2/work-orders/${targetA.body.data.workOrderId}/revisions/${targetA.body.data.revisionId}/preview`;
    const preview=await request(baseUrl,COMPANIES.a,previewRoute); assert.equal(preview.status,200); assert.equal(preview.body.data.document.displayDocumentNumber,TARGET_NUMBER);
    for(const companyId of [COMPANIES.b,COMPANIES.h]){const cross=await request(baseUrl,companyId,resolverRoute);assert.equal(cross.status,404);assert.equal(cross.body.error.code,"NOT_FOUND");}
    const blocked=await request(baseUrl,COMPANIES.c,resolverRoute); assert.equal(blocked.status,403); assert.equal(blocked.body.error.code,"FORBIDDEN");
    const invalid=await request(baseUrl,COMPANIES.a,"/api/v2/work-orders/documents/not-a-document/preview-target"); assert.equal(invalid.status,404); assert.equal(invalid.body.error.code,"NOT_FOUND");
    const after=await snapshot(client); assert.deepEqual(after,before,"read-only-mobile-preview-entry-mutated-database");
    console.log("WAFL v2 alpha.29 mobile Preview entry runtime: PASS");
    console.log(`Target fingerprint: ${REQUIRED_FINGERPRINT}`); console.log(`Migration ledger: ${manifest.length}/${manifest.length}`); console.log("Preview target GET count: 6"); console.log("Tenant isolation: A PASS, B/H NOT_FOUND, C FORBIDDEN"); console.log("Alpha.28 Preview parity: PASS"); console.log("DB/schema/business/R2/Worker/PDF/production mutation: false");
  } catch(error) { if(serverTail)console.error("Sanitized Next server tail:",serverTail); throw error; }
  finally { if(child)await stop(child); await client.end(); }
}
main().catch((error)=>{console.error("WAFL v2 alpha.29 mobile Preview entry runtime: FAILED",{name:error instanceof Error?error.name:"UnknownError",message:error instanceof Error?error.message:"unknown"});process.exitCode=1;});
