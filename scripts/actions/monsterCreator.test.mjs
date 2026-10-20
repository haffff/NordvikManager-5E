// The monster creator's actions (addon_files/Actions/*monster*.json, set_card_prop.json):
// a card from the 5E Monster Template, every property the view computed, and a token
// when it was opened from the map.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const json = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const action = (name) => json(`addon_files/Actions/${name}.json`);
const step = (name, type) => action(name).content.find((s) => s.Type === type);

test("create_monster_from_srd: card from the monster template, then every property", () => {
  const create = step("create_monster_from_srd", "CreateCard");
  assert.equal(create.Data.TemplateId, '%q:card[5E Monster Template].id%');
  assert.equal(create.Data.Name, "%name%");
  assert.equal(create.Data.Output, "newCardId");

  const each = step("create_monster_from_srd", "ForEach");
  assert.deepEqual([each.Data.Collection, each.Data.ItemName, each.Data.Action], ["props", "prop", "dnd5e/set_card_prop"]);

  const set = step("set_card_prop", "SetProperty");
  assert.deepEqual([set.Data.ParentId, set.Data.PropertyName, set.Data.PropertyValue], ["%newCardId%", "%v:prop.name%", "%v:prop.value%"]);
});

test("opened from the map, it also places the monster's token there", () => {
  const branch = step("create_monster_from_srd", "If");
  assert.equal(branch.Data.Condition, "'%hasMapContext%' = 'true'");
  assert.equal(branch.Data.ActionTrue, "dnd5e/create_monster_spawn_token");

  const spawn = step("create_monster_spawn_token", "RunClientCommand");
  assert.deepEqual([spawn.Data.Panel, spawn.Data.Command], ["BattleMap_token", "CreateToken"]);
  assert.match(spawn.Data.Data, /%newCardId%/);
  assert.match(spawn.Data.Data, /%battleMapId%/);
});

test("the creator view is GM only, and reachable from the menus", () => {
  const open = action("open_monster_creator");
  assert.equal(open.genericPermission, 0);
  assert.equal(step("open_monster_creator", "ShowView").Data.ViewKey, "monster_creator");
  assert.equal(json("addon_files/Views/monster_creator.json").key, "monster_creator");

  const menus = action("create_menus").content.map((s) => s.Data);
  const toCreator = menus.filter((m) => m.Action === "dnd5e/open_monster_creator").map((m) => m.Location);
  assert.deepEqual(toCreator.sort(), ["addons", "battlemap_add"]);
  assert.ok(menus.filter((m) => m.SubMenuId === "dnd5e_tools").every((m) => m.SubMenuName === "5E Create"));
});

test("the packer builds the creator card", () => {
  assert.match(fs.readFileSync(path.join(root, "scripts/pack-cards.mjs"), "utf8"), /'dnd5e-monstercreator'/);
});
