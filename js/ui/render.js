export function monsterCard(monster, { buttonText = "View Details", buttonClass = "btn", showPick = false } = {}) {
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
    <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
      <button class="${buttonClass}" type="button" data-action="detail" data-slug="${escapeHtml(monster.slug ?? "")}">
        ${escapeHtml(buttonText)}
      </button>
      ${showPick ? `<button class="btn" type="button" data-action="pick" data-slug="${escapeHtml(monster.slug ?? "")}">Pick</button>` : ""}
    </div>
  `;
  return el;
}

export function monsterDetailHtml(monster) {
  const cr = monster.challenge_rating ?? "—";
  const type = monster.type ?? "—";
  const size = monster.size ?? "—";
  const alignment = monster.alignment ?? "—";
  const speed = monster.speed ?? "—";

  return `
    <h3>${escapeHtml(monster.name ?? "Monster")}</h3>
    <p class="muted">${escapeHtml(size)} ${escapeHtml(type)} • ${escapeHtml(alignment)} • CR ${escapeHtml(String(cr))}</p>

    <dl class="kv">
      <div><dt>Armor Class</dt><dd>${monster.armor_class ?? "—"}</dd></div>
      <div><dt>Hit Points</dt><dd>${monster.hit_points ?? "—"}</dd></div>
      <div><dt>Speed</dt><dd>${escapeHtml(String(speed))}</dd></div>
      <div><dt>Languages</dt><dd>${escapeHtml(monster.languages ?? "—")}</dd></div>
      <div><dt>Senses</dt><dd>${escapeHtml(monster.senses ?? "—")}</dd></div>
      <div><dt>Legendary?</dt><dd>${monster.legendary_desc ? "Yes" : "No"}</dd></div>
    </dl>

    <h4>Abilities</h4>
    <dl class="kv">
      <div><dt>STR</dt><dd>${monster.strength ?? "—"}</dd></div>
      <div><dt>DEX</dt><dd>${monster.dexterity ?? "—"}</dd></div>
      <div><dt>CON</dt><dd>${monster.constitution ?? "—"}</dd></div>
      <div><dt>INT</dt><dd>${monster.intelligence ?? "—"}</dd></div>
      <div><dt>WIS</dt><dd>${monster.wisdom ?? "—"}</dd></div>
      <div><dt>CHA</dt><dd>${monster.charisma ?? "—"}</dd></div>
    </dl>

    ${monster.special_abilities?.length ? `<h4>Special Abilities</h4>${listBlocks(monster.special_abilities)}` : ""}
    ${monster.actions?.length ? `<h4>Actions</h4>${listBlocks(monster.actions)}` : ""}
    ${monster.legendary_actions?.length ? `<h4>Legendary Actions</h4>${listBlocks(monster.legendary_actions)}` : ""}
  `;
}

function listBlocks(items) {
  return `
    <div style="display:grid; gap:.5rem;">
      ${items
        .map(
          (x) => `
        <div style="border:1px solid var(--border); border-radius:12px; padding:.75rem; background:#111118;">
          <strong>${escapeHtml(x.name ?? "")}</strong>
          <p class="muted" style="margin:.35rem 0 0;">${escapeHtml(x.desc ?? "")}</p>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
