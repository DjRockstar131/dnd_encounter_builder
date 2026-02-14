const BASE = "https://api.unsplash.com";

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const APP_NAME = import.meta.env.VITE_UNSPLASH_APP_NAME || "dnd_encounter_builder";

if (!ACCESS_KEY) {
  console.warn("Missing VITE_UNSPLASH_ACCESS_KEY in .env");
}

async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;
  throw { name: "unsplashError", message: data };
}

/**
 * Search Unsplash photos.
 * Uses Authorization: Client-ID <access key> (standard Unsplash approach). :contentReference[oaicite:4]{index=4}
 */
export async function searchPhotos(query, { perPage = 1, orientation = "landscape" } = {}) {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation,
  });

  const res = await fetch(`${BASE}/search/photos?${params.toString()}`, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      "Accept-Version": "v1",
    },
  });

  return toJson(res);
}

export function buildAttribution(photo) {
  // Required: photographer + Unsplash + links back with utm params. :contentReference[oaicite:5]{index=5}
  const utm = `?utm_source=${encodeURIComponent(APP_NAME)}&utm_medium=referral`;

  return {
    photographerName: photo.user?.name ?? "Unknown",
    photographerUrl: `${photo.user?.links?.html ?? "https://unsplash.com"}${utm}`,
    unsplashUrl: `https://unsplash.com${utm}`,
  };
}
