import spells from "./srd-data.json";

// Adapted from the 2014 rules in SRD 5.1. See SOURCES.md.
export const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
export type Ability = (typeof ABILITIES)[number];
export const SKILLS: Record<string, Ability> = {
  Acrobatics: "DEX",
  "Animal Handling": "WIS",
  Arcana: "INT",
  Athletics: "STR",
  Deception: "CHA",
  History: "INT",
  Insight: "WIS",
  Intimidation: "CHA",
  Investigation: "INT",
  Medicine: "WIS",
  Nature: "INT",
  Perception: "WIS",
  Performance: "CHA",
  Persuasion: "CHA",
  Religion: "INT",
  "Sleight of Hand": "DEX",
  Stealth: "DEX",
  Survival: "WIS",
};

export const SRD_PDF =
  "https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf";
const wiki = "https://dnd5e.wikidot.com/";

type ClassRules = {
  saves: Ability[];
  die: number;
  casting?: Ability;
  subclass: string;
  subclassLevel: number;
  ref: string;
  subclassRef: string;
};

export const CLASSES: Record<string, ClassRules> = {
  Barbarian: {
    saves: ["STR", "CON"],
    die: 12,
    subclass: "Path of the Berserker",
    subclassLevel: 3,
    ref: wiki + "barbarian",
    subclassRef: wiki + "barbarian:berserker",
  },
  Bard: {
    saves: ["DEX", "CHA"],
    die: 8,
    casting: "CHA",
    subclass: "College of Lore",
    subclassLevel: 3,
    ref: wiki + "bard",
    subclassRef: wiki + "bard:lore",
  },
  Cleric: {
    saves: ["WIS", "CHA"],
    die: 8,
    casting: "WIS",
    subclass: "Life Domain",
    subclassLevel: 1,
    ref: wiki + "cleric",
    subclassRef: wiki + "cleric:life",
  },
  Druid: {
    saves: ["INT", "WIS"],
    die: 8,
    casting: "WIS",
    subclass: "Circle of the Land",
    subclassLevel: 2,
    ref: wiki + "druid",
    subclassRef: wiki + "druid:land",
  },
  Fighter: {
    saves: ["STR", "CON"],
    die: 10,
    subclass: "Champion",
    subclassLevel: 3,
    ref: wiki + "fighter",
    subclassRef: wiki + "fighter:champion",
  },
  Monk: {
    saves: ["STR", "DEX"],
    die: 8,
    subclass: "Way of the Open Hand",
    subclassLevel: 3,
    ref: wiki + "monk",
    subclassRef: wiki + "monk:open-hand",
  },
  Paladin: {
    saves: ["WIS", "CHA"],
    die: 10,
    casting: "CHA",
    subclass: "Oath of Devotion",
    subclassLevel: 3,
    ref: wiki + "paladin",
    subclassRef: wiki + "paladin:devotion",
  },
  Ranger: {
    saves: ["STR", "DEX"],
    die: 10,
    casting: "WIS",
    subclass: "Hunter",
    subclassLevel: 3,
    ref: wiki + "ranger",
    subclassRef: wiki + "ranger:hunter",
  },
  Rogue: {
    saves: ["DEX", "INT"],
    die: 8,
    subclass: "Thief",
    subclassLevel: 3,
    ref: wiki + "rogue",
    subclassRef: wiki + "rogue:thief",
  },
  Sorcerer: {
    saves: ["CON", "CHA"],
    die: 6,
    casting: "CHA",
    subclass: "Draconic Bloodline",
    subclassLevel: 1,
    ref: wiki + "sorcerer",
    subclassRef: wiki + "sorcerer:draconic-bloodline",
  },
  Warlock: {
    saves: ["WIS", "CHA"],
    die: 8,
    casting: "CHA",
    subclass: "The Fiend",
    subclassLevel: 1,
    ref: wiki + "warlock",
    subclassRef: wiki + "warlock:fiend",
  },
  Wizard: {
    saves: ["INT", "WIS"],
    die: 6,
    casting: "INT",
    subclass: "School of Evocation",
    subclassLevel: 2,
    ref: wiki + "wizard",
    subclassRef: wiki + "wizard:evocation",
  },
};

