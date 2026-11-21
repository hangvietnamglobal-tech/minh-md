/* MINH.md — the film: one GSAP master timeline driven by scroll, a conductor for watch mode,
   the story layer (gags, chorus, bubbles), the puppet, the index, the .md reader and the "today" page. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";
import { EN } from "./content.js";
import { ART, DEFS, PLANT } from "./art.js";
import { mountPainting, stopPainting } from "./art-motion/index.js";
import { mountAnimeRoom, ROOM_SETS } from "./art-motion/anime-room.js";
import { mountMinh } from "./art-motion/minh-live.js";
import { mountAges, thumbs, ERAS } from "./art-motion/ages.js";
import { mountStair, setScale } from "./art-motion/staircase.js";
gsap.registerPlugin(ScrollTrigger, CustomEase);

/* =========================================================
   MINH.md — scroll-scrubbed film (GSAP + ScrollTrigger + Lenis)
   ========================================================= */
function springEase(name, zeta, omega, n=90){
  const wd = omega*Math.sqrt(Math.max(1e-6, 1 - zeta*zeta)); let d = "M0,0";
  for(let k=1;k<=n;k++){ const t=k/n; let y = zeta<1 ? 1 - Math.exp(-zeta*omega*t)*(Math.cos(wd*t) + zeta*omega/wd*Math.sin(wd*t)) : 1 - Math.exp(-omega*t)*(1+omega*t); if(k===n) y=1; d += ` L${t.toFixed(4)},${y.toFixed(4)}`; }
  CustomEase.create(name, d); return name;
}
CustomEase.create("camera","M0,0 C0.62,0 0.22,1 1,1"); CustomEase.create("reveal","M0,0 C0.18,0.82 0.24,1 1,1"); CustomEase.create("exit","M0,0 C0.3,-0.16 0.62,0 1,1"); CustomEase.create("hop","M0,0 C0.25,0.9 0.6,1.25 1,1");
springEase("spring",.62,11); springEase("springOut",.5,12); springEase("bouncy",.34,14); springEase("snappy",.78,16); springEase("wobble",.18,20); springEase("settle",.9,9);
document.body.insertAdjacentHTML("afterbegin", DEFS.replace("</defs>", `<radialGradient id="sunG" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff6d0"/><stop offset=".5" stop-color="#ffd36b"/><stop offset="1" stop-color="#f29a2e"/></radialGradient></defs>`));
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad2 = i => String(i).padStart(2, "0");
const lines = (txt, cls="") => txt.split("\n").map(t => `<span class="line ${cls}"><span>${esc(t)}</span></span>`).join("");
const svgOf = (key, extra="") => `<svg viewBox="0 0 200 200" ${extra}>${ART[key]||""}</svg>`;
const HER = "her.webp";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- character images: pose slots with graceful fallback ---------- */
const poseOK = {};
function poseSrc(p){ return poseOK[p] ? `poses/${p}.webp` : HER; }
["mug","yoga","read","heart","stand","meditate","wave","cheers","walk","money","laugh","love","career","character","travel","energy","family"].forEach(p => {
  const im = new Image(); im.onload = () => { poseOK[p] = true; refreshPoses(); }; im.src = `poses/${p}.webp`;
});
function refreshPoses(){ document.querySelectorAll("img[data-pose]").forEach(i => { const s = poseSrc(i.dataset.pose); if(!i.src.endsWith(s)) i.src = s; }); }
refreshPoses();

/* ---------- build DOM ---------- */
$(".hud-mug svg").innerHTML = ART.cup;
$("#openPlant").innerHTML = PLANT(1);
$("#plant").innerHTML = PLANT(1);
$("#dailyPad").innerHTML = svgOf("notepad");
$("#moon").innerHTML = svgOf("moon");
$("#tags").innerHTML = EN.taglines.map(t => `<p>${esc(t)}</p>`).join("");
$("#fileSay").innerHTML = lines("A reminder, in plain text,\nof the woman I am choosing\nto become.");
$("#sc-tri").innerHTML = EN.tri.map((w,i) => `<p class="w" id="tri${i}" style="top:${16+i*22}vh"><span>${esc(w)}</span></p>`).join("");
$("#dailyList").innerHTML = EN.daily.map(t => `<li>${esc(t)} <span class="tick"></span></li>`).join("");
$("#bbb").innerHTML = ["Believe.","Behave.","Become."].map(w => `<span class="bw" style="display:inline-block;margin:0 .14em">${w}</span>`).join("");
$("#closing").textContent = EN.closing;
$("#sig").textContent = EN.sign;
$("#stars").innerHTML = Array.from({length:70}, (_,k) => { const a=Math.abs(Math.sin(k*91.7)*43758.5)%1, b=Math.abs(Math.sin(k*12.9)*2463.6)%1; return `<i style="left:${(a*100).toFixed(2)}%;top:${(b*60).toFixed(2)}%;opacity:${(.3+.7*((a*7)%1)).toFixed(2)}"></i>`; }).join("");
document.querySelectorAll(".meta span")[0].textContent = EN.author;
document.querySelectorAll(".meta span")[1].textContent = EN.date;

const A = EN.areas;
const IX = n => A.findIndex(a => a.name === n);
$("#tarots").innerHTML = A.map((a,i) => `<div class="tarot" id="tc${i}"><img alt="${esc(a.arcana)}" src="${a.tarot}"></div>`).join("");
$("#props").innerHTML = A.map((a,i) => `<div class="pshadow" id="ps${i}"></div><div class="prop p-${a.prop}" id="prop${i}">${a.propImg ? `<img class="pi" alt="" src="${a.propImg}">` : svgOf(a.prop, 'class="pi"')}</div>`).join("");
const roman = ["I","II","III","IV","V","VI","VII","VIII"];
const words = txt => txt.split(/(\*[^*]+\*)/).filter(Boolean).map(seg => {
  const em = seg.startsWith("*"); const w = seg.replace(/\*/g,"").trim().split(/\s+/).map(x => `<span class="wd"><span>${esc(x)}</span></span>`).join(" ");
  return em ? `<em>${w}</em>` : w; }).join(" ");
const wcount = txt => (Array.isArray(txt) ? txt.join(" ") : txt).replace(/\*/g,"").split(/\s+/).filter(Boolean).length;
$("#groups").innerHTML = A.map((a,i) => `
  <div class="grp ${a.dark?"on-dark":""} ${/^#e[0-9a-f]/i.test(a.color)?"warm":""}" id="g${i}" style="${a.em?`--accent:${a.em}`:""}">
    <div class="bt b1"><p class="kick"><b>##</b> ${i+1}. ${esc(a.name)} · ${esc(a.arcana)}</p><p>${words(a.beats[0])}</p></div>
    <div class="bt b2"><p>${words(a.beats[1])}</p></div>
    <div class="bt b3 trio">${a.beats[2].map(l => `<p>${words(l)}</p>`).join("")}</div>
    <div class="bt b4"><p>${words(a.beats[3])}</p><p class="src">— ${esc(a.tag)}</p></div>
  </div>`).join("");

/* ---------- kinetic type: split titles into characters, kickers into typewriter keys ---------- */
document.querySelectorAll(".grp .kick, #sc-six .kick, #sc-scale .kick").forEach(k => { const b = k.querySelector("b"); const txt = k.textContent.replace(b.textContent, "").trim();
  k.innerHTML = `<b class="k">##</b><span class="k">&nbsp;</span>` + [...txt].map(ch => `<span class="k">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join(""); });

/* ---------- interludes & specials: DOM ---------- */
$("#sc-pause .pline").innerHTML = lines("Between what happens\nand how I respond,\nthere is a pause.");
function wheelMarkup(full){
  const n = A.length, R = 170, c = 200; let s = "";
  for(let r=1;r<=5;r++) s += `<circle class="ringc" cx="${c}" cy="${c}" r="${R*r/5}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${full?0:1}"/>`;
  const pts = [];
  A.forEach((a,i) => { const t = -Math.PI/2 + i*2*Math.PI/n, x = c + R*Math.cos(t), y = c + R*Math.sin(t);
    s += `<line class="spoke" x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${full?0:1}"/>`;
    const lx = c + (R+30)*Math.cos(t), ly = c + (R+30)*Math.sin(t);
    s += `<text class="wl" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${Math.abs(Math.cos(t))<.2?"middle":(Math.cos(t)>0?"start":"end")}" dominant-baseline="middle" opacity="${full?1:0}">${esc(a.name)}</text>`;
    const v = (a.score || 6)/10; pts.push(`${(c + R*v*Math.cos(t)).toFixed(1)},${(c + R*v*Math.sin(t)).toFixed(1)}`); });
  return s + `<polygon ${full?"":'id="wpoly"'} points="${pts.join(" ")}"/>`;
}
$("#wheelSvg").innerHTML = wheelMarkup(false);
$("#sc-wheel .wtxt").innerHTML = `<p class="kick"><b>##</b> the wheel of life</p><p class="say" style="margin-top:2vh">${lines("Eleven areas.\nOne life.\nBalanced — not perfect.")}</p>`;
$("#coins").innerHTML = Array.from({length:8}, (_,k) => `<i style="bottom:${k*9}px"><svg viewBox="0 0 64 20"><ellipse cx="32" cy="12" rx="30" ry="8" fill="#8a5e12"/><rect x="2" y="6" width="60" height="6" fill="url(#gGold)"/><ellipse cx="32" cy="6" rx="30" ry="8" fill="url(#gGoldV)"/></svg></i>`).join("");
const STEPS = Array.from({length:10}, (_,k) => [600 + k*60, 700 - k*38]);
const LV = ["20","75","150","200","250","350","400","500","600","700+"];
$("#stairs").innerHTML = `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>` +
  STEPS.map((p,k) => `<g class="stp" style="opacity:0"><rect x="${p[0]-56}" y="${p[1]}" width="112" height="14" rx="3" fill="${k<3?"#6b5a8e":k===3?"#ffd36b":"#ffe9b0"}" opacity="${k<3?.55:.95}"/><rect x="${p[0]-56}" y="${p[1]}" width="112" height="14" rx="3" fill="#fff6d8" opacity="${k<3?0:.6}" filter="url(#glow)"/></g>
  <text class="stl" x="${p[0]}" y="${p[1]+34}" text-anchor="middle" opacity="0">${LV[k]}</text>`).join("") +
  `<circle id="orb" cx="${STEPS[0][0]}" cy="${STEPS[0][1]-26}" r="13" fill="#fff4cf" opacity="0" style="filter:drop-shadow(0 0 14px #ffd36b) drop-shadow(0 0 30px #ffb84a)"/>`;

/* ---------- initial states ---------- */
gsap.set("#wall", {backgroundColor:"#004edf"});
gsap.set(["#sc-file .txt .line > span"], {yPercent:110});
gsap.set("#sc-file .kick", {opacity:0, y:20});
gsap.set(".eighty", {yPercent:70, opacity:0});
gsap.set("#sc-tri .w", {y:"-80vh", rotate:-6, opacity:1});
gsap.set("#sc-daily .kick", {opacity:0, y:20});
gsap.set("#dailyList li", {opacity:0, x:-40});
gsap.set("#dailyPad", {y:"70vh", rotate:8});
gsap.set(["#table","#plate"], {y:"40vh"});
gsap.set("#tableHer", {y:"110vh"});
gsap.set("#plant", {scale:0});
gsap.set(".prop", {y:"-90vh", rotate:-8});
gsap.set(".pshadow", {scale:.2, opacity:0});
gsap.set(".prop .pi", {transformOrigin:"50% 92%"});
gsap.set(".p-diamond .pi", {filter:"brightness(1) drop-shadow(0 0 0 rgba(255,255,255,0))"});
gsap.set(".bt .wd > span", {yPercent:150});
gsap.set(".bt .src", {opacity:0, y:12});
gsap.set("#table", {backgroundColor:A[0].floor});
gsap.set(["#stars","#sc-outro .sig","#closing"], {opacity:0});
gsap.set(["#sc-pause .panel","#sc-wheel .panel"], {yPercent:100});
gsap.set("#ring", {scale:.45}); gsap.set(".bwd", {opacity:0}); gsap.set("#wpoly", {scale:0, svgOrigin:"200 200"});
gsap.set(["#sc-pause .pline .line > span","#sc-wheel .wtxt .line > span"], {yPercent:110});
gsap.set("#sun", {y:"30vh", opacity:0});
gsap.set("#coins i", {y:"-70vh", opacity:0});
gsap.set(".tarot", {rotationY:-100, y:"-6vh", opacity:0, transformPerspective:900, transformOrigin:"50% 100%"});
gsap.set(["#aurora"], {opacity:0}); gsap.set("#stairs .stp", {y:30});
gsap.set("#outroHer", {y:"100vh"});
gsap.set("#moon", {xPercent:-50, y:"100vh", opacity:0});
gsap.set(".prop", {xPercent:-50, yPercent:-100});
gsap.set("#plate", {xPercent:-50});
gsap.set("#sc-outro .bw", {opacity:0, y:40, rotate:3});
function dotHome(){ const r = $("#logo .dt").getBoundingClientRect(); return {x:r.left + r.width/2, y:r.top + r.height/2, s:r.width}; }
{ const h = dotHome(); gsap.set("#dot", {left:h.x, top:h.y, width:h.s, height:h.s, marginLeft:-h.s/2, marginTop:-h.s/2}); gsap.set("#logo .dt", {opacity:0}); }

/* ---------- master timeline ---------- */
const tl = gsap.timeline({paused:true, defaults:{ease:"power3.out"}});
const RESTS = [];                      // snap points (seconds)
const CRUMB = [];                      // [time, text, dark]
const RW = [];                         // words to read at each rest
const rest = (t, n=4) => { tl.addLabel("r"+RESTS.length, t); RESTS.push(t); RW.push(n); };
const crumb = (t, txt, dark) => CRUMB.push([t, txt, dark]);

// OPEN 0–5.5
crumb(0, "MINH.md", true); rest(0);
tl.to("#logo", {y:"-45vh", opacity:0, duration:1.4, ease:"power2.in"}, 3)
  .to("#openHer", {x:"120vw", duration:1.4, ease:"power2.in"}, 3.1)
  .to("#openPlant", {x:"-40vw", rotate:-12, duration:1.3, ease:"power2.in"}, 3.1)
  .to(["#openFloor","#tags","#sc-open .meta"], {y:"30vh", opacity:0, duration:1.2, ease:"power2.in"}, 3.2)
  .to("#wall", {backgroundColor:"#ffabc8", duration:1}, 4.4)
  .to("#dot", {left:"92vw", top:"16vh", width:18, height:18, marginLeft:-9, marginTop:-9, duration:1.2, ease:"power2.inOut"}, 4.3);

// FILE 5.5–12.5
crumb(5.3, "what this file is", false);
tl.to("#sc-file .kick", {opacity:1, y:0, duration:.6}, 5.5)
  .to("#sc-file .txt .line > span", {yPercent:0, duration:.9, stagger:.12}, 5.7)
  .to(".eighty", {yPercent:0, opacity:1, duration:1.6, ease:"expo.out", stagger:.05}, 6.2);
