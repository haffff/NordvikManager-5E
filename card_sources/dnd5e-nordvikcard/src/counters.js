// Counters on the character sheet (Rage uses, Focus Points, Bardic Inspiration, ...),
// stored together as one JSON list in the card's "dnd5e_counters" property, so an
// action can read and write them too (the Turn Changed countdown).
//
// A counter: { id, name, current, max, reset: "round" | "short" | "long" | "none",
//              durationRounds: number | null, roundsLeft: number, featId?: string }
// max 0 = no upper limit. durationRounds: how long one activation lasts (Rage: 10).
// featId: the feat it counts (Feats tab); without one, a feat with the same name.
// icon / showOnToken: its icon on the token and when it shows (see tokenIcons.js).
import { mkId } from "./srdHelpers.js";

export const COUNTERS_PROPERTY = "dnd5e_counters";

/** When a counter refills, in the order the sheet offers them. */
export const RESETS = { round: "Per round", short: "Short rest", long: "Long rest", none: "Manual" };

/** The stored list; anything unreadable reads as no counters. */
export const parseCounters = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const newCounter = ({ name, max = 0, reset = "long", durationRounds = null, icon = "" }) => ({
  id: mkId(),
  name,
  current: max,
  max,
  reset,
  durationRounds: durationRounds || null,
  roundsLeft: 0,
  icon,
  showOnToken: durationRounds ? "active" : "never",
});

const clamp = (counter, value) => Math.max(0, counter.max > 0 ? Math.min(counter.max, value) : value);

const change = (counters, id, fn) => counters.map((c) => (c.id === id ? fn(c) : c));

export const adjust = (counters, id, delta) => change(counters, id, (c) => ({ ...c, current: clamp(c, (c.current ?? 0) + delta) }));

export const setValue = (counters, id, value) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? counters : change(counters, id, (c) => ({ ...c, current: clamp(c, n) }));
};

/** Short rest refills "round" and "short" counters; long rest also "long". Either ends active durations. */
export const rest = (counters, kind) =>
  counters.map((c) => {
    const refills = c.reset === "round" || c.reset === "short" || (kind === "long" && c.reset === "long");
    return { ...c, current: refills ? c.max : c.current, roundsLeft: 0 };
  });

/** Spends one use and starts the duration (e.g. enter a Rage). No uses left: nothing happens. */
export const activate = (counters, id) =>
  change(counters, id, (c) =>
    (c.current ?? 0) > 0 ? { ...c, current: c.current - 1, roundsLeft: c.durationRounds || 0 } : c);

export const deactivate = (counters, id) => change(counters, id, (c) => ({ ...c, roundsLeft: 0 }));

/**
 * One of the character's turns started: active durations count down by one and
 * per-round counters refill. Returns the new list (unchanged counters are the same
 * objects) and the names of what just ran out. The Turn Changed action
 * (addon_files/Actions/counters_turn_tick.json) runs the same logic in its script.
 */
export const tickRound = (counters) => {
  const ended = [];
  const next = counters.map((c) => {
    let out = c;
    if (c.roundsLeft > 0) {
      out = { ...out, roundsLeft: c.roundsLeft - 1 };
      if (out.roundsLeft === 0) ended.push(c.name);
    }
    if (c.reset === "round" && c.max > 0 && (c.current ?? 0) < c.max) out = { ...out, current: c.max };
    return out;
  });
  return { counters: next, ended };
};

/** Small counters (max up to 12) show as pips; larger or unlimited ones as a number. */
export const showsPips = (counter) => counter.max > 0 && counter.max <= 12;

const sameName = (a, b) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/** The counter of a feat: the one linked to it, else an unlinked one with the same name. */
export const linkedCounter = (counters, feat) =>
  counters.find((c) => c.featId === feat.id) ?? counters.find((c) => !c.featId && sameName(c.name, feat.name));

/** A new counter tracking a feat's uses: linked to it, named after it, set up like the preset of that name. */
export const counterForFeat = (feat) => {
  const preset = PRESETS.find((p) => sameName(p.name, feat.name));
  return {
    ...newCounter({ name: feat.name, max: 1, reset: preset?.reset ?? "long", durationRounds: preset?.durationRounds, icon: preset?.icon }),
    featId: feat.id,
  };
};

// SRD class resources. The player sets max (it depends on level and ability scores).
export const PRESETS = [
  { name: "Rage", reset: "long", durationRounds: 10, icon: "rage" },
  { name: "Bardic Inspiration", reset: "long", icon: "music" },
  { name: "Channel Divinity", reset: "short", icon: "holy" },
  { name: "Wild Shape", reset: "short", icon: "leaf" },
  { name: "Focus Points", reset: "short", icon: "fist" },
  { name: "Sorcery Points", reset: "long", icon: "sparkles" },
  { name: "Second Wind", reset: "short", icon: "heart" },
  { name: "Action Surge", reset: "short", icon: "bolt" },
  { name: "Lay on Hands", reset: "long", icon: "heart" },
  { name: "Arcane Recovery", reset: "long", icon: "moon" },
  { name: "Reaction", reset: "round", icon: "hourglass" },
  { name: "Legendary Actions", reset: "round", icon: "skull" },
];
