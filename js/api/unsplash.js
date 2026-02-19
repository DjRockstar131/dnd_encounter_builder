const BASE = "https://api.unsplash.com";
const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const APP_NAME = import.meta.env.VITE_UNSPLASH_APP_NAME || "dnd_encounter_builder";

async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;
  throw { name: "unsplashError", message: data };
}

export async function searchPhotos(query, { perPage = 1, orientation = "landscape" } = {}) {
  if (!ACCESS_KEY) throw { name: "unsplashError", message: { message: "Missing access key" } };

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
  const utm = `?utm_source=${encodeURIComponent(APP_NAME)}&utm_medium=referral`;
  return {
    photographerName: photo.user?.name ?? "Unknown",
    photographerUrl: `${photo.user?.links?.html ?? "https://unsplash.com"}${utm}`,
    unsplashUrl: `https://unsplash.com${utm}`,
  };
}
