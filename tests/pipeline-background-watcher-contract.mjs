import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const main = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");
const watcher = read("tools/pipeline/download-watcher.ps1");
const common = read("tools/pipeline/pipeline-common.ps1");
const config = read("tools/pipeline/pipeline.config.psd1");

const required = [
  [main, "StartDownloadWatcherBackground"],
  [main, "StopDownloadWatcherBackground"],
  [main, "GetDownloadWatcherProcess"],
  [main, "1. Download 폴더 감시 시작/종료 토글"],
  [main, "2. npm run dev 시작/종료 토글"],
  [main, "3. 패치 적용 후 자동 Build 토글"],
  [watcher, "WriteWatcherState"],
  [watcher, "RefreshRuntimeOptions"],
  [common, "RuntimeOptionsFile"],
  [common, "WatcherStateFile"],
  [config, 'ScriptVersion = "v19.7"'],
];
for (const [content, needle] of required) {
  if (!content.includes(needle)) throw new Error(`missing contract: ${needle}`);
}
if (main.includes("InvokeDownloadWatcherForeground")) throw new Error("foreground watcher entry remains");
console.log("pipeline background watcher contract OK");
