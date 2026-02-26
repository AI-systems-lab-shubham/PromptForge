import {
  loadJSON, getProfile, bindProfileForm,
  getProgress, setProgress,
  getBookmarks, setBookmarks,
  getNotes, setNotes,
  copyToClipboard, fillPrompt, phaseLabel
} from "../common.js";

const PROMPTS_PATH = "../assets/js/data/prompts.json";

let prompts = [];
let activeId = null;
let overrides = {};

function byId(id) {
  return prompts.find(p => p.id === id);
}

function setActive(id) {
  activeId = id;
  const p = byId(id);
  if (!p) return;

  const profile = getProfile();
  const filled = fillPrompt(p.prompt, profile, overrides);

  document.getElementById("promptHeader").innerHTML = `
    <div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px; flex-wrap:wrap">
      <div>
        <div style="font-weight:900; font-size:18px">${p.title}</div>
        <div class="muted small">${phaseLabel(p.phase)} • ${p.id}</div>
      </div>
      <div class="muted small">${(p.tags || []).map(t => `#${t}`).join(" ")}</div>
    </div>
  `;

  document.getElementById("promptMeta").innerText = p.summary || "";
  document.getElementById("promptText").innerText = filled;
  document.getElementById("promptWhy").innerText = p.why || "This prompt helps you move one step forward with clarity.";

  const notesAll = getNotes();
  document.getElementById("promptNotes").value = notesAll[id] || "";

  renderNav();
  renderBookmarks();
  renderProgressMeta();
}

function renderProgressMeta() {
  const meta = document.getElementById("promptMeta");
  const progress = getProgress();
  const status = progress[activeId] || "Not started";
  meta.innerText = `${(byId(activeId)?.summary || "").trim()}\nStatus: ${status}`;
}

function renderNav(filterText = "") {
  const container = document.getElementById("navPhases");
  const query = filterText.trim().toLowerCase();

  const grouped = {};
  for (const p of prompts) {
    if (query) {
      const hay = `${p.id} ${p.title} ${p.prompt}`.toLowerCase();
      if (!hay.includes(query)) continue;
    }
    grouped[p.phase] = grouped[p.phase] || [];
    grouped[p.phase].push(p);
  }

  const phases = Object.keys(grouped);
  container.innerHTML = phases.map(ph => {
    const items = grouped[ph].map(p => `
      <a href="#${p.id}" class="${p.id === activeId ? "active" : ""}">${p.id} • ${p.title}</a>
    `).join("");
    return `
      <div class="muted small" style="margin:10px 0 6px">${phaseLabel(ph)}</div>
      ${items}
    `;
  }).join("");

  container.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("href").slice(1);
      setActive(id);
      history.replaceState(null, "", `#${id}`);
    });
  });
}

function renderBookmarks() {
  const container = document.getElementById("navBookmarks");
  const bookmarks = getBookmarks();

  if (!bookmarks.length) {
    container.innerHTML = `<div class="muted small">No bookmarks yet.</div>`;
    return;
  }

  container.innerHTML = bookmarks.map(id => {
    const p = byId(id);
    if (!p) return "";
    return `<a href="#${id}" class="${id === activeId ? "active" : ""}">${p.id} • ${p.title}</a>`;
  }).join("");

  container.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("href").slice(1);
      setActive(id);
      history.replaceState(null, "", `#${id}`);
    });
  });
}

function applyOverrides() {
  overrides = {
    feature1: (document.getElementById("ovFeature1").value || "").trim(),
    feature2: (document.getElementById("ovFeature2").value || "").trim(),
    feature3: (document.getElementById("ovFeature3").value || "").trim()
  };
  Object.keys(overrides).forEach(k => { if (!overrides[k]) delete overrides[k]; });
  setActive(activeId);
}

async function init() {
  bindProfileForm();

  prompts = await loadJSON(PROMPTS_PATH);

  const search = document.getElementById("searchInput");
  search.addEventListener("input", () => renderNav(search.value));

  document.getElementById("applyOverrides").addEventListener("click", applyOverrides);

  document.getElementById("copyPrompt").addEventListener("click", async () => {
    const p = byId(activeId);
    const filled = fillPrompt(p.prompt, getProfile(), overrides);
    await copyToClipboard(filled);
  });

  document.getElementById("bookmarkPrompt").addEventListener("click", () => {
    const bookmarks = getBookmarks();
    const exists = bookmarks.includes(activeId);
    const next = exists ? bookmarks.filter(x => x !== activeId) : [activeId, ...bookmarks];
    setBookmarks(next);
    renderBookmarks();
  });

  document.getElementById("markDone").addEventListener("click", () => {
    const progress = getProgress();
    progress[activeId] = "Done";
    setProgress(progress);
    renderProgressMeta();
  });

  document.getElementById("saveNotes").addEventListener("click", () => {
    const notesAll = getNotes();
    notesAll[activeId] = document.getElementById("promptNotes").value || "";
    setNotes(notesAll);
    const status = document.getElementById("notesStatus");
    status.textContent = "Saved";
    setTimeout(() => status.textContent = "", 900);
  });

  const hashId = (location.hash || "").replace("#", "");
  const initial = hashId && byId(hashId) ? hashId : prompts[0]?.id;
  setActive(initial);
}

init();
