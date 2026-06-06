#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const startedAt = new Date();

function log(message = '') {
  console.log(message);
}

function error(message = '') {
  console.error(message);
}

function resolveSqlFile(inputPath) {
  if (!inputPath || !String(inputPath).trim()) {
    return null;
  }

  const trimmed = String(inputPath).trim();
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
}

async function readSqlFile(filePath) {
  const stat = await fs.stat(filePath);

  if (!stat.isFile()) {
    throw new Error(`SQL path is not a file: ${filePath}`);
  }

  const content = await fs.readFile(filePath, 'utf8');

  if (!content.trim()) {
    throw new Error(`SQL file is empty: ${filePath}`);
  }

  return content;
}

async function createDbExecutor(databaseUrl) {
  const tried = [];

  try {
    const postgresModule = await import('postgres');
    const postgres = postgresModule.default;
    const sql = postgres(databaseUrl, { max: 1 });

    return {
      name: 'postgres',
      async execute(sqlText) {
        await sql.unsafe(sqlText);
      },
      async close() {
        await sql.end({ timeout: 5 });
      },
    };
  } catch (err) {
    tried.push(`postgres: ${err?.message ?? err}`);
  }

  try {
    const pgModule = await import('pg');
    const PgClient = pgModule.Client ?? pgModule.default?.Client;
    const client = new PgClient({ connectionString: databaseUrl });
    await client.connect();

    return {
      name: 'pg',
      async execute(sqlText) {
        await client.query(sqlText);
      },
      async close() {
        await client.end();
      },
    };
  } catch (err) {
    tried.push(`pg: ${err?.message ?? err}`);
  }

  try {
    const neonModule = await import('@neondatabase/serverless');

    if (typeof neonModule.neon === 'function') {
      const sql = neonModule.neon(databaseUrl);

      if (typeof sql.query === 'function') {
        return {
          name: '@neondatabase/serverless neon.query',
          async execute(sqlText) {
            await sql.query(sqlText);
          },
          async close() {},
        };
      }

      return {
        name: '@neondatabase/serverless neon',
        async execute(sqlText) {
          await sql(sqlText);
        },
        async close() {},
      };
    }

    if (typeof neonModule.Client === 'function') {
      const client = new neonModule.Client({ connectionString: databaseUrl });
      await client.connect();

      return {
        name: '@neondatabase/serverless Client',
        async execute(sqlText) {
          await client.query(sqlText);
        },
        async close() {
          await client.end();
        },
      };
    }

    throw new Error('No supported @neondatabase/serverless client export was found.');
  } catch (err) {
    tried.push(`@neondatabase/serverless: ${err?.message ?? err}`);
  }

  throw new Error([
    'No supported PostgreSQL client dependency was found or connectable.',
    'Install/use one of: postgres, pg, @neondatabase/serverless.',
    'Tried:',
    ...tried.map((item) => `- ${item}`),
  ].join('\n'));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const rawArgs = process.argv.slice(2);
  const sqlFiles = rawArgs.map(resolveSqlFile).filter(Boolean);

  log('=========================================================');
  log('Run SQL Files');
  log('=========================================================');
  log(`StartedAt: ${startedAt.toISOString()}`);
  log(`WorkingDir: ${process.cwd()}`);
  log(`SQL file count: ${sqlFiles.length}`);

  if (!databaseUrl || !databaseUrl.trim()) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  if (sqlFiles.length === 0) {
    throw new Error('No SQL files were provided.');
  }

  for (const sqlFile of sqlFiles) {
    log(`- ${sqlFile}`);
  }

  const executor = await createDbExecutor(databaseUrl);
  log(`DB client: ${executor.name}`);
  log('');

  try {
    for (let index = 0; index < sqlFiles.length; index += 1) {
      const sqlFile = sqlFiles[index];
      const sqlText = await readSqlFile(sqlFile);

      log('---------------------------------------------------------');
      log(`Executing ${index + 1}/${sqlFiles.length}: ${sqlFile}`);
      log(`SQL bytes: ${Buffer.byteLength(sqlText, 'utf8')}`);

      const fileStartedAt = Date.now();
      await executor.execute(sqlText);
      const elapsedMs = Date.now() - fileStartedAt;

      log(`OK: ${sqlFile}`);
      log(`ElapsedMs: ${elapsedMs}`);
    }
  } finally {
    await executor.close();
  }

  log('');
  log('=========================================================');
  log('SQL execution completed successfully.');
  log(`FinishedAt: ${new Date().toISOString()}`);
  log('=========================================================');
}

main().catch((err) => {
  error('');
  error('=========================================================');
  error('SQL execution failed.');
  error(`FinishedAt: ${new Date().toISOString()}`);
  error('=========================================================');
  error(err?.stack ?? err?.message ?? String(err));
  process.exitCode = 1;
});