type RaceRules = {
  speed: number;
  bonuses: Partial<Record<Ability, number>>;
  traits: string[];
  ref: string;
};
const dwarf: RaceRules = {
  speed: 25,
  bonuses: { CON: 2 },
  traits: [
    "Darkvision",
    "Dwarven Resilience",
    "Dwarven Combat Training",
    "Tool Proficiency (choose one)",
    "Stonecunning",
  ],
  ref: wiki + "lineage:dwarf",
};
const elf: RaceRules = {
  speed: 30,
  bonuses: { DEX: 2 },
  traits: [
    "Darkvision",
    "Keen Senses (Perception proficiency)",
    "Fey Ancestry",
    "Trance",
  ],
  ref: wiki + "lineage:elf",
};
const gnome: RaceRules = {
  speed: 25,
  bonuses: { INT: 2 },
  traits: ["Darkvision", "Gnome Cunning"],
  ref: wiki + "lineage:gnome",
};
const halfling: RaceRules = {
  speed: 25,
  bonuses: { DEX: 2 },
  traits: ["Lucky", "Brave", "Halfling Nimbleness"],
  ref: wiki + "lineage:halfling",
};
export const RACES: Record<string, RaceRules> = {
  Dragonborn: {
    speed: 30,
    bonuses: { STR: 2, CHA: 1 },
    traits: [
      "Draconic Ancestry (choose a dragon)",
      "Breath Weapon",
      "Damage Resistance (from ancestry)",
    ],
    ref: wiki + "lineage:dragonborn",
  },
  Dwarf: dwarf,
  "Hill Dwarf": {
    ...dwarf,
    bonuses: { CON: 2, WIS: 1 },
    traits: [...dwarf.traits, "Dwarven Toughness (+1 maximum HP per level)"],
  },
  Elf: elf,
  "High Elf": {
    ...elf,
    bonuses: { DEX: 2, INT: 1 },
    traits: [
      ...elf.traits,
      "Elf Weapon Training",
      "Cantrip (choose one wizard cantrip)",
      "Extra Language",
    ],
  },
  Gnome: gnome,
  "Rock Gnome": {
    ...gnome,
    bonuses: { INT: 2, CON: 1 },
    traits: [...gnome.traits, "Artificer’s Lore", "Tinker"],
  },
  "Half-Elf": {
    speed: 30,
    bonuses: { CHA: 2 },
    traits: [
      "Choose two other ability scores to increase by 1",
      "Darkvision",
      "Fey Ancestry",
      "Skill Versatility (choose two skills)",
    ],
    ref: wiki + "lineage:half-elf",
  },
  "Half-Orc": {
    speed: 30,
    bonuses: { STR: 2, CON: 1 },
    traits: [
      "Darkvision",
      "Menacing (Intimidation proficiency)",
      "Relentless Endurance",
      "Savage Attacks",
    ],
    ref: wiki + "lineage:half-orc",
  },
  Halfling: halfling,
  "Lightfoot Halfling": {
    ...halfling,
    bonuses: { DEX: 2, CHA: 1 },
    traits: [...halfling.traits, "Naturally Stealthy"],
  },
  Human: {
    speed: 30,
    bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    traits: ["Extra Language"],
    ref: wiki + "lineage:human",
  },
  Tiefling: {
    speed: 30,
    bonuses: { CHA: 2, INT: 1 },
    traits: ["Darkvision", "Hellish Resistance (fire)", "Infernal Legacy"],
    ref: wiki + "lineage:tiefling",
  },
};

export const BACKGROUNDS: Record<string, { skills: string[]; ref: string }> = {
  Acolyte: {
    skills: ["Insight", "Religion"],
    ref: wiki + "background:acolyte",
  },
};
export const FEATS = {
  Grappler: {
    prerequisite: "Strength 13 or higher",
    ref: wiki + "feat:grappler",
  },
};

export const SPELLS: Record<
  string,
  { level: number; description: string; ref?: string; classes?: string[] }
> = spells;

type Weapon = { dice: string; ability: Ability; finesse?: boolean };
export const WEAPONS: Record<string, Weapon> = {
  Club: { dice: "1d4", ability: "STR" },
  Dagger: { dice: "1d4", ability: "STR", finesse: true },
  Greatclub: { dice: "1d8", ability: "STR" },
  Handaxe: { dice: "1d6", ability: "STR" },
  Javelin: { dice: "1d6", ability: "STR" },
  "Light Hammer": { dice: "1d4", ability: "STR" },
  Mace: { dice: "1d6", ability: "STR" },
  Quarterstaff: { dice: "1d6", ability: "STR" },
  Sickle: { dice: "1d4", ability: "STR" },
  Spear: { dice: "1d6", ability: "STR" },
  "Light Crossbow": { dice: "1d8", ability: "DEX" },
  Dart: { dice: "1d4", ability: "DEX", finesse: true },
  Shortbow: { dice: "1d6", ability: "DEX" },
  Sling: { dice: "1d4", ability: "DEX" },
  Battleaxe: { dice: "1d8", ability: "STR" },
  Flail: { dice: "1d8", ability: "STR" },
  Glaive: { dice: "1d10", ability: "STR" },
  Greataxe: { dice: "1d12", ability: "STR" },
  Greatsword: { dice: "2d6", ability: "STR" },
  Halberd: { dice: "1d10", ability: "STR" },
  Lance: { dice: "1d12", ability: "STR" },
  Longsword: { dice: "1d8", ability: "STR" },
  Maul: { dice: "2d6", ability: "STR" },
  Morningstar: { dice: "1d8", ability: "STR" },
  Pike: { dice: "1d10", ability: "STR" },
  Rapier: { dice: "1d8", ability: "STR", finesse: true },
  Scimitar: { dice: "1d6", ability: "STR", finesse: true },
  Shortsword: { dice: "1d6", ability: "STR", finesse: true },
  Trident: { dice: "1d6", ability: "STR" },
  "War Pick": { dice: "1d8", ability: "STR" },
  Warhammer: { dice: "1d8", ability: "STR" },
  Whip: { dice: "1d4", ability: "STR", finesse: true },
  Blowgun: { dice: "1", ability: "DEX" },
  "Hand Crossbow": { dice: "1d6", ability: "DEX" },
  "Heavy Crossbow": { dice: "1d10", ability: "DEX" },
  Longbow: { dice: "1d8", ability: "DEX" },
};
