const select = document.querySelector("#avatar");
const files = document.querySelector("#files");
const canvas = document.querySelector("#stage");
const message = document.querySelector("#stage-message");
const status = document.querySelector("#status");
const poses = document.querySelector("#poses");
const view = document.querySelector("#view");
const entries = new Map();
let selectedPose = "stand";
let visibleKey = "";
let generation = 0;
let stage;
let pendingFetch;

function addModel(key, model) {
  if (entries.has(key)) return;
  entries.set(key, model);
  select.add(new Option(model.name, key));
  select.options[0].text = "Choose a model";
  select.options[0].disabled = true;
  select.disabled = false;
}

async function show(key) {
  const ticket = ++generation;
  pendingFetch?.abort();
  const controller = new AbortController();
  pendingFetch = controller;
  const entry = entries.get(key);
  if (!entry) return;
  status.textContent = "Loading " + entry.name + "…";
  try {
    const runtime = await import("./avatar-stage.mjs");
    if (ticket !== generation) return;
    if (!stage) {
      try { stage = runtime.createStage(canvas); }
      catch { throw new Error("3D rendering is unavailable. Enable WebGL 2 or try another browser."); }
    }
    let buffer;
    if (entry.file) buffer = await entry.file.arrayBuffer();
    else {
      const response = await fetch(entry.url, { signal: controller.signal });
      if (!response.ok) throw new Error("The model file is unavailable.");
      buffer = await response.arrayBuffer();
    }
    if (ticket !== generation) return;
    const avatar = await runtime.parseAvatar(buffer);
    if (ticket !== generation) { runtime.disposeAvatar(avatar); return; }
    message.hidden = true;
    canvas.hidden = false;
    stage.show(avatar, selectedPose);
    visibleKey = key;
    poses.disabled = view.disabled = false;
    status.textContent = "Showing " + entry.name + ".";
  } catch (error) {
    if (ticket !== generation) return;
    select.value = visibleKey;
    status.textContent = "Couldn’t open " + entry.name + ". " +
      (error.message.startsWith("3D rendering") ? error.message : "Choose another model or try a fresh VRM export.");
  }
}

select.addEventListener("change", () => show(select.value));
files.addEventListener("change", () => {
  let first;
  for (const file of files.files) {
    if (!/\.vrm$/i.test(file.name)) continue;
    const key = ["local", file.name, file.size, file.lastModified].join(":");
    addModel(key, { name: file.name.replace(/\.vrm$/i, ""), file });
    first ??= key;
  }
  files.value = "";
  if (!first) { status.textContent = "Choose a .vrm file exported from VRoid Studio."; return; }
  select.value = first;
  show(first);
});
poses.addEventListener("click", event => {
  const name = event.target.closest("[data-pose]")?.dataset.pose;
  if (!name || !visibleKey) return;
  stage.pose(name);
  selectedPose = name;
  for (const button of poses.querySelectorAll("button"))
    button.setAttribute("aria-pressed", String(button.dataset.pose === name));
});
view.addEventListener("click", event => {
  const action = event.target.closest("[data-view]")?.dataset.view;
  if (action && visibleKey) stage.view(action);
});

async function loadCatalog() {
  const catalogURL = new URL("/assets/avatars/catalog.json", location.href);
  try {
    const response = await fetch(catalogURL);
    if (!response.ok) throw new Error();
    const models = await response.json();
    if (!Array.isArray(models)) throw new Error();
    let first;
    for (const model of models) {
      if (!model?.name || typeof model.file !== "string") continue;
      const url = new URL(model.file, catalogURL);
      if (url.origin !== location.origin || !url.pathname.startsWith("/assets/avatars/") ||
          !/\.vrm$/i.test(url.pathname)) continue;
      addModel(url.href, { name: model.name, url });
      first ??= url.href;
    }
    if (generation) return;
    if (first) { select.value = first; await show(first); }
    else {
      message.textContent = "PMOG’s avatar collection is coming soon.";
      document.querySelector("#preview").open = true;
    }
  } catch {
    if (!generation) {
      message.textContent = "The avatar list is unavailable. You can still preview local models.";
      document.querySelector("#preview").open = true;
    }
  }
}
loadCatalog();
