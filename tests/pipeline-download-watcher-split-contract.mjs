import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pipelineDir = path.join(root, 'tools', 'pipeline');
const read = (name) => fs.readFileSync(path.join(pipelineDir, name), 'utf8');

const main = read('peacebypiece-auto-pipeline.ps1');
const common = read('pipeline-common.ps1');
const processing = read('pipeline-patch-processing.ps1');
const watcher = read('download-watcher.ps1');
const config = read('pipeline.config.psd1');

assert.match(config, /ScriptVersion\s*=\s*"v19\.7"/);
assert.match(main, /\. \$PipelineCommonPath/);
assert.match(main, /\. \$PipelinePatchProcessingPath/);
assert.match(main, /StartDownloadWatcherBackground/);
assert.doesNotMatch(main, /function\s+GetMetaValue\s*\{/);
assert.doesNotMatch(main, /function\s+ProcessOnePatchIfReady\s*\{/);

assert.match(common, /function\s+ResolvePipelineProjectDir\s*\{/);
assert.match(common, /\$TempFilePatterns\s*=\s*@\("\*\.crdownload", "\*\.tmp", "\*\.download", "\*\.partial"\)/);

assert.match(processing, /function\s+GetMetaValue\s*\{/);
assert.match(processing, /function\s+AssertMetaFormat\s*\{/);
assert.match(processing, /function\s+ExpandIncomingPatchZipIfReady\s*\{/);
assert.match(processing, /function\s+ProcessOnePatchIfReady\s*\{/);
assert.match(processing, /peacebypiece-patch-\*\.zip/);

assert.match(watcher, /\. \$PipelineCommonPath/);
assert.match(watcher, /\. \$PipelinePatchProcessingPath/);
assert.match(watcher, /ProcessOnePatchIfReady/);
assert.match(watcher, /StartDownloadWatcherLoop/);
assert.doesNotMatch(watcher, /function\s+GetMetaValue\s*\{/);
assert.doesNotMatch(watcher, /function\s+AssertMetaFormat\s*\{/);

console.log('pipeline download watcher split contract: OK');
