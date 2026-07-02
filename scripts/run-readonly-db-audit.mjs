import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;
const mode = process.argv[2] ?? '';
const files = {
  reconciliation: 'db/audits/0.24.21.11-reconciliation-readonly.sql',
  constraints: 'db/audits/0.24.21.12-constraint-readiness-readonly.sql',
  indexes: 'db/audits/0.24.21.12-index-readiness-readonly.sql',
  'signup-compatibility': 'db/audits/0.24.26-signup-migration-compatibility-readonly.sql',
  'signup-post-apply': 'db/audits/0.24.26-signup-post-apply-schema-readonly.sql',
  'signup-consents-compatibility': 'db/audits/0.24.26-signup-consents-migration-compatibility-readonly.sql',
  'signup-consents-post-apply': 'db/audits/0.24.26-signup-consents-post-apply-schema-readonly.sql',
  'system-catalog-compatibility': 'db/audits/0.24.27-system-catalog-compatibility-readonly.sql',
  'system-catalog-post-apply': 'db/audits/0.24.27-system-catalog-post-apply-readonly.sql',
  'billing-compatibility': 'db/audits/0.24.32-billing-compatibility-readonly.sql',
  'billing-post-apply': 'db/audits/0.24.32-billing-post-apply-readonly.sql',
  'public-signup-e2e-compatibility': 'db/audits/0.24.33-public-signup-e2e-compatibility-readonly.sql',
  'public-signup-e2e-post-apply': 'db/audits/0.24.33-public-signup-e2e-post-apply-readonly.sql',
  'workorder-size-spec-compatibility': 'db/audits/0.24.34-workorder-size-spec-compatibility-readonly.sql',
  'workorder-size-spec-post-apply': 'db/audits/0.24.34-workorder-size-spec-post-apply-readonly.sql',
};
const sqlPath = files[mode];
const findingModes = new Set(['reconciliation', 'signup-compatibility', 'signup-post-apply', 'signup-consents-compatibility', 'signup-consents-post-apply', 'system-catalog-compatibility', 'system-catalog-post-apply', 'billing-compatibility', 'billing-post-apply', 'public-signup-e2e-compatibility', 'public-signup-e2e-post-apply', 'workorder-size-spec-compatibility', 'workorder-size-spec-post-apply']);
if (!sqlPath) throw new Error(`Unknown audit mode: ${mode}`);
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (process.env.WAFL_DB_AUDIT_APPROVED !== '1') throw new Error('Read-only audit guard approval is missing.');

const raw = await fs.readFile(path.resolve(sqlPath), 'utf8');
const withoutComments = raw.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const forbidden = /\b(insert|update|delete|merge|alter|drop|truncate|create|grant|revoke|comment|copy|call|do|vacuum|analyze|refresh|reindex|cluster|set)\b/i;
if (forbidden.test(withoutComments)) throw new Error(`Forbidden non-read-only SQL token detected: ${RegExp.$1}`);
const statements = withoutComments.split(';').map((s) => s.trim()).filter(Boolean);
if (!statements.length || statements.some((s) => !/^(select|with)\b/i.test(s))) {
  throw new Error('Every audit statement must start with SELECT or WITH.');
}

const client = new Client({ connectionString: process.env.DATABASE_URL, statement_timeout: 60000, query_timeout: 60000 });
await client.connect();
try {
  await client.query('BEGIN READ ONLY');
  console.log(`WAFL DB READ-ONLY AUDIT: ${mode}`);
  console.log(`Statements: ${statements.length}`);
  console.log('Mutation: none');
  let totalResultRows = 0;
  let totalReportedIssues = 0;
  for (let i = 0; i < statements.length; i += 1) {
    const result = await client.query(statements[i]);
    const count = result.rowCount ?? result.rows.length;
    totalResultRows += count;

    if (mode === 'constraints') {
      for (const row of result.rows) {
        const issueCount = Number.parseInt(String(row.issue_count ?? '0'), 10);
        if (!Number.isFinite(issueCount) || issueCount < 0) {
          throw new Error(`Invalid issue_count returned by constraint audit: ${row.issue_count}`);
        }
        totalReportedIssues += issueCount;
      }
    }

    console.log(`\n[${i + 1}] rows=${count}`);
    if (count > 0) console.log(JSON.stringify(result.rows.slice(0, 20), null, 2));
    if (count > 20) console.log(`... ${count - 20} more rows omitted`);
  }
  await client.query('ROLLBACK');
  console.log('Transaction: rolled back');
  console.log(`\nTotal result rows: ${totalResultRows}`);

  if (mode === 'constraints') {
    console.log(`Total reported issues: ${totalReportedIssues}`);
    console.log(`Result: ${totalReportedIssues > 0 ? 'FAIL' : 'PASS'}`);
    process.exitCode = totalReportedIssues > 0 ? 2 : 0;
  } else if (findingModes.has(mode)) {
    console.log(`Total compatibility findings: ${totalResultRows}`);
    console.log(`Result: ${totalResultRows > 0 ? 'FAIL' : 'PASS'}`);
    process.exitCode = totalResultRows > 0 ? 2 : 0;
  } else {
    console.log('Result: PASS');
    process.exitCode = 0;
  }
} catch (error) {
  try {
    await client.query('ROLLBACK');
    console.error('Transaction: rollback attempted');
  } catch {
    console.error('Transaction: rollback attempt failed');
  }
  throw error;
} finally {
  await client.end();
}
