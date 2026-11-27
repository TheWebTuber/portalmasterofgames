import {
  newSheet,
  newEntry,
  labels,
  groupNames,
  type Sheet,
  type Group,
} from "./model";
import { ABILITIES } from "./rules";
let connection: Promise<IDBDatabase> | undefined;
function db() {
  if (!connection)
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("pmog-character-forge", 1);
      req.onupgradeneeded = () =>
        req.result.createObjectStore("characters", { keyPath: "id" });
      req.onsuccess = () => {
        req.result.onversionchange = () => {
          req.result.close();
          connection = undefined;
        };
        resolve(req.result);
      };
      req.onerror = () => {
        connection = undefined;
        reject(req.error);
      };
      req.onblocked = () =>
        reject(Error("Close other Character Forge tabs and reload."));
    });
  return connection;
}
export async function loadAll(): Promise<Sheet[]> {
  const d = await db();
  return new Promise((ok, no) => {
    const q = d.transaction("characters").objectStore("characters").getAll();
    q.onsuccess = () => ok(q.result);
    q.onerror = () => no(q.error);
  });
}
export async function persist(sheets: Sheet[], remove?: string) {
  const d = await db();
  return new Promise<void>((ok, no) => {
    const tx = d.transaction("characters", "readwrite"),
      store = tx.objectStore("characters");
    tx.oncomplete = () => ok();
    tx.onabort = () => no(tx.error || Error("Storage write cancelled"));
    tx.onerror = () => no(tx.error);
    for (const s of sheets) store.put(s);
    if (remove) store.delete(remove);
  });
}
export const backup = (characters: Sheet[]) =>
  JSON.stringify(
    { format: "character-forge", version: 1, characters },
    null,
    2,
  );
function record(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function requireValue(test: unknown): asserts test {
  if (!test)
    throw Error(
      "Invalid Character Forge backup. Your library was left intact.",
    );
}
function strings(v: unknown, keys?: string[]) {
  requireValue(record(v));
  const result: Record<string, string> = Object.create(null);
  for (const [k, t] of Object.entries(v)) {
    requireValue(
      typeof t === "string" &&
        !["__proto__", "constructor", "prototype"].includes(k),
    );
    if (!keys || keys.includes(k)) result[k] = t;
  }
  return result;
}
export function readBackup(raw: string): Sheet[] {
  const data = JSON.parse(raw);
  requireValue(
    record(data) &&
      data.format === "character-forge" &&
      data.version === 1 &&
      Array.isArray(data.characters),
  );
  return data.characters.map((v: unknown) => {
    requireValue(
      record(v) &&
        typeof v.id === "string" &&
        v.id &&
        typeof v.edited === "string" &&
        Number.isFinite(Date.parse(v.edited)) &&
        typeof v.portrait === "string" &&
        (!v.portrait ||
          /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v.portrait)),
    );
    const s = newSheet();
    const f = strings(v.f, Object.keys(labels));
    requireValue(
      typeof f.name === "string" && /^([1-9]|1\d|20)$/.test(f.level),
    );
    Object.assign(s, {
      id: v.id,
      edited: v.edited,
      portrait: v.portrait,
      f: { ...s.f, ...f },
      overrides: strings(v.overrides),
      refs: strings(v.refs),
      ranks: strings(v.ranks),
    });
    for (const rank of Object.values(s.ranks))
      requireValue(["0", "1", "2"].includes(rank));
    Object.assign(s.scores, strings(v.scores, [...ABILITIES]));
    requireValue(record(v.groups));
    for (const k of Object.keys(groupNames) as Group[]) {
      const list = v.groups[k];
      requireValue(Array.isArray(list));
      const ids = new Set<string>();
      s.groups[k] = list.map((row) => {
        const defaults = newEntry(),
          entry = strings(row, Object.keys(defaults));
        requireValue(
          typeof entry.name === "string" &&
            typeof entry.id === "string" &&
            entry.id.length > 0 &&
            !ids.has(entry.id),
        );
        ids.add(entry.id);
        return { ...defaults, ...entry };
      });
    }
    requireValue(
      Array.isArray(v.history) && v.history.every((x) => typeof x === "string"),
    );
    s.history = v.history;
    return s;
  });
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function portraitFile(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw Error("Choose a PNG, JPEG or WebP portrait.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("Image conversion unavailable.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    bitmap.close();
  }
}
