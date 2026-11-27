import { useId, type ReactNode } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  ABILITIES,
  BACKGROUNDS,
  CLASSES,
  RACES,
  SKILLS,
  SPELLS,
  WEAPONS,
  FEATS,
  SRD_PDF,
  type Ability,
} from "./rules";
import {
  armor,
  boundedLevel,
  choiceRef,
  derive,
  groupNames,
  labels,
  lookup,
  newEntry,
  safeURL,
  signed,
  sources,
  type Entry,
  type Field,
  type Group,
  type Sheet,
} from "./model";
import { portraitFile } from "./storage";
export const steps = [
  "Identity",
  "Species",
  "Class",
  "Subclass",
  "Background",
  "Ability scores",
  "Skills & saves",
  "Combat & equipment",
  "Spells & features",
  "Personality & story",
  "Review",
];
const priorities: Record<string, string[]> = {
  Barbarian: ["STR", "CON", "DEX"],
  Bard: ["CHA", "DEX", "CON"],
  Cleric: ["WIS", "CON", "STR"],
  Druid: ["WIS", "CON", "DEX"],
  Fighter: ["STR", "CON", "DEX"],
  Monk: ["DEX", "WIS", "CON"],
  Paladin: ["STR", "CHA", "CON"],
  Ranger: ["DEX", "WIS", "CON"],
  Rogue: ["DEX", "CON", "INT"],
  Sorcerer: ["CHA", "CON", "DEX"],
  Warlock: ["CHA", "CON", "DEX"],
  Wizard: ["INT", "CON", "DEX"],
};
const explain = [
  "Give this adventurer a name and a place in your campaign.",
  "Choose a species or enter one from your own world.",
  "Your class sets your hit die and starting saving throw proficiencies.",
  "Check when your class gains its subclass.",
  "Your background describes life before adventuring.",
  "Start with the standard array. Assign the six base scores in any order.",
  "Proficiency adds your proficiency bonus. Expertise doubles that bonus for a skill.",
  "Track your defenses, attacks, possessions and current health.",
  "Record the magic and special abilities your character can use.",
  "Keep the details you want at the table.",
  "Check the numbers and finish your sheet.",
];
type Props = {
  s: Sheet;
  change: (v: Sheet) => void;
  step: number;
  setPortrait: (id: string, image: string) => void;
  report: (m: string) => void;
};
const glossary: Record<string, string> = {
  "Armor Class": "An attack must meet or exceed this number to hit.",
  "Hit points": "Your current health and maximum health.",
  Initiative: "Add this bonus to your d20 roll to determine combat order.",
  Perception: "Passive Perception equals 10 plus your Perception skill bonus.",
  Proficiency: "The bonus you add to rolls you are trained in.",
  Speed: "How far you can move on your turn.",
  "Temporary HP":
    "A separate buffer that takes damage before your current hit points.",
  Concentration: "Only one concentration spell can be maintained at a time.",
  "Remaining hit dice":
    "Hit dice can be spent to regain hit points during a short rest.",
};
type InputProps = {
  label: string;
  value: string;
  onChange: (s: string) => void;
  options?: readonly string[];
  suggest?: readonly string[];
  area?: boolean;
  type?: string;
  min?: number;
  max?: number;
  hint?: string;
  placeholder?: string;
};
export function Input({
  label,
  value,
  onChange,
  options,
  suggest,
  area,
  type = "text",
  min,
  max,
  hint,
  placeholder,
}: InputProps) {
  const id = useId();
  return (
    <label className={"field" + (area ? " wide" : "")}>
      <span id={id + "-label"} title={glossary[label]}>
        {label}
      </span>
      {options ? (
        <select
          aria-labelledby={id + "-label"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o || "Automatic"}
            </option>
          ))}
        </select>
      ) : area ? (
        <textarea
          aria-labelledby={id + "-label"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
        />
      ) : (
        <input
          aria-labelledby={id + "-label"}
          value={value}
          type={type}
          min={min}
          max={max}
          list={suggest ? id : undefined}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {suggest && (
        <datalist id={id}>
          {suggest.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Ref({ url }: { url: string }) {
  return safeURL(url) ? (
    <a href={url} target="_blank" rel="noreferrer">
      View rules / reference <ExternalLink size={13} />
    </a>
  ) : null;
}
export function Summary({ s }: { s: Sheet }) {
  const d = derive(s);
  return (
    <div className="stats">
      {[
        ["Armor Class", d.ac],
        ["Hit points", (s.f.hp || d.maxHP) + " / " + d.maxHP],
        ["Initiative", signed(d.initiative)],
        ["Perception", d.passive],
        ["Proficiency", signed(d.prof)],
        ["Speed", d.speed + " ft"],
      ].map(([k, v]) => (
        <div className="stat" key={k} title={glossary[k]}>
          <small>{k}</small>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}
export function Editor({ s, change, step, report, setPortrait }: Props) {
  const f = s.f,
    d = derive(s);
  const field = (k: Field, extra: Partial<InputProps> = {}) => (
    <Input
      key={k}
      label={labels[k]}
      value={f[k]}
      onChange={(v) => change({ ...s, f: { ...f, [k]: v } })}
      {...extra}
    />
  );
  const override = (k: string, label: string, auto: number | undefined) => (
    <Input
      key={k}
      label={label + " override"}
      type="number"
      value={s.overrides[k] || ""}
      placeholder={"Auto " + (auto ?? "—")}
      onChange={(v) => change({ ...s, overrides: { ...s.overrides, [k]: v } })}
    />
  );
  const fields = (children: ReactNode) => (
    <div className="fields">{children}</div>
  );
  const many = (keys: Field[]) =>
    fields(keys.map((k) => field(k, { area: true })));
  function choice(
    key: "race" | "className" | "subclass" | "background",
    names: string[],
  ) {
    const info = choiceRef(s, key);
    const changeValue = (v: string) => {
      const refs = { ...s.refs };
      for (const tail of ["Source", "URL", "Notes"]) delete refs[key + tail];
      const next = { ...f, [key]: v };
      if (key === "className" && d.c?.subclass === f.subclass) {
        next.subclass = "";
        for (const tail of ["Source", "URL", "Notes"])
          delete refs["subclass" + tail];
      }
      change({ ...s, f: next, refs });
    };
    const setRef = (tail: string, v: string) =>
      change({ ...s, refs: { ...s.refs, [key + tail]: v } });
    return (
      <>
        {fields(
          <>
            <Input
              label={labels[key]}
              value={f[key]}
              onChange={changeValue}
              suggest={names}
              placeholder="Search or type a custom option"
            />
            {f[key] && (
              <Input
                label="Rules source"
                value={info.source}
                options={sources}
                onChange={(v) => setRef("Source", v)}
              />
            )}
          </>,
        )}
        {f[key] && (
          <>
            <Ref url={info.url} />
            <details>
              <summary>Rule notes and reference link</summary>
              {fields(
                <>
                  <Input
                    label="Reference URL"
                    value={s.refs[key + "URL"] ?? info.url}
                    onChange={(v) => setRef("URL", v)}
                  />
                  <Input
                    label="Rules and adaptations"
                    value={info.notes}
                    area
                    onChange={(v) => setRef("Notes", v)}
                  />
                </>,
              )}
            </details>
          </>
        )}
      </>
    );
  }
  const updateEntry = (group: Group, i: number, patch: Partial<Entry>) =>
    change({
      ...s,
      groups: {
        ...s.groups,
        [group]: s.groups[group].map((old, j) =>
          i === j ? { ...old, ...patch } : old,
        ),
      },
    });
  function entries(g: Group) {
    const opts =
      g === "weapons"
        ? Object.keys(WEAPONS)
        : g === "spells"
          ? Object.keys(SPELLS)
          : g === "features"
            ? Object.keys(FEATS)
            : [];
    const add = () =>
      change({
        ...s,
        groups: { ...s.groups, [g]: [...s.groups[g], newEntry()] },
      });
    return (
      <section className="entries">
        <div className="section-head">
          <h3>{groupNames[g]}</h3>
          <button onClick={add}>
            <Plus size={15} /> Add{" "}
            {
              {
                weapons: "attack",
                items: "item",
                features: "feature",
                spells: "spell",
              }[g]
            }
          </button>
        </div>
        {s.groups[g].map((e, i) => {
          const set = (key: keyof Entry, v: string) =>
            updateEntry(g, i, { [key]: v });
          const input = (
            key: keyof Entry,
            label: string,
            extra: Partial<InputProps> = {},
          ) => (
            <Input
              label={label}
              value={e[key]}
              onChange={(v) => set(key, v)}
              {...extra}
            />
          );
          function name(v: string) {
            const w = lookup(WEAPONS, v),
              sp = lookup(SPELLS, v),
              feat = lookup(FEATS, v);
            const patch: Partial<Entry> = { name: v };
            if (g === "weapons" && w)
              Object.assign(patch, {
                dice: w.dice,
                ability: w.finesse
                  ? d.mods.DEX > d.mods.STR
                    ? "DEX"
                    : "STR"
                  : w.ability,
                source: "SRD 5.1",
                url: SRD_PDF,
              });
            if (g === "spells" && sp)
              Object.assign(patch, {
                level: String(sp.level),
                description: sp.description,
                source: "SRD 5.1",
                url: sp.ref || SRD_PDF,
              });
            if (g === "features" && feat)
              Object.assign(patch, {
                source: "SRD 5.1",
                url: feat.ref || SRD_PDF,
                description: "Prerequisite: " + feat.prerequisite,
              });
            updateEntry(g, i, patch);
          }
          return (
            <article className="item" key={e.id}>
              <div className="section-head">
                <strong>
                  {e.name ||
                    "New " +
                      {
                        weapons: "attack",
                        items: "item",
                        features: "feature",
                        spells: "spell",
                      }[g]}
                </strong>
                <button
                  aria-label={"Remove " + (e.name || "entry")}
                  onClick={() =>
                    change({
                      ...s,
                      groups: {
                        ...s.groups,
                        [g]: s.groups[g].filter((_, j) => i !== j),
                      },
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {fields(
                <>
                  <Input
                    label="Entry name"
                    value={e.name}
                    onChange={name}
                    suggest={opts.length ? opts : undefined}
                  />
                  {g === "items" &&
                    input("quantity", "Quantity", { type: "number", min: 0 })}
                  {g === "weapons" && (
                    <>
                      {input("ability", "Attack ability", {
                        options: ABILITIES,
                      })}
                      {input("dice", "Damage dice", { placeholder: "1d8" })}
                      {input("proficient", "Proficient with weapon", {
                        options: ["yes", "no"],
                      })}
                      {input("bonus", "Attack bonus override", {
                        type: "number",
                        placeholder: signed(d.attack(e)),
                      })}
                      <p>
                        To hit <b>{signed(d.attack(e))}</b> · Damage {e.dice}{" "}
                        {signed(d.mods[e.ability as Ability] ?? 0)}
                      </p>
                    </>
                  )}
                  {g === "spells" && (
                    <>
                      {input("level", "Spell level (0 for cantrip)", {
                        type: "number",
                        min: 0,
                        max: 9,
                      })}
                      {input("status", "Spell status", {
                        options: [
                          "Known",
                          "Prepared",
                          "Always prepared",
                          "Spellbook",
                          "Innate",
                        ],
                      })}
                    </>
                  )}
                  {g === "features" &&
                    input("uses", "Uses remaining / recharge")}
                  {input("description", "Description and notes", {
                    area: true,
                  })}
                  {input("source", "Source", { options: sources })}
                  {input("url", "Rules reference URL")}
                </>,
              )}
              <Ref url={e.url} />
            </article>
          );
        })}
      </section>
    );
  }
  const rank = (k: string, value: string, opts: string[]) => (
    <label className="field" key={k}>
      <span>
        {k.replace("save:", "")}{" "}
        <strong>
          {signed(k.startsWith("save:") ? d.saves[k.slice(5)] : d.skills[k])}
        </strong>
      </span>
      <select
        aria-label={k + " proficiency"}
        value={s.ranks[k] ?? "auto"}
        onChange={(e) => {
          const ranks = { ...s.ranks };
          if (e.target.value === "auto") delete ranks[k];
          else ranks[k] = e.target.value;
          change({ ...s, ranks });
        }}
      >
        <option value="auto">Auto · {opts[Number(value)]}</option>
        {opts.map((v, i) => (
          <option key={v} value={i}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
  const content = [
    <>
      {fields(
        <>
          {field("name")}
          {field("level", {
            type: "number",
            min: 1,
            max: 20,
            onChange: (v) =>
              change({
                ...s,
                f: {
                  ...f,
                  level: v
                    ? String(Math.min(20, Math.max(1, Math.trunc(Number(v)))))
                    : "1",
                },
              }),
          })}
          {field("campaign")}
          {field("timeline")}
          {field("alignment")}
          {field("xp", { type: "number", min: 0 })}
          {field("edition", {
            hint: "Automatic calculations use the 2014 rules.",
          })}
        </>,
      )}
      <label className="field">
        Character portrait
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file)
              try {
                const portrait = await portraitFile(file);
                setPortrait(s.id, portrait);
              } catch (err) {
                report(String(err));
              }
          }}
        />
      </label>
      {s.portrait && (
        <>
          <img className="portrait" src={s.portrait} alt="Character portrait" />
          <button onClick={() => change({ ...s, portrait: "" })}>
            Remove portrait
          </button>
        </>
      )}
    </>,
    <>
      {choice("race", Object.keys(RACES))}
      {d.r && (
        <div className="notice">
          <b>{d.r.speed} ft walking speed</b>
          <p>
            {Object.entries(d.r.bonuses)
              .map(([a, v]) => a + " +" + v)
              .join(" · ")}
          </p>
          <p>{d.r.traits.join(" · ")}</p>
        </div>
      )}
      {f.race === "Half-Elf" &&
        fields(
          [1, 2].map((i) => (
            <Input
              key={i}
              label={"Flexible +1 ability " + i}
              value={s.refs["halfElf" + i] || ""}
              options={[
                "",
                ...ABILITIES.filter(
                  (a) => a !== "CHA" && a !== s.refs["halfElf" + (3 - i)],
                ),
              ]}
              onChange={(v) =>
                change({ ...s, refs: { ...s.refs, ["halfElf" + i]: v } })
              }
            />
          )),
        )}
      {field("choices", {
        area: true,
        hint: "Record selectable traits here and apply their choices in the relevant section.",
      })}
    </>,
    <>
      {choice("className", Object.keys(CLASSES))}
      {!d.c && (
        <p className="muted">
          Custom classes start with a suggested d8. Set hit dice, maximum HP,
          proficiencies and spellcasting for your own rules.
        </p>
      )}
      {d.c && (
        <div className="notice">
          d{d.c.die} hit die · {d.c.saves.join(" and ")} saving throws
          {d.c.casting ? " · " + d.c.casting + " spellcasting" : ""}
        </div>
      )}
    </>,
    <>
      {d.c && (
        <p>
          {f.className} chooses a subclass at level {d.c.subclassLevel}.
          {boundedLevel(s) < d.c.subclassLevel
            ? " You can leave this blank for now."
            : ""}
        </p>
      )}
      {choice(
        "subclass",
        d.c && boundedLevel(s) >= d.c.subclassLevel ? [d.c.subclass] : [],
      )}
    </>,
    <>
      {choice("background", Object.keys(BACKGROUNDS))}
      {lookup(BACKGROUNDS, f.background) && (
        <p>
          Skill proficiencies applied:{" "}
          {BACKGROUNDS[f.background].skills.join(" and ")}.
        </p>
      )}
    </>,
    <>
      <p className="muted">
        STR Strength · DEX Dexterity · CON Constitution · INT Intelligence · WIS
        Wisdom · CHA Charisma
      </p>
      {lookup(priorities, f.className) && (
        <button
          onClick={() => {
            const order = [
              ...new Set([...priorities[f.className], ...ABILITIES]),
            ];
            const scores = Object.fromEntries(
              order.map((a, i) => [a, ["15", "14", "13", "12", "10", "8"][i]]),
            ) as Sheet["scores"];
            change({ ...s, scores });
          }}
        >
          Use suggested {f.className} array
        </button>
      )}
      {fields(
        ABILITIES.map((a) => (
          <Input
            key={a}
            label={a + " base score"}
            value={s.scores[a]}
            type="number"
            min={1}
            max={30}
            hint={"Final " + d.scores[a] + " · modifier " + signed(d.mods[a])}
            onChange={(v) => change({ ...s, scores: { ...s.scores, [a]: v } })}
          />
        )),
      )}
      <details>
        <summary>Ability modifier overrides</summary>
        {fields(ABILITIES.map((a) => override("mod:" + a, a, d.mods[a])))}
      </details>
    </>,
    <>
      <h3>Saving throws</h3>
      {fields(
        ABILITIES.map((a) =>
          rank("save:" + a, d.saveRank(a), ["Untrained", "Proficient"]),
        ),
      )}
      <h3>Skills</h3>
      {fields(
        Object.keys(SKILLS).map((k) =>
          rank(k, d.skillRank(k), ["Untrained", "Proficient", "Expertise"]),
        ),
      )}
      {field("proficiencies", { area: true })}
      <details>
        <summary>Skill, save and proficiency overrides</summary>
        {fields(
          <>
            {override("prof", "Proficiency bonus", d.prof)}
            {ABILITIES.map((a) =>
              override("save:" + a, a + " save", d.saves[a]),
            )}
            {Object.keys(SKILLS).map((k) =>
              override("skill:" + k, k, d.skills[k]),
            )}
          </>,
        )}
      </details>
    </>,
    <>
      <Summary s={s} />
      {fields(
        <>
          {field("armor", { options: Object.keys(armor) })}
          {field("shield", { options: ["No", "Yes"] })}
          {field("hp", {
            type: "number",
            min: 0,
            placeholder: String(d.maxHP),
          })}
          {field("temp", { type: "number", min: 0 })}
          {field("hitDice", { placeholder: boundedLevel(s) + "d" + d.die })}
          {field("success", { options: ["0", "1", "2", "3"] })}
          {field("failure", { options: ["0", "1", "2", "3"] })}
          {field("conditions")}
          {field("resistances")}
        </>,
      )}
      <details>
        <summary>Combat overrides</summary>
        {fields(
          <>
            {override("ac", "Armor Class", d.ac)}
            {override("maxHP", "Maximum HP", d.maxHP)}
            {override("initiative", "Initiative", d.initiative)}
            {override("speed", "Speed", d.speed)}
            {override("passive", "Passive Perception", d.passive)}
          </>,
        )}
      </details>
      {entries("weapons")}
      {entries("items")}
      {field("currency")}
    </>,
    <>
      {fields(
        <>
          {field("casting", { options: ["", "None", ...ABILITIES] })}
          {field("concentration")}
          {d.slots.map((x) => (
            <Input
              key={x.level}
              label={"Level " + x.level + " slots remaining"}
              type="number"
              min={0}
              max={x.total}
              hint={"Capacity " + x.total}
              value={String(x.left)}
              onChange={(v) =>
                change({
                  ...s,
                  refs: { ...s.refs, ["slot:" + (x.level - 1)]: v },
                })
              }
            />
          ))}
          {field("slots", {
            area: true,
            hint: "Additional slots and homebrew adjustments.",
          })}
        </>,
      )}
      <p>
        Spell attack {d.spellAttack === undefined ? "—" : signed(d.spellAttack)}{" "}
        · Save DC {d.dc ?? "—"}
      </p>
      <details>
        <summary>Spellcasting overrides</summary>
        {fields(
          <>
            {override("spellAttack", "Spell attack", d.spellAttack)}
            {override("dc", "Spell save DC", d.dc)}
          </>,
        )}
      </details>
      {entries("spells")}
      {d.classFeatures.length > 0 && (
        <details>
          <summary>
            Class and subclass features at level {boundedLevel(s)} (
            {d.classFeatures.length})
          </summary>
          <ul>
            {d.classFeatures.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p className="muted">
            Record your choices, uses and table rulings below.
          </p>
        </details>
      )}
      {entries("features")}
    </>,
    many([
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
    <>
      <h3>{f.name || "Unnamed adventurer"}</h3>
      <p>
        {[f.race, f.className, f.subclass, f.background]
          .filter(Boolean)
          .join(" · ") || "Custom adventurer"}{" "}
        · Level {boundedLevel(s)}
      </p>
      <Summary s={s} />
      <p>
        {s.groups.weapons.length} attacks · {s.groups.spells.length} spells ·{" "}
        {s.groups.items.length} inventory entries
      </p>
      <p className="muted">
        Review optional choices, equipment and features with your DM before
        play.
      </p>
    </>,
  ];
  return (
    <>
      <div className="section-head">
        <h2>{steps[step]}</h2>
      </div>
      <p className="muted">{explain[step]}</p>
      {content[step]}
    </>
  );
}
