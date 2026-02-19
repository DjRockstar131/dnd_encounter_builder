import { listMonstersPage, getMonsterBySlug, crToNumber } from "../api/open5e.js";
import { searchPhotos, buildAttribution } from "../api/unsplash.js";
import { monsterCard, monsterDetailHtml } from "../ui/render.js";
import { loadSavedEncounters, saveEncounter, deleteEncounter } from "../storage/storage.js";

const form = document.querySelector("#encForm");
const partySizeEl = document.querySelector("#partySize");
const partyLevelEl = document.querySelector("#partyLevel");
const envEl = document.querySelector("#environment");
const status = document.querySelector("#status");
const grid = document.querySelector("#grid");
const summaryEl = document.querySelector("#summary");
const loreBox = document.querySelector("#loreBox");
const newLoreBtn = document.querySelector("#newLoreBtn");
const saveBtn = document.querySelector("#saveBtn");
const savedList = document.querySelector("#savedList");

const heroImg = document.querySelector("#heroImg");
const heroTitle = document.querySelector("#heroTitle");
const heroAttribution = document.querySelector("#heroAttribution");

const modal = document.querySelector("#monsterModal");
const modalBody = document.querySelector("#modalBody");
const modalClose = document.querySelector("#modalClose");

let currentEncounter = null;
let loreData = null;

modalClose.addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.close();
});

grid.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action='detail']");
  if (!btn) return;
  const slug = btn.dataset.slug;
  if (!slug) return;

  try {
    modalBody.innerHTML = `<p class="muted">Loading…</p>`;
    modal.showModal();
    const monster = await getMonsterBySlug(slug);
    modalBody.innerHTML = monsterDetailHtml(monster);
  } catch (err) {
    console.error(err);
    modalBody.innerHTML = `<p class="muted">Could not load monster details.</p>`;
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const partySize = Number(partySizeEl.value);
  const partyLevel = Number(partyLevelEl.value);
  const environment = envEl.value;

  if (!partySize || !partyLevel) return;

  setStatus("Generating encounter…");
  grid.innerHTML = "";
  summaryEl.innerHTML = "";
  loreBox.innerHTML = "";

  try {
    // theme image
    loadThemeImage(environmentTheme(environment)).catch(() => {});

    // pick monsters
    const monsters = await generateMonsters({ partyLevel, partySize, environment });

    // compute difficulty
    const analysis = analyzeEncounter(monsters, partySize, partyLevel);

    // render
    const frag = document.createDocumentFragment();
    monsters.forEach((m) => frag.appendChild(monsterCard(m, { buttonText: "View Details" })));
    grid.appendChild(frag);

    renderSummary(analysis, partySize, partyLevel, environment);

    currentEncounter = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      partySize,
      partyLevel,
      environment,
      monsters: monsters.map((m) => ({
        name: m.name,
        slug: m.slug,
        cr: m.challenge_rating,
        xp: crXp(m.challenge_rating),
      })),
      analysis,
      lore: null,
    };

    setStatus("Encounter ready. You can save it or generate lore.");
  } catch (err) {
    console.error(err);
    setStatus("Could not generate encounter. Try again.");
  }
});

newLoreBtn.addEventListener("click", async () => {
  if (!loreData) loreData = await loadLore();
  const lore = generateLore(loreData);
  loreBox.innerHTML = `
    <strong>Quest Hook</strong>
    <p class="muted" style="margin:.35rem 0 0;">${escapeHtml(lore)}</p>
  `;

  if (currentEncounter) currentEncounter.lore = lore;
});

saveBtn.addEventListener("click", () => {
  if (!currentEncounter) {
    setStatus("Generate an encounter first.");
    return;
  }
  saveEncounter(currentEncounter);
  renderSaved();
  setStatus("Saved encounter!");
});

savedList.addEventListener("click", (e) => {
  const loadBtn = e.target.closest("button[data-action='load']");
  const delBtn = e.target.closest("button[data-action='delete']");
  if (!loadBtn && !delBtn) return;

  const id = (loadBtn || delBtn).dataset.id;
  if (!id) return;

  if (delBtn) {
    deleteEncounter(id);
    renderSaved();
    return;
  }

  // load
  const saved = loadSavedEncounters().find((x) => x.id === id);
  if (!saved) return;

  partySizeEl.value = saved.partySize;
  partyLevelEl.value = saved.partyLevel;
  envEl.value = saved.environment;

  loadThemeImage(environmentTheme(saved.environment)).catch(() => {});

  // render saved monsters list (no refetch needed)
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();
  saved.monsters.forEach((m) => {
    frag.appendChild(
      monsterCard(
        { name: m.name, slug: m.slug, challenge_rating: m.cr, type: "", size: "", armor_class: "", hit_points: "" },
        { buttonText: "View Details" }
      )
    );
  });
  grid.appendChild(frag);

  renderSummary(saved.analysis, saved.partySize, saved.partyLevel, saved.environment);

  loreBox.innerHTML = saved.lore
    ? `<strong>Quest Hook</strong><p class="muted" style="margin:.35rem 0 0;">${escapeHtml(saved.lore)}</p>`
    : "";

  currentEncounter = saved;

  setStatus("Loaded saved encounter.");
});

