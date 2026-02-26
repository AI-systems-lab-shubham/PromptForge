import {
  loadJSON, getProfile,
  getBookmarks, setBookmarks,
  copyToClipboard, fillPrompt, phaseLabel
} from "../common.js";

const PROMPTS_PATH = "../assets/js/data/prompts.json";

let prompts = [];
let active = null;

function uniq(arr){ return [...new Set(arr)].filter(Boolean); }

function renderFilters() {
  const phaseSel = document.getElementById("phaseFilter");
  const tagSel = document.getElementById("tagFilter");

  const phases = uniq(prompts.map(p => p.phase));
  phaseSel.innerHTML = `<option value="">All phases</option>` + phases.map(p => `<option value="${p}">${phaseLabel(p)}</option>`).join("");

  const tags = uniq(prompts.flatMap(p => p.tags || []));
  tagSel.innerHTML = `<option value="">All tags</option>` + tags.map(t => `<option value="${t}">${t}</option>`).join("");
}

function renderCards() {
  const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  const phase = document.getElementById("phaseFilter").value;
  const tag = document.getElementById("tagFilter").value;

  const filtered = prompts.filter(p => {
    if (phase && p.phase !== phase) return false;
    if (tag && !(p.tags || []).includes(tag)) return false;
    if (q) {
      const hay = `${p.id} ${p.title} ${p.summary} ${p.prompt}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const bookmarks = getBookmarks();

  const cards = document.getElementById("cards");
  cards.innerHTML = filtered.map(p => `
    <div class="cardmini">
      <div class="muted small">${phaseLabel(p.phase)} • ${p.id}</div>
      <h3>${p.title}</h3>
      <div class="muted small">${(p.summary||"").replaceAll("\n"," ")}</div>
      <div class="tagrow">
        ${(p.tags||[]).map(t => `<span class="tag">${t}</span>`).join("")}
        ${bookmarks.includes(p.id) ? `<span class="tag">bookmarked</span>` : ""}
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn--primary" data-open="${p.id}" type="button">Open</button>
        <button class="btn" data-copy="${p.id}" type="button">Copy</button>
      </div>
    </div>
  `).join("");

  cards.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.copy;
      const p = prompts.find(x => x.id === id);
      const filled = fillPrompt(p.prompt, getProfile());
      await copyToClipboard(filled);
    });
  });

  cards.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.open));
  });
}

function openModal(id) {
  active = prompts.find(p => p.id === id);
  if (!active) return;

  const profile = getProfile();
  const filled = fillPrompt(active.prompt, profile);

  document.getElementById("modalTitle").textContent = `${active.id} • ${active.title}`;
  document.getElementById("modalMeta").textContent = `${phaseLabel(active.phase)} ${(active.tags||[]).length ? "• " + active.tags.join(", ") : ""}`;
  document.getElementById("modalText").textContent = filled;

  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  active = null;
}

async function init() {
  prompts = await loadJSON(PROMPTS_PATH);

  renderFilters();
  renderCards();

  document.getElementById("searchInput").addEventListener("input", renderCards);
  document.getElementById("phaseFilter").addEventListener("change", renderCards);
  document.getElementById("tagFilter").addEventListener("change", renderCards);
  document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("phaseFilter").value = "";
    document.getElementById("tagFilter").value = "";
    document.getElementById("searchInput").value = "";
    renderCards();
  });

  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  document.getElementById("copyModal").addEventListener("click", async () => {
    if (!active) return;
    const filled = fillPrompt(active.prompt, getProfile());
    await copyToClipboard(filled);
  });

  document.getElementById("bookmarkModal").addEventListener("click", () => {
    if (!active) return;
    const bookmarks = getBookmarks();
    const exists = bookmarks.includes(active.id);
    const next = exists ? bookmarks.filter(x => x !== active.id) : [active.id, ...bookmarks];
    setBookmarks(next);
    renderCards();
  });
}

init();
