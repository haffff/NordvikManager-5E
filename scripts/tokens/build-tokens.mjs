// Writes addon_files/Resources/token_character.json and token_monster.json, and the
// Turn Changed action's counter icon steps (pnpm tokens:build). See buildTokens.mjs
// and counterIconSteps.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildToken } from "./buildTokens.mjs";
import { tickScript, iconPropertyLines } from "./counterIconSteps.mjs";

const resources = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../addon_files/Resources");
const base = JSON.parse(fs.readFileSync(path.join(resources, "token_character.json"), "utf8"));

for (const kind of ["character", "monster"]) {
  const token = buildToken(base, kind);
  fs.writeFileSync(path.join(resources, `token_${kind}.json`), JSON.stringify(token, null, 2) + "\n");
  console.log(`token_${kind}.json: ${token.additions.length} parts, ${token.assignableIcons.length} assignable icons`);
}

const actions = path.join(resources, "../Actions");
const updateStep = (file, type, update) => {
  const p = path.join(actions, file);
  const action = JSON.parse(fs.readFileSync(p, "utf8"));
  const step = action.content.find((s) => s.Type === type);
  if (!step) throw new Error(`${file}: no ${type} step`);
  update(step.Data);
  fs.writeFileSync(p, JSON.stringify(action, null, 2) + "\n");
};
updateStep("counters_turn_tick.json", "RunScript", (data) => { data.Script = tickScript(); });
updateStep("counters_turn_tick.json", "SetProperties", (data) => { data.Properties = iconPropertyLines(); });
console.log("counters_turn_tick: counter icon steps updated");