renderSaved();
setStatus("Set party info and click Generate.");

async function generateMonsters({ partyLevel, partySize, environment }) {
  // Strategy:
  // 1) pick a CR target based on party level (simple heuristic)
  // 2) fetch random page of monsters
  // 3) filter to CR <= target+1 and pick a group size that makes sense

  const targetCr = Math.max(0.125, Math.min(10, Math.floor(partyLevel / 2)));
  const crMax = targetCr + 1;

  // random page
  const page = 1 + Math.floor(Math.random() * 20);
  const data = await listMonstersPage({ page, limit: 50 });
  let pool = data.results ?? [];

  // filter out weird entries and CR too high
  pool = pool
    .filter((m) => m.slug && m.name)
    .filter((m) => crToNumber(m.challenge_rating) <= crMax);

  // if pool too small, fallback to page 1
  if (pool.length < 8) {
    const fallback = await listMonstersPage({ page: 1, limit: 50 });
    pool = (fallback.results ?? []).filter((m) => crToNumber(m.challenge_rating) <= crMax);
  }

  // choose number of monsters (more for bigger parties)
  const count = partySize <= 2 ? randInt(1, 2) : partySize <= 4 ? randInt(2, 4) : randInt(3, 6);

  // pick random monsters
  const picked = [];
  const used = new Set();
  while (picked.length < Math.min(count, pool.length)) {
    const m = pool[randInt(0, pool.length - 1)];
    if (used.has(m.slug)) continue;
    used.add(m.slug);
    picked.push(m);
  }

  // Sort by CR (nice UX)
  picked.sort((a, b) => crToNumber(a.challenge_rating) - crToNumber(b.challenge_rating));

  return picked;
}

function analyzeEncounter(monsters, partySize, partyLevel) {
  const baseXp = monsters.reduce((sum, m) => sum + crXp(m.challenge_rating), 0);
  const mult = encounterMultiplier(monsters.length, partySize);
  const adjustedXp = Math.round(baseXp * mult);

  const thresholds = partyThresholds(partyLevel, partySize);

  let difficulty = "Trivial";
  if (adjustedXp >= thresholds.deadly) difficulty = "Deadly";
  else if (adjustedXp >= thresholds.hard) difficulty = "Hard";
  else if (adjustedXp >= thresholds.medium) difficulty = "Medium";
  else if (adjustedXp >= thresholds.easy) difficulty = "Easy";

  return { baseXp, adjustedXp, multiplier: mult, difficulty, thresholds, monsterCount: monsters.length };
}

function renderSummary(analysis, partySize, partyLevel, environment) {
  summaryEl.innerHTML = `
    <div class="box">
      <dt class="muted">Party</dt>
      <dd style="margin:0; font-weight:600;">${partySize} players • Level ${partyLevel}</dd>
    </div>
    <div class="box">
      <dt class="muted">Environment</dt>
      <dd style="margin:0; font-weight:600;">${escapeHtml(environment)}</dd>
    </div>
    <div class="box">
      <dt class="muted">Monsters</dt>
      <dd style="margin:0; font-weight:600;">${analysis.monsterCount}</dd>
    </div>
    <div class="box">
      <dt class="muted">XP</dt>
      <dd style="margin:0; font-weight:600;">Base ${analysis.baseXp} • Adjusted ${analysis.adjustedXp} (x${analysis.multiplier})</dd>
    </div>
    <div class="box">
      <dt class="muted">Difficulty</dt>
      <dd style="margin:0; font-weight:700;">${analysis.difficulty}</dd>
    </div>
  `;
}