rest(9);
tl.to("#sc-file .txt", {y:"-20vh", opacity:0, duration:1, ease:"power2.in"}, 11)
  .to(".eighty", {yPercent:-60, opacity:0, duration:1.2, ease:"power2.in"}, 11.1)
  .to("#wall", {backgroundColor:"#004edf", duration:1}, 11.8)
  .to("#dot", {left:"50vw", top:"88vh", duration:1, ease:"power2.inOut"}, 11.8);

// HEART · BODY · MIND 12.5–20
crumb(12.4, "heart · body · mind", true);
EN.tri.forEach((w,i) => tl.to("#tri"+i, {y:0, rotate:0, duration:1.2, ease:"bouncy"}, 13 + i*1.0));
rest(16.6);
tl.to("#sc-tri .w", {y:"90vh", rotate:6, duration:1.1, ease:"power2.in", stagger:.12}, 18.2)
  .to("#wall", {backgroundColor:"#f4efe8", duration:1}, 19)
  .to("#dot", {left:"92vw", top:"16vh", duration:1, ease:"power2.inOut"}, 19);

// DAILY SEVEN 20–28.5
crumb(19.8, "seven things, every day", false);
tl.to("#sc-daily .kick", {opacity:1, y:0, duration:.6}, 20.2)
  .to("#dailyPad", {y:0, rotate:-4, duration:1.4, ease:"springOut"}, 20.2)
  .to("#dailyList li", {opacity:1, x:0, duration:.6, stagger:.4}, 20.6);
document.querySelectorAll("#dailyList .tick").forEach((el,k) => tl.to(el, {"--k":1, duration:.35, ease:"back.out(3)"}, 22.6 + k*.38));
rest(25.6);
tl.to("#sc-daily .txt", {y:"-25vh", opacity:0, duration:1, ease:"power2.in"}, 27)
  .to("#dailyPad", {y:"70vh", rotate:10, duration:1, ease:"power2.in"}, 27);

// THE TABLE 28.5–130
tl.to("#wall", {backgroundColor:A[0].color, duration:1}, 28.4)
  .to(["#table","#plate"], {y:0, duration:1.6, ease:"expo.out"}, 28.6)
  .to("#tableHer", {y:0, duration:1.5, ease:"springOut"}, 29.6)
  .to("#plant", {scale:.32, duration:1, ease:"back.out(2)"}, 30)
  .to("#dot", {left:"50vw", top:"63vh", duration:1, ease:"power2.inOut"}, 30);
const S0 = 31, D = 14, PAUSE_AFTER = IX("Emotions"), WHEEL_LEN = 9;
/* interludes that sit between rooms: [after area, length] */
const INTER = [[IX("Emotions"), 8], [IX("Money"), 10], [IX("Energy"), 11]];
const AS = A.map((_,i) => S0 + i*D + INTER.filter(([k]) => k < i).reduce((t,x) => t + x[1], 0));
const T_PAUSE = AS[IX("Emotions")] + D, T_SIX = AS[IX("Money")] + D, T_SCALE = AS[IX("Energy")] + D, T_WHEEL = AS[A.length-1] + D;
const MOB = () => innerWidth < 760 || innerHeight > innerWidth;
const ST = () => innerHeight*(MOB() ? .71 : .79);                 // the line things stand on
const VW = v => innerWidth*v/100;
const propTop = () => ST() - Math.min(270, Math.max(150, innerWidth*.14))*.92;
const bulletAt = (sel) => { const el = $(sel); const r = el.getBoundingClientRect(); return {x:r.left + parseFloat(getComputedStyle(el).fontSize)*.32, y:r.top + r.height*.52}; };
const wordsIn = (g, sel) => `${g} ${sel} .wd > span`;

/* ---------- the story layer: objects, chorus, bubbles ---------- */
const ASP = {pig:.941, bust1:1.504, bust2:1.515, bust3:1.678, bust4:1.434, dumbbell:.468, book:.324, pausebars:1.364, coal:.709, weight:1.019, mug:.915};
const W = (id, img, x, w, extra="") => `<img class="gg st" id="${id}" alt="" src="story/${img}.webp" style="left:${x}vw;width:${w}vw;${extra}">`;
const topOf = (x, w, img) => () => ST() - VW(w)*ASP[img];          // y of the top of a standing object
let GG = "";
// Health: three dumbbells, 40 · 60 · 80
[[23,5.2,"40"],[30.5,6.6,"60"],[39,8.2,"80"]].forEach(([x,w,l],k) => { GG += W(`db${k}`, "dumbbell", x, w) + `<p class="gl" id="dbl${k}" style="left:${x}vw;top:calc(var(--st) - ${(w*ASP.dumbbell).toFixed(2)}vw - 4.6vh)">${l}</p>`; });
// Mind: twelve books, one a month
for(let k=0;k<12;k++) GG += W(`bk${k}`, "book", 34 + (k%2?.4:-.3), 9, `top:calc(var(--st) - ${(k*9*ASP.book*.62).toFixed(2)}vw);filter:hue-rotate(${k*29}deg) saturate(${k%3?1:.8})`);
GG += `<p class="cnt" id="bkn" style="left:25vw;top:var(--st)">0</p>`;
// Emotions: the pause
GG += W("pz", "pausebars", 36, 9);
// Character: coal, the weight, a diamond
GG += W("coal", "coal", 36, 8) + W("wt", "weight", 36, 10) + `<img class="gg st" id="dia2" alt="" src="props/diamond.webp" style="left:36vw;width:8.5vw">`;
// Connection: a table of mugs looking up at the aunt
[[24,7.4],[31.5,7.6],[38.5,6],[43.6,4.6],[47.8,4.2]].forEach(([x,w],k) => GG += W(`mg${k}`, "mug", x, w, `filter:sepia(1) saturate(${[3,4,5,5,5][k]}) hue-rotate(${[150,300,10,200,90][k]}deg)`));
// Money: pay yourself first
GG += W("pig", "pig", 34, 10) + `<i class="coin gg" id="cn" style="left:35vw;top:-10vh"></i>`;
// Life Quality: three postcards — what, where, when
["sea","mtn","city"].forEach((c,k) => GG += `<div class="pc ${c}" id="pc${k}" style="left:${24 + k*9.4}vw"></div>`);
$("#gags").innerHTML = GG;
$("#chorus").innerHTML = [["bust1",9],["bust3",22],["bust2",62],["bust4",76]].map(([b,x],k) => `<img id="ch${k}" alt="" src="story/${b}.webp" style="left:${x}vw">`).join("");
const BUB = {char:"I will.", fam:"Who's cooking?", eighty:"Still me. Better.", love:"Hello, you."};
$("#bubbles").innerHTML = Object.entries(BUB).map(([k,v]) => `<p class="bub" id="bub-${k}">${esc(v)}</p>`).join("");
gsap.set(".gg.st", {xPercent:-50, yPercent:-100}); gsap.set("#cn", {xPercent:-50, yPercent:-50}); gsap.set("#bkn", {xPercent:-50, yPercent:-100}); gsap.set([".gl",".pc"], {xPercent:-50});
gsap.set(".gg", {y:"-110vh", opacity:1});
gsap.set(["#bkn",".gl"], {opacity:0, y:12});
gsap.set(["#dbl0","#dbl1","#dbl2"], {y:12});
gsap.set(".pc", {y:"60vh", rotation:-8});
gsap.set("#chorus img", {yPercent:105});
gsap.set(".bub", {scale:0, opacity:0});
gsap.set("#rings i", {scale:0});
gsap.set("#splitA", {xPercent:-101}); gsap.set("#splitB", {xPercent:101});
gsap.set("#dia2", {opacity:0}); gsap.set("#cn", {y:0});

// small vocabulary of moves
const drop = (sel, t, d=.75) => tl.to(sel, {y:0, duration:d, ease:"bounce.out"}, t);
const lift = (sel, t, d=.55) => tl.to(sel, {y:"-110vh", duration:d, ease:"exit"}, t);
const dotTo = (x, y, t, d=.5) => tl.to("#dot", {left:x, top:y, duration:d, ease:"hop"}, t);
function chorus(t, hold=1.2){   // the ceramic audience pops up, gasps, and ducks
  tl.to("#chorus img", {yPercent:42, duration:.36, stagger:.07, ease:"steps(3)"}, t)
    .to("#chorus img", {keyframes:[{rotation:-4, duration:.12},{rotation:4, duration:.12},{rotation:0, duration:.12}], stagger:.05}, t + .4)
    .to("#chorus img", {yPercent:105, duration:.4, stagger:.05, ease:"power2.in"}, t + .4 + hold);
}
function bubble(k, t, hold=1.6){ tl.to("#bub-"+k, {scale:1, opacity:1, duration:.45, ease:"bouncy"}, t).to("#bub-"+k, {scale:0, opacity:0, duration:.25, ease:"power2.in"}, t + hold); }
/* ---------- the puppet: paper-cutout walking and reactions, made from motion alone ---------- */
const HER_ = "#tableHer";
function walkOut(t){   // she hops out to the right in stop-motion steps
  tl.to(HER_, {x:"48vw", duration:.7, ease:"steps(8)"}, t)
    .to(HER_, {keyframes:[{y:-10,rotation:2},{y:0,rotation:-2},{y:-10,rotation:2},{y:0,rotation:-2},{y:-10,rotation:2},{y:0,rotation:0}], duration:.7, ease:"none"}, t);
}
function walkIn(t, dur=1.4){   // …and walks back in: a 12 fps bob, the paper-doll walk
  const n = Math.round(dur*6), kf = [];
  for(let k=0;k<n;k++) kf.push({y:k%2 ? 0 : -14, rotation:k%2 ? -2.2 : 2.2});
  kf.push({y:0, rotation:0});
  tl.fromTo(HER_, {x:"48vw"}, {x:0, duration:dur, ease:`steps(${n})`, immediateRender:false}, t)
    .to(HER_, {keyframes:kf, duration:dur + .15, ease:"none"}, t);
}
const MARK = {surprised:"!", oof:"!!", think:"?", idea:"!", love:"♥", spark:"✦", joy:"✿"};
function mark(kind, t, hold=1){
  tl.set("#mk", {textContent:MARK[kind]}, t - .01)
    .fromTo("#mk", {scale:0, rotation:-20, opacity:1}, {scale:1, rotation:0, duration:.45, ease:"bouncy", immediateRender:false}, t)
    .to("#mk", {rotation:8, duration:.12, yoyo:true, repeat:3, ease:"sine.inOut"}, t + .45)
    .to("#mk", {scale:0, opacity:0, duration:.25, ease:"power2.in"}, t + hold);
}
function react(kind, t){
  if(kind === "surprised") tl.to(HER_, {keyframes:[{y:-34, scaleY:1.06, scaleX:.96, duration:.14, ease:"power2.out"},{y:0, scaleY:.94, scaleX:1.05, duration:.16, ease:"power2.in"},{scaleY:1, scaleX:1, duration:.4, ease:"bouncy"}], transformOrigin:"50% 100%"}, t);
  if(kind === "oof") tl.to(HER_, {keyframes:[{scaleY:.88, scaleX:1.07, duration:.08},{x:-6, duration:.05},{x:6, duration:.05},{x:-4, duration:.05},{x:0, duration:.05},{scaleY:1, scaleX:1, duration:.5, ease:"bouncy"}], transformOrigin:"50% 100%"}, t);
  if(kind === "think" || kind === "idea") tl.to(HER_, {keyframes:[{rotation:-4, duration:.3, ease:"power2.out"},{rotation:-4, duration:.6},{rotation:0, duration:.4, ease:"bouncy"}], transformOrigin:"50% 100%"}, t);
  if(kind === "love" || kind === "spark" || kind === "joy") tl.to(HER_, {keyframes:[{y:-18, duration:.14, ease:"power2.out"},{y:0, duration:.3, ease:"bounce.out"},{y:-10, duration:.12, ease:"power2.out"},{y:0, duration:.3, ease:"bounce.out"}]}, t);
  mark(kind, t + .05);
}
function talk(t, dur){   // talking: a small 12 fps nod while the bubble is up
  const n = Math.round(dur*6), kf = []; for(let k=0;k<n;k++) kf.push({y:k%2 ? 0 : -5, rotation:k%2 ? 0 : -.8}); kf.push({y:0, rotation:0});
  tl.to(HER_, {keyframes:kf, duration:dur, ease:"none"}, t);
}
// confetti: deterministic pieces, so scrubbing backwards un-throws them
const CONF_C = ["#fc4109","#f8d867","#004edf","#ffabc8","#69b488","#fbf6ec"];
$("#confetti").innerHTML = Array.from({length:28}, (_,k) => `<i style="background:${CONF_C[k%6]}"></i>`).join("");
gsap.set("#confetti i", {opacity:0});
const rnd = k => Math.abs(Math.sin(k*127.1 + 3.7)*43758.5453)%1;
function cheer(t){
  tl.to(HER_, {keyframes:[{scaleY:.9, scaleX:1.05, duration:.1},{y:-46, scaleY:1.08, scaleX:.95, duration:.22, ease:"power2.out"},{y:0, scaleY:.94, scaleX:1.05, duration:.22, ease:"power2.in"},{scaleY:1, scaleX:1, duration:.45, ease:"bouncy"}], transformOrigin:"50% 100%"}, t);
  document.querySelectorAll("#confetti i").forEach((c,k) => {
    const a = -Math.PI/2 + (rnd(k) - .5)*2.2, v = 26 + rnd(k+9)*22;
    tl.fromTo(c, {x:0, y:0, rotation:0, opacity:1}, {keyframes:[
        {x:Math.cos(a)*v + "vh", y:Math.sin(a)*v + "vh", rotation:rnd(k+3)*540, duration:.55, ease:"power2.out"},
        {y:(Math.sin(a)*v + 40) + "vh", x:Math.cos(a)*v*1.3 + "vh", rotation:rnd(k+5)*900, opacity:0, duration:1.1, ease:"power1.in"}], immediateRender:false}, t + .2);
  });
}
function ringsIn(S, a){          // match cut through a target: rings of colour flood out of the object
  const pal = ["#fc4109","#f8d867","#004edf","#ffabc8", a.color];
  document.querySelectorAll("#rings i").forEach((r,k) => tl.set(r, {backgroundColor:pal[k], scale:0}, S - .9).to(r, {scale:1, duration:1.05, ease:"expo.in"}, S - .9 + k*.09));
  tl.set("#rings i", {scale:0}, S + .6);
}
function splitIn(S, a){          // the wall and the floor slide in from opposite sides
  tl.set("#splitA", {backgroundColor:a.color, xPercent:-101}, S - .8).set("#splitB", {backgroundColor:a.floor, xPercent:101}, S - .8)
    .to("#splitA", {xPercent:0, duration:.9, ease:"expo.inOut"}, S - .75)
    .to("#table", {backgroundColor:a.floor, duration:.5, ease:"power2.inOut"}, S - .35)
    .set(["#splitA"], {xPercent:-101}, S + .42).set(["#splitB"], {xPercent:101}, S + .42);
}
const TRANS = {Mind:"rings", Character:"split", Money:"rings", Career:"split", Love:"rings"};

