import { searchMonsters } from "../api/open5e.js";
import { monsterCard } from "../ui/render.js";
import { searchPhotos, buildAttribution } from "../api/unsplash.js";


const q = document.querySelector("#q");
const crMax = document.querySelector("#crMax");
const searchBtn = document.querySelector("#searchBtn");
const grid = document.querySelector("#grid");
const status = document.querySelector("#status");
const heroImg = document.querySelector("#heroImg");
const heroTitle = document.querySelector("#heroTitle");
const heroAttribution = document.querySelector("#heroAttribution");



searchBtn.addEventListener("click", () => runSearch());
q.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

async function runSearch() {
  setStatus("Loading monsters…");
  grid.innerHTML = "";

  try {
    const monsters = await searchMonsters({
      name: q.value.trim(),
      crMax: crMax.value,
    });

    if (!monsters.length) {
      setStatus("No monsters found. Try a different search.");
      return;
    }

    const frag = document.createDocumentFragment();
    monsters.forEach((m) => frag.appendChild(monsterCard(m)));
    grid.appendChild(frag);

    setStatus(`Showing ${monsters.length} result(s).`);
  } catch (err) {
    console.error(err);
    const msg =
      err?.name === "apiError"
        ? "Open5e returned an error. Try again."
        : "Something went wrong fetching monsters.";
    setStatus(msg);
  }
}

function setStatus(msg) {
  status.textContent = msg;
}

// Optional: auto-load some results on page open
runSearch();

async function loadThemeImage(themeQuery) {
  // Hotlink URLs from the API (required). :contentReference[oaicite:6]{index=6}
  const data = await searchPhotos(themeQuery, { perPage: 1, orientation: "landscape" });
  const photo = data.results?.[0];
  if (!photo) return;

  heroImg.src = photo.urls?.regular || photo.urls?.full;
  heroImg.alt = themeQuery;

  const { photographerName, photographerUrl, unsplashUrl } = buildAttribution(photo);

  heroTitle.textContent = `Theme: ${themeQuery}`;
  heroAttribution.innerHTML = `Photo by <a href="${photographerUrl}" target="_blank" rel="noopener noreferrer">${photographerName}</a> on <a href="${unsplashUrl}" target="_blank" rel="noopener noreferrer">Unsplash</a>.`;
}
