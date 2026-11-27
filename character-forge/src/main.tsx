import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Anvil,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Copy,
  Dice5,
  Download,
  Feather,
  FilePlus2,
  Library,
  Moon,
  Plus,
  Shield,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { Editor, steps } from "./editor";
import { newSheet, uid, type Sheet } from "./model";
import { backup, download, loadAll, persist, readBackup } from "./storage";
import { PdfTools, Roller, Modal } from "./tools";
import { SRD_PDF } from "./rules";
import "./style.css";

function App() {
  const [all, setAll] = useState<Sheet[]>([]),
    [ready, setReady] = useState(false),
    [active, setActive] = useState(""),
    [step, setStep] = useState(0),
    [wizard, setWizard] = useState(false);
  const [query, setQuery] = useState(""),
    [folder, setFolder] = useState(""),
    [tool, setTool] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const latest = useRef(all);
  latest.current = all;
  const [light, setLight] = useState(() => {
    try {
      return localStorage.getItem("forge-theme") === "light";
    } catch {
      return false;
    }
  });
  const importRef = useRef<HTMLInputElement>(null),
    revision = useRef(0),
    [removing, removeSet] = useState<Sheet | null>(null);
  const s = all.find((x) => x.id === active);
  useEffect(() => {
    loadAll()
      .then((v) => {
        setAll(v);
        setReady(true);
      })
      .catch((e) =>
        setError(
          "Browser storage could not open. Allow site storage and refresh. " +
            e,
        ),
      );
  }, []);
  const go = (i: number) => {
    setStep(i);
    window.scrollTo(0, 0);
  };
  function enter(sheet: Sheet, guided: boolean) {
    setActive(sheet.id);
    setWizard(guided);
    go(0);
    setTool("");
  }
  function library() {
    setActive("");
    setTool("");
    window.scrollTo(0, 0);
  }
  function save(sheet: Sheet) {
    const v = { ...sheet, edited: new Date().toISOString() };
    const token = ++revision.current;
    setAll((list) => [v, ...list.filter((x) => x.id !== v.id)]);
    setStatus("Saving…");
    persist([v])
      .then(() => {
        if (revision.current === token) setStatus("Saved on this device");
      })
      .catch((e) => {
        setError("Saving failed. Export a JSON backup before closing. " + e);
        setStatus("Save failed");
      });
  }
  function create(guided: boolean) {
    const v = newSheet();
    save(v);
    enter(v, guided);
  }
  function duplicate(v: Sheet) {
    const copy = structuredClone(v);
    copy.id = uid();
    copy.f.name = (v.f.name || "Character") + " (copy)";
    save(copy);
    enter(copy, false);
  }
  async function remove() {
    if (!removing) return;
    try {
      await persist([], removing.id);
      setAll((list) => list.filter((x) => x.id !== removing.id));
      removeSet(null);
      setStatus("Character deleted");
    } catch (e) {
      setError(String(e));
    }
  }
  function json(items: Sheet[], name: string) {
    download(
      new Blob([backup(items)], { type: "application/json" }),
      name + ".json",
    );
  }
  async function restore(file: File) {
    try {
      const incoming = readBackup(await file.text()),
        used = new Set(all.map((x) => x.id));
      for (const v of incoming) {
        if (used.has(v.id)) v.id = uid();
        used.add(v.id);
      }
      await persist(incoming);
      setAll((prev) => [...incoming, ...prev]);
      setStatus(
        "Imported " +
          incoming.length +
          " character" +
          (incoming.length === 1 ? "" : "s"),
      );
      setError("");
    } catch (e) {
      setError("Import failed. " + String(e));
    }
  }
  const filtered = all
    .filter(
      (x) =>
        (!folder || x.f.campaign === folder) &&
        [x.f.name, x.f.className, x.f.race, x.f.campaign, x.f.timeline]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.edited.localeCompare(a.edited));
  const die = <Dice5 size={18} />;
  return (
    <div className="forge" data-theme={light ? "light" : "dark"}>
      <header className="topbar">
        <button className="brand" onClick={library}>
          <span className="brand-icon">
            <Anvil size={22} />
          </span>
          Character Forge
        </button>
        <div className="bar-actions">
          <a href="./dnd.html">PMOG campaign</a>
          <button
            className="icon-btn"
            aria-label={light ? "Dark mode" : "Light mode"}
            onClick={() => {
              setLight(!light);
              try {
                localStorage.setItem("forge-theme", light ? "dark" : "light");
              } catch {}
            }}
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </header>
      <main className="container">
        {error && (
          <div className="notice error" role="alert">
            {error} <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}
        {!s ? (
          <>
            <section className="hero">
              <p className="eyebrow">Dungeons &amp; Dragons · 5e 2014</p>
              <h1>Character Forge</h1>
              <p>
                Build your adventurer, keep track of each session, and bring a
                character sheet to the table.
              </p>
              <div className="hero-actions">
                <button
                  className="primary"
                  disabled={!ready}
                  onClick={() => create(true)}
                >
                  <Plus size={18} /> Create character
                </button>
                <button
                  className="secondary"
                  disabled={!ready}
                  onClick={() => create(false)}
                >
                  <Feather size={17} /> Advanced editor
                </button>
              </div>
            </section>
            <div className="section-head">
              <div>
                <p className="eyebrow">Campaign records</p>
                <h2>Your library</h2>
              </div>
              <div className="actions">
                <button
                  disabled={!ready}
                  onClick={() => importRef.current?.click()}
                >
                  <Upload size={16} /> Import JSON
                </button>
                <button
                  disabled={!all.length}
                  onClick={() => json(all, "Character_Forge_Backup")}
                >
                  <Download size={16} /> Back up library
                </button>
              </div>
            </div>
            {all.length > 0 && (
              <div className="toolbar">
                <label className="field">
                  <span>Search characters</span>
                  <input
                    type="search"
                    placeholder="Name, class or campaign"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label className="field">
                  Campaign folder
                  <select
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                  >
                    <option value="">All campaigns</option>
                    {Array.from(
                      new Set(all.map((x) => x.f.campaign).filter(Boolean)),
                    )
                      .sort()
                      .map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                  </select>
                </label>
              </div>
            )}
            {filtered.length ? (
              <div className="cards">
                {filtered.map((v) => (
                  <article key={v.id} className="character-card">
                    {v.portrait ? (
                      <img className="portrait" alt="" src={v.portrait} />
                    ) : (
                      <div className="portrait">
                        <Shield size={26} />
                      </div>
                    )}
                    <span className="badge">Level {v.f.level}</span>
                    <h3>{v.f.name || "Unnamed adventurer"}</h3>
                    <p>
                      {[v.f.race, v.f.className, v.f.subclass]
                        .filter(Boolean)
                        .join(" · ") || "Custom adventurer"}
                    </p>
                    <p className="muted">
                      {[v.f.background, v.f.campaign, v.f.timeline, v.f.edition]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <small>
                      Edited {new Date(v.edited).toLocaleDateString()}
                    </small>
                    <div className="card-actions">
                      <button onClick={() => enter(v, false)}>
                        Open sheet <ArrowRight size={15} />
                      </button>
                      <button
                        aria-label={"Duplicate " + v.f.name}
                        onClick={() => duplicate(v)}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        aria-label={"Delete " + v.f.name}
                        onClick={() => removeSet(v)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <BookOpen />
                <h3>
                  {all.length
                    ? "No matching characters"
                    : ready
                      ? "Your first adventure starts here"
                      : "Opening your library…"}
                </h3>
                <p>
                  {all.length
                    ? "Try a different name or campaign."
                    : "Create a character with the guided builder or import a Character Forge backup."}
                </p>
              </div>
            )}
            <div className="actions library-pdf">
              <button onClick={() => setTool("blank")}>
                <FilePlus2 size={16} /> Blank printable sheet
              </button>
              <button
                disabled={!all.length}
                onClick={() => setTool("collection")}
              >
                <Library size={16} /> Library PDF
              </button>
            </div>
            <p className="storage-note muted">
              Characters are saved in this browser. Back up your library before
              clearing site data or moving devices.
            </p>
          </>
        ) : (
          <>
            <button onClick={library}>
              <ArrowLeft size={16} /> Library
            </button>
            <header className="editor-head">
              <div>
                <p className="eyebrow">
                  {wizard ? "Guided builder" : "Character sheet"} · Level{" "}
                  {s.f.level}
                </p>
                <h1>{s.f.name || "Unnamed adventurer"}</h1>
                <p className="muted">
                  {[s.f.campaign, s.f.timeline].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="sheet-actions">
                <button className="primary" onClick={() => setTool("pdf")}>
                  <Download size={17} /> Download PDF
                </button>
                <button onClick={() => setTool("dice")}>{die} Roll dice</button>
                <button
                  onClick={() =>
                    json(
                      [s],
                      (s.f.name || "Character").replace(
                        /[^\p{L}\p{N}_-]+/gu,
                        "_",
                      ),
                    )
                  }
                >
                  Export JSON
                </button>
              </div>
            </header>
            <div className="sheet-layout">
              <nav className="sidebar" aria-label="Sheet sections">
                {steps.map((title, i) => (
                  <button
                    className={"step" + (i === step ? " active" : "")}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => go(i)}
                    key={title}
                  >
                    {wizard ? i + 1 + ". " : ""}
                    {title}
                  </button>
                ))}
              </nav>
              <section className="panel">
                <Editor
                  key={s.id}
                  s={s}
                  change={save}
                  step={step}
                  report={setError}
                  setPortrait={(id, portrait) => {
                    const current = latest.current.find((v) => v.id === id);
                    if (current) save({ ...current, portrait });
                  }}
                />
                <div className="sheet-footer">
                  {wizard && step > 0 && (
                    <button onClick={() => go(step - 1)}>
                      <ArrowLeft size={15} /> Back
                    </button>
                  )}
                  {wizard && step < 10 ? (
                    <button className="primary" onClick={() => go(step + 1)}>
                      Next <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button className="primary" onClick={library}>
                      Save and return to library
                    </button>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
        <p role="status" className="muted">
          {status}
        </p>
        <footer className="credits">
          <a href="https://dnd5e.wikidot.com/" target="_blank" rel="noreferrer">
            5e rules wiki
          </a>{" "}
          · Rules adapted from the{" "}
          <a href={SRD_PDF}>System Reference Document 5.1</a> by Wizards of the
          Coast LLC, available under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
        </footer>
      </main>
      <input
        ref={importRef}
        hidden
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void restore(f);
        }}
      />
      {tool === "dice" && s && (
        <Roller s={s} change={save} close={() => setTool("")} />
      )}
      {["pdf", "blank", "collection"].includes(tool) && (
        <PdfTools
          sheets={tool === "collection" ? all : s ? [s] : []}
          blank={tool === "blank"}
          close={() => setTool("")}
        />
      )}
      {removing && (
        <Modal title="Delete character?" close={() => removeSet(null)}>
          <p>This removes {removing.f.name} from this browser’s library.</p>
          <div className="actions">
            <button onClick={() => removeSet(null)}>Keep character</button>
            <button onClick={remove}>Delete character</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