/* ---------- per-area gags (beat 2 window: S+3.3 … S+7) ---------- */
const GAG = {
  Health(S){
    [0,1,2].forEach(k => { drop("#db"+k, S + 3.6 + k*.55, .6); tl.to("#dbl"+k, {opacity:1, y:0, duration:.35, ease:"steps(3)"}, S + 4 + k*.55);
      dotTo(() => VW([23,30.5,39][k]), topOf([23,30.5,39][k], [5.2,6.6,8.2][k], "dumbbell")() - 12, S + 4.1 + k*.55, .45); });
    chorus(S + 5.4); react("surprised", S + 5.5);
    tl.to(["#db0","#db1","#db2"], {y:"-110vh", duration:.5, stagger:.06, ease:"exit"}, S + 7)
      .to(".gl", {opacity:0, duration:.3}, S + 7);
  },
  Mind(S){
    const o = {n:0};
    tl.to("#bkn", {opacity:1, y:0, duration:.3}, S + 3.5); react("think", S + 3.7); react("idea", S + 6.4);
    for(let k=0;k<12;k++) drop("#bk"+k, S + 3.6 + k*.22, .32);
    tl.to(o, {n:12, duration:12*.22, ease:"steps(12)", onUpdate:() => $("#bkn").textContent = Math.round(o.n)}, S + 3.7);
    dotTo(() => VW(34), () => ST() - VW(9)*ASP.book*(1 + 11*.62) - 14, S + 6.4);
    tl.to("[id^=bk]:not(#bkn)", {y:"-110vh", duration:.45, stagger:.02, ease:"exit"}, S + 7).to("#bkn", {opacity:0, duration:.3}, S + 7);
  },
  Emotions(S){
    tl.to("#pz", {y:0, duration:.55, ease:"bounce.out"}, S + 5.1)
      .to(["#prop2 .pi","#tableHer"], {filter:"saturate(.2)", duration:.3}, S + 5.2)
      .to("#wall", {filter:"saturate(.4)", duration:.4}, S + 5.2)
      .to(["#prop2 .pi","#tableHer"], {filter:"saturate(1)", duration:.4}, S + 6.6)
      .to("#wall", {filter:"saturate(1)", duration:.4}, S + 6.6);
    dotTo(() => VW(36), topOf(36, 9, "pausebars")() - 14, S + 5.6); mark("spark", S + 6.1, .5);
    lift("#pz", S + 7);
  },
  Character(S){
    bubble("char", S + 1.8, 1.1); talk(S + 1.8, 1);
    drop("#coal", S + 3.5, .5);
    dotTo(() => VW(36), topOf(36, 8, "coal")() - 12, S + 3.9, .4);
    tl.to("#wt", {y:0, duration:.32, ease:"power3.in"}, S + 4.7)
      .to("#coal", {scaleY:.45, scaleX:1.25, duration:.1}, S + 5.02)
      .to("#dot", {top:"+=40", duration:.1}, S + 5.02)
      .to("#cam", {keyframes:[{x:-8, duration:.05},{x:8, duration:.05},{x:-4, duration:.05},{x:0, duration:.05}]}, S + 5.02);
    chorus(S + 5.15, 1); react("oof", S + 5.02); react("spark", S + 6.25);
    tl.to("#wt", {y:"-110vh", duration:.6, ease:"exit"}, S + 6)
      .set("#coal", {opacity:0}, S + 6.15).set("#dia2", {y:0}, S + 6.15)
      .fromTo("#dia2", {opacity:0, scale:.6}, {opacity:1, scale:1, filter:"brightness(1.6) drop-shadow(0 0 26px rgba(255,255,255,.95))", duration:.5, ease:"bouncy"}, S + 6.15)
      .to("#dia2", {filter:"brightness(1) drop-shadow(0 0 0 rgba(255,255,255,0))", duration:.6}, S + 6.7);
    dotTo(() => VW(36), topOf(36, 8.5, "coal")() - 18, S + 6.3);
    tl.to("#dia2", {y:"-110vh", duration:.5, ease:"exit"}, S + 7.1);
  },
  Spirit(S){   // the dot rises slowly and becomes a star
    tl.to("#dot", {left:"50vw", top:"30vh", width:26, height:26, marginLeft:-13, marginTop:-13, boxShadow:"0 0 30px 10px rgba(255,214,120,.8)", backgroundColor:"#ffe7a3", duration:2.6, ease:"sine.inOut"}, S + 3.6)
      .to("#dot", {left:"50vw", top:() => propTop(), width:18, height:18, marginLeft:-9, marginTop:-9, boxShadow:"0 2px 6px rgba(150,40,0,.35)", backgroundColor:"#fc4109", duration:.9, ease:"power2.inOut"}, S + 6.5);
  },
  Connection(S){
    [0,1,2,3,4].forEach(k => drop("#mg"+k, S + 3.6 + k*.28, .55));
    tl.to(["#mg2","#mg3","#mg4"], {rotation:14, duration:.35, ease:"steps(3)", stagger:.08}, S + 5.4);
    dotTo(() => VW(47.8), topOf(47.8, 4.2, "mug")() - 12, S + 5.6); react("love", S + 5.7);
    tl.to("[id^=mg]", {y:"-110vh", duration:.45, stagger:.04, ease:"exit"}, S + 7);
    bubble("fam", S + 9.7, 1.1); talk(S + 9.7, 1);
  },
  Money(S){
    drop("#pig", S + 3.5, .6);
    tl.to("#cn", {top:"8vh", duration:.01}, S + 4.6)
      .to("#cn", {top:() => topOf(34, 10, "pig")() + VW(1), duration:.5, ease:"power2.in"}, S + 4.7)
      .to("#cn", {scaleY:.15, opacity:0, duration:.12}, S + 5.2)
      .to("#pig", {keyframes:[{scaleY:.86, scaleX:1.08, duration:.1},{y:-26, scaleY:1.06, scaleX:.96, duration:.2, ease:"power2.out"},{y:0, scaleY:1, scaleX:1, duration:.45, ease:"bounce.out"}]}, S + 5.2);
    dotTo(() => VW(34), topOf(34, 10, "pig")() - 12, S + 5.4);
    chorus(S + 5.6, 1); react("joy", S + 5.4);
    lift("#pig", S + 7);
  },
  Career(S){
    react("spark", S + 4.9);
    tl.to("#spot", {opacity:1, duration:.5}, S + 4.7).to("#spot", {opacity:0, duration:.5}, S + 6.8);
    chorus(S + 9.6, 1);
  },
  "Life Quality"(S){
    [0,1,2].forEach(k => { tl.to("#pc"+k, {y:0, rotation:[-6,4,-3][k], duration:.6, ease:"bouncy"}, S + 3.6 + k*.65);
      dotTo(() => VW(24 + k*9.4), () => ST() - innerHeight*.17 - 12, S + 3.9 + k*.65, .4); });
    react("joy", S + 5.5);
    tl.to(".pc", {y:"60vh", rotation:-12, duration:.5, stagger:.06, ease:"exit"}, S + 7);
  },
  Energy(S){ react("think", S + 3.6); mark("spark", S + 6.2, .8); },
  Love(S){   // a full person attracts a full person: the dot finds its pair
    tl.set("#dot2", {left:VW(80), top:innerHeight*.42, width:18, height:18, marginLeft:-9, marginTop:-9, opacity:0}, S + 3.4)
      .to("#dot2", {opacity:1, duration:.2}, S + 3.6)
      .to(["#dot","#dot2"], {width:30, height:30, marginLeft:-15, marginTop:-15, duration:.4}, S + 3.6)
      .to("#dot", {left:"44vw", top:"45vh", duration:.8, ease:"power2.inOut"}, S + 3.6)
      .to("#dot2", {left:"56vw", top:"45vh", duration:.8, ease:"power2.inOut"}, S + 3.7)
      .to("#dot", {left:"49vw", duration:1.2, ease:"spring"}, S + 4.9)
      .to("#dot2", {left:"51vw", duration:1.2, ease:"spring"}, S + 4.9)
      .to(["#dot","#dot2"], {scale:1.5, duration:.2, yoyo:true, repeat:3, ease:"sine.inOut"}, S + 5.8);
    chorus(S + 6.2, 1); react("love", S + 5.9);
    tl.to("#dot2", {opacity:0, duration:.3}, S + 7).to("#dot", {left:"50vw", top:() => propTop(), width:18, height:18, marginLeft:-9, marginTop:-9, duration:.6, ease:"hop"}, S + 7);
    bubble("love", S + 12.5, .8); talk(S + 12.5, .7);
  },
};

A.forEach((a,i) => {
  const S = AS[i], g = "#g"+i;
  crumb(S - .5, `${i+1}. ${a.name}`, !!a.dark);
  if(i>0){
    tl.to("#prop"+(i-1), {scale:7, yPercent:-60, opacity:0, duration:.95, ease:"power2.in", transformOrigin:"50% 60%"}, S - .75)
      .to("#ps"+(i-1), {opacity:0, scale:.3, duration:.4}, S - .75);
    const tr = TRANS[a.name];
    if(tr === "rings") ringsIn(S, a);
    else if(tr === "split") splitIn(S, a);
    else tl.set("#iris", {backgroundColor:a.color, clipPath:"circle(0% at 50% 70%)"}, S - .55)
      .to("#iris", {clipPath:"circle(150% at 50% 70%)", duration:.95, ease:"expo.in"}, S - .55)
      .set("#iris", {clipPath:"circle(0% at 50% 70%)"}, S + .41);
    tl.to("#leak", {keyframes:[{opacity:.5, duration:.3},{opacity:0, duration:.6}], ease:"none"}, S - .2)
      .set("#wall", {backgroundColor:a.color}, S + .4)
      .set("#table", {backgroundColor:a.floor}, S + .4);
  } else tl.to("#table", {backgroundColor:a.floor, duration:.8}, S - 1.2);
  tl.to("#prop"+i, {y:0, rotate:0, duration:1.15, ease:"bounce.out"}, S + .3)
    .to("#ps"+i, {opacity:1, scale:1, duration:1.15, ease:"bounce.out"}, S + .3)
    .to("#dot", {left:"50vw", top:() => propTop(), duration:.7, ease:"hop"}, S + 1.2)
    .to("#tc"+i, {rotationY:0, y:0, opacity:1, duration:1.1, ease:"springOut"}, S + .6)
    .to("#plant", {scale:.32 + .68*(i+1)/A.length, duration:.8, ease:"back.out(2)"}, S + .6)
;
  if(i > 0){ walkOut(S - .85); walkIn(S + .15); }
  cheer(S + 11.7);
  // beat 1 — the hook
  tl.to(`${g} .b1 .kick .k`, {opacity:1, duration:.02, stagger:.018, ease:"none"}, S + .45)
    .to(wordsIn(g,".b1"), {yPercent:0, duration:.75, stagger:.06, ease:"reveal"}, S + .8);
  rest(S + 2.1, wcount(a.beats[0]) + 3);
  tl.to(wordsIn(g,".b1"), {yPercent:-150, duration:.4, stagger:.02, ease:"power2.in"}, S + 2.8)
    .to(`${g} .b1 .kick`, {opacity:0, duration:.3}, S + 2.8)
    .to("#tc"+i, {rotationY:100, y:"-4vh", opacity:0, duration:.45, ease:"power2.in"}, S + 2.9)      // the card steps aside for the gag…
    .fromTo("#tc"+i, {rotationY:-100, y:"-6vh", opacity:0}, {rotationY:0, y:0, opacity:1, duration:1, ease:"springOut", immediateRender:false}, S + 10.9);   // …and comes back for the promise
  // beat 2 — the picture: the sentence, then the gag acts it out
  tl.to(wordsIn(g,".b2"), {yPercent:0, duration:.75, stagger:.06, ease:"reveal"}, S + 3.3);
  metaphor(a.prop, `#prop${i} .pi`, S + 1.3);
  (GAG[a.name] || (() => {}))(S);
  rest(S + 4.7, wcount(a.beats[1]));
  rest(S + 6.5, 2);
  tl.to(wordsIn(g,".b2"), {yPercent:-150, duration:.4, stagger:.02, ease:"power2.in"}, S + 7.2);
  // beat 3 — how: three short lines; the dot becomes the bullet
  a.beats[2].forEach((l,k) => {
    const t = S + 7.7 + k*.95, sel = `${g} .b3 p:nth-child(${k+1})`;
    tl.to("#dot", {left:() => bulletAt(sel).x, top:() => bulletAt(sel).y, duration:.45, ease:"hop"}, t - .25)
      .to(`${sel} .wd > span`, {yPercent:0, duration:.6, stagger:.05, ease:"reveal"}, t);
    rest(t + .7, wcount(l));
  });
  tl.to(wordsIn(g,".b3"), {yPercent:-150, duration:.4, stagger:.015, ease:"power2.in"}, S + 10.8)
    .to("#dot", {left:"50vw", top:() => propTop(), duration:.6, ease:"hop"}, S + 10.8);
  // beat 4 — the promise; she reacts
  tl.to(wordsIn(g,".b4"), {yPercent:0, duration:.75, stagger:.06, ease:"reveal"}, S + 11.2)
    .to(`${g} .b4 .src`, {opacity:.75, y:0, duration:.6}, S + 11.8)

    .to("#cam", {scale:1.045, y:"-1vh", duration:9.6, ease:"sine.inOut"}, S + 3)
    .to("#cam", {scale:1, y:0, duration:.7, ease:"power2.inOut"}, S + 13);
  rest(S + 12.4, wcount(a.beats[3]) + 2);
  tl.to(wordsIn(g,".b4"), {yPercent:-150, duration:.4, stagger:.02, ease:"power2.in"}, S + 13)
    .to(`${g} .b4 .src`, {opacity:0, duration:.3}, S + 13)
    .to("#tc"+i, {rotationY:100, y:"-4vh", opacity:0, duration:.55, ease:"power2.in"}, S + 13);
});
bubble("eighty", AS[0] + 12.5, .8); talk(AS[0] + 12.5, .7);
/* slow-motion moments (human-md "paces"): the dive between rooms and each landing play slower when conducted */
const PACES = [[0,2.9,4],[7.9,10.9,4],[16.6,18.1,4],[24.9,26.9,4]];   // empty stretches fly by
A.forEach((a,i) => { const S = AS[i]; if(i) PACES.push([S - .8, S + .45, .55]); PACES.push([S + .45, S + 1.5, .7]); });
const T_OUT = T_WHEEL + WHEEL_LEN;
/* ---- interlude: the pause ---- */
crumb(T_PAUSE - .3, "the pause", false);
tl.to("#sc-pause .panel", {yPercent:0, duration:1.1, ease:"power3.inOut"}, T_PAUSE - .4)
  .to("#sc-pause .pline .line > span", {yPercent:0, duration:.9, stagger:.12}, T_PAUSE + 1)
  .to("#ring", {scale:1, duration:2, ease:"sine.inOut"}, T_PAUSE + 1.2)
  .to("#bw0", {opacity:1, duration:.4}, T_PAUSE + 1.2).to("#bw0", {opacity:0, duration:.3}, T_PAUSE + 3)
  .to("#bw1", {opacity:1, duration:.3}, T_PAUSE + 3.2).to("#bw1", {opacity:0, duration:.3}, T_PAUSE + 4.1)
  .to("#ring", {scale:.45, duration:2, ease:"sine.inOut"}, T_PAUSE + 4.3)
  .to("#bw2", {opacity:1, duration:.3}, T_PAUSE + 4.3).to("#bw2", {opacity:0, duration:.3}, T_PAUSE + 6.1);
