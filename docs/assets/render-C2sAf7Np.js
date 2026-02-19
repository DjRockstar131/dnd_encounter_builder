const o="https://api.open5e.com/";async function u(t){const d=await t.json().catch(()=>({}));if(t.ok)return d;throw{name:"apiError",message:d}}async function m({name:t="",crMax:d=""}={}){const a=new URLSearchParams;t&&a.set("search",t),a.set("limit","60");const e=`${o}monsters/?${a.toString()}`;let s=(await u(await fetch(e))).results??[];return d&&(s=s.filter(c=>p(c.challenge_rating)<=p(d))),s}async function b(t){const d=`${o}monsters/${encodeURIComponent(t)}/`;return u(await fetch(d))}async function f({page:t=1,limit:d=50}={}){const a=new URLSearchParams({page:String(t),limit:String(d)}),e=`${o}monsters/?${a.toString()}`;return u(await fetch(e))}function p(t){if(!t)return Number.POSITIVE_INFINITY;const d=String(t).trim();if(d.includes("/")){const[e,n]=d.split("/").map(Number);return e/n}const a=Number(d);return Number.isFinite(a)?a:Number.POSITIVE_INFINITY}const g="https://api.unsplash.com",h="CO7Jihybp-Dm056TbF_RjTbfs1wtJV2-Kn4Nbifd_TM",$="dnd_encounter_builder";async function v(t){const d=await t.json().catch(()=>({}));if(t.ok)return d;throw{name:"unsplashError",message:d}}async function y(t,{perPage:d=1,orientation:a="landscape"}={}){const e=new URLSearchParams({query:t,per_page:String(d),orientation:a}),n=await fetch(`${g}/search/photos?${e.toString()}`,{headers:{Authorization:`Client-ID ${h}`,"Accept-Version":"v1"}});return v(n)}function S(t){const d=`?utm_source=${encodeURIComponent($)}&utm_medium=referral`;return{photographerName:t.user?.name??"Unknown",photographerUrl:`${t.user?.links?.html??"https://unsplash.com"}${d}`,unsplashUrl:`https://unsplash.com${d}`}}function _(t,{buttonText:d="View Details",buttonClass:a="btn",showPick:e=!1}={}){const n=t.challenge_rating??"—",s=t.type??"—",c=t.size??"—",r=document.createElement("article");return r.className="card",r.innerHTML=`
    <h3 class="card-title">${i(t.name??"Unknown")}</h3>
    <p class="muted">${i(c)} ${i(s)} • CR ${i(String(n))}</p>
    <dl class="stats">
      <div><dt>AC</dt><dd>${t.armor_class??"—"}</dd></div>
      <div><dt>HP</dt><dd>${t.hit_points??"—"}</dd></div>
      <div><dt>STR</dt><dd>${t.strength??"—"}</dd></div>
      <div><dt>DEX</dt><dd>${t.dexterity??"—"}</dd></div>
      <div><dt>CON</dt><dd>${t.constitution??"—"}</dd></div>
    </dl>
    <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
      <button class="${a}" type="button" data-action="detail" data-slug="${i(t.slug??"")}">
        ${i(d)}
      </button>
      ${e?`<button class="btn" type="button" data-action="pick" data-slug="${i(t.slug??"")}">Pick</button>`:""}
    </div>
  `,r}function A(t){const d=t.challenge_rating??"—",a=t.type??"—",e=t.size??"—",n=t.alignment??"—",s=t.speed??"—";return`
    <h3>${i(t.name??"Monster")}</h3>
    <p class="muted">${i(e)} ${i(a)} • ${i(n)} • CR ${i(String(d))}</p>

    <dl class="kv">
      <div><dt>Armor Class</dt><dd>${t.armor_class??"—"}</dd></div>
      <div><dt>Hit Points</dt><dd>${t.hit_points??"—"}</dd></div>
      <div><dt>Speed</dt><dd>${i(String(s))}</dd></div>
      <div><dt>Languages</dt><dd>${i(t.languages??"—")}</dd></div>
      <div><dt>Senses</dt><dd>${i(t.senses??"—")}</dd></div>
      <div><dt>Legendary?</dt><dd>${t.legendary_desc?"Yes":"No"}</dd></div>
    </dl>

    <h4>Abilities</h4>
    <dl class="kv">
      <div><dt>STR</dt><dd>${t.strength??"—"}</dd></div>
      <div><dt>DEX</dt><dd>${t.dexterity??"—"}</dd></div>
      <div><dt>CON</dt><dd>${t.constitution??"—"}</dd></div>
      <div><dt>INT</dt><dd>${t.intelligence??"—"}</dd></div>
      <div><dt>WIS</dt><dd>${t.wisdom??"—"}</dd></div>
      <div><dt>CHA</dt><dd>${t.charisma??"—"}</dd></div>
    </dl>

    ${t.special_abilities?.length?`<h4>Special Abilities</h4>${l(t.special_abilities)}`:""}
    ${t.actions?.length?`<h4>Actions</h4>${l(t.actions)}`:""}
    ${t.legendary_actions?.length?`<h4>Legendary Actions</h4>${l(t.legendary_actions)}`:""}
  `}function l(t){return`
    <div style="display:grid; gap:.5rem;">
      ${t.map(d=>`
        <div style="border:1px solid var(--border); border-radius:12px; padding:.75rem; background:#111118;">
          <strong>${i(d.name??"")}</strong>
          <p class="muted" style="margin:.35rem 0 0;">${i(d.desc??"")}</p>
        </div>`).join("")}
    </div>
  `}function i(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}export{_ as a,y as b,S as c,p as d,b as g,f as l,A as m,m as s};
