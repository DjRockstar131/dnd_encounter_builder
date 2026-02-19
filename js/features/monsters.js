import { searchMonsters, getMonsterBySlug } from "../api/open5e.js";
import { searchPhotos, buildAttribution } from "../api/unsplash.js";
import { monsterCard, monsterDetailHtml } from "../ui/render.js";

const q = document.querySelector("#q");
const crMax = document.querySelector("#crMax");
const searchBtn = document.querySelector("#searchBtn");
const grid = document.querySelector("#grid");
const status = document.querySelector("#status");

const heroImg = document.querySelector("#heroImg");
const heroTitle = document.querySelector("#heroTitle");
const heroAttribution = document.querySelector("#heroAttribution");

const modal = document.querySelector("#monsterModal");
const modalBody = document.querySelector("#modalBody");
const modalClose = document.querySelector("#modalClose");

searchBtn.addEventListener("click", () => runSearch());
q.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

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

async function runSearch() {
  setStatus("Loading monsters…");
  grid.innerHTML = "";

  try {
    const monsters = await searchMonsters({ name: q.value.trim(), crMax: crMax.value });

    // Unsplash theme (best-effort)
    const theme = q.value.trim() ? `${q.value.trim()} fantasy` : "dungeon entrance fantasy";
    loadThemeImage(theme).catch(() => {});

    if (!monsters.length) {
      setStatus("No monsters found. Try a different search.");
      return;
    }

    const frag = document.createDocumentFragment();
    monsters.forEach((m) => frag.appendChild(monsterCard(m)));
    grid.appendChild(frag);

    setStatus(`Showing ${monsters.length} result(s). Click "View Details" for stats.`);
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong fetching monsters.");
  }
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

function setStatus(msg) {
  status.textContent = msg;
}

// initial load
runSearch();