rest(T_PAUSE + 3.6);
tl.to("#sc-pause .panel", {yPercent:-100, duration:1.1, ease:"power3.inOut"}, T_PAUSE + 6.7);
/* ---- interlude: six qualities that attract money ---- */
$("#sc-six .six-say").innerHTML = words("Money follows *the person I become,* not the things I say.");
$("#sixg").innerHTML = EN.six.map((q,k) => `<div class="sq"><i>${["I","II","III","IV","V","VI"][k]}</i><b>${esc(q[0])}</b><span>${esc(q[1])}</span></div>`).join("");
gsap.set("#sc-six .panel", {yPercent:100}); gsap.set(".sq", {opacity:0, y:50, rotation:k => [-3,2,-1,3,-2,1][k]});
gsap.set("#sc-six .say .wd > span", {yPercent:150});
crumb(T_SIX - .3, "what attracts money", false);
tl.to("#sc-six .panel", {yPercent:0, duration:1.1, ease:"power3.inOut"}, T_SIX - .4)
  .to("#sc-six .kick .k", {opacity:1, duration:.02, stagger:.018, ease:"none"}, T_SIX + .6)
  .to("#sc-six .say .wd > span", {yPercent:0, duration:.75, stagger:.06, ease:"reveal"}, T_SIX + .9);
rest(T_SIX + 2.4, 11);
document.querySelectorAll(".sq").forEach((q,k) => {
  const t = T_SIX + 3 + k*.6;
  tl.to(q, {opacity:1, y:0, duration:.6, ease:"bouncy"}, t)
    .to("#dot", {left:() => q.getBoundingClientRect().left + 22, top:() => q.getBoundingClientRect().top + 4, duration:.4, ease:"hop"}, t + .15);
});
rest(T_SIX + 7, 40);
tl.to(".sq", {y:-30, opacity:0, duration:.4, stagger:.04, ease:"power2.in"}, T_SIX + 8.2)
  .to("#sc-six .panel", {yPercent:-100, duration:1.1, ease:"power3.inOut"}, T_SIX + 8.6)
  .to("#dot", {left:"50vw", top:() => propTop(), duration:.6, ease:"hop"}, T_SIX + 9);

/* ---- interlude: the scale, 20 → 1000 ---- */
$("#sc-scale .scl-say").innerHTML = words("Above 200 — *power that nourishes.* Below — force that drains.");
$("#ways").innerHTML = EN.ways.map(w => `<p><b>${esc(w[0])}</b>${esc(w[1])}</p>`).join("");
gsap.set("#sc-scale .panel", {yPercent:100}); gsap.set("#ways p", {opacity:0, y:16});
gsap.set("#sc-scale .say .wd > span", {yPercent:150});
crumb(T_SCALE - .3, "the scale", true);
tl.to("#sc-scale .panel", {yPercent:0, duration:1.1, ease:"power3.inOut"}, T_SCALE - .4)
  .to("#sc-scale .kick .k", {opacity:1, duration:.02, stagger:.018, ease:"none"}, T_SCALE + .6)
  .to("#sc-scale .say .wd > span", {yPercent:0, duration:.75, stagger:.06, ease:"reveal"}, T_SCALE + 1.4);
// the red dot steps aside: Minh herself climbs the staircase painting (mounted at the end of this file)
tl.to("#dot", {opacity:0, duration:.3}, T_SCALE + .2).to("#dot", {opacity:1, duration:.3}, T_SCALE + 9.9);
rest(T_SCALE + 3.2, 10);
rest(T_SCALE + 5.2, 4);
tl.to("#ways p", {opacity:1, y:0, duration:.5, stagger:.35, ease:"bouncy"}, T_SCALE + 5.4);
rest(T_SCALE + 7.4, 34);
tl.to("#ways p", {opacity:0, duration:.4, stagger:.01}, T_SCALE + 9)
  .to("#sc-scale .panel", {yPercent:-100, duration:1.1, ease:"power3.inOut"}, T_SCALE + 9.6)
  .to("#dot", {left:"50vw", top:() => propTop(), duration:.6, ease:"hop"}, T_SCALE + 10);

/* ---- interlude: the wheel of life ---- */
crumb(T_WHEEL - .3, "the wheel of life", false);
tl.to("#sc-wheel .panel", {yPercent:0, duration:1.1, ease:"power3.inOut"}, T_WHEEL - .4)
  .to("#wheelSvg .ringc", {strokeDashoffset:0, duration:1.4, stagger:.12, ease:"power2.inOut"}, T_WHEEL + .7)
  .to("#wheelSvg .spoke", {strokeDashoffset:0, duration:.8, stagger:.05}, T_WHEEL + 1)
  .to("#wheelSvg .wl", {opacity:1, duration:.4, stagger:.06}, T_WHEEL + 1.4)
  .to("#wpoly", {scale:1, svgOrigin:"200 200", duration:1.6, ease:"springOut"}, T_WHEEL + 2.4)
  .to("#sc-wheel .wtxt .line > span", {yPercent:0, duration:.9, stagger:.12}, T_WHEEL + 2.8);
rest(T_WHEEL + 5);
tl.to("#sc-wheel .panel", {yPercent:-100, duration:1.1, ease:"power3.inOut"}, T_WHEEL + 7.7);
/* ---- chapter specials ---- */
{ const S = AS[IX("Spirit")];   // Spirit: a sun rising behind the table
  tl.to("#sun", {y:0, opacity:1, duration:2.2, ease:"power2.out"}, S + .1).to("#sun", {opacity:0, y:"12vh", duration:.8, ease:"power2.in"}, S + 13); }
{ const S = AS[IX("Money")];   // Money: pay yourself first, coin by coin
  document.querySelectorAll("#coins i").forEach((c,k) => tl.to(c, {y:0, opacity:1, duration:.55, ease:"bounce.out"}, S + 7.8 + k*.3));
  tl.to("#coins", {x:"-62vw", rotate:-25, duration:1, ease:"power2.in"}, AS[IX("Money")+1] - .7); }
{ const S = AS[IX("Energy")];  // Energy: climbing the scale under an aurora
  tl.to("#aurora", {opacity:1, duration:1.4}, S - .5)
    .to("#stairs .stp", {opacity:1, y:0, duration:.5, stagger:.08, ease:"springOut"}, S + .3)
    .to("#stairs .stl", {opacity:.85, duration:.4, stagger:.08}, S + .8)
    .to("#orb", {opacity:1, duration:.3}, S + 1.6);
  STEPS.forEach((p,k) => tl.to("#orb", {attr:{cx:p[0], cy:p[1]-26}, duration:.45, ease:"power2.out"}, S + 1.8 + k*.62));
  tl.to(["#aurora","#stairs"], {opacity:0, duration:.8}, S + 13.1); }
function metaphor(kind, el, S){
  const k = (frames, at, dur) => tl.to(el, {keyframes:frames, duration:dur, ease:"none"}, at);
  switch(kind){
    case "yoga":     k([{y:-26,scaleY:1.04},{y:0,scaleY:.96},{y:-26,scaleY:1.04},{y:0,scaleY:.96},{y:-26},{y:0,scaleY:1}], S+2.2, 5.6); break;      // lifting, rep by rep
    case "books":    tl.fromTo(el, {scale:.82}, {scale:1.12, duration:5.4, ease:"steps(4)"}, S+2.4); break;                                   // the stack grows
    case "heart":    k([{scale:1.16},{scale:1},{scale:1.12},{scale:1},{scale:1.16},{scale:1},{scale:1.12},{scale:1}], S+2.2, 5.8); break;     // heartbeat
    case "diamond":  k([{rotate:7,y:-14,filter:"brightness(1.35) drop-shadow(0 0 22px rgba(255,255,255,.9))"},{rotate:-6,y:0,filter:"brightness(1) drop-shadow(0 0 0 rgba(255,255,255,0))"},{rotate:5,y:-10,filter:"brightness(1.3) drop-shadow(0 0 22px rgba(255,255,255,.9))"},{rotate:0,y:0,filter:"brightness(1) drop-shadow(0 0 0 rgba(255,255,255,0))"}], S+2.4, 5.4); break;              // facets catching light
    case "lotus":    tl.fromTo(el, {scale:.55, filter:"drop-shadow(0 0 0 rgba(255,220,150,0))"}, {scale:1.15, filter:"drop-shadow(0 0 28px rgba(255,220,150,.9))", duration:4.5, ease:"settle"}, S+2.4); break; // blooming
    case "rings":    k([{rotate:-14,x:-10},{rotate:12,x:10},{rotate:-6,x:-4},{rotate:0,x:0,scale:1.08}], S+2.4, 5.2); break;                // coming together
    case "house":    tl.fromTo(el, {filter:"brightness(1) drop-shadow(0 0 0 rgba(255,210,120,0))"}, {filter:"brightness(1.18) drop-shadow(0 0 30px rgba(255,210,120,.9))", duration:3, ease:"power1.inOut"}, S+2.6); break; // lights on at home
    case "factory":  k([{rotate:-4,y:-8},{rotate:3,y:0},{rotate:-4,y:-8},{rotate:3,y:0},{rotate:-3,y:-6},{rotate:0,y:0}], S+2.2, 5.6); break;   // the machine keeps turning
    case "coins":    k([{y:-14,scaleY:1.04},{y:0,scaleY:1},{y:-10},{y:0},{y:-6},{y:0}], S+2.6, 4.8); break;          // compounding                                                            // the machine keeps turning
    case "suitcase": k([{y:-40,rotate:-10},{y:0,rotate:0},{y:-30,rotate:8},{y:0,rotate:0},{y:-20,rotate:-5},{y:0,rotate:0}], S+2.4, 5.2); break;  // off we go
    case "energy":   tl.fromTo(el, {filter:"brightness(.85)", y:0}, {filter:"brightness(1.35) drop-shadow(0 0 26px rgba(255,236,170,.9))", y:-18, duration:5.4, ease:"steps(6)"}, S+2.4); break; // climbing the scale
  }
}

// OUTRO
crumb(T_OUT - .4, "— m.", true);
tl.to("#wall", {backgroundColor:"#121634", duration:1.2}, T_OUT)
  .to(["#table","#plate","#tableHer","#props","#plant"], {y:"110vh", duration:1.4, ease:"power2.in"}, T_OUT)
  .to("#stars", {opacity:1, duration:1.4}, T_OUT + .6)
  .to("#moon", {y:0, opacity:1, duration:1.8, ease:"expo.out"}, T_OUT + .9)
  .to("#outroHer", {y:0, duration:1.6, ease:"springOut"}, T_OUT + 1.6)
  .to("#dot", {left:"50vw", top:"92vh", duration:1}, T_OUT + .5)
  .to("#sc-outro .bw", {opacity:1, y:0, rotate:0, duration:1, stagger:.45, ease:"bouncy"}, T_OUT + 2.2)
  .to("#closing", {opacity:.9, duration:1}, T_OUT + 3.8)
  .to("#sc-outro .sig", {opacity:.75, duration:1}, T_OUT + 4.6);
rest(T_OUT + 6.4);
tl.to({}, {duration:.6}, T_OUT + 6.4);
CRUMB.sort((p,q) => p[0]-q[0]);
const TOTAL = tl.duration();

/* ---------- scroll: Lenis + ScrollTrigger, snapping to rests (the "wall") ---------- */
const PX_PER_S = innerWidth < 760 ? 120 : 160;
$("#scroll").style.height = `calc(${Math.round(TOTAL*PX_PER_S)}px + 100vh)`;
let lenis = null;
try {
  lenis = new Lenis({lerp:.085, wheelMultiplier:.9, smoothWheel:true, virtualScroll: d => route(d)});
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);
  document.documentElement.classList.add("lenis");
} catch(e){ lenis = null; }
const st = ScrollTrigger.create({
  trigger:"#scroll", start:"top top", end:"bottom bottom", animation:tl, scrub: reduce ? true : .9,
});

const scrollForTime = t => st.start + (t/TOTAL)*(st.end - st.start);
const timeForScroll = y => Math.max(0, Math.min(TOTAL, (y - st.start)/(st.end - st.start)*TOTAL));
function brake(d){
  if(watching || !st || !lenis) return true;
  const dy = d.deltaY; if(!(dy > 0)) return true;
  const tT = timeForScroll(lenis.targetScroll);
  let wall = RESTS.find(r => r >= tT - .02);
  if(wall === undefined) return true;
  if(Math.abs(wall - tT) < .03){
    if(tl.time() < wall - .12){ d.deltaY = 0; if(d.event.cancelable) d.event.preventDefault(); return false; }   // still performing: hold
    wall = RESTS.find(r => r > tT + .03); if(wall === undefined) return true;
  }
  const room = scrollForTime(wall) - lenis.targetScroll;
  d.deltaY = Math.min(dy * Math.max(.3, Math.min(1, room/360)), room);                                        // ease into the wall
  return true;
}
const go = (t, instant) => { if(C.tw){ C.tw.kill(); C.tw = null; C.dir = 0; } C.t = t;
  lenis ? lenis.scrollTo(scrollForTime(t), {immediate:!!instant, duration:1.2}) : window.scrollTo({top:scrollForTime(t), behavior:instant?"auto":"smooth"}); };

/* =========================================================
   THE CONDUCTOR (after human-md): on desktop every wheel gesture is one step to the next rest,
   played at real pace with a camera ease, slow-motion on key moments, faster if you flick again,
   2.4× when rewinding. Watch mode is the same conductor stepping by itself and holding each rest
   for 0.8s + 0.3s/word + 0.75s breath (max 15s). Touch devices keep free scroll with the wall.
   ========================================================= */
