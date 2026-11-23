// people.js — "my people": a private relationship book. Everything lives only in this browser (localStorage,
// inside MINH.md's own store); nothing is ever written to the public site. Name cards Tuệ Minh sends are turned into
// an import file (JSON / CSV / vCard) that she loads here herself.
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const GROUPS = ["Client", "Supplier", "Partner", "Investor", "Team", "Mentor", "Friend", "Family", "Government", "Other"];
const FIELDS = [
  ["name", "Name", "text", 1], ["title", "Title / role", "text"], ["company", "Company", "text"], ["group", "Group", "group"],
  ["phone", "Phone", "tel"], ["email", "Email", "email"], ["web", "Website", "text"], ["country", "Country", "text"], ["city", "City", "text"],
  ["address", "Address", "text"], ["industry", "Industry", "text"], ["tags", "Tags (comma)", "text"], ["met", "Where / how we met", "text"],
  ["metOn", "Met on", "date"], ["last", "Last contact", "date"], ["next", "Next follow-up", "date"], ["close", "Closeness", "close"],
  ["birthday", "Birthday", "date"], ["notes", "Notes", "area"],
];
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const initials = n => (n || "?").split(/\s+/).filter(Boolean).map(w => w[0]).slice(-2).join("").toUpperCase();
const hue = s => [...(s || "x")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

// ---------- import / export ----------
const CSV_COLS = FIELDS.map(f => f[0]);
function toCSV(list) { const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`; return [CSV_COLS.join(","), ...list.map(p => CSV_COLS.map(k => q(Array.isArray(p[k]) ? p[k].join(", ") : p[k])).join(","))].join("\n"); }
function parseCSV(txt) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < txt.length; i++) { const c = txt[i];
    if (q) { if (c === '"' && txt[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map(h => h.trim()); return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
function toVCF(list) {
  return list.map(p => ["BEGIN:VCARD", "VERSION:3.0", `FN:${p.name || ""}`, p.company ? `ORG:${p.company}` : "", p.title ? `TITLE:${p.title}` : "", p.phone ? `TEL;TYPE=CELL:${p.phone}` : "",
    p.email ? `EMAIL:${p.email}` : "", p.web ? `URL:${p.web}` : "", p.address ? `ADR:;;${p.address};${p.city || ""};;;${p.country || ""}` : "", p.notes ? `NOTE:${p.notes.replace(/\n/g, "\\n")}` : "", "END:VCARD"].filter(Boolean).join("\n")).join("\n");
}
function parseVCF(txt) {
  return txt.split(/BEGIN:VCARD/i).slice(1).map(b => { const get = k => (b.match(new RegExp("^" + k + "[^:\\n]*:(.*)$", "im")) || [])[1]?.trim() || "";
    const adr = get("ADR").split(";"); return { name: get("FN"), company: get("ORG").replace(/;/g, " "), title: get("TITLE"), phone: get("TEL"), email: get("EMAIL"), web: get("URL"), address: adr[2] || "", city: adr[3] || "", country: adr[6] || "", notes: get("NOTE").replace(/\\n/g, "\n") }; });
}
const clean = p => { const o = { id: p.id || uid(), added: p.added || today() };
  FIELDS.forEach(([k]) => { let v = p[k] ?? p[k.toLowerCase()] ?? ""; if (k === "tags") v = Array.isArray(v) ? v : String(v).split(/[,;]/).map(s => s.trim()).filter(Boolean); if (k === "close") v = Math.max(0, Math.min(5, +v || 0)); if (k === "group" && !GROUPS.includes(v)) v = v ? (GROUPS.find(g => g.toLowerCase() === String(v).toLowerCase()) || "Other") : "Other"; o[k] = v; });
  o.log = Array.isArray(p.log) ? p.log : []; return o; };
const download = (name, text, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

// ---------- the page ----------
export function mountPeople({ DB, save }) {
  DB.people = (DB.people || []).map(clean);
  const st = { q: "", group: "", country: "", tag: "", due: false, close: 0, sort: "next", open: null };
  document.body.insertAdjacentHTML("beforeend", `<section class="ppl" id="ppl" aria-label="My people" data-lenis-prevent>
  <header class="pp-top"><div><p class="kick"><b>##</b> my people · relationships</p><h2 class="pp-h">The people who <em>build my life</em></h2>
    <p class="pp-note">Private to this browser — nothing here is published. Export a backup now and then.</p></div>
    <div class="pp-act"><button class="pill" id="ppAdd">+ add person</button><label class="pill pp-file">import<input type="file" id="ppImp" accept=".json,.csv,.vcf,text/csv,text/vcard,application/json" hidden></label>
    <button class="pill ghost" id="ppExp">export ▾</button><div class="pp-menu" id="ppMenu"><button data-x="json">JSON (backup)</button><button data-x="csv">CSV (Excel)</button><button data-x="vcf">vCard (phone)</button></div>
    <button class="pill ghost" id="ppClose">close ✕</button></div></header>
  <div class="pp-stats" id="ppStats"></div>
  <div class="pp-filt"><input id="ppQ" type="search" placeholder="Search name, company, notes, tags…" aria-label="Search">
    <div class="pp-chips" id="ppGroups"></div>
    <div class="pp-sel"><select id="ppCountry" aria-label="Country"></select><select id="ppTag" aria-label="Tag"></select>
      <select id="ppClos" aria-label="Closeness"><option value="0">any closeness</option><option value="3">★★★ and up</option><option value="4">★★★★ and up</option><option value="5">★★★★★ only</option></select>
      <select id="ppSort" aria-label="Sort"><option value="next">sort · next follow-up</option><option value="name">sort · name</option><option value="company">sort · company</option><option value="last">sort · longest no contact</option><option value="added">sort · newest</option><option value="close">sort · closest</option></select>
      <label class="pp-due"><input type="checkbox" id="ppDue"> follow-up due</label></div></div>
  <div class="pp-grid" id="ppGrid"></div>
  <div class="pp-modal" id="ppModal" role="dialog" aria-modal="true"><form class="pp-form" id="ppForm"></form></div>
</section>`);
  const $ = s => document.querySelector(s), grid = $("#ppGrid");
  const commit = () => { save(); render(); };
  const dueOf = p => p.next && p.next <= today();
  const daysSince = d => d ? Math.floor((Date.now() - new Date(d)) / 864e5) : null;

  function filtered() {
    const q = st.q.toLowerCase();
    let L = DB.people.filter(p => (!st.group || p.group === st.group) && (!st.country || p.country === st.country) && (!st.tag || p.tags.includes(st.tag)) && (!st.due || dueOf(p)) && (p.close >= st.close)
      && (!q || [p.name, p.title, p.company, p.email, p.phone, p.city, p.country, p.industry, p.met, p.notes, ...p.tags].join(" ").toLowerCase().includes(q)));
    const by = { name: (a, b) => a.name.localeCompare(b.name), company: (a, b) => (a.company || "~").localeCompare(b.company || "~"), added: (a, b) => b.added.localeCompare(a.added), close: (a, b) => b.close - a.close,
      last: (a, b) => (a.last || "0").localeCompare(b.last || "0"), next: (a, b) => (a.next || "9").localeCompare(b.next || "9") };
    return L.sort(by[st.sort]);
  }
  function render() {
    const P = DB.people, uniq = k => [...new Set(P.map(p => p[k]).filter(Boolean))].sort();
    const due = P.filter(dueOf).length, cold = P.filter(p => (daysSince(p.last) ?? 999) > 90).length;
    $("#ppStats").innerHTML = `<span><b>${P.length}</b> people</span><span><b>${uniq("company").length}</b> companies</span><span><b>${uniq("country").length}</b> countries</span><span class="${due ? "hot" : ""}"><b>${due}</b> follow-ups due</span><span><b>${cold}</b> not contacted in 90 days</span>`;
    const cnt = g => P.filter(p => p.group === g).length;
    $("#ppGroups").innerHTML = [["", "All", P.length], ...GROUPS.filter(cnt).map(g => [g, g, cnt(g)])].map(([v, l, n]) => `<button class="chip ${st.group === v ? "on" : ""}" data-g="${esc(v)}">${esc(l)} <i>${n}</i></button>`).join("");
    const opt = (el, list, all) => { const v = el.value; el.innerHTML = `<option value="">${all}</option>` + list.map(x => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join(""); };
    opt($("#ppCountry"), uniq("country"), "all countries"); opt($("#ppTag"), [...new Set(P.flatMap(p => p.tags))].sort(), "all tags");
    const L = filtered();
    grid.innerHTML = L.length ? L.map(p => { const d = daysSince(p.last);
      return `<article class="pp-card ${dueOf(p) ? "due" : ""}" data-id="${p.id}" tabindex="0">
        <div class="pp-av" style="--h:${hue(p.company || p.name)}">${esc(initials(p.name))}</div>
        <div class="pp-main"><h3>${esc(p.name)}</h3><p class="pp-role">${esc([p.title, p.company].filter(Boolean).join(" · "))}</p>
        <p class="pp-meta"><span class="grp g-${esc(p.group)}">${esc(p.group)}</span>${p.country ? `<span>📍 ${esc([p.city, p.country].filter(Boolean).join(", "))}</span>` : ""}${p.close ? `<span class="pp-stars">${"★".repeat(p.close)}</span>` : ""}</p>
        ${p.tags.length ? `<p class="pp-tags">${p.tags.map(t => `<i>#${esc(t)}</i>`).join("")}</p>` : ""}
        <p class="pp-when">${p.next ? `<span class="${dueOf(p) ? "hot" : ""}">↻ ${dueOf(p) ? "follow up now" : "follow up " + esc(p.next)}</span>` : ""}${d != null ? `<span>last contact ${d === 0 ? "today" : d + "d ago"}</span>` : ""}</p></div>
        <div class="pp-quick">${p.phone ? `<a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}" title="Call">☎</a>` : ""}${p.email ? `<a href="mailto:${esc(p.email)}" title="Email">✉</a>` : ""}<button data-touch="${p.id}" title="Mark contacted today">✓</button></div>
      </article>`; }).join("") : `<p class="pp-empty">${P.length ? "No one matches these filters." : "No one here yet. Add a person, or import the file made from your name cards."}</p>`;
  }
  function form(p) {
    st.open = p ? p.id : null; const v = p || { group: "Client", close: 3, tags: [], metOn: today(), last: today() };
    $("#ppForm").innerHTML = `<h3>${p ? "Edit" : "Add"} person</h3><div class="pp-fields">${FIELDS.map(([k, l, t, req]) => {
      const val = Array.isArray(v[k]) ? v[k].join(", ") : (v[k] ?? "");
      const input = t === "group" ? `<select name="${k}">${GROUPS.map(g => `<option ${g === val ? "selected" : ""}>${g}</option>`).join("")}</select>`
        : t === "close" ? `<select name="${k}">${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}" ${+val === n ? "selected" : ""}>${n ? "★".repeat(n) : "—"}</option>`).join("")}</select>`
        : t === "area" ? `<textarea name="${k}" rows="3">${esc(val)}</textarea>` : `<input name="${k}" type="${t}" value="${esc(val)}" ${req ? "required" : ""}>`;
      return `<label class="${t === "area" || k === "address" ? "wide" : ""}"><span>${l}</span>${input}</label>`; }).join("")}</div>
      ${p ? `<div class="pp-log"><p class="kick"><b>##</b> touchpoints</p>${(p.log || []).slice().reverse().map(e => `<p><b>${esc(e.d)}</b> ${esc(e.t)}</p>`).join("") || "<p>none yet</p>"}
        <div class="pp-logadd"><input id="ppLogT" placeholder="What happened? (call, meeting, gift…)"><button type="button" class="pill" id="ppLogB">+ log</button></div></div>` : ""}
      <div class="pp-fbtn">${p ? `<button type="button" class="pill ghost danger" id="ppDel">delete</button>` : ""}<span></span><button type="button" class="pill ghost" id="ppCancel">cancel</button><button class="pill" type="submit">save</button></div>`;
    $("#ppModal").classList.add("on"); $("#ppForm [name=name]").focus();
    $("#ppCancel").onclick = () => $("#ppModal").classList.remove("on");
    if (p) { $("#ppDel").onclick = () => { if (!confirm(`Delete ${p.name}? This can't be undone (export a backup first if unsure).`)) return; DB.people = DB.people.filter(x => x.id !== p.id); $("#ppModal").classList.remove("on"); commit(); };
      $("#ppLogB").onclick = () => { const t = $("#ppLogT").value.trim(); if (!t) return; p.log.push({ d: today(), t }); p.last = today(); commit(); form(p); }; }
  }
  $("#ppForm").onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    if (st.open) { const p = DB.people.find(x => x.id === st.open); Object.assign(p, clean({ ...p, ...f, id: p.id, log: p.log })); } else DB.people.push(clean(f));
    $("#ppModal").classList.remove("on"); commit(); };
  $("#ppModal").onclick = e => { if (e.target.id === "ppModal") e.currentTarget.classList.remove("on"); };
  grid.onclick = e => { const t = e.target.closest("[data-touch]"); if (t) { const p = DB.people.find(x => x.id === t.dataset.touch); p.last = today(); p.log.push({ d: today(), t: "contacted" }); return commit(); }
    if (e.target.closest("a")) return; const c = e.target.closest(".pp-card"); if (c) form(DB.people.find(x => x.id === c.dataset.id)); };
  grid.onkeydown = e => { if (e.key === "Enter" && e.target.classList.contains("pp-card")) form(DB.people.find(x => x.id === e.target.dataset.id)); };
  $("#ppGroups").onclick = e => { const b = e.target.closest("[data-g]"); if (b) { st.group = b.dataset.g; render(); } };
  $("#ppQ").oninput = e => { st.q = e.target.value; render(); };
  $("#ppCountry").onchange = e => { st.country = e.target.value; render(); }; $("#ppTag").onchange = e => { st.tag = e.target.value; render(); };
  $("#ppClos").onchange = e => { st.close = +e.target.value; render(); }; $("#ppSort").onchange = e => { st.sort = e.target.value; render(); }; $("#ppDue").onchange = e => { st.due = e.target.checked; render(); };
  $("#ppAdd").onclick = () => form(null);
  $("#ppExp").onclick = () => $("#ppMenu").classList.toggle("on");
  $("#ppMenu").onclick = e => { const x = e.target.dataset.x; if (!x) return; $("#ppMenu").classList.remove("on"); const d = today();
    if (x === "json") download(`minh-people-${d}.json`, JSON.stringify(DB.people, null, 2), "application/json");
    if (x === "csv") download(`minh-people-${d}.csv`, "﻿" + toCSV(DB.people), "text/csv");
    if (x === "vcf") download(`minh-people-${d}.vcf`, toVCF(DB.people), "text/vcard"); };
  $("#ppImp").onchange = async e => { const f = e.target.files[0]; if (!f) return; const txt = await f.text(); let L = [];
    try { L = /\.json$/i.test(f.name) ? JSON.parse(txt) : /\.vcf$/i.test(f.name) ? parseVCF(txt) : parseCSV(txt.replace(/^﻿/, "")); } catch { alert("Couldn't read that file."); return; }
    let add = 0, upd = 0; L.map(clean).forEach(p => { const same = DB.people.find(x => x.id === p.id || (x.name.toLowerCase() === p.name.toLowerCase() && (x.company || "").toLowerCase() === (p.company || "").toLowerCase()));
      if (same) { Object.keys(p).forEach(k => { if (k !== "id" && k !== "log" && (p[k] && (!Array.isArray(p[k]) || p[k].length))) same[k] = p[k]; }); upd++; } else { DB.people.push(p); add++; } });
    e.target.value = ""; commit(); alert(`Imported: ${add} new, ${upd} updated.`); };
  render();
  return { render };
}