function renderSaved() {
  const list = loadSavedEncounters();
  if (!list.length) {
    savedList.innerHTML = `<p class="muted">No saved encounters yet.</p>`;
    return;
  }

  savedList.innerHTML = list
    .map(
      (e) => `
    <div class="saved-card">
      <div>
        <strong>${escapeHtml(e.environment)} • L${e.partyLevel} (${e.partySize} players)</strong>
        <p class="muted" style="margin:.25rem 0 0;">${new Date(e.createdAt).toLocaleString()} • ${escapeHtml(e.analysis?.difficulty ?? "")} • Adjusted XP ${e.analysis?.adjustedXp ?? ""}</p>
      </div>
      <div class="saved-actions">
        <button class="btn" data-action="load" data-id="${e.id}">Load</button>
        <button class="btn" data-action="delete" data-id="${e.id}">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
}

async function loadLore() {
  const res = await fetch("./data/lore.json");
  if (!res.ok) throw new Error("Could not load lore.json");
  return res.json();
}

function generateLore(data) {
  const pick = (arr) => arr[randInt(0, arr.length - 1)];
  const loc = pick(data.locations);
  const vil = pick(data.villains);
  const hook = pick(data.hooks);
  const twist = pick(data.twists);

  return `${hook} It leads to ${loc}, where the party discovers ${vil}. Twist: ${twist}`;
}

async function loadThemeImage(themeQuery) {
  const data = await searchPhotos(themeQuery, { perPage: 1, orientation: "landscape" });
  const photo = data.results?.[0];
  if (!photo) return;

  heroImg.src = photo.urls?.regular || photo.urls?.full;
  heroImg.alt = themeQuery;

  const { photographerName, photographerUrl, unsplashUrl } = buildAttribution(photo);
  heroTitle.textContent = `Theme: ${themeQuery}`;
  heroAttribution.innerHTML = `Photo by <a href="${photographerUrl}" target="_blank" rel="noopener noreferrer">${photographerName}</a> on <a href="${unsplashUrl}" target="_blank" rel="noopener noreferrer">Unsplash</a>.`;
}

function environmentTheme(env) {
  const map = {
    dungeon: "fantasy dungeon corridor",
    forest: "enchanted forest fantasy",
    swamp: "misty swamp fantasy",
    mountain: "mountain pass fantasy",
    desert: "ancient desert ruins fantasy",
    city: "medieval city street fantasy",
    arctic: "frozen tundra fantasy",
    coast: "stormy coast fantasy",
    underdark: "underdark cavern fantasy"
  };
  return map[env] || "fantasy adventure";
}

function setStatus(msg) {
  status.textContent = msg;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * XP by CR (DMG table)
 */
function crXp(cr) {
  const table = {
    "0": 10,
    "1/8": 25,
    "1/4": 50,
    "1/2": 100,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
    "13": 10000,
    "14": 11500,
    "15": 13000,
    "16": 15000,
    "17": 18000,
    "18": 20000,
    "19": 22000,
    "20": 25000,
    "21": 33000,
    "22": 41000,
    "23": 50000,
    "24": 62000,
    "25": 75000,
    "26": 90000,
    "27": 105000,
    "28": 120000,
    "29": 135000,
    "30": 155000
  };
  const key = String(cr ?? "").trim();
  return table[key] ?? 0;
}

/**
 * Encounter multiplier by monster count (basic DMG)
 * Party size adjustment included (simple).
 */
function encounterMultiplier(monsterCount, partySize) {
  let mult = 1;
  if (monsterCount === 1) mult = 1;
  else if (monsterCount === 2) mult = 1.5;
  else if (monsterCount >= 3 && monsterCount <= 6) mult = 2;
  else if (monsterCount >= 7 && monsterCount <= 10) mult = 2.5;
  else if (monsterCount >= 11 && monsterCount <= 14) mult = 3;
  else mult = 4;

  // small/large party adjustment
  if (partySize <= 2) mult *= 1.5;
  else if (partySize >= 6) mult *= 0.85;

  return Math.round(mult * 100) / 100;
}

/**
 * Thresholds per player (DMG) multiplied by party size.
 */
function partyThresholds(level, partySize) {
  const perPlayer = {
    1:  { easy: 25,  medium: 50,  hard: 75,  deadly: 100 },
    2:  { easy: 50,  medium: 100, hard: 150, deadly: 200 },
    3:  { easy: 75,  medium: 150, hard: 225, deadly: 400 },
    4:  { easy: 125, medium: 250, hard: 375, deadly: 500 },
    5:  { easy: 250, medium: 500, hard: 750, deadly: 1100 },
    6:  { easy: 300, medium: 600, hard: 900, deadly: 1400 },
    7:  { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
    8:  { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
    9:  { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
    10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
    11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
    12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
    13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
    14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
    15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
    16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
    17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
    18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
    19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
    20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 }
  };

  const t = perPlayer[Math.min(20, Math.max(1, Number(level)))] || perPlayer[1];
  return {
    easy: t.easy * partySize,
    medium: t.medium * partySize,
    hard: t.hard * partySize,
    deadly: t.deadly * partySize
  };
}