const FLICK = matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce && !/[?&]scroll/.test(location.search);
const TEMPO = {base:.8, perWord:.3, breath:.75, most:15, boost:1.8, boostFor:1.4, back:2.4, floorBase:.5, floorWord:.1};
const C = {t:0, tw:null, dir:0, target:0, arrived:0, k:-1, queued:null};
function cutsIn(a, b){ return [...new Set(PACES.flatMap(p => [p[0], p[1]]).filter(x => x > a && x < b))].sort((x,y) => x - y).concat(b); }
const rateAt = m => { const p = PACES.find(p => m >= p[0] && m < p[1]); return p ? p[2] : 1; };
function realSecs(a, b){ let s = 0, t = a; for(const c of cutsIn(a, b)){ s += (c - t)/rateAt((t + c)/2); t = c; } return s; }
function warpInv(a, b, s){ let t = a; for(const c of cutsIn(a, b)){ const r = rateAt((t + c)/2), d = (c - t)/r; if(s <= d) return t + s*r; s -= d; t = c; } return b; }
function setT(t){ C.t = t; lenis ? lenis.scrollTo(scrollForTime(t), {immediate:true, force:true}) : window.scrollTo(0, scrollForTime(t)); }
const syncT = () => { if(!C.tw) C.t = timeForScroll(lenis ? lenis.targetScroll : scrollY); };
function playTo(target, back, done){
  if(C.tw) C.tw.kill();
  const a = C.t, lo = Math.min(a, target), hi = Math.max(a, target), total = realSecs(lo, hi), u = {v:0};
  C.dir = back ? -1 : 1; C.target = target;
  C.tw = gsap.to(u, {v:1, duration:Math.max(.35, back ? (hi - lo)/TEMPO.back : total), ease:"camera",
    onUpdate:() => setT(back ? hi - u.v*(hi - lo) : warpInv(lo, hi, u.v*total)),
    onComplete:() => { C.tw = null; C.dir = 0; C.arrived = gsap.ticker.time; C.k = RESTS.indexOf(target); done && done(); }});
}
function step(dir){
  if(C.queued){ C.queued.kill(); C.queued = null; }
  syncT();
  if(dir > 0){
    if(C.tw && C.dir > 0){ C.tw.timeScale(TEMPO.boost); gsap.delayedCall(TEMPO.boostFor, () => C.tw && C.tw.timeScale(1)); return; }
    if(C.t >= TOTAL - .02) return;
    // a just-arrived rest must be on screen long enough to read before we leave it
    const k = RESTS.findIndex(r => Math.abs(r - C.t) < .03);
    if(k >= 0 && !C.tw){ const floor = TEMPO.floorBase + TEMPO.floorWord*RW[k], waited = gsap.ticker.time - C.arrived;
      if(C.k === k && waited < floor){ C.queued = gsap.delayedCall(floor - waited, () => { C.queued = null; step(1); }); return; } }
    const n = RESTS.find(r => r > C.t + .03);
    playTo(n === undefined ? TOTAL : n, false);
  } else {
    const base = C.tw && C.dir < 0 ? C.target : C.t;
    const p = [...RESTS].reverse().find(r => r < base - .03);
    playTo(p === undefined ? 0 : p, true);
  }
}
/* wheel gestures: one gesture = one step, even with trackpad inertia (a new push inside the tail counts) */
const G = {last:0, sign:0, peak:0, low:1e9, fell:false, sum:0, armed:false, prev:0};
function onWheel(dy){
  const a = Math.abs(dy); if(a < .5) return;
  const sg = Math.sign(dy), now = performance.now(); let fresh = now - G.last > 220 || sg !== G.sign;
  if(!fresh){ G.peak = Math.max(G.peak, a); if(a < G.peak*.7) G.fell = true; if(G.fell) G.low = Math.min(G.low, a);
    if(G.fell && a > 2.2*G.low + 6 && a > G.prev*1.35) fresh = true; }
  G.last = now; G.sign = sg; G.prev = a;
  if(fresh){ G.peak = a; G.low = 1e9; G.fell = false; G.sum = 0; G.armed = true; }
  G.sum += a; if(G.armed && G.sum >= 10){ G.armed = false; step(sg); }
}
const conducted = () => FLICK && !document.body.classList.contains("index-open") && !document.body.classList.contains("reading") && !document.body.classList.contains("today-open") && !document.body.classList.contains("is-loading") && !document.body.classList.contains("stair-open");
function route(d){
  if(conducted() && !d.event.ctrlKey){
    if(d.event.type === "wheel"){ if(watching) watch(false); onWheel(d.deltaY); }
    if(d.event.cancelable) d.event.preventDefault(); return false;
  }
  return brake(d);
}
if(FLICK){
  document.documentElement.classList.add("is-conducted");
  addEventListener("keydown", e => {
    if(e.ctrlKey || e.metaKey || e.altKey || !conducted()) return;
    const k = e.key, dn = k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey), up = k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey);
    if(!dn && !up) return; e.preventDefault(); if(e.repeat) return; if(watching) watch(false); step(dn ? 1 : -1);
  });
}

/* ---------- time-driven HUD: crumb, dark mode, character pose ---------- */
let lastCrumb = "", lastPose = "";
function onTime(t){
  if(typeof syncAreaPill === "function") syncAreaPill(t);
  let c = CRUMB[0]; for(const k of CRUMB) if(t >= k[0]) c = k;
  if(c[1] !== lastCrumb){ lastCrumb = c[1]; scramble($("#crumb"), c[1], .7, t => `<span>##</span> ${esc(t)}`); }
  document.body.classList.toggle("dark", !!c[2]);
  let ai = 0; AS.forEach((s,k) => { if(t + .15 >= s) ai = k; });
  const pose = t < S0 - 1 ? "mug" : A[ai].pose;
  if(pose !== lastPose){ lastPose = pose; const im = $("#tableHerImg"); im.dataset.pose = pose; const s = poseSrc(pose);
    if(!im.src.endsWith(s)){ im.src = s;
      gsap.fromTo(im, {yPercent:3, rotation:-1.5, opacity:.4}, {yPercent:0, rotation:0, opacity:1, duration:.6, ease:"bouncy"}); } }
  idle();
}

/* ---------- idle life: she breathes, the plant sways ---------- */
if(!reduce){
  gsap.to("#tableHerImg", {scaleY:1.008, scaleX:.997, transformOrigin:"50% 100%", duration:2.2, yoyo:true, repeat:-1, ease:"sine.inOut"});
  gsap.to("#plant", {rotation:1.6, transformOrigin:"50% 100%", duration:2.6, yoyo:true, repeat:-1, ease:"sine.inOut"});
}

/* ---------- film strip: progress + chapter ticks ---------- */
$("#strip").insertAdjacentHTML("beforeend", [...AS, T_PAUSE, T_SIX, T_SCALE, T_WHEEL, T_OUT].map(t => `<b style="left:${(t/TOTAL*100).toFixed(2)}%"></b>`).join(""));
const setFill = gsap.quickSetter("#sfill", "width", "%");
tl.eventCallback("onUpdate", () => { onTime(tl.time()); setFill(tl.progress()*100); });

/* ---------- depth: layers drift with the pointer (desktop) ---------- */
if(matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce){
  const layers = [["#tableHer",-14,-6],["#props",9,4],["#plant",18,6],["#openHer",-16,-6],["#openPlant",20,8],["#logo",8,4],["#moon",-10,-6],["#outroHer",-12,-4],["#dailyPad",12,6]]
    .map(([s,dx,dy]) => ({el:$(s), dx, dy, x:0, y:0}));
  let nx = 0, ny = 0;
  addEventListener("pointermove", e => { nx = e.clientX/innerWidth*2 - 1; ny = e.clientY/innerHeight*2 - 1; });
  gsap.ticker.add(() => layers.forEach(L => { L.x += (nx*L.dx - L.x)*.06; L.y += (ny*L.dy - L.y)*.06; L.el.style.translate = `${L.x.toFixed(2)}px ${L.y.toFixed(2)}px`; }));
}

/* ---------- sound: the MINH.md score ---------- */
const music = $("#music"); let soundOn = false;
$("#snd").onclick = () => { soundOn = !soundOn; document.body.classList.toggle("sound-on", soundOn);
  if(soundOn){ music.volume = 0; music.play().then(() => gsap.to(music, {volume:.55, duration:1.5})).catch(() => { soundOn = false; document.body.classList.remove("sound-on"); }); }
  else gsap.to(music, {volume:0, duration:.6, onComplete:() => music.pause()}); };

/* ---------- "scroll" hint when idle ---------- */
let idleT; function idle(){ document.body.classList.remove("show-hint"); clearTimeout(idleT);
  idleT = setTimeout(() => { if(!watching && tl.time() < TOTAL - 1 && !document.body.classList.contains("index-open")) document.body.classList.add("show-hint"); }, 10000); }
idle();

/* ---------- scramble text (crumb + watch button), like a split-flap ---------- */
const GLYPHS = "abcdefghijklmnopqrstuvwxyz";
function scramble(el, text, dur=.6, html=t=>esc(t)){
  if(el._sc) el._sc.kill(); const o = {p:0};
  el._sc = gsap.to(o, {p:1, duration:dur, ease:"none", onUpdate:() => {
    const n = Math.floor(o.p*text.length);
    el.innerHTML = html(text.slice(0,n) + [...text.slice(n)].map(c => c === " " ? " " : GLYPHS[Math.random()*26|0]).join("").slice(0, Math.max(0, Math.ceil((1-o.p)*8))));
  }});
}
/* ---------- watch: the conductor steps by itself ---------- */
let watching = false;
function watchNext(){
  if(!watching) return;
  syncT();
  const k = RESTS.findIndex(r => r > C.t + .03), target = k < 0 ? TOTAL : RESTS[k];
  playTo(target, false, () => {
    if(!watching) return; if(k < 0) return watch(false);
    C.queued = gsap.delayedCall(Math.min(TEMPO.most, TEMPO.base + TEMPO.perWord*RW[k] + TEMPO.breath), () => { C.queued = null; watchNext(); });
  });
}
function watch(on){
  if(on === watching) return;
  watching = on; scramble($("#watch"), on ? "scroll" : "watch", .5); document.body.classList.toggle("is-watching", on);
  if(C.queued){ C.queued.kill(); C.queued = null; }
  if(!on){ if(C.tw) C.tw.timeScale(1); return; }
  syncT(); if(C.t >= TOTAL - .5) setT(0);       // at the end: start over from the top
  watchNext();
}
$("#watch").onclick = () => watch(!watching);
["wheel","touchstart","keydown"].forEach(ev => addEventListener(ev, e => { if(watching && !(ev==="keydown" && (e.key==="Tab" || FLICK)) && !(ev==="wheel" && FLICK) && !e.target.closest?.(".hud")) watch(false); }, {passive:true}));

/* ---------- index ---------- */
const CARDS = [
  {g:"M", t:"MINH.md", time:0, img:true, bg:"#004edf"},
  {g:"?", t:"what this file is", time:9, art:"compass", bg:"#ffabc8"},
  {g:"♡", t:"heart · body · mind", time:16.6, art:"heart", bg:"#004edf"},
  {g:"7", t:"seven things, every day", time:25.6, art:"notepad", bg:"#e83729"},
  ...A.map((a,i) => ({g:String(i+1), t:`${a.name} · ${a.arcana.split(" · ")[1]}`, area:i, time:AS[i] + 1.9, art:a.prop, tarot:a.tarot, bg:a.color})).flatMap((c,i) => i === PAUSE_AFTER ? [c, {g:"∴", t:"the pause", time:T_PAUSE + 3.6, art:"lotus", bg:"#f4efe8"}]
    : i === IX("Money") ? [c, {g:"VI", t:"what attracts money", time:T_SIX + 7, art:"coins", bg:"#f8d867"}]
    : [c]),
  {g:"◎", t:"the wheel of life", time:T_WHEEL + 5, wheel:true, bg:"#f4efe8"},
  {g:"— m.", t:"This file will change as I do.", time:T_OUT + 6.4, art:"moon", bg:"#121634"},
  {g:"⌛", t:"Minh through the ages · 18 eras", ages:true, bg:"#1c1a17"},
  {g:"✦", t:"the staircase · where am I today?", stair:true, bg:"#0a1a6a"},
  {g:"✓", t:"today · tick it every night", today:true, bg:"#fc4109"},
  {g:"#", t:"read the .md file", md:true}
];
const rot = [-1.6,1.2,-.6,1.8,-1.2,.8,-1.8,1.4,-.4,1,-1.4,.6];
$("#cards").innerHTML = CARDS.map((c,i) => `<button class="card" style="--r:${rot[i%rot.length]}deg" data-i="${i}">
  <div class="th${c.tarot?" tth":""}" style="background:${c.bg||"#151312"}">${c.tarot ? `<img alt="" src="${c.tarot}">` : c.wheel ? `<svg viewBox="-60 -60 520 520">${wheelMarkup(true)}</svg>` : c.today ? `<div class="term" style="background:#fc4109;color:#fff;font-size:13px;line-height:1.9;padding:18px">${EN.daily.map(d => "☐ " + esc(d)).join("<br>")}</div>` : c.md ? `<div class="term">${esc(md().slice(0,560))}</div>` : c.img ? `<img alt="" data-pose="wave" src="${poseSrc("wave")}">` : svgOf(c.art, 'preserveAspectRatio="xMidYMid meet" style="padding:14%"')}</div>
  <div class="g">${esc(c.g)}</div><div class="t">${esc(c.t)}</div></button>`).join("");
function openIndex(on){
  document.body.classList.toggle("index-open", on);
  $("#pillIco").innerHTML = on ? '<path d="M3 3l10 10M13 3L3 13"/>' : '<path d="M2 4h12M2 8h12M2 12h12"/>';
  if(on){ watch(false); lenis && lenis.stop();
    gsap.fromTo(".card", {y:40, opacity:0}, {y:0, opacity:1, duration:.6, stagger:.03, ease:"back.out(1.6)"}); }
  else lenis && lenis.start();
}
$("#pill").onclick = () => openIndex(!document.body.classList.contains("index-open"));
$("#cards").onclick = e => { const b = e.target.closest(".card"); if(!b) return; const c = CARDS[+b.dataset.i];
  openIndex(false); if(c.area != null) return area(c.area); if(c.ages) return ages(true); if(c.stair) return stair(true); if(c.today) return today(true); if(c.md) return reading(true); go(c.time, true); };
$("#mug").onclick = $("#brand").onclick = () => { openIndex(false); reading(false); go(0, true); };

