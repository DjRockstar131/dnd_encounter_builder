const BASE = "https://api.open5e.com/";

async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;
  throw { name: "apiError", message: data };
}

export async function searchMonsters({ name = "", crMax = "" } = {}) {
  const params = new URLSearchParams();
  if (name) params.set("search", name);
  params.set("limit", "60");

  const url = `${BASE}monsters/?${params.toString()}`;
  const data = await toJson(await fetch(url));
  let results = data.results ?? [];

  if (crMax) {
    results = results.filter((m) => crToNumber(m.challenge_rating) <= crToNumber(crMax));
  }

  return results;
}

export async function getMonsterBySlug(slug) {
  const url = `${BASE}monsters/${encodeURIComponent(slug)}/`;
  return toJson(await fetch(url));
}

export async function listMonstersPage({ page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const url = `${BASE}monsters/?${params.toString()}`;
  return toJson(await fetch(url)); // {count, next, previous, results}
}

export function crToNumber(cr) {
  if (!cr) return Number.POSITIVE_INFINITY;
  const s = String(cr).trim();
  if (s.includes("/")) {
    const [a, b] = s.split("/").map(Number);
    return a / b;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}
