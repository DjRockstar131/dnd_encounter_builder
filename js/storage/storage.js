const KEY = "dnd-saved-encounters";

export function loadSavedEncounters() {
  const raw = localStorage.getItem(KEY);
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEncounter(encounter) {
  const list = loadSavedEncounters();
  list.unshift(encounter);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 25)));
}

export function deleteEncounter(id) {
  const list = loadSavedEncounters().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
