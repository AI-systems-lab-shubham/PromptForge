const STORAGE = {
  theme: "pf_theme",
  profile: "pf_profile",
  progress: "pf_progress",
  bookmarks: "pf_bookmarks",
  notes: "pf_notes"
};

export function getTheme() {
  return localStorage.getItem(STORAGE.theme) || "dark";
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE.theme, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function initTheme() {
  setTheme(getTheme());
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", () => toggleTheme());
}

export function loadJSON(path) {
  return fetch(path).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${path}`);
    return r.json();
  });
}

export function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

export function getProfile() {
  const raw = localStorage.getItem(STORAGE.profile);
  return raw ? safeParse(raw, {}) : {};
}

export function setProfile(p) {
  localStorage.setItem(STORAGE.profile, JSON.stringify(p));
}

export function clearProfile() {
  localStorage.removeItem(STORAGE.profile);
}

export function bindProfileForm() {
  const fields = ["pfIdea","pfUsers","pfProblem","pfConstraints","pfMetric"];
  const profile = getProfile();
  for (const id of fields) {
    const el = document.getElementById(id);
    if (!el) continue;
    const key = id.replace("pf","").toLowerCase();
    el.value = profile[key] || "";
  }

  const save = document.getElementById("saveProfile");
  if (save) {
    save.addEventListener("click", () => {
      const next = {};
      for (const id of fields) {
        const el = document.getElementById(id);
        const key = id.replace("pf","").toLowerCase();
        next[key] = el ? (el.value || "").trim() : "";
      }
      setProfile(next);
    });
  }

  const clear = document.getElementById("clearProfile");
  if (clear) clear.addEventListener("click", () => {
    for (const id of fields) {
      const el = document.getElementById(id);
      if (el) el.value = "";
    }
    clearProfile();
  });
}

export function getProgress() {
  const raw = localStorage.getItem(STORAGE.progress);
  return raw ? safeParse(raw, {}) : {};
}
export function setProgress(p) {
  localStorage.setItem(STORAGE.progress, JSON.stringify(p));
}

export function getBookmarks() {
  const raw = localStorage.getItem(STORAGE.bookmarks);
  return raw ? safeParse(raw, []) : [];
}
export function setBookmarks(arr) {
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(arr));
}

export function getNotes() {
  const raw = localStorage.getItem(STORAGE.notes);
  return raw ? safeParse(raw, {}) : {};
}
export function setNotes(n) {
  localStorage.setItem(STORAGE.notes, JSON.stringify(n));
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

export function fillPrompt(template, profile, overrides = {}) {
  const idea = overrides.idea || profile.idea || "[DESCRIBE WHAT YOU WANT IN PLAIN ENGLISH]";
  const users = overrides.users || profile.users || "[DESCRIBE YOUR USERS]";
  const problem = overrides.problem || profile.problem || "[DESCRIBE THE PROBLEM]";
  const constraints = overrides.constraints || profile.constraints || "";
  const metric = overrides.metric || profile.metric || "";

  const feature1 = overrides.feature1 || "[MAIN FEATURE 1]";
  const feature2 = overrides.feature2 || "[MAIN FEATURE 2]";
  const feature3 = overrides.feature3 || "[MAIN FEATURE 3]";

  let out = template;

  out = out.replaceAll("[DESCRIBE WHAT YOU WANT IN PLAIN ENGLISH]", idea);
  out = out.replaceAll("[DESCRIBE YOUR USERS]", users);
  out = out.replaceAll("[DESCRIBE THE PROBLEM]", problem);
  out = out.replaceAll("[MAIN FEATURE 1]", feature1);
  out = out.replaceAll("[MAIN FEATURE 2]", feature2);
  out = out.replaceAll("[MAIN FEATURE 3]", feature3);

  if (constraints) out += `\n\nConstraints to keep in mind:\n- ${constraints}\n`;
  if (metric) out += `\nSuccess metric:\n- ${metric}\n`;

  return out.trim() + "\n";
}

export function phaseLabel(phaseId) {
  const map = {
    "phase-1": "Phase 1: Project Kickoff",
    "phase-2": "Phase 2: Building",
    "phase-3": "Phase 3: Understanding the Code",
    "phase-4": "Phase 4: Testing & Quality",
    "phase-5": "Phase 5: Shipping & Sharing",
    "emergency": "Emergency Prompts",
    "extras": "Tips and Quick Reference"
  };
  return map[phaseId] || phaseId;
}

initTheme();