/* ---------- reading mode: the plain .md ---------- */
function md(){
  let s = `# MINH.md\n\n${EN.author} · ${EN.date}\n\n` + EN.taglines.map(t => "> "+t).join("\n") + `\n\n## what this file is\n\n${EN.about}\n\n${EN.about2}\n\n## seven things, every day\n\n` + EN.daily.map((d,k) => `${k+1}. ${d}`).join("\n") + "\n";
  A.forEach((a,i) => { s += `\n## ${i+1}. ${a.name} — ${a.arcana}\n_${a.tag}_\n\n> ${a.essence}\n\n### vision\n` + a.vision.map(v => "- "+v).join("\n") + `\n\n### purpose\n` + a.purpose.map(p => `- **${p[0]}** — ${p[1]}`).join("\n") + `\n\n### strategy\n` + a.strategy.map((p,k) => `${k+1}. **${p[0]}** — ${p[1]}`).join("\n") + `\n\n### goals · 2027\n` + a.goals.map(g => "- "+g).join("\n") + `\n\n> ${a.quote}\n`; });
  s += `\n## what attracts money — six qualities\n\n` + EN.six.map((q,k) => `${k+1}. **${q[0]}** — ${q[1]}`).join("\n") + `\n\n> ${EN.sixLine}\n`;
  s += `\n## the scale · 20 → 1000\n\n` + EN.scale.map(l => `- **${l[0]} · ${l[1]}** — ${l[2]}`).join("\n") + `\n\n### the way up\n` + EN.ways.map(w => `- **${w[0]}** — ${w[1]}`).join("\n") + "\n";
  s += `\n## vision boards · health\n\n` + EN.boards.map(b => `- **${b[0]}** — ${b[1]}`).join("\n") + "\n";
  return s + `\n---\n\nBelieve. Behave. Become.\n\n${EN.closing}\n\n${EN.sign}\n`;
}
$("#mdText").textContent = md();
/* ---------- today: the Lifebook's daily page, kept on this device ---------- */
const LS = {get(){ try { return JSON.parse(localStorage.getItem("minhmd.v1") || "{}"); } catch(e){ return {}; } },
            set(v){ try { localStorage.setItem("minhmd.v1", JSON.stringify(v)); } catch(e){} }};
let DB = LS.get(); DB.hab = DB.hab || {}; DB.mood = DB.mood || {}; DB.sleep = DB.sleep || {};
const iso = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const MON = ["J","F","M","A","M","J","J","A","S","O","N","D"], DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function weekDays(){ const d = new Date(), wd = (d.getDay() + 6) % 7; return DOW.map((_,k) => { const x = new Date(d); x.setDate(d.getDate() - wd + k); return x; }); }
function drawAreaToday(){
  const now = new Date(), key = iso(now);
  $("#areaToday").innerHTML = A.map((a,i) => { const k = slug(a.name);
    return `<div class="atd"><button class="atn" data-a="${i}" style="--c:${a.color}"><i></i>${esc(a.name)} <span>${areaScore(i)}%</span></button>${a.habits.map(([n,per],h) =>
      `<button class="ath ${ticks(k,h)[key]?"on":""}" data-k="${k}" data-h="${h}"><i>${ticks(k,h)[key]?"✓":""}</i>${esc(n)}${per<7?` <em>${Math.min(per,weekCount(k,h,now))}/${per} this week</em>`:""}</button>`).join("")}</div>`; }).join("");
}
function drawToday(){
  drawAreaToday();
  const now = new Date(), key = iso(now), wk = weekDays(), wdNow = (now.getDay() + 6) % 7;
  $("#tdate").textContent = now.toLocaleDateString("en-GB", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
  $("#hab").innerHTML = `<tr><th></th>${DOW.map((d,k) => `<th class="${k===wdNow?"now":""}">${d}</th>`).join("")}</tr>` +
    EN.daily.map((h,i) => `<tr><td>${esc(h)}</td>${wk.map(d => { const k = iso(d) + ":" + i; return `<td><button data-h="${k}" class="${DB.hab[k]?"on":""}" aria-label="${esc(h)} ${iso(d)}">${DB.hab[k]?"✓":""}</button></td>`; }).join("")}</tr>`).join("");
  const keys = (list, store, el) => { $(el).innerHTML = list.map((m,k) => `<button data-k="${k}" class="${store[key]===k?"on":""}"><i style="background:${m[1]}"></i>${esc(m[0])}</button>`).join(""); };
  keys(EN.moods, DB.mood, "#moodKeys"); keys(EN.sleeps, DB.sleep, "#sleepKeys");
  const year = (list, store, el) => { const y = now.getFullYear(); let h = `<span></span>${MON.map(m => `<span>${m}</span>`).join("")}`;
    for(let d=1; d<=31; d++){ h += `<span>${d}</span>`; for(let m=0; m<12; m++){ const dt = new Date(y, m, d), ok = dt.getMonth() === m, k = iso(dt), v = store[k];
      h += `<i class="${ok?"":"x"} ${k===key?"t":""}" style="${ok && v!=null ? "background:"+list[v][1] : ""}"></i>`; } }
    $(el).innerHTML = h; };
  document.querySelectorAll(".yr").forEach(e => e.textContent = now.getFullYear());
  year(EN.moods, DB.mood, "#moodYear"); year(EN.sleeps, DB.sleep, "#sleepYear");
}
$("#hab").onclick = e => { const b = e.target.closest("button"); if(!b) return; const k = b.dataset.h; DB.hab[k] = !DB.hab[k]; LS.set(DB); drawToday(); };
$("#moodKeys").onclick = e => { const b = e.target.closest("button"); if(!b) return; DB.mood[iso(new Date())] = +b.dataset.k; LS.set(DB); drawToday(); };
$("#sleepKeys").onclick = e => { const b = e.target.closest("button"); if(!b) return; DB.sleep[iso(new Date())] = +b.dataset.k; LS.set(DB); drawToday(); };
function today(on){ document.body.classList.toggle("today-open", on); if(on){ watch(false); lenis && lenis.stop(); drawToday(); $("#today").scrollTop = 0; } else lenis && lenis.start(); }
$("#todayClose").onclick = () => today(false);
/* =========================================================
   AREA PAGES — click a life area: vision, purpose, strategy, goals, and the habits that get me there.
   Habits live in content.js as [name, times per week]. Ticks are stored per day:
   DB.ah[areaKey][habitIndex][YYYY-MM-DD] = 1. Deep links: #/health, #/money …
   ========================================================= */
DB.ah = DB.ah || {}; DB.goal = DB.goal || {};
const slug = n => n.toLowerCase().replace(/[^a-z]+/g, "-");
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = d => addDays(d, -((d.getDay() + 6) % 7));
const ticks = (k, h) => ((DB.ah[k] = DB.ah[k] || {})[h] = DB.ah[k][h] || {});
const weekCount = (k, h, ref) => { const m = monday(ref); let n = 0; for(let i=0;i<7;i++) if(ticks(k,h)[iso(addDays(m,i))]) n++; return n; };
function streak(k, h, per){       // daily habits: days in a row · weekly habits: weeks in a row that hit the target
  const now = new Date(); let n = 0;
  if(per >= 7){ let d = ticks(k,h)[iso(now)] ? now : addDays(now, -1); while(ticks(k,h)[iso(d)]){ n++; d = addDays(d, -1); } return [n, n === 1 ? "day" : "days"]; }
  let w = monday(now); if(weekCount(k,h,w) < per) w = addDays(w, -7);
  while(weekCount(k,h,w) >= per){ n++; w = addDays(w, -7); } return [n, n === 1 ? "week" : "weeks"];
}
function areaScore(i){            // this week's share of targets met, 0–100
  const a = A[i], k = slug(a.name); let got = 0, want = 0;
  a.habits.forEach(([_, per], h) => { got += Math.min(per, weekCount(k, h, new Date())); want += per; });
  return want ? Math.round(100*got/want) : 0;
}
document.body.insertAdjacentHTML("beforeend", `<section class="area" id="area" aria-label="Life area" data-lenis-prevent><div class="ain" id="ain"></div></section>
  <button class="pill openArea" id="openArea" aria-label="Open this area"><span></span> ↗</button>`);
let AREA = -1;
const ring = (pct, col) => { const r = 42, c = 2*Math.PI*r; return `<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="9"/>
  <circle class="rg" cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct/100)}" transform="rotate(-90 50 50)"/>
  <text x="50" y="57" text-anchor="middle">${pct}%</text></svg>`; };
function drawArea(i){
  const a = A[i], k = slug(a.name), now = new Date(), m = monday(now), wdNow = (now.getDay() + 6) % 7, dark = !!a.dark;
  const days = DOW.map((_, j) => addDays(m, j));
  const habitRows = a.habits.map(([name, per], h) => {
    const c = weekCount(k, h, now), [sn, su] = streak(k, h, per);
    let heat = ""; const start = addDays(m, -77);
    for(let d=0; d<84; d++){ const x = addDays(start, d); heat += `<i class="${ticks(k,h)[iso(x)]?"on":""} ${iso(x)===iso(now)?"t":""} ${x>now?"f":""}"></i>`; }
    return `<div class="hb" data-h="${h}">
      <div class="hn"><b>${esc(name)}</b><span>${per >= 7 ? "every day" : per + "× a week"}</span></div>
      <div class="hd">${days.map((d,j) => `<button data-d="${iso(d)}" class="${ticks(k,h)[iso(d)]?"on":""} ${j===wdNow?"now":""}" ${d>now?"disabled":""} aria-label="${esc(name)} ${DOW[j]}"><em>${DOW[j][0]}</em></button>`).join("")}</div>
      <div class="hp"><div class="bar"><i style="width:${Math.min(100, 100*c/per)}%"></i></div><span>${Math.min(c,per)}/${per}${c >= per ? " ✓" : ""}</span></div>
      <div class="hs"><b>${sn}</b> ${su}</div>
      <div class="heat" title="last 12 weeks">${heat}</div>
    </div>`; }).join("");
  $("#ain").innerHTML = `
    <header class="ahd" style="--c:${a.color};background:${a.color};color:${dark?"#f4efe8":"#201e1f"}">
      <div class="atop"><button class="pill" id="aPrev" aria-label="Previous area">←</button><button class="pill" id="aNext" aria-label="Next area">→</button>
        <span class="sp"></span><button class="pill" id="aPlay">▶ play the scene</button><button class="pill close" id="aClose">close ✕</button></div>
      <div class="ahg"><div>
        <p class="kick"><b>##</b> ${i+1} / ${A.length} · ${esc(a.arcana)}</p>
        <h2>${esc(a.name)}</h2><p class="ess">${esc(a.essence)}</p><p class="atag">${esc(a.tag)}</p><p class="astyle" id="aStyle"></p></div>
        <div class="aart live"><img class="atar" alt="" src="${a.tarot}"><div class="minh-host" id="minhHost"><span class="minh-tip">tap me ✦</span></div></div></div>
    </header>
    <div class="abody">
      <section class="as"><div class="ash"><p class="kick"><b>##</b> the habits that get me there</p>
        <div class="score">${ring(areaScore(i), /^#f4|^#f8|^#ff/i.test(a.color) ? "#fc4109" : a.color)}<p>of this week's targets<br><b>week of ${m.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</b></p></div></div>
        <div class="hbs">${habitRows}</div>
        <p class="tnote">Tap a day to tick it. Streaks count days in a row for daily habits, and weeks that hit the target for the rest. The strip is the last 12 weeks.</p></section>
      ${(a.extras||[]).includes("move") ? moveSection() : ""}
      ${visionStory(a)}
      ${(a.extras||[]).includes("boards") ? boardSection() : ""}
      ${purposeSection(a)}
      <section class="as"><p class="kick"><b>##</b> strategy — how</p><ol class="st2">${a.strategy.map(([t,d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ol></section>
      <section class="as"><p class="kick"><b>##</b> goals · 2027</p><div class="gl2">${a.goals.map((g,j) => { const gk = k + ":" + j; return `<button class="${DB.goal[gk]?"on":""}" data-g="${gk}"><i>${DB.goal[gk]?"✓":""}</i><span>${esc(g)}</span></button>`; }).join("")}</div>
        ${a.quote ? `<blockquote>${esc(a.quote)}</blockquote>` : ""}</section>
    </div>`;  stopPainting(); const hp = mountPainting($("#ain .ahd"), k); $("#aStyle").textContent = hp ? "living painting · " + hp.style : "";
  storyInit(k); purposeInit();
  // Minh lives on every area page; the same live player is moved into the new header on re-renders (no reload)
  if(MINH) MINH.attach($("#minhHost"));
  else { MINH = mountMinh($("#minhHost"), {url: "./iki/minh.iki"}); }
  if(MINH_AREA !== k){ MINH_AREA = k; const sc = areaScore(i); setTimeout(() => MINH && MINH.react("hello", sc >= 100 ? `${a.name}: every target met this week ✦` : sc > 0 ? `${a.name}: ${sc}% of this week's targets. Let's go!` : `Hi! Let's start ${a.name.toLowerCase()} this week.`), 900); }
}
/* ---- Purpose — why it matters: four cards that arrive like a hand of cards.
   Words rise out of a mask, the numeral springs in, cards tilt toward the pointer with a moving shine.
   Areas with purposePose get Minh herself on each card (her own character art as a puppet) with a small
   living motif: steam, sparks, hearts, wind. Tap a card and she hops. ---- */
const POSE_SRC = {old:"poses/her-old.webp", laugh:"poses/laugh.webp", wave:"poses/wave.webp", walk:"poses/walk.webp", stand:"poses/stand.webp", yoga:"poses/yoga.webp", read:"poses/read.webp", heart:"poses/heart.webp", meditate:"poses/meditate.webp", travel:"poses/travel.webp", money:"poses/money.webp", career:"poses/career.webp"};
const FX = {tea:'<i></i><i></i><i></i>', spark:'<i>✦</i><i>✦</i><i>✧</i><i>✦</i>', heart:'<i>♥</i><i>♥</i><i>♥</i>', wind:'<i></i><i></i><i></i>'};
const rise = t => esc(t).split(/(\s+)/).map(w => w.trim() ? `<span class="w"><span>${w}</span></span>` : w).join("");
function purposeSection(a){
  const pp = a.purposePose || [];
  return `<section class="as pur" style="--c:${a.color}"><p class="kick"><b>##</b> purpose — why it matters</p><div class="pg">${a.purpose.map(([t,d],j) => {
    const [pose, fx] = pp[j] || [];
    return `<article class="pc2${pose ? " fig" : ""}" style="--i:${j}" tabindex="0">
      <div class="pcx"><i>${roman[j]||j+1}</i><b>${rise(t)}</b><span>${esc(d)}</span></div>
      ${pose ? `<div class="pfig"><img src="${POSE_SRC[pose]}" alt="" loading="lazy" decoding="async"><span class="pfx fx-${fx}">${FX[fx]||""}</span></div>` : ""}
      <span class="shine"></span></article>`; }).join("")}</div></section>`;
}
let pio = null, MINH = null, MINH_AREA = null;
const CHEER = ["nice!", "keep going!", "that's the way.", "one more brick.", "proud of you.", "small steps, big life.", "you showed up."];
const pick = (arr, n) => arr[n % arr.length];
function purposeInit(){
  pio && pio.disconnect();
  const sec = $("#ain .pur"); if(!sec) return;
  if(reduce){ sec.classList.add("in"); return; }
  pio = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ sec.classList.add("in"); pio.disconnect(); } }), {root:$("#area"), threshold:.25});
  pio.observe(sec);
  sec.querySelectorAll(".pc2").forEach(c => {
    c.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.setProperty("--ry", (x * 8).toFixed(2) + "deg"); c.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg"); c.style.setProperty("--sx", ((x + .5) * 100).toFixed(1) + "%"); });
    c.addEventListener("pointerleave", () => { c.style.setProperty("--ry", "0deg"); c.style.setProperty("--rx", "0deg"); });
    c.addEventListener("click", () => { const f = c.querySelector(".pfig img"); if(!f) return; f.classList.remove("hop"); void f.offsetWidth; f.classList.add("hop"); });
  });
}
/* ---- Vision as a story: one chapter per vision line, pinned while you scroll.
   Type rules after huashu-art-motion's TY kit: words rise out of a mask one by one (enter slow ~.45s),
   key phrases get a painted highlighter sweep, the old line leaves fast (~.18s), and the living
   painting beside it makes a slow camera move per chapter — punctuation, not decoration. ---- */
