// Template and view keys are unique in a game, whichever addon brought them, so they start
// with the addon's key. Cards made from a template find it again by its key after an update:
// a template's key must never change between versions.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = (rel) => fs.readdirSync(path.join(root, rel)).filter((f) => f.endsWith(".json")).map((f) => `${rel}/${f}`);
const json = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const addonKey = json("addon_files/info.json").key;
const viewKeys = dir("addon_files/Views").map((f) => json(f).key);

test("every template and view key starts with the addon's key", () => {
  for (const file of [...dir("addon_files/Templates"), ...dir("addon_files/Views")]) {
    assert.match(json(file).key, new RegExp(`^${addonKey}_.+`), file);
  }
});

test("every ShowView opens one of the addon's views", () => {
  const viewKeysIn = (node) =>
    Array.isArray(node) ? node.flatMap(viewKeysIn)
      : node && typeof node === "object"
        ? [...(node.Type === "ShowView" ? [node.Data?.ViewKey] : []), ...Object.values(node).flatMap(viewKeysIn)]
        : [];
  const opened = dir("addon_files/Actions").flatMap((f) => viewKeysIn(json(f)).map((key) => [f, key]));
  assert.ok(opened.length > 0);
  for (const [file, key] of opened) assert.ok(viewKeys.includes(key), `${file}: ${key}`);
});
