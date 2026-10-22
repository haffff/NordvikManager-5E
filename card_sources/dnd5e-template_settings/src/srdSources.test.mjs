import { test } from "node:test";
import assert from "node:assert/strict";
import { srdSource, srdRawUrl, slugify, SRD_EDITIONS, SRD_ATTRIBUTION } from "./srdSources.js";

test("an SRD source points at that edition's file in the addon repo", () => {
  assert.deepEqual(srdSource("5.2", "spells"), {
    name: "SRD 5.2",
    url: "https://github.com/haffff/NordvikManager-5E/blob/main/data/srd-5.2/spells.json",
  });
  assert.equal(srdRawUrl("5.1", "languages"), "https://raw.githubusercontent.com/haffff/NordvikManager-5E/refs/heads/main/data/srd-5.1/languages.json");
});

test("its name gives the resource keys sync_data writes (dnd5e_items_srd_5_2, ...)", () => {
  assert.equal(slugify(srdSource("5.2", "items").name), "srd_5_2");
  assert.equal(slugify(srdSource("5.1", "items").name), "srd_5_1");
});

test("both editions are offered, each with its CC-BY attribution", () => {
  assert.deepEqual(SRD_EDITIONS, ["5.1", "5.2"]);
  for (const edition of SRD_EDITIONS) assert.match(SRD_ATTRIBUTION[edition], /Creative Commons Attribution 4\.0/);
});
