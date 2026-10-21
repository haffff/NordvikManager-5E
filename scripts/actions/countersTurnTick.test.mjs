// The Turn Changed countdown (addon_files/Actions/counters_turn_tick.json): its RunScript
// step is run here with Node, and the countdown must match src/counters.js tickRound.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tickRound, newCounter } from "../../card_sources/dnd5e-nordvikcard/src/counters.js";
import { COUNTER_ICONS, tokenIconProps, iconProperty } from "../../card_sources/dnd5e-nordvikcard/src/tokenIcons.js";

const actionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../addon_files/Actions");
const action = (name) => JSON.parse(fs.readFileSync(path.join(actionsDir, `${name}.json`), "utf8"));
const steps = (name, type) => action(name).content.filter((s) => s.Type === type);

// Runs the action's RunScript step like the backend does: `vars` in, returned object out.
const runScript = (name, vars) => {
  const [step] = steps(name, "RunScript");
  return new Function("vars", step.Data.Script)(Object.freeze(vars));
};

test("it runs on the Turn Changed hook (23) and stops when the new turn has no token, or a card-less one", () => {
  const hook = action("counters_turn_tick");
  assert.equal(hook.hook, 23);
  assert.equal(hook.isEnabled, true);

  const [noToken, noCard, unchanged] = steps("counters_turn_tick", "If");
  assert.equal(noToken.Data.Condition, "'%Data.elementId%' = ''");
  assert.equal(noToken.Data.Then[0].Type, "Exit");

  const [token] = steps("counters_turn_tick", "Find");
  assert.deepEqual([token.Data.What, token.Data.Id, token.Data.First, token.Data.Output], ["tokens", "%Data.elementId%", true, "tick_token"]);
  assert.equal(noCard.Data.Condition, "'%tick_token.cardId%' = ''");
  assert.equal(noCard.Data.Then[0].Type, "Exit");
  assert.equal(unchanged.Data.Condition, "%tick_changed% = 0");
  assert.equal(unchanged.Data.Then[0].Type, "Exit");
});

const counters = [
  { ...newCounter({ name: "Rage", max: 3, reset: "long", durationRounds: 10 }), id: "r", roundsLeft: 1 },
  { ...newCounter({ name: "Bless", max: 1, reset: "none", durationRounds: 10 }), id: "b", roundsLeft: 5 },
  { ...newCounter({ name: "Focus Points", max: 5, reset: "short" }), id: "k" },
  { ...newCounter({ name: "Reaction", max: 1, reset: "round" }), id: "re", current: 0 },
];

test("the countdown matches the sheet's tickRound, and says what ended", () => {
  const result = runScript("counters_turn_tick", { tick_counters: JSON.stringify(counters) });
  const expected = tickRound(counters);

  assert.deepEqual(JSON.parse(result.tick_newCounters), expected.counters);
  assert.equal(result.tick_changed, 1);
  assert.equal(result.tick_hasEnded, 1);
  assert.equal(result.tick_endedText, "Rage");
});

test("a spent per-round counter alone is refilled and written", () => {
  const spent = [{ ...counters[3] }];
  const result = runScript("counters_turn_tick", { tick_counters: JSON.stringify(spent) });
  assert.deepEqual(JSON.parse(result.tick_newCounters), tickRound(spent).counters);
  assert.deepEqual([result.tick_changed, result.tick_hasEnded], [1, 0]);
});

test("nothing active, or nothing readable: nothing to write", () => {
  const idle = [{ ...counters[2] }];
  for (const stored of [JSON.stringify(idle), "[]", "", "broken", null]) {
    const result = runScript("counters_turn_tick", { tick_counters: stored });
    assert.equal(result.tick_changed, 0, String(stored));
    assert.equal(result.tick_hasEnded, 0, String(stored));
  }
});

test("it reads and writes the card's counters and announces what ended", () => {
  const [read] = steps("counters_turn_tick", "GetPropertyValue");
  assert.deepEqual([read.Data.ParentId, read.Data.PropertyName, read.Data.Output], ["%tick_token.cardId%", "dnd5e_counters", "tick_counters"]);

  const [write] = steps("counters_turn_tick", "SetProperty");
  assert.deepEqual([write.Data.ParentId, write.Data.PropertyName, write.Data.PropertyValue], ["%tick_token.cardId%", "dnd5e_counters", "%tick_newCounters%"]);

  const ended = steps("counters_turn_tick", "If").at(-1);
  assert.equal(ended.Data.Condition, "%tick_hasEnded% = 1");
  const [chat] = ended.Data.Then;
  assert.equal(chat.Type, "SendChat");
  assert.equal(chat.Data.Title, "%q:{tick_token.cardId}.name%");
  assert.match(chat.Data.Message, /%tick_endedText%/);
});

test("the token's counter icons follow the countdown, like the sheet's tokenIconProps", () => {
  const raging = [
    { ...newCounter({ name: "Rage", max: 3, reset: "long", durationRounds: 10, icon: "rage" }), id: "r", roundsLeft: 1 },
    { ...newCounter({ name: "Reaction", max: 1, reset: "round", icon: "hourglass" }), id: "re", current: 0, showOnToken: "uses" },
  ];
  const result = runScript("counters_turn_tick", { tick_counters: JSON.stringify(raging) });
  const expected = tokenIconProps(tickRound(raging).counters);

  for (const { key } of COUNTER_ICONS) {
    assert.equal(result[`tick_icon_${key}`], expected[iconProperty(key)], key);
  }
  // Rage ran out, the reaction came back.
  assert.deepEqual([result.tick_icon_rage, result.tick_icon_hourglass], ["false", "true"]);
});

test("it writes every counter icon's property", () => {
  const [write] = steps("counters_turn_tick", "SetProperties");
  assert.equal(write.Data.ParentId, "%tick_token.cardId%");
  const lines = write.Data.Properties.split("\n");
  assert.deepEqual(lines, COUNTER_ICONS.map(({ key }) => `${iconProperty(key)}=%tick_icon_${key}%`));
});
