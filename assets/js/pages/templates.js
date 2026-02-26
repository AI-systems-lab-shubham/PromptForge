import { loadJSON, copyToClipboard } from "../common.js";

const TPL_PATH = "../assets/js/data/templates.json";
let templates = [];
let active = null;

function render() {
  const el = document.getElementById("templateCards");
  el.innerHTML = templates.map(t => `
    <div class="cardmini">
      <div class="muted small">${t.category}</div>
      <h3>${t.title}</h3>
      <div class="muted small">${t.summary}</div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn--primary" data-open="${t.id}" type="button">Open</button>
        <button class="btn" data-copy="${t.id}" type="button">Copy</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openModal(b.dataset.open)));
  el.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    const t = templates.find(x => x.id === b.dataset.copy);
    await copyToClipboard(t.body);
  }));
}

function openModal(id) {
  active = templates.find(t => t.id === id);
  if (!active) return;

  document.getElementById("modalTitle").textContent = active.title;
  document.getElementById("modalMeta").textContent = active.category;
  document.getElementById("modalText").textContent = active.body;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  active = null;
}

async function init() {
  templates = await loadJSON(TPL_PATH);
  render();

  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  document.getElementById("copyModal").addEventListener("click", async () => {
    if (!active) return;
    await copyToClipboard(active.body);
  });
}

init();
