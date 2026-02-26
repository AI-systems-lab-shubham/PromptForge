import { loadJSON, copyToClipboard } from "../common.js";

const TPL_PATH = "../assets/js/data/templates.json";
let templates = [];
let active = null;

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// Minimal Markdown renderer for headings + bullets + numbered lists.
// Keeps it simple and reliable for your template content.
function mdToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) { html += "</ul>"; inUl = false; }
    if (inOl) { html += "</ol>"; inOl = false; }
  };

  for (const raw of lines) {
    const line = escapeHtml(raw);

    // Headings
    if (line.startsWith("### ")) { closeLists(); html += `<h3>${line.slice(4)}</h3>`; continue; }
    if (line.startsWith("## "))  { closeLists(); html += `<h2>${line.slice(3)}</h2>`; continue; }
    if (line.startsWith("# "))   { closeLists(); html += `<h1>${line.slice(2)}</h1>`; continue; }

    // Ordered list "1. "
    if (/^\d+\.\s/.test(line)) {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (!inOl) { html += "<ol>"; inOl = true; }
      html += `<li>${line.replace(/^\d+\.\s/, "")}</li>`;
      continue;
    }

    // Unordered list "- "
    if (line.startsWith("- ")) {
      if (inOl) { html += "</ol>"; inOl = false; }
      if (!inUl) { html += "<ul>"; inUl = true; }
      html += `<li>${line.slice(2)}</li>`;
      continue;
    }

    // Empty line adds spacing
    if (line.trim() === "") { closeLists(); html += "<div style='height:10px'></div>"; continue; }

    // Paragraph
    closeLists();
    html += `<p>${line}</p>`;
  }

  closeLists();
  return html;
}

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

  const modalText = document.getElementById("modalText");
  modalText.innerHTML = mdToHtml(active.body);

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
