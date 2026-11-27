import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dice5, Download, Eye, Printer, X } from "lucide-react";
import { Input } from "./editor";
import { derive, rollDice, signed, toPrint, type Sheet } from "./model";
import { ABILITIES, SKILLS, type Ability } from "./rules";
import { makePDF, type PdfOptions } from "./pdf";
import { download } from "./storage";
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog className="modal" ref={ref} aria-label={title} onCancel={close}>
      <div className="section-head">
        <h2>{title}</h2>
        <button onClick={close} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PdfTools({
  sheets,
  blank,
  close,
}: {
  sheets: Sheet[];
  blank: boolean;
  close: () => void;
}) {
  const [options, setOptions] = useState<PdfOptions>({
    mode: blank ? "blank" : "full",
    paper: "a4",
    portrait: true,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, previewSet] = useState("");
  const frame = useRef<HTMLIFrameElement>(null),
    wantPrint = useRef(false);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function opt(v: Partial<PdfOptions>) {
    setOptions({ ...options, ...v });
    previewSet("");
    wantPrint.current = false;
  }
  async function output(action: "download" | "preview" | "print") {
    setBusy(true);
    setError("");
    try {
      const bytes = await makePDF(sheets.map(toPrint), options);
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });
      const stem =
        options.mode === "blank"
          ? "Blank_5e_Sheet"
          : sheets.length === 1
            ? (sheets[0].f.name || "Character").replace(
                /[^\p{L}\p{N}-]+/gu,
                "_",
              ) +
              "_Level_" +
              sheets[0].f.level
            : "Character_Library";
      if (action === "download") download(blob, stem + ".pdf");
      else {
        wantPrint.current = action === "print";
        previewSet(URL.createObjectURL(blob));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Export PDF" close={close}>
      <div className="fields">
        <label className="field">
          Sheet format
          <select
            aria-label="Sheet format"
            value={options.mode}
            onChange={(e) =>
              opt({ mode: e.target.value as PdfOptions["mode"] })
            }
          >
            {!blank && (
              <>
                <option value="full">Full character sheet</option>
                <option value="compact">Compact session sheet</option>
              </>
            )}
            <option value="blank">Blank printable sheet</option>
          </select>
        </label>
        <label className="field">
          Paper
          <select
            aria-label="Paper"
            value={options.paper}
            onChange={(e) =>
              opt({ paper: e.target.value as PdfOptions["paper"] })
            }
          >
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </label>
      </div>
      {options.mode !== "blank" && (
        <label>
          <input
            type="checkbox"
            checked={options.portrait}
            onChange={(e) => opt({ portrait: e.target.checked })}
          />{" "}
          Include portraits
        </label>
      )}
      <div className="actions">
        <button
          className="primary"
          disabled={busy}
          onClick={() => output("download")}
        >
          <Download /> Download PDF
        </button>
        <button disabled={busy} onClick={() => output("preview")}>
          <Eye /> Preview
        </button>
        <button disabled={busy} onClick={() => output("print")}>
          <Printer /> Print
        </button>
      </div>
      {busy && <p role="status">Preparing pages…</p>}
      {error && <p role="alert">{error}</p>}
      {preview && (
        <>
          <iframe
            ref={frame}
            title="PDF preview"
            src={preview}
            onLoad={() => {
              if (wantPrint.current) {
                wantPrint.current = false;
                try {
                  frame.current?.contentWindow?.focus();
                  frame.current?.contentWindow?.print();
                } catch {
                  setError("Open the PDF below and use its Print button.");
                }
              }
            }}
          />
          <a href={preview} target="_blank" rel="noreferrer">
            Open PDF in a new tab
          </a>
        </>
      )}
    </Modal>
  );
}
export function Roller({
  s,
  change,
  close,
}: {
  s: Sheet;
  change: (v: Sheet) => void;
  close: () => void;
}) {
  const [kind, kindSet] = useState("Dice"),
    [selected, select] = useState("d20"),
    [mode, setMode] = useState("Normal"),
    [error, setError] = useState("");
  const d = derive(s),
    weapons = s.groups.weapons;
  const choices: Record<string, string[]> = {
    Dice: ["d4", "d6", "d8", "d10", "d12", "d20", "d100"],
    "Ability check": [...ABILITIES],
    "Skill check": Object.keys(SKILLS),
    "Saving throw": [...ABILITIES],
    Attack: [
      ...weapons.map((w) => w.id),
      ...(d.spellAttack !== undefined ? ["Spell attack"] : []),
    ],
    Damage: weapons.map((w) => w.id),
  };
  const changeKind = (v: string) => {
    kindSet(v);
    select(choices[v][0] || "");
    setError("");
  };
  function roll() {
    try {
      let expr = "1d20",
        bonus = 0,
        title = selected;
      const weapon = weapons.find((w) => w.id === selected);
      if (kind === "Dice") expr = "1" + selected;
      if (kind === "Ability check")
        bonus = d.mods[selected as Ability] + d.jack;
      if (kind === "Skill check") bonus = d.skills[selected];
      if (kind === "Saving throw") bonus = d.saves[selected];
      if (kind === "Attack" && selected === "Spell attack")
        bonus = d.spellAttack ?? 0;
      if (weapon) {
        title = weapon.name;
        if (kind === "Attack") bonus = d.attack(weapon);
        else {
          expr = weapon.dice;
          bonus = d.mods[weapon.ability as Ability] ?? 0;
        }
      }
      const a = rollDice(expr),
        double = kind !== "Damage" && expr === "1d20" && mode !== "Normal",
        b = double ? rollDice(expr) : null;
      const best = b
        ? (mode === "Advantage" ? Math.max : Math.min)(a.total, b.total)
        : a.total;
      const line =
        kind +
        " · " +
        title +
        " = " +
        (best + bonus) +
        "  (" +
        [a.rolls.join("+"), ...(b ? [b.rolls.join("+")] : [])].join(" / ") +
        (a.bonus + bonus ? " " + signed(a.bonus + bonus) : "") +
        (double ? " · " + mode : "") +
        ")";
      change({ ...s, history: [line, ...s.history].slice(0, 100) });
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <Modal close={close} title="Dice tray">
      <div className="fields">
        <Input
          label="Roll type"
          options={Object.keys(choices)}
          value={kind}
          onChange={changeKind}
        />
        <label className="field">
          Roll for
          <select
            aria-label="Roll for"
            value={selected}
            onChange={(e) => select(e.target.value)}
          >
            {choices[kind].map((x) => (
              <option key={x} value={x}>
                {weapons.find((w) => w.id === x)?.name || x}
              </option>
            ))}
          </select>
        </label>
        {kind !== "Damage" && (kind !== "Dice" || selected === "d20") && (
          <Input
            label="Roll mode"
            options={["Normal", "Advantage", "Disadvantage"]}
            value={mode}
            onChange={setMode}
          />
        )}
      </div>
      <button className="primary" onClick={roll} disabled={!selected}>
        <Dice5 /> Roll
      </button>
      {!selected && <p>Add an attack under Combat &amp; equipment first.</p>}
      {error && <p role="alert">{error}</p>}
      <ol className="roll-history" aria-live="polite">
        {s.history.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ol>
    </Modal>
  );
}
