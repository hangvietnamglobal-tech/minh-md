// books.js — "my library": the books Tuệ Minh has read, Blinkist-style. Each book keeps its cover, categories,
// what it is about, the key ideas she wants to keep, her favourite lines and the one action she takes from it.
// Stored in this browser (inside MINH.md's store) with JSON backup; an encrypted books.enc.json can also be pulled
// with the same private key as "my people".
import { createElement, Flower2, Palette, HandHeart, GraduationCap, Target, Feather, Leaf, Globe, TrendingUp, Flower, Brain, Network, Hourglass,
  MessagesSquare, Heart, Apple, FlaskConical, Rocket, ChartLine, Landmark, Baby, Scroll, Lightbulb, Briefcase, Presentation, Cpu, PiggyBank, BookOpen,
  Search, Plus, Star, X, Upload, Download, Quote, ListChecks, Pencil, Trash2, Clock, Sparkles, ImagePlus, Library, BookMarked } from "lucide";

const ic = (node, size = 22) => { const el = createElement(node); el.setAttribute("width", size); el.setAttribute("height", size); el.setAttribute("stroke-width", "1.6"); return el.outerHTML; };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const CATS = [
  ["Philosophy", Flower2], ["Creativity", Palette], ["Religion & Spirituality", HandHeart], ["Education", GraduationCap], ["Career & Success", Target],
  ["Biography & Memoir", Feather], ["Nature & the Environment", Leaf], ["Society & Culture", Globe], ["Personal Development", TrendingUp],
  ["Mindfulness & Happiness", Flower], ["Psychology", Brain], ["Management & Leadership", Network], ["Productivity", Hourglass], ["Communication Skills", MessagesSquare],
  ["Sex & Relationships", Heart], ["Health & Nutrition", Apple], ["Science", FlaskConical], ["Entrepreneurship", Rocket], ["Economics", ChartLine], ["Politics", Landmark],
  ["Parenting", Baby], ["History", Scroll], ["Motivation & Inspiration", Lightbulb], ["Corporate Culture", Briefcase], ["Marketing & Sales", Presentation],
  ["Technology & the Future", Cpu], ["Money & Investments", PiggyBank], ["Fiction", BookOpen],
];
const CAT_IC = Object.fromEntries(CATS);
const STATUS = { finished: "Finished", reading: "Reading", want: "Want to read" };
const C_STATUS = { finished: "Completed", reading: "Learning", want: "Want to take" };
const stName = b => (b.kind === "course" ? C_STATUS : STATUS)[b.status];
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const lines = v => Array.isArray(v) ? v : String(v || "").split(/\n+/).map(s => s.replace(/^\s*[-•\d.)]+\s*/, "").trim()).filter(Boolean);
const clean = b => ({ id: b.id || uid(), kind: b.kind === "course" ? "course" : "book", progress: Math.max(0, Math.min(100, +b.progress || (b.status === "finished" ? 100 : 0))), hours: b.hours || "", cert: b.cert || "", title: b.title || "Untitled", author: b.author || "", cover: b.cover || "", cats: (Array.isArray(b.cats) ? b.cats : String(b.cats || "").split(/[,;]/)).map(s => s.trim()).filter(c => CAT_IC[c]),
  status: STATUS[b.status] ? b.status : "finished", rating: Math.max(0, Math.min(5, +b.rating || 0)), started: b.started || "", finished: b.finished || "", pages: b.pages || "",
  about: b.about || "", ideas: lines(b.ideas), quotes: lines(b.quotes), takeaway: b.takeaway || "", tags: (Array.isArray(b.tags) ? b.tags : String(b.tags || "").split(",")).map(s => s.trim()).filter(Boolean), added: b.added || today() });
const hue = s => [...(s || "x")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 11);
// a typeset cover for books without a picture
const PAL = ["#fc4109", "#004edf", "#1c3d24", "#c99a2e", "#5d9dc5", "#e83729", "#201e1f", "#69b488", "#8a5cc2"];
export const coverColor = t => PAL[hue(t) % PAL.length];
const fakeCover = b => `<div class="bk-fake" style="--c:${coverColor(b.title)}"><b>${esc(b.title)}</b><i>${esc(b.author)}</i></div>`;
const coverOf = b => b.cover ? `<img src="${esc(b.cover)}" alt="Cover of ${esc(b.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'bk-fake',innerHTML:'<b>'+this.alt.replace('Cover of ','')+'</b>'}))">` : fakeCover(b);
const stars = (n, cls = "bk-stars") => `<span class="${cls}">${"★".repeat(n)}<s>${"★".repeat(5 - n)}</s></span>`;

