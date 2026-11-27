import {
  ABILITIES,
  SKILLS,
  CLASSES,
  RACES,
  BACKGROUNDS,
  SRD_PDF,
  type Ability,
} from "./rules";
import { classFeatureNames } from "./class-features";
import { slotCapacity } from "./spellslots";
import type { PrintSheet } from "./pdf";

export const labels = {
  name: "Character name",
  campaign: "Campaign / folder",
  timeline: "Version or timeline",
  edition: "Rules edition",
  alignment: "Alignment",
  level: "Level",
  xp: "Experience points",
  race: "Race / species",
  className: "Class",
  subclass: "Subclass",
  background: "Background",
  proficiencies: "Languages, tools and other proficiencies",
  choices: "Additional rule choices",
  armor: "Worn armor",
  shield: "Shield",
  casting: "Spellcasting ability",
  slots: "Spell slots by level (remaining / total)",
  concentration: "Concentration",
  hp: "Current HP",
  temp: "Temporary HP",
  hitDice: "Remaining hit dice",
  success: "Death save successes",
  failure: "Death save failures",
  conditions: "Conditions",
  resistances: "Resistances and immunities",
  currency: "Currency (cp, sp, ep, gp, pp)",
  appearance: "Appearance",
  personality: "Personality",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  backstory: "Backstory",
  goals: "Goals",
  allies: "Allies",
  notes: "Session notes",
  lore: "Established lore",
  adaptation: "Game adaptation",
};
export type Field = keyof typeof labels;
export const groupNames = {
  weapons: "Attacks",
  items: "Inventory",
  features: "Features, feats and traits",
  spells: "Spellbook",
};
export type Group = keyof typeof groupNames;
export type Entry = {
  id: string;
  name: string;
  description: string;
  source: string;
  url: string;
  quantity: string;
  ability: string;
  dice: string;
  proficient: string;
  bonus: string;
  level: string;
  status: string;
  uses: string;
};
export const sources = ["SRD 5.1", "Other published", "Homebrew", "Unofficial"];
export type Sheet = {
  id: string;
  edited: string;
  portrait: string;
  f: Record<Field, string>;
  scores: Record<Ability, string>;
  overrides: Record<string, string>;
  ranks: Record<string, string>;
  refs: Record<string, string>;
  groups: Record<Group, Entry[]>;
  history: string[];
};
export const uid = () => crypto.randomUUID();
export function newEntry(): Entry {
  return {
    id: uid(),
    name: "",
    description: "",
    source: "Homebrew",
    url: "",
    quantity: "1",
    ability: "STR",
    dice: "1d6",
    proficient: "yes",
    bonus: "",
    level: "0",
    status: "Known",
    uses: "",
  };
}
export function newSheet(): Sheet {
  const f = Object.fromEntries(
    Object.keys(labels).map((k) => [k, ""]),
  ) as Sheet["f"];
  Object.assign(f, {
    name: "New adventurer",
    edition: "5e (2014)",
    level: "1",
    xp: "0",
    armor: "Unarmored",
    shield: "No",
    temp: "0",
    success: "0",
    failure: "0",
  });
  return {
    id: uid(),
    edited: new Date().toISOString(),
    portrait: "",
    f,
    scores: { STR: "15", DEX: "14", CON: "13", INT: "12", WIS: "10", CHA: "8" },
    overrides: {},
    ranks: {},
    refs: {},
    groups: { weapons: [], items: [], features: [], spells: [] },
    history: [],
  };
}
export const n = (value: unknown, fallback = 0) =>
  value === "" || value == null || !Number.isFinite(Number(value))
    ? fallback
    : Number(value);