const vwords = v => { let key = false;
  return esc(v).split(/(\*)/).map(seg => { if(seg === "*"){ key = !key; return ""; }
    const ws = seg.split(/(\s+)/).map(w => w.trim() ? `<span class="w"><span>${w}</span></span>` : w).join("");
    return key ? `<span class="k">${ws}</span>` : ws; }).join(""); };
const CAM = [[1.1, 0, 0], [1.3, -8, 4], [1.22, 6, -5], [1.4, -5, -9], [1.2, 7, 5], [1.3, 0, 7]];   // |shift| stays inside the zoom, no edge shows
const lum = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };
function visionStory(a){
  const n = a.vision.length, L = lum(a.color), fl = a.floor || "#fc4109";
  const hl = L < .35 ? (lum(fl) > .5 ? fl : "#f8d867") : a.color;                 // highlighter: a light, readable wash
  const ink = L > .62 ? (lum(fl) < .6 ? fl : "#201e1f") : a.color;               // numerals + progress: dark enough on paper
  return `<section class="vst" style="--n:${n};--c:${ink};--hlc:color-mix(in srgb, ${hl} 62%, transparent)" aria-label="Vision">
    <div class="vstage">
      <div class="vtext">
        <p class="kick"><b>##</b> vision · a story in ${n} chapters</p>
        <div class="vchs">${a.vision.map((v,j) => `<article class="vch${reduce ? " on" : ""}" data-j="${j}"><span class="vnum">${roman[j]}<em>/ ${roman[n-1]}</em></span><p class="vline">${vwords(v)}</p></article>`).join("")}</div>
        <div class="vprog">${a.vision.map((_,j) => `<button data-vj="${j}" aria-label="Chapter ${j+1}"></button>`).join("")}<span class="vcount">01 / ${String(n).padStart(2,"0")}</span></div>
      </div>
      <div class="vpaint"><div class="vcam"></div><p class="vcap"></p></div>
    </div>
    <div class="vsteps">${a.vision.map((_,j) => `<div class="vstep" data-j="${j}"></div>`).join("")}</div>
  </section>`;
}
let VJ = -1, vio = null, GH = null;
const CAM_SOFT = [[1.04, 0, 0], [1.08, -2, 1], [1.06, 2, -1], [1.1, -1, -2], [1.05, 2, 1], [1.08, 0, 2]];
function storyChapter(j, instant){
  const root = $("#ain .vst"); if(!root || j === VJ) return;
  const chs = root.querySelectorAll(".vch"), prev = chs[VJ], cur = chs[j]; VJ = j;
  root.querySelectorAll(".vprog button").forEach((b,k) => b.classList.toggle("on", k <= j));
  root.querySelector(".vcount").textContent = `${String(j+1).padStart(2,"0")} / ${String(chs.length).padStart(2,"0")}`;
  GH && GH.chapter(j);
  const [sc, x, y] = (GH ? CAM_SOFT : CAM)[j % CAM.length], cam = root.querySelector(".vcam");
  cam.style.transform = `scale(${sc}) translate(${x}%, ${y}%)`;
  if(reduce || instant){ chs.forEach(c => c.classList.toggle("on", c === cur)); return; }
  if(prev){ gsap.to(prev, {opacity:0, y:-24, duration:.18, ease:"power2.in", onComplete:() => prev.classList.remove("on")}); }
  gsap.killTweensOf(cur); cur.classList.add("on"); gsap.set(cur, {opacity:1, y:0});
  const ws = cur.querySelectorAll(".w > span"), ks = cur.querySelectorAll(".k");
  gsap.fromTo(cur.querySelector(".vnum"), {opacity:0, y:30, scale:.7}, {opacity:1, y:0, scale:1, duration:.6, ease:"springOut", delay:.12});
  gsap.fromTo(ws, {yPercent:110, rotate:4}, {yPercent:0, rotate:0, duration:.48, ease:"power3.out", stagger:.032, delay:.16});
  gsap.fromTo(ks, {"--hl":"0%"}, {"--hl":"100%", duration:.42, ease:"power2.inOut", stagger:.07, delay:.3 + ws.length * .032});
}
function storyInit(k){
  vio && vio.disconnect(); VJ = -1;
  const root = $("#ain .vst"); if(!root) return;
  GH && GH.stop(); GH = null;
  const hp = ROOM_SETS[k] ? (GH = mountAnimeRoom(root.querySelector(".vcam"), {set: k})) : mountPainting(root.querySelector(".vcam"), k, {budget:300000, cls:"vcv"});
  root.classList.toggle("anime", !!GH);
  root.querySelector(".vcap").textContent = hp ? hp.style : "";
  storyChapter(0, true); if(reduce) return;
  VJ = -1;                       // let chapter I play its entrance when the story scrolls into view
  vio = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) storyChapter(+e.target.dataset.j); }), {root:$("#area"), rootMargin:"-45% 0px -45% 0px"});
  root.querySelectorAll(".vstep").forEach(s => vio.observe(s));
  root.querySelector(".vprog").addEventListener("click", e => { const b = e.target.closest("[data-vj]"); if(!b) return;
    const st = root.querySelectorAll(".vstep")[+b.dataset.vj], ar = $("#area");
    ar.scrollTo({top: ar.scrollTop + st.getBoundingClientRect().top - innerHeight * .3, behavior:"smooth"}); });
}
/* ---- Health extras: the 2027 movement tracker and the three vision boards ---- */
DB.move = DB.move || {}; DB.vb = DB.vb || {};
let MOVE_ACT = 0, MOVE_YEAR = new Date().getFullYear();
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MOVE_HABIT = [0, 1, 0, 0, 0, null];          // Gym/Run/Cycle/Swim tick "Train", Yoga ticks "Yoga"
function moveSection(){
  const now = new Date(), y = MOVE_YEAR; let yearN = 0;
  const rows = MONTHS.map((mn, m) => { const nd = new Date(y, m+1, 0).getDate(); let n = 0, cells = "";
    for(let d=1; d<=nd; d++){ const dt = new Date(y, m, d), k = iso(dt), v = DB.move[k];
      if(v != null) n++;
      cells += `<button data-mv="${k}" ${dt > now ? "disabled" : ""} class="${k===iso(now)?"t":""}" style="${v!=null?`background:${EN.moves[v][1]};border-color:${EN.moves[v][1]};color:${v===5?"#201e1f":"#fff"}`:""}">${d}</button>`; }
    yearN += n;
    return `<div class="mrow"><p class="mname"><b>${String(m+1).padStart(2,"0")}</b>${mn}</p><div class="mcells">${cells}</div><p class="mcount">${n} / ${nd}</p></div>`; }).join("");
  const byAct = EN.moves.map((_, k) => Object.entries(DB.move).filter(([d,v]) => v === k && d.startsWith(String(y))).length);
  return `<section class="as mv"><div class="ash"><p class="kick"><b>##</b> movement tracker · ${y}</p>
      <div class="yrs">${[y-1, y, y+1].map(Y => `<button data-yr="${Y}" class="${Y===y?"on":""}">${Y}</button>`).join("")}</div></div>
    <p class="mhint">Pick what I did, then tap the day. Tap again to clear. Gym, running, cycling and swimming also tick <i>Train</i>; yoga ticks <i>Yoga</i>.</p>
    <div class="acts">${EN.moves.map(([n,c],k) => `<button data-act="${k}" class="${k===MOVE_ACT?"on":""}" style="--c:${c}"><i></i>${n}<em>${byAct[k]}</em></button>`).join("")}</div>
    <div class="mgrid">${rows}</div><p class="tnote">${yearN} active days in ${y}.</p></section>`;
}
const BOARD_ICON = ["props/suitcase.webp", "props/yoga.webp", "story/dumbbell.webp"];
const BOARD_ACTS = [[2,3,4], [1,5], [0]];
function boardSection(){
  const y = new Date().getFullYear();
  return `<section class="as"><p class="kick"><b>##</b> my vision boards</p><div class="vbs">${EN.boards.map(([t, sub], b) => {
    const n = Object.entries(DB.move).filter(([d,v]) => BOARD_ACTS[b].includes(v) && d.startsWith(String(y))).length;
    const ph = DB.vb[b] || [];
    return `<div class="vb" style="--c:${["#5d9dc5","#cb9cf8","#fc4109"][b]}"><div class="vbh"><h3>${esc(t)}</h3><p>${esc(sub)}</p><span>${n} sessions in ${y}</span></div>
      <div class="vbp">${[0,1,2,3].map(k => ph[k] ? `<button data-vb="${b}:${k}" class="ph" style="background-image:url(${ph[k]})" aria-label="Change photo"></button>` : `<button data-vb="${b}:${k}" class="add" aria-label="Add a photo">+</button>`).join("")}</div></div>`; }).join("")}</div>
    <p class="tnote">Add my own photos — they stay on this device only and are never uploaded.</p></section>`;
}
const vbFile = Object.assign(document.createElement("input"), {type:"file", accept:"image/*"}); let vbSlot = null;
vbFile.onchange = () => { const f = vbFile.files[0]; if(!f || !vbSlot) return; const img = new Image();
  img.onload = () => { const S = 520, sc = Math.min(1, S/Math.max(img.width, img.height)), cv = document.createElement("canvas");
    cv.width = img.width*sc; cv.height = img.height*sc; cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    const [b, k] = vbSlot; (DB.vb[b] = DB.vb[b] || [])[k] = cv.toDataURL("image/jpeg", .78); LS.set(DB); URL.revokeObjectURL(img.src); vbFile.value = ""; drawArea(AREA); };
  img.src = URL.createObjectURL(f); };
