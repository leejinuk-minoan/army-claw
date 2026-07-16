const { createRequire } = require("node:module");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

(async () => {
  const runtimeRoot = process.env.ARMY_CLAW_NODE_MODULES;
  const runtimeRequire = createRequire(pathToFileURL(path.join(runtimeRoot, ".army-claw-loader.cjs")));
  const JSZip = runtimeRequire("jszip");
  if (JSZip.version !== "3.10.1") {
    throw new Error(`unexpected version: ${JSZip.version}`);
  }
  const zip = new JSZip();
  zip.file("hello.txt", "army-claw-offline-jszip");
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const loaded = await JSZip.loadAsync(buffer);
  const text = await loaded.file("hello.txt").async("string");
  if (text !== "army-claw-offline-jszip") {
    throw new Error("zip round-trip mismatch");
  }
  console.log(JSON.stringify({ status: "passed", version: JSZip.version, byte_size: buffer.length, text }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
