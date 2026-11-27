import test from "node:test";
import assert from "node:assert/strict";
import { derive, newSheet, newEntry, rollDice, toPrint } from "../src/model";
import { backup, readBackup } from "../src/storage";
import { slotCapacity } from "../src/spellslots";
import { SPELLS } from "../src/rules";
test("2014 rules recalculate and keep manual overrides", () => {
  const s = newSheet();
  Object.assign(s.f, {
    level: "5",
    race: "High Elf",
    className: "Wizard",
    background: "Acolyte",
    armor: "Chain mail",
  });
  const d = derive(s);
  assert.equal(d.mods.DEX, 3);
  assert.equal(d.prof, 3);
  assert.equal(d.skills.Perception, 3);
  assert.equal(d.skills.Religion, 4);
  assert.equal(d.saves.INT, 4);
  assert.equal(d.ac, 16);
  assert.equal(d.passive, 13);
  assert.deepEqual([d.dc, d.spellAttack], [12, 4]);
  assert.deepEqual(slotCapacity("Wizard", 5), [4, 3, 2]);
  s.ranks.Perception = "2";
  s.overrides.initiative = "0";
  s.overrides.maxHP = "60";
  assert.equal(derive(s).skills.Perception, 6);
  assert.equal(derive(s).initiative, 0);
  assert.equal(derive(s).maxHP, 60);
  const w = newEntry();
  w.ability = "DEX";
  assert.equal(d.attack(w), 6);
  w.bonus = "0";
  assert.equal(d.attack(w), 0);
  s.f.className = "Paladin";
  s.f.level = "1";
  assert.equal(derive(s).casting, undefined);
  assert.deepEqual(slotCapacity("Warlock", 11), [0, 0, 0, 0, 3]);
});
test("backup validation and homebrew round trip", () => {
  const s = newSheet();
  s.f.timeline = "Winter";
  s.f.backstory = "A very long tale. ".repeat(500);
  s.groups.features.push({ ...newEntry(), name: "Star shield", uses: "2/day" });
  const copy = readBackup(backup([s]))[0];
  assert.deepEqual(toPrint(copy), toPrint(s));
  copy.f.name = "Other";
  assert.notEqual(s.f.name, copy.f.name);
  assert.throws(() =>
    readBackup('{"format":"character-forge","version":12,"characters":[]}'),
  );
  assert.throws(() =>
    readBackup(backup([{ ...s, portrait: "https://example.org/image.png" }])),
  );
});
test("dice and SRD library", () => {
  assert.equal(Object.keys(SPELLS).length, 319);
  assert.ok(SPELLS["Fireball"]);
  assert.equal(rollDice("1").total, 1);
  const r = rollDice("2d6 + 3");
  assert.ok(r.total >= 5 && r.total <= 15);
  assert.throws(() => rollDice("d999"));
});