function area(i, from){
  if(i < 0){ if(AREA < 0) return; stopPainting(); GH && GH.stop(); GH = null; MINH && MINH.stop(); MINH = null; MINH_AREA = null; document.body.classList.remove("area-open"); AREA = -1; if(location.hash.startsWith("#/")) history.replaceState(null, "", location.pathname + location.search); lenis && lenis.start(); return; }
  i = (i + A.length) % A.length; AREA = i; watch(false); openIndex(false); reading(false); today(false); lenis && lenis.stop();
  drawArea(i); document.body.classList.add("area-open"); $("#area").scrollTop = 0;
  if(location.hash !== "#/" + slug(A[i].name)) history.replaceState(null, "", "#/" + slug(A[i].name));
  if(!reduce){
    gsap.fromTo("#area", {y:from === "side" ? 0 : 40, opacity:0}, {y:0, opacity:1, duration:.5, ease:"power3.out"});
    gsap.from("#ain .ahd h2, #ain .ess, #ain .atag", {y:30, opacity:0, duration:.7, stagger:.07, ease:"spring", delay:.08});
    gsap.from("#ain .aart img", {y:60, rotation:k => k ? 8 : -6, opacity:0, duration:.9, stagger:.1, ease:"springOut", delay:.12});
    gsap.from("#ain .hb", {y:24, opacity:0, duration:.5, stagger:.06, ease:"power3.out", delay:.25});
    gsap.from("#ain .ring .rg", {strokeDashoffset:2*Math.PI*42, duration:1.2, ease:"power3.out", delay:.3});
  }
}
$("#area").addEventListener("click", e => {
  const t = e.target;
  if(t.closest("#aClose")) return area(-1);
  if(t.closest("#aPrev")) return area(AREA - 1, "side");
  if(t.closest("#aNext")) return area(AREA + 1, "side");
  if(t.closest("#aPlay")){ const i = AREA; area(-1); return go(AS[i] + 1.9, true); }
  const yr = t.closest("[data-yr]"); if(yr){ MOVE_YEAR = +yr.dataset.yr; drawArea(AREA); return; }
  const ac = t.closest("[data-act]"); if(ac){ MOVE_ACT = +ac.dataset.act; drawArea(AREA); return; }
  const mv = t.closest("[data-mv]"); if(mv && !mv.disabled){ const k = mv.dataset.mv, had = DB.move[k];
    if(had === MOVE_ACT) delete DB.move[k]; else DB.move[k] = MOVE_ACT;
    const hk = slug(A[AREA].name), hi = MOVE_HABIT[MOVE_ACT];
    if(hi != null && DB.move[k] === MOVE_ACT) ticks(hk, hi)[k] = 1;
    LS.set(DB); const st = $("#area").scrollTop; drawArea(AREA); $("#area").scrollTop = st;
    const nb = $(`#ain [data-mv="${k}"]`); if(nb && !reduce) gsap.fromTo(nb, {scale:.5}, {scale:1, duration:.45, ease:"bouncy"}); return; }
  const vb = t.closest("[data-vb]"); if(vb){ vbSlot = vb.dataset.vb.split(":").map(Number); vbFile.click(); return; }
  const g = t.closest("[data-g]"); if(g){ DB.goal[g.dataset.g] = !DB.goal[g.dataset.g]; LS.set(DB); drawArea(AREA); return; }
  const d = t.closest(".hd button"); if(d && !d.disabled){
    const k = slug(A[AREA].name), h = +d.closest(".hb").dataset.h, tk = ticks(k, h), was = !!tk[d.dataset.d];
    if(was) delete tk[d.dataset.d]; else tk[d.dataset.d] = 1; LS.set(DB);
    const per = A[AREA].habits[h][1], wc = weekCount(k, h, new Date()), hit = wc >= per;
    if(MINH){ const name = A[AREA].habits[h][0], all = areaScore(AREA) >= 100;
      if(was) MINH.react("untick", "Undone. No stress — tomorrow counts too.");
      else if(all) MINH.react("goal", `All of this week's ${A[AREA].name} targets — done! 🎉`);
      else if(hit && wc === per) MINH.react("goal", `“${name}”: ${per}/${per} this week. Target hit!`);
      else MINH.react("tick", `${wc}/${per} this week · ${pick(CHEER, wc)}`); }
    const st = $("#area").scrollTop; drawArea(AREA); $("#area").scrollTop = st;
    const nb = $(`#ain .hb[data-h="${h}"] .hd button[data-d="${d.dataset.d}"]`);
    if(nb && !was && !reduce){ gsap.fromTo(nb, {scale:.6}, {scale:1, duration:.5, ease:"bouncy"});
      if(hit) gsap.fromTo($(`#ain .hb[data-h="${h}"] .hp span`), {scale:1.7}, {scale:1, duration:.7, ease:"bouncy"}); }
  }
});
addEventListener("keydown", e => { if(AREA < 0) return; if(e.key === "Escape") area(-1); if(e.key === "ArrowRight") area(AREA + 1, "side"); if(e.key === "ArrowLeft") area(AREA - 1, "side"); });
function fromHash(){ const m = location.hash.match(/^#\/([a-z-]+)/); if(!m) return; if(m[1] === 'ages') return ages(true); if(m[1] === 'scale') return stair(true); const i = A.findIndex(a => slug(a.name) === m[1]); if(i >= 0) area(i); }
addEventListener("hashchange", fromHash);
// a pill in the HUD that opens the room you are standing in
let pillArea = -2;
function areaAt(t){ let ai = -1; AS.forEach((s,k) => { if(t + .15 >= s && t < s + D - .6) ai = k; }); return ai; }
function syncAreaPill(t){
  const ai = areaAt(t); if(ai === pillArea) return; pillArea = ai;
  const b = $("#openArea"); if(ai < 0) return b.classList.remove("on");
  b.querySelector("span").textContent = "open " + A[ai].name; b.classList.add("on"); b.onclick = () => area(ai);
}
// "today" lists every area's habits for today
$("#areaToday").addEventListener("click", e => {
  const n = e.target.closest(".atn"); if(n) return area(+n.dataset.a);
  const b = e.target.closest(".ath"); if(!b) return;
  const tk = ticks(b.dataset.k, +b.dataset.h), key = iso(new Date()); if(tk[key]) delete tk[key]; else tk[key] = 1; LS.set(DB); drawAreaToday();
});
function reading(on){ document.body.classList.toggle("reading", on); if(on){ watch(false); lenis && lenis.stop(); $("#md").scrollTop = 0; } else lenis && lenis.start(); }
$("#readClose").onclick = () => reading(false);
$("#skipLink").onclick = e => { e.preventDefault(); reading(true); };
addEventListener("keydown", e => { if(e.key === "Escape"){ reading(false); openIndex(false); today(false); } });

/* ---------- loader → intro ---------- */
if(matchMedia("(pointer:coarse)").matches) $("#hint").firstChild.textContent = "swipe ";
const preload = [HER, ...Object.keys(poseOK).length ? [] : []];
function startIntro(){
 if(reduce) return;
  gsap.from("#logo .ch, #logo .dt", {yPercent:120, opacity:0, duration:1.1, stagger:.06, ease:"back.out(1.8)", delay:.2});
  gsap.from("#openHer", {x:"55vw", duration:1.8, ease:"steps(9)", delay:.35});
  gsap.fromTo("#openHer img", {yPercent:0}, {keyframes:[{yPercent:-1.6},{yPercent:0},{yPercent:-1.6},{yPercent:0},{yPercent:-1.6},{yPercent:0},{yPercent:-1.6},{yPercent:0}], duration:1.8, ease:"none", delay:.35});
  gsap.from("#openPlant", {scale:.2, duration:1.2, ease:"back.out(1.6)", delay:.7, transformOrigin:"50% 100%"});
  gsap.from("#tags p", {opacity:0, x:-20, duration:.6, stagger:.25, delay:1.2});
  gsap.from("#dot", {scale:0, duration:.8, ease:"springOut", delay:.9});
  gsap.from("#logo .ch", {rotate:()=>gsap.utils.random(-8,8), duration:1.2, ease:"wobble", delay:.4, stagger:.05});
}
(function load(){
  const imgs = [HER, ...["walk","yoga","read","heart","stand","meditate","wave","money","laugh","career","travel"].map(p => `poses/${p}.webp`), "props/yoga.webp", "props/books.webp"];
  let done = 0; const bar = $("#loadPct");
  const tick = () => { done++; bar.textContent = Math.round(done/imgs.length*100) + "%"; if(done === imgs.length) finish(); };
  imgs.forEach(src => { const im = new Image(); im.onload = im.onerror = tick; im.src = src; });
  let fin = false; function finish(){ if(fin) return; fin = true;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      gsap.to("#loader", {yPercent:-100, duration:.9, ease:"expo.inOut", onComplete:() => $("#loader").remove()});
      document.body.classList.remove("is-loading"); ScrollTrigger.refresh();
      { const h = dotHome(); gsap.set("#dot", {left:h.x, top:h.y}); }
      startIntro(); fromHash(); }); }
  setTimeout(finish, 4500);
})();
/* gentle idle life: breathing character + floating props */
gsap.to("#openHer img, #tableHerImg", {scaleY:1.008, y:-3, duration:2.4, ease:"sine.inOut", yoyo:true, repeat:-1, transformOrigin:"50% 100%"});
gsap.to("#moon svg", {rotate:4, duration:6, ease:"sine.inOut", yoyo:true, repeat:-1});
addEventListener("load", () => ScrollTrigger.refresh());
onTime(0);

/* ---------- Minh through the ages: huashu-art-motion's speedrun, with Minh (see src/art-motion/ages.js) ---------- */
document.body.insertAdjacentHTML("beforeend", `<section class="ages" id="ages" aria-label="Minh through the ages" data-lenis-prevent>
  <div class="agtop"><span>MINH / ART &amp; MOTION</span><span>after huashu-art-motion · ${ERAS.length} eras</span></div>
  <h2>Minh, <em>through the ages</em></h2>
  <p class="agsub">One room, one cup of tea, one cat — painted by ${ERAS.length} eras of art, from the cave to now. Every painting is alive.</p>
  <div class="aghero"><div class="agstage" id="agStage"></div><div class="agcap"><b id="agYear"></b><span id="agName"></span></div></div>
    <div class="agctl"><button class="pill" id="agPrev" aria-label="Earlier era">←</button><button class="pill" id="agRun">▶ speedrun</button><button class="pill" id="agNext" aria-label="Later era">→</button><button class="pill" id="agClose">close ✕</button></div>
  <div class="agstrip" id="agStrip">${ERAS.map((e,i) => `<button data-e="${i}"><span class="agth"></span><i>${e.label}</i><small>${e.name}</small></button>`).join("")}</div>
  <p class="agcredit">Technique after <a href="https://github.com/alchaincyf/huashu-art-motion" target="_blank" rel="noopener">huashu-art-motion</a> (MIT) · Minh's own character art, repainted by each era.</p>
</section>`);
let AG = null, agThumbs = false;
function agSync(i, running){ const e = ERAS[i]; if(!e) return; $("#agYear").textContent = e.label; $("#agName").textContent = e.name;
  document.querySelectorAll("#agStrip button").forEach((b,k) => b.classList.toggle("on", k === i));
  const on = $(`#agStrip button[data-e="${i}"]`); on && on.scrollIntoView({block:"nearest", inline:"center", behavior: reduce ? "auto" : "smooth"});
  $("#agRun").textContent = running ? "■ stop" : "▶ speedrun"; }
function ages(on){
  document.body.classList.toggle("ages-open", on);
  if(on){ watch(false); lenis && lenis.stop(); if(AREA >= 0) area(-1);
    if(!location.hash.startsWith("#/ages")) history.replaceState(null, "", "#/ages");
    if(!AG) AG = mountAges($("#agStage"), {onEra: agSync});
    agSync(AG.era, false);
    if(!agThumbs){ agThumbs = true; thumbs("./", 288, 162).then(cs => cs.forEach((c,i) => { const s = $(`#agStrip button[data-e="${i}"] .agth`); s && s.appendChild(c); })); }
  } else { if(AG){ AG.stop(); AG = null; } lenis && lenis.start(); if(location.hash.startsWith("#/ages")) history.replaceState(null, "", location.pathname); }
}
$("#agClose").onclick = () => ages(false);
$("#agPrev").onclick = () => { AG.stopRun(); AG.go(AG.era - 1); };
$("#agNext").onclick = () => { AG.stopRun(); AG.go(AG.era + 1); };
$("#agRun").onclick = () => { if($("#agRun").textContent.startsWith("■")){ AG.stopRun(); agSync(AG.era, false); } else AG.speedrun(); };
$("#agStrip").onclick = e => { const b = e.target.closest("[data-e]"); if(!b) return; AG.stopRun(); AG.go(+b.dataset.e); };
addEventListener("keydown", e => { if(!document.body.classList.contains("ages-open")) return; if(e.key === "Escape") ages(false); if(e.key === "ArrowRight") $("#agNext").click(); if(e.key === "ArrowLeft") $("#agPrev").click(); });

/* ---------- the staircase: the scale as a place you stand each evening (src/art-motion/staircase.js) ---------- */
const STEP_UP = [  // EN.scale order, top → bottom: for each level, the one step that lifts you (or keeps you there)
  "Simply be. Nothing to add.", "Rest in the stillness — keep it with one quiet minute tonight.", "Share it: tell someone what made you glad today.",
  "Love without keeping score — one kind act nobody will know about.", "Learn one thing today and use it before you sleep.", "Trust the process — breathe out what you can't control.",
  "Offer help to one person today, freely.", "Let go of one thing that isn't yours to carry.", "You are on the threshold. Take one brave action today — small is fine.",
  "Ask one person for honest feedback, and only listen.", "Pause. Ten slow breaths before you answer anyone.", "Write three things you already have enough of.",
  "Name the fear on paper, then take one tiny step toward it.", "Let it be felt. Call someone who loves you.", "Do one five-minute thing: make the bed, open the window, walk outside.",
  "Turn the mistake into one repair you can make today.", "Say one kind sentence to yourself, out loud. You are allowed to begin again." ];
const lvlNum = i => parseInt(EN.scale[i][0], 10);
DB.scale = DB.scale || {};
document.body.insertAdjacentHTML("beforeend", `<section class="stair" id="stair" aria-label="The staircase" data-lenis-prevent>
  <div class="stcanvas" id="stCanvas"></div>
  <div class="stpanel">
    <p class="kick"><b>##</b> the staircase · 20 → 1000</p>
    <h2 class="sth">Where am I <em>today?</em></h2>
    <p class="sthint">Tap the step that feels true tonight. Above 200 — power that nourishes. Below — force that drains.</p>
    <div class="stcard" id="stCard"><b id="stNum"></b><span id="stName"></span><p id="stDesc"></p><p class="stup"><i>one step up ·</i> <span id="stUp"></span></p><p class="stsaved" id="stSaved"></p></div>
    <div class="sthist"><p class="kick"><b>##</b> the last 30 evenings</p><svg id="stChart" viewBox="0 0 300 120" preserveAspectRatio="none"></svg><p class="stins" id="stIns"></p></div>
  </div>
  <button class="pill close" id="stClose">close ✕</button>
</section>`);
setScale(EN.scale);
let STAIR = null;
function stShow(i, saved){
  if(i < 0) return; const L = EN.scale[i];
  $("#stNum").textContent = L[0]; $("#stName").textContent = L[1]; $("#stDesc").textContent = L[2]; $("#stUp").textContent = STEP_UP[i];
  const c = $("#stCard"); c.classList.toggle("lit", i <= 8); c.classList.toggle("gate", i === 8);
  if(saved != null) $("#stSaved").textContent = saved;
}
function stChart(){
  const days = [...Array(30)].map((_,k) => { const d = new Date(); d.setDate(d.getDate() - 29 + k); return iso(d); });
  const pts = days.map((d,k) => DB.scale[d] != null ? [k * 300/29, 8 + DB.scale[d] / 16 * 104, DB.scale[d]] : null);
  const y200 = 8 + 8/16 * 104, real = pts.filter(Boolean);
  $("#stChart").innerHTML = `<line x1="0" x2="300" y1="${y200}" y2="${y200}" class="th"/>` +
    (real.length > 1 ? `<polyline points="${real.map(p => p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" class="ln"/>` : "") +
    real.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" class="${p[2] <= 8 ? "up" : "dn"}"/>`).join("");
  // insight: the evenings after days you showed up for your habits
  const ticksOn = d => Object.values(DB.ah || {}).reduce((n, area) => n + Object.values(area).filter(h => h[d]).length, 0);
  const vals = Object.entries(DB.scale), avg = a => a.length ? Math.round(a.reduce((x,y) => x + y, 0) / a.length) : null;
  const good = avg(vals.filter(([d]) => ticksOn(d) >= 3).map(([,i]) => lvlNum(i))), rest = avg(vals.filter(([d]) => ticksOn(d) < 3).map(([,i]) => lvlNum(i)));
  const all = avg(real.map(p => lvlNum(p[2])));
  $("#stIns").textContent = !real.length ? "Your evenings will gather here like stars." :
    good != null && rest != null ? `On days you tick 3+ habits you stand around ${good}; on the others, ${rest}.` : `${real.length} evening${real.length > 1 ? "s" : ""} so far · average ${all}.`;
}
function stair(on){
  document.body.classList.toggle("stair-open", on);
  if(on){ watch(false); lenis && lenis.stop(); if(AREA >= 0) area(-1); if(document.body.classList.contains("ages-open")) ages(false);
    if(!location.hash.startsWith("#/scale")) history.replaceState(null, "", "#/scale");
    const today = DB.scale[iso(new Date())];
    if(!STAIR) STAIR = mountStair($("#stCanvas"), {base: "./",
      onPick: i => { DB.scale[iso(new Date())] = i; LS.set(DB); stShow(i, `✓ saved for tonight · ${new Date().toLocaleDateString("en-GB", {day:"numeric", month:"short"})}`); stChart(); },
      onHover: i => stShow(i >= 0 ? i : (DB.scale[iso(new Date())] ?? 8)) });
    STAIR.set(today ?? 8, true); stShow(today ?? 8, today != null ? "✓ already chosen tonight — tap another step to change" : ""); stChart();
  } else { if(STAIR){ STAIR.stop(); STAIR = null; } lenis && lenis.start(); if(location.hash.startsWith("#/scale")) history.replaceState(null, "", location.pathname); }
}
$("#stClose").onclick = () => stair(false);
addEventListener("keydown", e => { if(!document.body.classList.contains("stair-open")) return; if(e.key === "Escape") stair(false); });
$("#sc-scale .sct").insertAdjacentHTML("beforeend", `<button class="pill stgo" id="stGo">✦ where am I tonight? ↗</button>`);
$("#stGo").onclick = () => stair(true);
// the film's scale scene IS the staircase: Minh climbs to tonight's step when the scene comes in; tap a step to choose it
const SCL = mountStair($("#sclStair"), {base: "./", paused: () => document.body.classList.contains("stair-open"),
  onPick: i => { DB.scale[iso(new Date())] = i; LS.set(DB); stair(true); stShow(i, `✓ saved for tonight · ${new Date().toLocaleDateString("en-GB", {day:"numeric", month:"short"})}`); STAIR && STAIR.set(i, true); stChart(); }});
SCL.set(DB.scale[iso(new Date())] ?? 8, true);
