const BASE = "https://api.open5e.com/";

async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;
  throw { name: "apiError", message: data };
}

export async function searchMonsters({ name = "", crMax = "" } = {}) {
  // Open5e supports search=... and pagination.
  // We'll fetch one page for now.
  const params = new URLSearchParams();
  if (name) params.set("search", name);

  const url = `${BASE}monsters/?${params.toString()}`;
  const data = await toJson(await fetch(url));

  let results = data.results ?? [];

  // Optional client-side CR filter (Open5e CR is string-like)
  if (crMax) {
    results = results.filter((m) => crToNumber(m.challenge_rating) <= crToNumber(crMax));
  }

  return results;
}

// Convert CR like "1/2" to number for comparison
function crToNumber(cr) {
  if (!cr) return Number.POSITIVE_INFINITY;
  if (cr.includes("/")) {
    const [a, b] = cr.split("/").map(Number);
    return a / b;
  }
  const n = Number(cr);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}
