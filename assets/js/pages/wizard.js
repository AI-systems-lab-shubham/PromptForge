import {
  loadJSON, getProfile, bindProfileForm,
  getProgress, setProgress,
  copyToClipboard, fillPrompt, phaseLabel
} from "../common.js";

const PROMPTS_PATH = "../assets/js/data/prompts.json";

let steps = [];
let index = 0;

function wizardOrder(prompts) {
  const preferred = ["1.1","1.2","1.3","2.1","2.2","2.3","2.4","3.1","3.2","3.3","4.1","4.2","4.3","5.1","5.2","5.3","E.1","E.2","E.3"];
  const map = new Map(prompts.map(p => [p.id, p]));
  const ordered = [];
  for (const id of preferred) {
    if (map.has(id)) ordered.push(map.get(id));
  }
  const leftovers = prompts.filter(p => !preferred.includes(p.id));
  return [...ordered, ...leftovers];
}

function renderSide() {
  const progress = getProgress();

  const progressEl = document.getElementById("wizardProgress");
  progressEl.innerHTML = steps.map((s, i) => {
    const st = progress[s.id] || "Not started";
    return `<a href="#" data-i="${i}" class="${i===index?"active":""}">${s.id} • ${st}</a>`;
  }).join("");

  const jump = document.getElementById("wizardJump");
  jump.innerHTML = steps.map((s, i) => `<a href="#" data-i="${i}" class="${i===index?"active":""}">${s.id} • ${s.title}</a>`).join("");

  [...progressEl.querySelectorAll("a"), ...jump.querySelectorAll("a")].forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      index = Number(a.dataset.i);
      renderStep();
      renderSide();
    });
  });
}

function renderStep() {
  const s = steps[index];
  const profile = getProfile();
  const filled = fillPrompt(s.prompt, profile);

  document.getElementById("stepHeader").innerHTML = `
    <div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px; flex-wrap:wrap">
      <div>
        <div style="font-weight:900; font-size:18px">${s.title}</div>
        <div class="muted small">${phaseLabel(s.phase)} • Step ${index+1} of ${steps.length}</div>
      </div>
      <div class="muted small">${(s.tags||[]).map(t => `#${t}`).join(" ")}</div>
    </div>
  `;

  const progress = getProgress();
  const status = progress[s.id] || "Not started";
  document.getElementById("stepMeta").innerText = `${s.summary || ""}\nStatus: ${status}`;
  document.getElementById("stepText").innerText = filled;
  document.getElementById("stepNext").innerText = s.next || "Run the prompt, capture the output, then move to the next step.";
}

async function init() {
  bindProfileForm();

  const prompts = await loadJSON(PROMPTS_PATH);
  steps = wizardOrder(prompts);

  document.getElementById("prevStep").addEventListener("click", () => {
    index = Math.max(0, index - 1);
    renderStep(); renderSide();
  });

  document.getElementById("nextStep").addEventListener("click", () => {
    index = Math.min(steps.length - 1, index + 1);
    renderStep(); renderSide();
  });

  document.getElementById("copyStep").addEventListener("click", async () => {
    const s = steps[index];
    const filled = fillPrompt(s.prompt, getProfile());
    await copyToClipboard(filled);
  });

  document.getElementById("markDone").addEventListener("click", () => {
    const s = steps[index];
    const progress = getProgress();
    progress[s.id] = "Done";
    setProgress(progress);
    renderStep(); renderSide();
  });

  document.getElementById("resetWizard").addEventListener("click", () => {
    const progress = getProgress();
    for (const s of steps) delete progress[s.id];
    setProgress(progress);
    renderStep(); renderSide();
  });

  renderStep();
  renderSide();
}

init();
