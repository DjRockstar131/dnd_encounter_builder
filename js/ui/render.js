export function monsterCard(monster) {
  const cr = monster.challenge_rating ?? "—";
  const type = monster.type ?? "—";
  const size = monster.size ?? "—";

  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <h3 class="card-title">${escapeHtml(monster.name ?? "Unknown")}</h3>
    <p class="muted">${escapeHtml(size)} ${escapeHtml(type)} • CR ${escapeHtml(String(cr))}</p>
    <dl class="stats">
      <div><dt>AC</dt><dd>${monster.armor_class ?? "—"}</dd></div>
      <div><dt>HP</dt><dd>${monster.hit_points ?? "—"}</dd></div>
      <div><dt>STR</dt><dd>${monster.strength ?? "—"}</dd></div>
      <div><dt>DEX</dt><dd>${monster.dexterity ?? "—"}</dd></div>
      <div><dt>CON</dt><dd>${monster.constitution ?? "—"}</dd></div>
    </dl>
    <button class="btn" type="button" data-monster="${escapeHtml(monster.slug ?? "")}">
      View Details (next)
    </button>
  `;
  return el;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