export const signed = (v: number) => (v >= 0 ? "+" + v : String(v));
export const modifier = (score: number) => Math.floor((score - 10) / 2);
export const armor: Record<string, [number, number]> = {
  Unarmored: [10, 99],
  Padded: [11, 99],
  Leather: [11, 99],
  "Studded leather": [12, 99],
  Hide: [12, 2],
  "Chain shirt": [13, 2],
  "Scale mail": [14, 2],
  Breastplate: [14, 2],
  "Half plate": [15, 2],
  "Ring mail": [14, 0],
  "Chain mail": [16, 0],
  Splint: [17, 0],
  Plate: [18, 0],
};
export const safeURL = (v: string | undefined) => {
  try {
    const u = new URL(v || "");
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
};
export const lookup = <T>(
  map: Record<string, T>,
  key: string,
): T | undefined => (Object.hasOwn(map, key) ? map[key] : undefined);
export const boundedLevel = (s: Sheet) =>
  Math.min(20, Math.max(1, Math.trunc(n(s.f.level, 1))));
export function derive(s: Sheet) {
  const f = s.f,
    c = lookup(CLASSES, f.className),
    r = lookup(RACES, f.race),
    bg = lookup(BACKGROUNDS, f.background);
  const ov = (k: string, v: number) => n(s.overrides[k], v),
    level = boundedLevel(s);
  const scores = {} as Record<Ability, number>,
    mods = {} as Record<Ability, number>;
  const flexible = new Set(
    [s.refs.halfElf1, s.refs.halfElf2].filter((v) => v && v !== "CHA"),
  );
  for (const a of ABILITIES) {
    scores[a] =
      n(s.scores[a], 10) +
      (r?.bonuses[a] || 0) +
      (f.race === "Half-Elf" && flexible.has(a) ? 1 : 0);
    mods[a] = ov("mod:" + a, modifier(scores[a]));
  }
  const prof = ov("prof", 2 + Math.floor((level - 1) / 4));
  const saveRank = (a: Ability) =>
    s.ranks["save:" + a] ?? (c?.saves.includes(a) ? "1" : "0");
  const saves = Object.fromEntries(
    ABILITIES.map((a) => [a, ov("save:" + a, mods[a] + n(saveRank(a)) * prof)]),
  );
  const skillRank = (k: string) =>
    s.ranks[k] ??
    (bg?.skills.includes(k) ||
    (["Elf", "High Elf"].includes(f.race) && k === "Perception") ||
    (f.race === "Half-Orc" && k === "Intimidation")
      ? "1"
      : "0");
  const jack = f.className === "Bard" && level >= 2 ? Math.floor(prof / 2) : 0;
  const skills = Object.fromEntries(
    Object.entries(SKILLS).map(([k, a]) => [
      k,
      ov(
        "skill:" + k,
        mods[a] + (n(skillRank(k)) ? n(skillRank(k)) * prof : jack),
      ),
    ]),
  );
  const die = c?.die || 8,
    hill = f.race === "Hill Dwarf" ? 1 : 0,
    draconic =
      f.className === "Sorcerer" && f.subclass === "Draconic Bloodline";
  const maxHP = ov(
    "maxHP",
    Math.max(1, die + mods.CON) +
      (level - 1) * Math.max(1, die / 2 + 1 + mods.CON) +
      level * (hill + Number(draconic)),
  );
  const ar = lookup(armor, f.armor) || armor.Unarmored,
    shield = f.shield === "Yes" ? 2 : 0;
  let baseAC = ar[0] + (ar[1] === 0 ? 0 : Math.min(ar[1], mods.DEX));
  if (f.armor === "Unarmored") {
    if (f.className === "Barbarian")
      baseAC = Math.max(baseAC, 10 + mods.DEX + mods.CON);
    if (f.className === "Monk" && !shield)
      baseAC = Math.max(baseAC, 10 + mods.DEX + mods.WIS);
    if (draconic) baseAC = Math.max(baseAC, 13 + mods.DEX);
  }
  const defaultCasting =
    level === 1 && ["Paladin", "Ranger"].includes(f.className)
      ? undefined
      : c?.casting;
  const casting =
    f.casting === "None"
      ? undefined
      : ABILITIES.find((a) => a === f.casting) || defaultCasting;
  const slots = slotCapacity(f.className, level)
    .map((total, i) => ({
      level: i + 1,
      total,
      left: Math.max(0, Math.min(total, n(s.refs["slot:" + i], total))),
    }))
    .filter((x) => x.total > 0);
  const spellAttack = casting
    ? ov("spellAttack", prof + mods[casting])
    : undefined;
  const dc = casting ? ov("dc", 8 + prof + mods[casting]) : undefined;
  const heavy = ["Ring mail", "Chain mail", "Splint", "Plate"].includes(
    f.armor,
  );
  const required =
    f.armor === "Chain mail"
      ? 13
      : ["Splint", "Plate"].includes(f.armor)
        ? 15
        : 0;
  let walking = r?.speed ?? 30;
  if (required > scores.STR && !["Dwarf", "Hill Dwarf"].includes(f.race))
    walking -= 10;
  if (f.className === "Barbarian" && level >= 5 && !heavy) walking += 10;
  if (
    f.className === "Monk" &&
    level >= 2 &&
    f.armor === "Unarmored" &&
    !shield
  )
    walking += 10 + Math.max(0, Math.floor((level - 2) / 4)) * 5;
  const speed = ov("speed", walking),
    ac = ov("ac", baseAC + shield),
    initiative = ov("initiative", mods.DEX + jack),
    passive = ov("passive", 10 + skills.Perception);
  const attack = (w: Entry) =>
    n(
      w.bonus,
      (mods[w.ability as Ability] ?? 0) + (w.proficient === "yes" ? prof : 0),
    );
  return {
    classFeatures: classFeatureNames(f.className, f.subclass, level),
    jack,
    slots,
    scores,
    mods,
    prof,
    saves,
    skills,
    skillRank,
    saveRank,
    maxHP,
    ac,
    initiative,
    passive,
    speed,
    casting,
    spellAttack,
    dc,
    die,
    attack,
    r,
    c,
  };
}
export function rollDice(expression: string) {
  if (/^\s*\d{1,4}\s*$/.test(expression)) {
    const flat = Number(expression);
    return { total: flat, rolls: [flat], bonus: 0 };
  }
  const match =
    /^\s*(?:(\d{1,2})?d(4|6|8|10|12|20|100))\s*([+-]\s*\d{1,4})?\s*$/i.exec(
      expression,
    );
  if (!match || Number(match[1] || 1) < 1)
    throw Error("Use a dice expression such as 2d6 + 3.");
  const qty = Number(match[1] || 1),
    sides = Number(match[2]),
    bonus = Number((match[3] || "0").replace(/\s/g, ""));
  const rolls = Array.from(
    { length: qty },
    () => Math.floor(Math.random() * sides) + 1,
  );
  return { total: rolls.reduce((a, b) => a + b, bonus), rolls, bonus };
}
export const choiceKeys = [
  "race",
  "className",
  "subclass",
  "background",
] as const;
export function choiceRef(s: Sheet, key: (typeof choiceKeys)[number]) {
  const c = lookup(CLASSES, s.f.className);
  const defaultURL =
    key === "race"
      ? lookup(RACES, s.f.race)?.ref
      : key === "className"
        ? c?.ref
        : key === "background"
          ? lookup(BACKGROUNDS, s.f.background)?.ref
          : c?.subclass === s.f.subclass
            ? c?.subclassRef
            : undefined;
  return {
    source: s.refs[key + "Source"] || (defaultURL ? "SRD 5.1" : "Homebrew"),
    url: safeURL(s.refs[key + "URL"] || defaultURL),
    notes: s.refs[key + "Notes"] || "",
  };
}
export function toPrint(s: Sheet): PrintSheet {
  const d = derive(s),
    f = s.f;
  type Row = [string, string];
  const section = (title: string, rows: Row[], compact = false) => ({
    title,
    rows,
    compact,
  });
  const fields = (keys: Field[]): Row[] => keys.map((k) => [labels[k], f[k]]);
  const list = (g: Group): Row[] =>
    s.groups[g].map((e) => {
      const details =
        g === "weapons"
          ? [
              signed(d.attack(e)) + " to hit",
              e.dice +
                " " +
                signed(d.mods[e.ability as Ability] ?? 0) +
                " damage",
              e.ability,
              e.proficient === "yes" ? "Proficient" : "Untrained",
            ]
          : g === "spells"
            ? ["Level " + e.level, e.status]
            : g === "items"
              ? ["Quantity " + e.quantity]
              : [e.uses];
      return [
        e.name || "Unnamed entry",
        [...details, e.description, e.source, e.url].filter(Boolean).join("\n"),
      ];
    });
  return {
    name: f.name || "Unnamed adventurer",
    level: boundedLevel(s),
    subtitle: [f.race, f.className, f.subclass, f.campaign]
      .filter(Boolean)
      .join(" · "),
    portrait: s.portrait,
    sections: [
      section(
        "Identity",
        fields([
          "name",
          "race",
          "className",
          "subclass",
          "level",
          "background",
          "alignment",
          "xp",
          "campaign",
          "timeline",
          "edition",
        ]),
      ),
      section(
        "Ability scores",
        ABILITIES.map((a) => [
          a,
          d.scores[a] + " (" + signed(d.mods[a]) + ") · base " + s.scores[a],
        ]),
        true,
      ),
      section(
        "Combat",
        [
          ["Armor Class", String(d.ac)],
          ["Initiative", signed(d.initiative)],
          ["Speed", d.speed + " ft"],
          ["Hit points", (f.hp || String(d.maxHP)) + " / " + d.maxHP],
          ["Hit dice", f.hitDice || boundedLevel(s) + "d" + d.die],
          ["Proficiency", signed(d.prof)],
          ["Passive Perception", String(d.passive)],
          ...fields([
            "temp",
            "armor",
            "shield",
            "success",
            "failure",
            "conditions",
            "resistances",
          ]),
        ],
        true,
      ),
      section(
        "Saving throws",
        ABILITIES.map((a) => [
          a,
          signed(d.saves[a]) + (d.saveRank(a) === "1" ? " · proficient" : ""),
        ]),
        true,
      ),
      section(
        "Skills",
        Object.keys(SKILLS).map((k) => [
          k,
          signed(d.skills[k]) +
            ["", " · proficient", " · expertise"][n(d.skillRank(k))],
        ]),
        true,
      ),
      section("Attacks", list("weapons"), true),
      section(
        "Features and traits",
        [
          ...(d.r?.traits || []).map((t) => ["Species trait", t] as Row),
          ...d.classFeatures.map((t) => ["Class feature", t] as Row),
          ...list("features"),
        ],
        true,
      ),
      section("Spellcasting", [
        [labels.casting, d.casting || "None"],
        [
          "Spell attack",
          d.spellAttack === undefined ? "—" : signed(d.spellAttack),
        ],
        ["Spell save DC", String(d.dc ?? "—")],
        ...d.slots.map(
          (x) =>
            ["Level " + x.level + " slots", x.left + " / " + x.total] as Row,
        ),
        ...fields(["slots", "concentration"]),
      ]),
      section("Spellbook", list("spells")),
      section("Inventory", [
        ...list("items"),
        ...fields(["currency", "proficiencies"]),
      ]),
      section(
        "Roleplay and session notes",
        fields([
          "appearance",
          "personality",
          "ideals",
          "bonds",
          "flaws",
          "backstory",
          "goals",
          "allies",
          "notes",
          "lore",
          "adaptation",
        ]),
      ),
      section("Rules and choices", [
        ...choiceKeys
          .filter((k) => f[k])
          .map((k) => {
            const c = choiceRef(s, k);
            return [
              labels[k],
              [f[k], c.source, c.url, c.notes].filter(Boolean).join("\n"),
            ] as Row;
          }),
        ...fields(["choices"]),
        ...(f.race === "Half-Elf"
          ? [
              [
                "Flexible ability increases",
                [s.refs.halfElf1, s.refs.halfElf2].filter(Boolean).join(", "),
              ] as Row,
            ]
          : []),
      ]),
      section(
        "Manual overrides",
        Object.entries(s.overrides).filter(([, v]) => v !== ""),
      ),
      section(
        "Roll history",
        s.history.map((v) => ["Roll", v]),
      ),
    ],
  };
}
