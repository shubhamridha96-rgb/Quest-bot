import { spawn } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distEntry  = path.join(__dirname, "dist", "index.js");
const srcEntry   = path.join(__dirname, "src", "index.ts");

function run(cmd, args, env = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    cwd:   __dirname,
    env:   { ...process.env, ...env },
  });
  child.on("exit", code => process.exit(code ?? 0));
  child.on("error", err => { console.error("[launcher] spawn error:", err.message); process.exit(1); });
}
if (existsSync(distEntry)) {
  console.log("[launcher] running compiled dist/index.js");
  run("node", [distEntry]);
} else if (existsSync(srcEntry)) {
  const tsxBin   = path.join(__dirname, "node_modules", ".bin", "tsx");
  const tsnodeBin= path.join(__dirname, "node_modules", ".bin", "ts-node");

  if (existsSync(tsxBin)) {
    console.log("[launcher] running with tsx (Node 25 compatible)");
    run(tsxBin, ["--tsconfig", "tsconfig.json", srcEntry]);
  } else if (existsSync(tsnodeBin)) {
    console.log("[launcher] running with ts-node/esm");
    run("node", ["--loader", "ts-node/esm", "--max-old-space-size=4096", srcEntry]);
  } else {
    console.error("[launcher] neither tsx nor ts-node found. Run: npm install");
    process.exit(1);
  }
} else {
  console.error("[launcher] no entry point found. Expected dist/index.js or src/index.ts");
  process.exit(1);
}
