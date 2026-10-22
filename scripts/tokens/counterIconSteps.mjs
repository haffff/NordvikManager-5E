// The Turn Changed action's counter icon steps, generated from the icon palette
// (card_sources/dnd5e-nordvikcard/src/tokenIcons.js) by `pnpm tokens:build`, so the
// palette is listed in one place: the RunScript of counters_turn_tick works out every
// icon's flag, and its SetProperties step writes them.
import { COUNTER_ICONS, iconProperty } from "../../card_sources/dnd5e-nordvikcard/src/tokenIcons.js";

const keys = () => COUNTER_ICONS.map((i) => i.key);

/** counters_turn_tick's script: tickRound (counters.js) plus tokenIconProps (tokenIcons.js). */
export const tickScript = () => [
  "var list;",
  'try { list = typeof vars.tick_counters === "string" ? JSON.parse(vars.tick_counters) : vars.tick_counters; } catch (e) { list = null; }',
  "if (!Array.isArray(list)) list = [];",
  "var ended = [];",
  "var changed = 0;",
  "var next = list.map(function (c) {",
  "  if (!c) return c;",
  "  var out = c;",
  "  if (c.roundsLeft > 0) {",
  "    out = Object.assign({}, out, { roundsLeft: c.roundsLeft - 1 });",
  "    if (out.roundsLeft === 0) ended.push(c.name);",
  "  }",
  '  if (c.reset === "round" && c.max > 0 && (c.current || 0) < c.max) out = Object.assign({}, out, { current: c.max });',
  "  if (out !== c) changed = 1;",
  "  return out;",
  "});",
  "// Token icons (tokenIcons.js tokenIconProps): on while a counter using it is active / has uses.",
  `var keys = ${JSON.stringify(keys())};`,
  "var on = {};",
  "next.forEach(function (c) {",
  "  if (!c || !c.icon) return;",
  '  var show = c.showOnToken || "never";',
  '  if ((show === "active" && c.roundsLeft > 0) || (show === "uses" && (c.current || 0) > 0)) on[c.icon] = true;',
  "});",
  'var result = { tick_newCounters: JSON.stringify(next), tick_changed: changed, tick_hasEnded: ended.length ? 1 : 0, tick_endedText: ended.join(", ") };',
  'keys.forEach(function (k) { result["tick_icon_" + k] = on[k] ? "true" : "false"; });',
  "return result;",
].join("\n");

/** counters_turn_tick's SetProperties lines: one per palette icon. */
export const iconPropertyLines = () => keys().map((k) => `${iconProperty(k)}=%tick_icon_${k}%`).join("\n");