// resize an uploaded picture so a hundred covers fit in local storage
const shrink = file => new Promise((res, rej) => { const r = new FileReader(); r.onerror = rej; r.onload = () => { const im = new Image(); im.onload = () => {
  const s = Math.min(1, 420 / im.width), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .82)); }; im.onerror = rej; im.src = r.result; }; r.readAsDataURL(file); });

const ub = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
async function pullPrivate() { let k = null; try { k = localStorage.getItem("minhmd.pk"); } catch {} if (!k) return null;
  const r = await fetch("./books.enc.json", { cache: "no-store" }); if (!r.ok) return null; const e = await r.json();
  const key = await crypto.subtle.importKey("raw", ub(k), "AES-GCM", false, ["decrypt"]);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub(e.iv) }, key, ub(e.ct)))); }

export function mountBooks({ DB, save }) {
  DB.books = (DB.books || []).map(clean); DB.bookGoal = DB.bookGoal || 12; DB.courseGoal = DB.courseGoal || 4;
  const st = { q: "", cat: "", status: "", sort: "recent", open: null, edit: null, kind: "book" };
  document.body.insertAdjacentHTML("beforeend", `<section class="bks" id="bks" aria-label="My library" data-lenis-prevent>
  <header class="bk-top"><div><p class="kick"><b>##</b> my library · books &amp; courses</p><h2 class="bk-h">The books and courses that <em>shape me</em></h2>
    <nav class="bk-kind" id="bkKind"><button data-kind="book" class="on">${ic(BookOpen, 18)} Books</button><button data-kind="course">${ic(GraduationCap, 18)} Courses</button></nav></div>
    <div class="bk-act"><button class="bk-btn pri" id="bkAdd">${ic(Plus, 18)} <span id="bkAddL">add a book</span></button><label class="bk-btn">${ic(Upload, 18)} import<input type="file" id="bkImp" accept=".json,application/json" hidden></label>
    <button class="bk-btn" id="bkExp">${ic(Download, 18)} backup</button><button class="bk-btn" id="bkClose" aria-label="Close">${ic(X, 18)}</button></div></header>
  <div class="bk-goal" id="bkGoal"></div>
  <div class="bk-reading" id="bkReading"></div>
  <section class="bk-catsec"><h3>Categories</h3><p>Explore all categories</p><div class="bk-cats" id="bkCats"></div></section>
  <div class="bk-bar"><label class="bk-search">${ic(Search, 18)}<input id="bkQ" type="search" placeholder="Search titles, authors, ideas, quotes…"></label>
    <div class="bk-tabs" id="bkTabs"></div><select id="bkSort" aria-label="Sort"><option value="recent">Recently finished</option><option value="added">Recently added</option><option value="rating">Top rated</option><option value="title">Title A–Z</option><option value="author">Author A–Z</option></select></div>
  <p class="bk-filter" id="bkFilter"></p>
  <div class="bk-grid" id="bkGrid"></div>
  <div class="bk-modal" id="bkView" role="dialog" aria-modal="true"></div>
  <div class="bk-modal" id="bkEdit" role="dialog" aria-modal="true"><form class="bk-form" id="bkForm"></form></div>
</section>`);
  const $ = s => document.querySelector(s), commit = () => { save(); render(); };
  const year = new Date().getFullYear();

  function list() { const q = st.q.toLowerCase();
    const L = DB.books.filter(b => b.kind === st.kind && (!st.cat || b.cats.includes(st.cat)) && (!st.status || b.status === st.status) &&
      (!q || [b.title, b.author, b.about, b.takeaway, ...b.ideas, ...b.quotes, ...b.tags, ...b.cats].join(" ").toLowerCase().includes(q)));
    const by = { recent: (a, b) => (b.finished || b.started || b.added).localeCompare(a.finished || a.started || a.added), added: (a, b) => b.added.localeCompare(a.added),
      rating: (a, b) => b.rating - a.rating, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.author.localeCompare(b.author) };
    return L.sort(by[st.sort]); }
  function render() {
    const B = DB.books.filter(b => b.kind === st.kind), isC = st.kind === "course", S = isC ? C_STATUS : STATUS, GOAL = isC ? DB.courseGoal : DB.bookGoal;
    document.querySelectorAll("#bkKind button").forEach(x => x.classList.toggle("on", x.dataset.kind === st.kind)); $("#bkAddL").textContent = isC ? "add a course" : "add a book";
    const _ = 0, done = B.filter(b => b.status === "finished" && (b.finished || b.added).startsWith(String(year))).length, pct = Math.min(100, done / GOAL * 100);
    $("#bkGoal").innerHTML = `<div class="bk-goalmain"><p class="kick">${year} ${isC ? "learning" : "reading"} goal</p><p class="bk-big"><b>${done}</b> / <button id="bkGoalSet" title="Change goal">${isC ? DB.courseGoal : DB.bookGoal}</button> ${isC ? "courses" : "books"}</p>
      <div class="bk-bar2"><i style="width:${pct}%"></i></div><p class="bk-sub">${done >= GOAL ? "Goal reached — beautiful." : (w => `${GOAL - done} to go · about one ${w <= 1 ? "a week" : "every " + w + " weeks"}`)(Math.round((12 - new Date().getMonth()) * 4.3 / Math.max(1, GOAL - done)))}</p></div>
      <div class="bk-kpis"><span>${ic(BookMarked, 20)}<b>${B.filter(b => b.status === "finished").length}</b> ${isC ? "completed" : "finished"}</span><span>${ic(BookOpen, 20)}<b>${B.filter(b => b.status === "reading").length}</b> ${isC ? "learning" : "reading"}</span>
      <span>${ic(ListChecks, 20)}<b>${B.reduce((n, b) => n + b.ideas.length, 0)}</b> ${isC ? "key lessons" : "key ideas"}</span><span>${ic(Quote, 20)}<b>${B.reduce((n, b) => n + b.quotes.length, 0)}</b> highlights</span></div>`;
    $("#bkGoalSet").onclick = () => { const g = +prompt(isC ? "Courses to complete this year:" : "Books to read this year:", GOAL); if (g > 0) { DB[isC ? "courseGoal" : "bookGoal"] = Math.round(g); commit(); } };
    const R = B.filter(b => b.status === "reading");
    $("#bkReading").innerHTML = R.length ? `<h3>${isC ? "Continue learning" : "Continue reading"}</h3><div class="bk-row">${R.map(b => `<button class="bk-cont" data-id="${b.id}"><span class="bk-cov sm">${coverOf(b)}</span><span><b>${esc(b.title)}</b><i>${esc(b.author)}</i><small>${isC ? `${b.progress}% done` : `${b.ideas.length} ideas noted so far`}</small>${isC ? `<em class="bk-prog"><i style="width:${b.progress}%"></i></em>` : ""}</span></button>`).join("")}</div>` : "";
    const cnt = c => B.filter(b => b.cats.includes(c)).length;
    $("#bkCats").innerHTML = CATS.map(([c, n]) => `<button class="bk-cat ${st.cat === c ? "on" : ""}" data-cat="${esc(c)}">${ic(n, 26)}<span>${esc(c)}</span>${cnt(c) ? `<i>${cnt(c)}</i>` : ""}</button>`).join("");
    $("#bkTabs").innerHTML = [["", "All"], ...Object.entries(S)].map(([v, l]) => `<button class="${st.status === v ? "on" : ""}" data-st="${v}">${l} <i>${v ? B.filter(b => b.status === v).length : B.length}</i></button>`).join("");
    $("#bkFilter").innerHTML = st.cat ? `${ic(CAT_IC[st.cat], 18)} ${esc(st.cat)} <button id="bkClr">clear ✕</button>` : "";
    if (st.cat) $("#bkClr").onclick = () => { st.cat = ""; render(); };
    const L = list();
    $("#bkGrid").innerHTML = L.length ? L.map(b => `<article class="bk-card ${b.kind}" data-id="${b.id}" tabindex="0"><div class="bk-cov">${coverOf(b)}${b.status !== "finished" ? `<span class="bk-badge ${b.status}">${stName(b)}</span>` : ""}</div>${isC && b.status === "reading" ? `<em class="bk-prog"><i style="width:${b.progress}%"></i></em>` : ""}
      <h4>${esc(b.title)}</h4><p class="bk-au">${esc(b.author)}</p>${b.cats[0] ? `<p class="bk-cl">${ic(CAT_IC[b.cats[0]], 14)} ${esc(b.cats[0])}</p>` : ""}
      <p class="bk-mt">${b.rating ? stars(b.rating) : ""}<span>${ic(ListChecks, 14)} ${b.ideas.length}</span><span>${ic(Quote, 14)} ${b.quotes.length}</span></p></article>`).join("")
      : `<div class="bk-empty">${ic(Library, 40)}<p>${B.length ? "Nothing matches." : isC ? "Add the first course you are taking." : "Your library is waiting for its first book."}</p><button class="bk-btn pri" data-add>${ic(Plus, 18)} ${isC ? "add a course" : "add a book"}</button></div>`;
  }

  function view(b) {
    st.open = b.id;
    $("#bkView").innerHTML = `<article class="bk-page"><button class="bk-x" data-close aria-label="Close">${ic(X, 20)}</button>
      <div class="bk-hero" style="--h:${hue(b.title)}"><div class="bk-cov big">${coverOf(b)}</div><div class="bk-meta">
        <p class="bk-cats2">${b.cats.map(c => `<span>${ic(CAT_IC[c], 15)} ${esc(c)}</span>`).join("")}</p>
        <h2>${esc(b.title)}</h2><p class="bk-by">${esc(b.author)}</p>
        <p class="bk-facts">${b.rating ? stars(b.rating) : ""}<span class="bk-badge ${b.status}">${stName(b)}</span>${b.finished ? `<span>${ic(Clock, 15)} finished ${esc(b.finished)}</span>` : b.started ? `<span>${ic(Clock, 15)} started ${esc(b.started)}</span>` : ""}${b.pages ? `<span>${esc(b.pages)} ${b.kind === "course" ? "lessons" : "pages"}</span>` : ""}${b.hours ? `<span>${esc(b.hours)} h</span>` : ""}${b.kind === "course" && b.status === "reading" ? `<span>${b.progress}% done</span>` : ""}${b.cert ? `<a href="${esc(b.cert)}" target="_blank" rel="noopener">certificate ↗</a>` : ""}</p>
        <p class="bk-facts"><span>${ic(ListChecks, 15)} ${b.ideas.length} ${b.kind === "course" ? "key lessons" : "key ideas"}</span><span>${ic(Quote, 15)} ${b.quotes.length} highlights</span></p>
        <div class="bk-pa"><button class="bk-btn pri" data-edit>${ic(Pencil, 16)} edit notes</button></div></div></div>
      ${b.about ? `<section><h3>What's it about?</h3><p class="bk-about">${esc(b.about)}</p></section>` : ""}
      ${b.ideas.length ? `<section><h3>${b.kind === "course" ? "Key lessons" : "Key ideas"}</h3><ol class="bk-ideas">${b.ideas.map((x, i) => `<li><b>${String(i + 1).padStart(2, "0")}</b><p>${esc(x)}</p></li>`).join("")}</ol></section>` : ""}
      ${b.quotes.length ? `<section><h3>Highlights I love</h3><div class="bk-quotes">${b.quotes.map(q => `<blockquote>${ic(Quote, 22)}<p>${esc(q)}</p></blockquote>`).join("")}</div></section>` : ""}
      ${b.takeaway ? `<section class="bk-take"><h3>${ic(Sparkles, 20)} My takeaway — what I will do</h3><p>${esc(b.takeaway)}</p></section>` : ""}
      ${b.tags.length ? `<p class="bk-tags">${b.tags.map(t => `<i>#${esc(t)}</i>`).join("")}</p>` : ""}
      ${!b.about && !b.ideas.length && !b.quotes.length ? `<p class="bk-hint">No notes yet — tap <b>edit notes</b> to add what it's about, the key ideas and the lines you loved.</p>` : ""}
    </article>`;
    $("#bkView").classList.add("on"); $("#bkView").scrollTop = 0;
  }
  function form(b) {
    st.edit = b ? b.id : null; const v = b || clean({ status: st.kind === "course" ? "reading" : "finished", finished: st.kind === "course" ? "" : today(), kind: st.kind }); const isC = v.kind === "course"; let cover = v.cover;
    $("#bkForm").innerHTML = `<h3>${b ? "Edit" : "Add"} ${isC ? "a course" : "a book"}</h3>
      <div class="bk-fgrid"><div class="bk-fcov"><div class="bk-cov big" id="bkCovPrev">${coverOf(v)}</div>
        <label class="bk-btn">${ic(ImagePlus, 16)} upload cover<input type="file" accept="image/*" id="bkCovFile" hidden></label>
        <button type="button" class="bk-btn" id="bkFind">${ic(Search, 16)} find cover online</button><input id="bkCovUrl" placeholder="…or paste an image link" value="${esc(v.cover.startsWith("data:") ? "" : v.cover)}">
        <div class="bk-found" id="bkFound"></div></div>
      <div class="bk-ff">
        <label><span>Title</span><input name="title" required value="${esc(v.title === "Untitled" ? "" : v.title)}"></label>
        <label><span>${isC ? "Teacher / school / platform" : "Author"}</span><input name="author" value="${esc(v.author)}"></label>
        <div class="bk-three"><label><span>Status</span><select name="status">${Object.entries(isC ? C_STATUS : STATUS).map(([k, l]) => `<option value="${k}" ${v.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <label><span>My rating</span><select name="rating">${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}" ${v.rating === n ? "selected" : ""}>${n ? "★".repeat(n) : "—"}</option>`).join("")}</select></label>
          <label><span>${isC ? "Lessons" : "Pages"}</span><input name="pages" value="${esc(v.pages)}"></label></div>${isC ? `<div class="bk-three"><label><span>Progress %</span><input type="number" min="0" max="100" name="progress" value="${v.progress}"></label><label><span>Hours</span><input name="hours" value="${esc(v.hours)}"></label><label><span>Certificate link</span><input name="cert" value="${esc(v.cert)}"></label></div>` : ""}
        <div class="bk-three"><label><span>Started</span><input type="date" name="started" value="${esc(v.started)}"></label><label><span>Finished</span><input type="date" name="finished" value="${esc(v.finished)}"></label><label><span>Tags</span><input name="tags" value="${esc(v.tags.join(", "))}"></label></div>
        <span class="bk-lab">Categories</span><div class="bk-pick">${CATS.map(([c, n]) => `<label class="${v.cats.includes(c) ? "on" : ""}"><input type="checkbox" name="cats" value="${esc(c)}" ${v.cats.includes(c) ? "checked" : ""} hidden>${ic(n, 15)} ${esc(c)}</label>`).join("")}</div>
      </div></div>
      <label class="bk-wide"><span>What's it about? (2–3 sentences in my words)</span><textarea name="about" rows="3">${esc(v.about)}</textarea></label>
      <label class="bk-wide"><span>${isC ? "Key lessons" : "Key ideas"} — one per line</span><textarea name="ideas" rows="6" placeholder="Habits are the compound interest of self-improvement.&#10;…">${esc(v.ideas.join("\n"))}</textarea></label>
      <label class="bk-wide"><span>Highlights I love — one quote per line</span><textarea name="quotes" rows="4">${esc(v.quotes.join("\n"))}</textarea></label>
      <label class="bk-wide"><span>My takeaway — the one thing I will do</span><textarea name="takeaway" rows="2">${esc(v.takeaway)}</textarea></label>
      <div class="bk-fbtn">${b ? `<button type="button" class="bk-btn danger" id="bkDel">${ic(Trash2, 16)} delete</button>` : ""}<span></span><button type="button" class="bk-btn" data-close>cancel</button><button class="bk-btn pri">save</button></div>`;
    const prev = () => { $("#bkCovPrev").innerHTML = coverOf({ ...v, cover, title: $("#bkForm [name=title]").value || v.title }); };
    $("#bkCovFile").onchange = async e => { const f = e.target.files[0]; if (f) { cover = await shrink(f); $("#bkCovUrl").value = ""; prev(); } };
    $("#bkCovUrl").oninput = e => { cover = e.target.value.trim(); prev(); };
    $("#bkForm .bk-pick").onchange = e => e.target.closest("label").classList.toggle("on", e.target.checked);
    $("#bkFind").onclick = async () => { const t = $("#bkForm [name=title]").value.trim(), a = $("#bkForm [name=author]").value.trim(); if (!t) return alert("Type the title first.");
      $("#bkFound").innerHTML = "<p>searching Open Library…</p>";
      try { const r = await (await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(t)}${a ? "&author=" + encodeURIComponent(a) : ""}&limit=12&fields=cover_i,title,author_name,number_of_pages_median`)).json();
        const docs = r.docs.filter(d => d.cover_i).slice(0, 8);
        $("#bkFound").innerHTML = docs.length ? docs.map(d => `<button type="button" data-cv="https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg" data-au="${esc((d.author_name || [])[0] || "")}" data-pg="${d.number_of_pages_median || ""}"><img src="https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg" alt=""></button>`).join("") : "<p>No cover found — upload a photo of your copy instead.</p>";
      } catch { $("#bkFound").innerHTML = "<p>Couldn't reach Open Library — upload a photo instead.</p>"; } };
    $("#bkFound").onclick = e => { const x = e.target.closest("[data-cv]"); if (!x) return; cover = x.dataset.cv; $("#bkCovUrl").value = cover;
      if (!$("#bkForm [name=author]").value && x.dataset.au) $("#bkForm [name=author]").value = x.dataset.au; if (!$("#bkForm [name=pages]").value && x.dataset.pg) $("#bkForm [name=pages]").value = x.dataset.pg; prev(); };
    if (b) $("#bkDel").onclick = () => { if (!confirm(`Delete "${b.title}" and its notes?`)) return; DB.books = DB.books.filter(x => x.id !== b.id); $("#bkEdit").classList.remove("on"); $("#bkView").classList.remove("on"); commit(); };
    $("#bkForm").onsubmit = e => { e.preventDefault(); const fd = new FormData(e.target), o = Object.fromEntries(fd); o.cats = fd.getAll("cats"); o.cover = cover;
      const nb = clean({ ...(b || {}), ...o, kind: v.kind, id: b ? b.id : undefined, added: b ? b.added : today() });
      if (b) Object.assign(b, nb); else DB.books.push(nb); $("#bkEdit").classList.remove("on"); commit(); view(b || nb); };
    $("#bkEdit").classList.add("on"); $("#bkEdit").scrollTop = 0;
  }

  const sec = $("#bks");
  sec.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-add]") || t.closest("#bkAdd")) return form(null);
    if (t.closest("[data-close]") || t.classList.contains("bk-modal")) { (t.closest(".bk-modal") || t).classList.remove("on"); return; }
    if (t.closest("[data-edit]")) return form(DB.books.find(b => b.id === st.open));
    const kd = t.closest("[data-kind]"); if (kd) { st.kind = kd.dataset.kind; st.cat = ""; st.status = ""; return render(); }
    const c = t.closest("[data-cat]"); if (c) { st.cat = st.cat === c.dataset.cat ? "" : c.dataset.cat; render(); $("#bkGrid").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const s = t.closest("[data-st]"); if (s) { st.status = s.dataset.st; return render(); }
    const k = t.closest(".bk-card,.bk-cont"); if (k) return view(DB.books.find(b => b.id === k.dataset.id));
  });
  sec.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("bk-card")) view(DB.books.find(b => b.id === e.target.dataset.id));
    if (e.key === "Escape") { const m = [...sec.querySelectorAll(".bk-modal.on")].pop(); if (m) { m.classList.remove("on"); e.stopPropagation(); } } });
  $("#bkQ").oninput = e => { st.q = e.target.value; render(); }; $("#bkSort").onchange = e => { st.sort = e.target.value; render(); };
  $("#bkExp").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(DB.books, null, 1)], { type: "application/json" })); a.download = `minh-library-${today()}.json`; a.click(); };
  $("#bkImp").onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const L = JSON.parse(await f.text()); let n = 0;
      L.map(clean).forEach(b => { const same = DB.books.find(x => x.id === b.id || (x.kind === b.kind && x.title.toLowerCase() === b.title.toLowerCase())); if (same) Object.assign(same, b, { id: same.id }); else { DB.books.push(b); n++; } });
      commit(); alert(`Imported ${n} new book(s).`); } catch { alert("Couldn't read that file."); } e.target.value = ""; };
  render();
  pullPrivate().then(L => { if (!L) return; let n = 0; L.map(clean).forEach(b => { if (!DB.books.some(x => x.title.toLowerCase() === b.title.toLowerCase())) { DB.books.push(b); n++; } }); if (n) commit(); }).catch(() => {});
  return { render, setKind: k => { st.kind = k; render(); }, anyModal: () => !!sec.querySelector(".bk-modal.on") };
}
