/* PIX in 3D: the 200BPS.AI screen mascot, built from its model sheet.
   - Body: a black rounded slab, 1.42 : 1, thin (side view), soft gloss, black outline.
   - Front: the screen with the mint glow line just inside the edge and the
     lime eyes (#E6FF00) drawn live, so every expression on the sheets is there.
   - Back: dark grey, four screws, the grey 200BPS slash and "200BPS.AI".
   - Floating cartoon gloves (white, black cuffs, black outline) that pose per mood.
   It floats, follows the mouse with its eyes and body, blinks, and reacts.
   window.PIX3D.mount(el) → { mood(name), poke(), destroy() }. Falls back to the
   flat pictures if WebGL isn't there. Nothing here talks to the network. */
import * as THREE from "./assets/vendor/three.module.min.js";

const LIME = "#E6FF00", MINT = "#C8FFF1", INK = 0x0b0c0d;
const BW = 1.42, BH = 1.0, BD = 0.16, BR = 0.13;            // body width/height/depth/corner radius

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// the comic outline: the same mesh, a little bigger, black, inside out
function outline(mesh, k = 1.06) {
  const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
  o.scale.setScalar(k); mesh.add(o); return mesh;
}
function toonRamp() {
  const d = new Uint8Array([90, 170, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}

/* ---------------- the face: every expression from the PIX sheets ---------------- */
const FACE_W = 640, FACE_H = 450;
function drawFace(c, f) {
  const g = c.getContext("2d"), W = FACE_W, H = FACE_H;
  g.clearRect(0, 0, W, H);
  // screen glass
  g.fillStyle = "#08090a"; g.fillRect(0, 0, W, H);
  const sheen = g.createLinearGradient(0, 0, W, H); sheen.addColorStop(0, "rgba(255,255,255,.06)"); sheen.addColorStop(.45, "rgba(255,255,255,0)");
  g.fillStyle = sheen; g.fillRect(0, 0, W, H);
  // the mint line just inside the edge
  const ins = 14, rr = 44;
  g.save(); g.shadowColor = MINT; g.shadowBlur = 16; g.strokeStyle = MINT; g.lineWidth = 6;
  g.beginPath(); g.roundRect(ins, ins, W - 2 * ins, H - 2 * ins, rr); g.stroke(); g.restore();
  // eyes
  const lx = W * .33 + f.lookX * 26, rx = W * .67 + f.lookX * 26, ey = H * .52 + f.lookY * 18, open = f.blink;
  g.save(); g.shadowColor = LIME; g.shadowBlur = 26; g.strokeStyle = g.fillStyle = LIME; g.lineCap = "round"; g.lineJoin = "round";
  FACE_T = f.t || 0;
  const E = EYES[f.eyes] || EYES.neutral;
  E(g, lx, ey, -1, open); E(g, rx, ey, 1, open);
  if (f.eyes === "error") { g.lineWidth = 9; g.beginPath(); const mx = W / 2 + f.lookX * 26, my = H * .72; g.moveTo(mx - 46, my);
    for (let i = 0; i < 6; i++) g.lineTo(mx - 46 + (i + 1) * 15.3, my + (i % 2 ? 0 : -14)); g.stroke(); }
  g.restore();
}
const arch = (g, x, y, w, h, t, open) => {           // the sheet's eye: a thick arch, fuller in the middle, round ends
  const hh = h * Math.max(.08, open), cy = y + h * .5;
  g.beginPath(); g.ellipse(x, cy, w + t * .5, hh + t * .62, 0, Math.PI, 0); g.ellipse(x, cy + t * .1, w - t * .5, Math.max(1, hh - t * .38), 0, 0, Math.PI, true); g.closePath(); g.fill();
  g.beginPath(); g.arc(x - w, cy, t * .5, 0, Math.PI * 2); g.arc(x + w, cy, t * .5, 0, Math.PI * 2); g.fill(); };
let FACE_T = 0;                                   // time, for eyes that move on the screen
const EYES = {
  embarrassed: (g, x, y, s, o) => { arch(g, x, y - 8, 58, 48, 44, o); g.lineWidth = 9; g.globalAlpha = .85;       // the sheet's blush strokes
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 30 + i * 22, y + 62); g.lineTo(x - 42 + i * 22, y + 84); g.stroke(); } g.globalAlpha = 1; },
  starry: (g, x, y, s, o) => { arch(g, x, y - 10, 64, 64, 50, o); const k = (Math.sin(FACE_T * 8 + s) + 1) / 2;       // excited, with a twinkle
    g.save(); g.translate(x + s * 78, y - 70); g.rotate(FACE_T * 2); g.globalAlpha = .4 + k * .6; g.beginPath();
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.moveTo(0, 0); g.quadraticCurveTo(3, 3, 0, 20 + k * 6); g.quadraticCurveTo(-3, 3, 0, 0); } g.fill(); g.restore(); g.globalAlpha = 1; },
  dots: (g, x, y, s, o) => { if (s > 0) return; const W = FACE_W; for (let i = 0; i < 3; i++) {     // "…" while Claude thinks
    const k = (Math.sin(FACE_T * 6 - i * .9) + 1) / 2; g.globalAlpha = .35 + .65 * k; g.beginPath(); g.arc(W * .38 + i * W * .12, y + 6 - k * 16, 22, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; },
  wink: (g, x, y, s, o) => { if (s < 0) arch(g, x, y - 6, 62, 54, 48, 1); else { g.lineWidth = 26; g.beginPath(); g.moveTo(x - 50, y + 12); g.quadraticCurveTo(x, y + 30, x + 50, y + 12); g.stroke(); } },
  determined: (g, x, y, s, o) => { g.beginPath(); g.moveTo(x - 60, y - 22 * s * -1 - 6); g.lineTo(x + 60, y + 22 * s * -1 - 6); g.lineTo(x + 54, y + 30 * Math.max(.2, o)); g.lineTo(x - 54, y + 30 * Math.max(.2, o)); g.closePath(); g.fill(); },
  suspicious: (g, x, y, s, o) => { g.beginPath(); g.moveTo(x - 62, y - 4 + s * 10); g.lineTo(x + 62, y - 4 - s * 10); g.quadraticCurveTo(x, y + 34 * Math.max(.2, o), x - 62, y - 4 + s * 10); g.fill(); },
  playful: (g, x, y, s, o) => { if (s < 0) arch(g, x, y - 4, 60, 50, 46, o); else { g.lineWidth = 26; g.beginPath(); g.moveTo(x + 34, y - 30); g.lineTo(x - 26, y); g.lineTo(x + 34, y + 30); g.stroke(); } },
  neutral: (g, x, y, s, o) => arch(g, x, y, 60, 44, 46, o),
  happy: (g, x, y, s, o) => arch(g, x, y - 6, 62, 54, 48, o),
  excited: (g, x, y, s, o) => arch(g, x, y - 12, 66, 68, 52, o),
  relieved: (g, x, y, s, o) => arch(g, x, y + 6, 58, 30, 40, o),
  curious: (g, x, y, s, o) => { g.lineWidth = 22; g.beginPath(); g.ellipse(x, y, 26, 40 * Math.max(.1, o), 0, 0, Math.PI * 2); g.stroke(); },
  surprised: (g, x, y, s, o) => { g.lineWidth = 24; g.beginPath(); g.ellipse(x, y - 4, 34, 50 * Math.max(.1, o), 0, 0, Math.PI * 2); g.stroke(); },
  thinking: (g, x, y, s, o) => { arch(g, x, y, 56, 42, 42, o); if (s < 0) { g.lineWidth = 12; g.beginPath(); g.moveTo(x - 34, y - 52); g.lineTo(x + 30, y - 60); g.stroke(); } },
  skeptical: (g, x, y, s, o) => { if (s < 0) arch(g, x, y, 54, 40, 42, o); else { g.lineWidth = 26; g.beginPath(); g.moveTo(x - 46, y + 4); g.lineTo(x + 46, y + 4); g.stroke(); } },
  focused: (g, x, y, s, o) => { g.lineWidth = 24; g.beginPath(); g.moveTo(x - 52, y + 4); g.lineTo(x + 52, y + 4); g.stroke(); },
  proud: (g, x, y, s, o) => { g.beginPath(); g.moveTo(x - 66, y - 8 + s * 6); g.quadraticCurveTo(x, y + 52 * Math.max(.2, o), x + 66, y - 8 - s * 6); g.closePath(); g.fill(); },
  annoyed: (g, x, y, s, o) => { g.beginPath(); g.moveTo(x - 66, y - 10); g.lineTo(x + 66, y - 10); g.quadraticCurveTo(x, y + 52 * Math.max(.2, o), x - 66, y - 10); g.fill(); },
  sleepy: (g, x, y, s, o) => { g.beginPath(); g.moveTo(x - 64, y + 10 - s * 4); g.quadraticCurveTo(x, y + 66, x + 64, y + 10 + s * 4); g.quadraticCurveTo(x, y + 16, x - 64, y + 10 - s * 4); g.fill(); },
  sad: (g, x, y, s, o) => { g.lineWidth = 28; g.beginPath(); g.ellipse(x, y - 10, 58, 34 * Math.max(.1, o), 0, Math.PI * .1, Math.PI * .9); g.stroke(); },
  mischievous: (g, x, y, s, o) => { g.lineWidth = 26; g.beginPath(); g.moveTo(x - 36 * s, y - 32 * Math.max(.2, o)); g.lineTo(x + 30 * s, y); g.lineTo(x - 36 * s, y + 32 * Math.max(.2, o)); g.stroke(); },
  error: (g, x, y, s, o) => { g.lineWidth = 20; g.beginPath(); g.moveTo(x - 34, y - 46); g.lineTo(x + 34, y + 18); g.moveTo(x + 34, y - 46); g.lineTo(x - 34, y + 18); g.stroke(); },
};

function drawBack(c) {
  const g = c.getContext("2d"), W = FACE_W, H = FACE_H;
  g.fillStyle = "#1b1d1f"; g.fillRect(0, 0, W, H);
  const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, "rgba(255,255,255,.07)"); sh.addColorStop(1, "rgba(0,0,0,.18)");
  g.fillStyle = sh; g.fillRect(0, 0, W, H);
  [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]].forEach(([x, y]) => {          // the four screws
    g.fillStyle = "#0c0d0e"; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#3a3d40"; g.beginPath(); g.arc(x - 2, y - 2, 3.5, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = "#5c6063";                                                           // the 200BPS slash, two slanted bars
  g.save(); g.translate(W / 2 + 6, H * .38); g.transform(1, 0, -0.55, 1, 0, 0);
  g.fillRect(-10, -58, 46, 58); g.fillRect(-64, 0, 46, 58); g.restore();
  g.font = "700 46px 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif"; g.textAlign = "center"; g.fillText("200BPS.AI", W / 2, H * .74);
}

/* ---------------- the gloves ---------------- */
const POSES = {      // finger curl 0 = straight, 1 = closed: [thumb, index, middle, ring]
  open: [0, 0, 0, 0], point: [.7, 0, 1, 1], fist: [.9, 1, 1, 1], thumb: [-.2, 1, 1, 1], peace: [.8, 0, 0, 1], relax: [.25, .3, .35, .4],
};
function makeHand(mat, cuffMat) {
  const hand = new THREE.Group(), pivot = new THREE.Group(); hand.add(pivot);
  const palm = outline(new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 18), mat), 1.09);
  palm.scale.set(1, 1.05, .62); pivot.add(palm);
  const cuff = outline(new THREE.Mesh(new THREE.CylinderGeometry(.095, .11, .13, 20), cuffMat), 1.08);
  cuff.position.set(0, -.2, 0); pivot.add(cuff);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.1, .022, 10, 24), mat); rim.rotation.x = Math.PI / 2; rim.position.set(0, -.14, 0); pivot.add(rim);
  const fingers = [];
  const fx = [-.13, -.07, 0, .07];
  for (let i = 0; i < 4; i++) {
    const base = new THREE.Group();
    if (i === 0) { base.position.set(-.13, -.02, .02); base.rotation.z = .9; }
    else base.position.set(fx[i] + .02, .12, 0);
    const seg = new THREE.Group(); base.add(seg);
    const f = outline(new THREE.Mesh(new THREE.CapsuleGeometry(i === 0 ? .045 : .042, i === 0 ? .08 : .11, 6, 12), mat), 1.12);
    f.position.y = i === 0 ? .06 : .075; seg.add(f);
    pivot.add(base); fingers.push(seg);
  }
  hand.userData = { pivot, fingers, curl: [0, 0, 0, 0], want: [0, 0, 0, 0] };
  return hand;
}
function setCurl(hand, pose) { hand.userData.want = (POSES[pose] || POSES.relax).slice(); }
function stepHand(hand, k) {
  const u = hand.userData;
  u.fingers.forEach((seg, i) => { u.curl[i] += (u.want[i] - u.curl[i]) * k; seg.rotation.x = u.curl[i] * (i === 0 ? 1.2 : 2.3); if (i === 0) seg.rotation.z = -u.curl[i] * .6; });
}

/* ---------------- moods: face + hands + motion, all from the sheets ---------------- */
const MOODS = {
  listen:   { eyes: "neutral",  L: ["relax", -.9, -.32, .2, 0], R: ["relax", .9, -.32, .2, 0], anim: "float" },
  hover:    { eyes: "happy",    L: ["relax", -.9, -.34, .2, 0], R: ["open", .9, .2, .25, -.3], anim: "wave" },
  talk:     { eyes: "happy",    L: ["relax", -.9, -.34, .2, 0], R: ["open", .9, -.08, .3, -1.2], anim: "present" },
  reply:    { eyes: "happy",    L: ["relax", -.9, -.34, .2, 0], R: ["open", .95, -.02, .35, -1.3], anim: "present" },
  point:    { eyes: "happy",    L: ["fist", -.9, -.3, .25, .2], R: ["point", .9, .14, .3, -.9], anim: "float" },
  think:    { eyes: "thinking", L: ["relax", -.9, -.36, .2, 0], R: ["fist", .7, -.5, .6, .3], anim: "tilt" },
  wait:     { eyes: "dots",     L: ["relax", -.9, -.36, .2, 0], R: ["fist", .7, -.5, .6, .3], anim: "tilt" },
  work:     { eyes: "focused",  L: ["relax", -.42, -.66, .5, 1.3], R: ["relax", .42, -.66, .5, 1.3], anim: "type" },
  done:     { eyes: "happy",    L: ["relax", -.9, -.34, .2, 0], R: ["thumb", .98, -.1, .3, 1.35], anim: "nod" },
  party:    { eyes: "excited",  L: ["fist", -.9, .5, .2, 0], R: ["fist", .9, .5, .2, 0], anim: "bounce" },
  fail:     { eyes: "error",    L: ["open", -.9, -.24, .25, 1.4], R: ["open", .9, -.24, .25, -1.4], anim: "shrug" },
  away:     { eyes: "sleepy",   L: ["relax", -.9, -.5, .15, .2], R: ["relax", .9, -.5, .15, -.2], anim: "sleep" },
  happy:    { eyes: "happy",    L: ["relax", -.9, -.32, .2, 0], R: ["relax", .9, -.32, .2, 0], anim: "float" },
  curious:  { eyes: "curious",  L: ["relax", -.9, -.32, .2, 0], R: ["relax", .9, -.32, .2, 0], anim: "tilt" },
  receive:  { eyes: "surprised", L: ["open", -.5, -.12, .75, .5], R: ["open", .5, -.12, .75, -.5], anim: "pop" },
  wow:      { eyes: "surprised", L: ["open", -.9, .28, .25, .2], R: ["open", .9, .28, .25, -.2], anim: "pop" },
  drop:     { eyes: "surprised", L: ["open", -.9, .28, .25, .2], R: ["open", .9, .28, .25, -.2], anim: "pop" },
  upload:   { eyes: "focused",  L: ["relax", -.42, -.66, .5, 1.3], R: ["relax", .42, -.66, .5, 1.3], anim: "type" },
  uploaded: { eyes: "excited",  L: ["open", -.36, -.25, .4, 1.4], R: ["open", .36, -.25, .4, -1.4], anim: "clap" },
  focus:    { eyes: "focused",  L: ["relax", -.9, -.32, .2, 0], R: ["relax", .9, -.32, .2, 0], anim: "float" },
  idea:     { eyes: "happy",    L: ["relax", -.9, -.34, .2, 0], R: ["point", .9, .36, .25, -.2], anim: "nod" },
  victory:  { eyes: "excited",  L: ["peace", -.9, .3, .22, .2], R: ["peace", .9, .3, .22, -.2], anim: "bounce" },
  sad:      { eyes: "sad",      L: ["relax", -.9, -.5, .15, .2], R: ["relax", .9, -.5, .15, -.2], anim: "sleep" },
  wink:     { eyes: "wink",     L: ["relax", -.9, -.32, .2, 0], R: ["point", .8, -.05, .6, -.4], anim: "nod" },
  playful:  { eyes: "playful",  L: ["peace", -.9, .2, .22, .2], R: ["relax", .9, -.32, .2, 0], anim: "bounce" },
  mischief: { eyes: "mischievous", L: ["relax", -.9, -.32, .2, 0], R: ["point", .9, .14, .3, -.9], anim: "tilt" },
  determined: { eyes: "determined", L: ["fist", -.9, -.2, .3, .2], R: ["fist", .9, -.2, .3, -.2], anim: "nod" },
  peekaboo: { eyes: "happy",    L: ["open", -.3, .02, .78, .15], R: ["open", .3, .02, .78, -.15], anim: "float" },
  highfive: { eyes: "starry",   L: ["relax", -.9, -.34, .2, 0], R: ["open", .62, .12, 1.05, -.1], anim: "pop" },
  scratch:  { eyes: "thinking", L: ["relax", -.9, -.34, .2, 0], R: ["relax", .58, .62, .25, .7], anim: "scratch" },
  shy:      { eyes: "embarrassed", L: ["open", -.62, -.28, .5, .9], R: ["open", .62, -.28, .5, -.9], anim: "sway" },
  cheer:    { eyes: "starry",   L: ["open", -.9, .55, .2, .3], R: ["open", .9, .55, .2, -.3], anim: "bounce" },
  hello:    { eyes: "starry",   L: ["relax", -.9, -.34, .2, 0], R: ["open", .9, .28, .3, -.3], anim: "wave" },
  suspicious: { eyes: "suspicious", L: ["relax", -.9, -.32, .2, 0], R: ["fist", .7, -.5, .6, .3], anim: "tilt" },
};
const IDLE = ["listen", "happy", "focus", "curious"];
// what PIX does when the mouse comes over it: a different trick each time
const HOVER_TRICKS = [
  [["hello", 1500]], [["peekaboo", 700], ["wow", 600], ["happy", 500]], [["highfive", 1300]], [["wink", 1100]],
  [["victory", 1300]], [["spin", 0]], [["playful", 1200]], [["scratch", 1300]], [["cheer", 1200]],
];

/* ---------------- shared attention: every PIX looks where things happen ---------------- */
const ALL = new Set();
const MOUSE = { x: innerWidth / 2, y: innerHeight / 2, t: 0 };
const GAZE = { x: 0, y: 0, until: 0 };
addEventListener("pointermove", (e) => { MOUSE.x = e.clientX; MOUSE.y = e.clientY; MOUSE.t = performance.now(); ALL.forEach((i) => i.kick()); }, { passive: true });
function lookAt(x, y, ms = 1400) { GAZE.x = x; GAZE.y = y; GAZE.until = performance.now() + ms; ALL.forEach((i) => i.kick()); }
function lookAtEl(el, ms) { if (!el || !el.getBoundingClientRect) return; const r = el.getBoundingClientRect(); lookAt(r.left + r.width / 2, r.top + r.height / 2, ms); }

function shadowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const rg = g.createRadialGradient(64, 64, 4, 64, 64, 62); rg.addColorStop(0, "rgba(0,0,0,.55)"); rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
}

function mount(host, opts = {}) {
  let gl;
  try { gl = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); } catch (e) { return null; }
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  gl.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.domElement.className = "pix3d-canvas";
  host.append(gl.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, 1, .1, 50); cam.position.set(0, .55, 7.6); cam.lookAt(0, -.08, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x30343a, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbff7ff, 1.1); rim.position.set(3, 1, -2); scene.add(rim);

  const pix = new THREE.Group(); scene.add(pix);
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(BW - .06, BH - .06, BR), { depth: BD - .06, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 5, curveSegments: 12 });
  bodyGeo.translate(0, 0, -(BD - .06) / 2);
  pix.add(outline(new THREE.Mesh(bodyGeo, new THREE.MeshPhongMaterial({ color: INK, specular: 0x555a60, shininess: 70 })), 1.025));
  const faceC = document.createElement("canvas"); faceC.width = FACE_W; faceC.height = FACE_H;
  const faceT = new THREE.CanvasTexture(faceC); faceT.colorSpace = THREE.SRGBColorSpace; faceT.anisotropy = 4;
  const scr = new THREE.ShapeGeometry(roundedRect(BW - .04, BH - .04, BR - .01), 12);
  const uv = scr.attributes.uv, pos = scr.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (BW - .04) + .5, pos.getY(i) / (BH - .04) + .5);
  const front = new THREE.Mesh(scr, new THREE.MeshBasicMaterial({ map: faceT })); front.position.z = BD / 2 + .004; pix.add(front);
  const backC = document.createElement("canvas"); backC.width = FACE_W; backC.height = FACE_H;
  const backT = new THREE.CanvasTexture(backC); backT.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(scr.clone(), new THREE.MeshLambertMaterial({ map: backT })); back.position.z = -BD / 2 - .004; back.rotation.y = Math.PI; pix.add(back);
  const paintBack = () => { drawBack(backC); backT.needsUpdate = true; };
  paintBack(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(paintBack);
  const ramp = toonRamp();
  const glove = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: ramp });
  const cuff = new THREE.MeshToonMaterial({ color: 0x15171a, gradientMap: ramp });
  const L = makeHand(glove, cuff), R = makeHand(glove, cuff); L.scale.setScalar(1.18); R.scale.set(-1.18, 1.18, 1.18);
  scene.add(L, R);
  // a soft shadow on the "floor": it shrinks and fades as PIX rises, which reads as depth
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .7), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.05; if (opts.shadow !== false) scene.add(shadow);

  const st = { mood: "listen", base: "listen", t: 0, mx: 0, my: 0, lx: 0, ly: 0, blink: 1, nextBlink: 2, poke: 0, face: "", hover: 0, wantHover: 0,
    seq: [], seqUntil: 0, idleAt: 6, idle: null, idleUntil: 0, spin: null, zoom: opts.zoom || 1,
    inside: false, trick: Math.floor(Math.random() * 9), spinT: -1, flips: [], lastDir: 0, lastX: 0, near: false };
  function setMood(m) { st.mood = MOODS[m] ? m : "listen"; const M = MOODS[st.mood]; setCurl(L, M.L[0]); setCurl(R, M.R[0]); }
  setMood(opts.mood || "listen"); st.base = st.mood;
  function size() { const w = host.clientWidth || 120, h = host.clientHeight || 100; gl.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); const ro = new ResizeObserver(size); ro.observe(host);

  let DT = 1 / 60;
  const lerp = (a, b, k) => a + (b - a) * (1 - Math.pow(1 - k, DT * 60));
  const place = (H, spec, t, side) => {
    const [, x, y, z, rz] = spec; let ox = 0, oy = Math.sin(t * 2.1 + side) * .03, orz = 0;
    const a = MOODS[st.mood].anim;
    if (a === "wave" && side > 0) orz = Math.sin(t * 9) * .45;
    if (a === "type") oy = Math.abs(Math.sin(t * 14 + side * 1.7)) * .06;
    if (a === "clap") ox = -side * (Math.sin(t * 11) * .5 + .5) * .16;
    if (a === "bounce") oy = Math.abs(Math.sin(t * 7)) * .12;
    if (a === "shrug") oy = Math.sin(t * 3) * .05 + .03;
    if (a === "scratch" && side > 0) { orz = Math.sin(t * 16) * .25; oy = Math.sin(t * 16) * .03; }
    if (a === "sway") ox = Math.sin(t * 4) * .04 * side;
    const hz = st.hover * .35;
    H.position.x = lerp(H.position.x, (x + ox) * (1 + st.hover * .08), .16); H.position.y = lerp(H.position.y, y + oy + pix.position.y * .8, .16); H.position.z = lerp(H.position.z, z + hz + pix.position.z, .16);
    H.rotation.z = lerp(H.rotation.z, rz + orz, .16); H.rotation.y = lerp(H.rotation.y, pix.rotation.y * .6, .1);
  };
  let raf = 0, last = performance.now(), alive = true;
  const api = {};
  function frame(now) {
    raf = 0; if (!alive) return;
    if (!host.isConnected) { api.destroy(); return; }
    const dt = Math.max(0, Math.min(.1, (now - last) / 1000)); last = Math.max(last, now); st.t += dt; DT = dt;   // never a negative step (rAF time can trail the mount time)
    // a sequence ([mood, ms], …), then back to the base mood
    if (st.seq.length && now > st.seqUntil) { const [m, ms] = st.seq.shift();
      if (m === "spin") { st.spinT = 0; setMood("starry" in MOODS ? "cheer" : "happy"); st.seqUntil = now + 1100; }
      else { setMood(m); st.seqUntil = ms ? now + ms : Infinity; if (!ms) st.base = m; } }
    else if (!st.seq.length && st.seqUntil !== Infinity && st.seqUntil && now > st.seqUntil) { st.seqUntil = 0; setMood(st.base); }
    const M = MOODS[st.mood], a = M.anim, t = st.t;
    // where to look: something that just happened, else the mouse; when the mouse rests, PIX looks around on its own
    const r = host.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (opts.interactive !== false) {                                 // the mouse over PIX: depth, a trick, and petting
      const pad = 6, inn = MOUSE.x > r.left - pad && MOUSE.x < r.right + pad && MOUSE.y > r.top - pad && MOUSE.y < r.bottom + pad && now - MOUSE.t < 4000;
      if (inn && !st.inside) { st.inside = true; st.wantHover = 1; if (!st.seq.length || st.seqUntil === Infinity) { st.seq = HOVER_TRICKS[st.trick++ % HOVER_TRICKS.length].slice(); st.seqUntil = 0; } }
      if (!inn && st.inside) { st.inside = false; st.wantHover = opts.hoverStay ? st.wantHover : 0; st.flips = []; }
      if (inn) { const dx = MOUSE.x - st.lastX, dir = Math.sign(dx);
        if (Math.abs(dx) > 3 && dir && dir !== st.lastDir) { st.flips.push(now); st.lastDir = dir; }
        st.flips = st.flips.filter((x) => now - x < 1300);
        if (st.flips.length >= 5) { st.flips = []; st.seq = [["shy", 1700], ["happy", 600]]; st.seqUntil = 0; } }
      st.lastX = MOUSE.x;
      const d = Math.hypot(Math.max(r.left - MOUSE.x, 0, MOUSE.x - r.right), Math.max(r.top - MOUSE.y, 0, MOUSE.y - r.bottom));
      const nearNow = !inn && d < 110 && now - MOUSE.t < 1500;
      if (nearNow && !st.near && IDLE.includes(st.mood) && !st.seq.length) { st.seq = [["curious", 900]]; st.seqUntil = 0; }
      st.near = nearNow;
    }
    let tx = MOUSE.x, ty = MOUSE.y;
    if (now < GAZE.until) { tx = GAZE.x; ty = GAZE.y; }
    let tmx = Math.max(-1, Math.min(1, (tx - cx) / (innerWidth * .45))), tmy = Math.max(-1, Math.min(1, (ty - cy) / (innerHeight * .45)));
    const resting = now - MOUSE.t > 5000 && now >= GAZE.until && IDLE.includes(st.mood) && !st.seq.length;
    if (resting && st.t > st.idleAt) {                                  // little life of its own: glance 3/4 left or right, look at you, wink
      const pick = ["left", "right", "you", "wink", "you"][Math.floor(Math.random() * 5)];
      st.idle = pick; st.idleUntil = st.t + (pick === "wink" ? .9 : 1.6); st.idleAt = st.t + 4 + Math.random() * 4;
      if (pick === "wink") { st.seq = [["wink", 900]]; }
    }
    if (st.idle && st.t < st.idleUntil && resting) { if (st.idle === "left") { tmx = -1.4; tmy = .1; } else if (st.idle === "right") { tmx = 1.4; tmy = .1; } else { tmx = 0; tmy = 0; } }
    st.mx = lerp(st.mx, tmx, .1); st.my = lerp(st.my, tmy, .1);
    // body: float, turn toward what it's looking at (up to a 3/4 view), mood motion, hover depth
    st.hover = lerp(st.hover, st.wantHover, .14);
    let by = Math.sin(t * 1.6) * .06, brz = 0, brx = 0;
    if (a === "bounce" || a === "pop") by = Math.abs(Math.sin(t * 7)) * .14;
    if (a === "nod") brx = Math.sin(t * 5) * .12;
    if (a === "tilt") brz = .12;
    if (a === "sleep") { by = Math.sin(t * .9) * .04 - .05; brz = .08; }
    if (a === "present") brz = -.06;
    if (st.poke > 0) { st.poke -= dt; by += Math.sin(st.poke * 18) * .08 * st.poke; }
    pix.position.y = lerp(pix.position.y, by + st.hover * .12, .2);
    pix.position.z = lerp(pix.position.z, st.hover * .9, .14);
    const amp = 1 + st.hover * .6;
    let spinAdd = 0;
    if (st.spinT >= 0) { st.spinT += dt / 1.05; const e = st.spinT >= 1 ? 1 : 1 - Math.pow(1 - st.spinT, 3); spinAdd = e * Math.PI * 2; if (st.spinT >= 1) st.spinT = -1; }
    const ry = (st.spin != null ? st.spin : st.mx * .62 * amp);
    pix.rotation.y = st.spinT >= 0 ? ry + spinAdd : lerp(pix.rotation.y % (Math.PI * 2), ry, st.spin != null ? .5 : .1);
    pix.rotation.x = lerp(pix.rotation.x, st.my * .3 * amp + brx - st.hover * .08, .1);
    pix.rotation.z = lerp(pix.rotation.z, brz + st.mx * -.05, .1);
    const sc = st.zoom * (1 + st.hover * .14);
    let sq = 0;                                                         // squash and stretch on bounces and pokes
    if (a === "bounce" || a === "pop") sq = Math.cos(t * 14) * .06;
    if (st.poke > 0) sq += Math.sin(st.poke * 22) * .1 * st.poke;
    const base = lerp(pix.scale.x / (1 - sq * .5 || 1), sc, .15);
    pix.scale.set(base * (1 - sq * .5), base * (1 + sq), base * (1 - sq * .5));
    const lift = pix.position.y + 1.05; shadow.scale.setScalar(Math.max(.4, 1.1 - lift * .25) * sc); shadow.material.opacity = Math.max(.15, .85 - lift * .35);
    place(L, M.L, t, -1); place(R, M.R, t, 1); stepHand(L, 1 - Math.pow(.82, dt * 60)); stepHand(R, 1 - Math.pow(.82, dt * 60));
    // eyes follow too; blink now and then
    st.lx = lerp(st.lx, st.mx, .14); st.ly = lerp(st.ly, st.my, .14);
    if (t > st.nextBlink) { st.blink = 0; st.nextBlink = t + 2.4 + Math.random() * 3; if (Math.random() < .25) st.nextBlink = t + .35; }
    st.blink = Math.min(1, st.blink + dt * 9);
    const blink = a === "sleep" ? 1 : Math.max(.08, Math.min(1, Math.abs(st.blink * 2 - 1) * 1.4));
    const sig = M.eyes + (Math.max(-1.2, Math.min(1.2, st.lx)) * 40 | 0) + "," + (st.ly * 40 | 0) + "," + (blink * 10 | 0) + (M.eyes === "dots" ? "," + (t * 20 | 0) : "");
    if (sig !== st.face) { st.face = sig; drawFace(faceC, { eyes: M.eyes, lookX: Math.max(-1, Math.min(1, st.lx)), lookY: st.ly, blink, t }); faceT.needsUpdate = true; }
    gl.render(scene, cam);
    if (!still && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && alive) raf = requestAnimationFrame(frame); };
  document.addEventListener("visibilitychange", kick);
  Object.assign(api, {
    kick,
    mood: (m) => { st.seq = []; st.seqUntil = 0; setMood(m); st.base = st.mood; kick(); },
    play: (steps) => { st.seq = steps.slice(); st.seqUntil = 0; kick(); },          // [[mood, ms], …]; ms 0 = stay
    hover: (on) => { st.wantHover = on ? 1 : 0; kick(); },
    poke: () => { st.poke = .9; kick(); },
    react: () => { st.poke = .9; const fun = [[["spin", 0]], [["cheer", 1200]], [["highfive", 1200]], [["victory", 1200]], [["shy", 1400]], [["playful", 1100]]];
      st.seq = fun[Math.floor(Math.random() * fun.length)].slice(); st.seqUntil = 0; kick(); },
    turn: (ry) => { st.spin = ry; kick(); },
    _debug: () => ({ rot: [pix.rotation.x, pix.rotation.y, pix.rotation.z], sc: [pix.scale.x, pix.scale.y], pos: [pix.position.y, pix.position.z], mood: st.mood, seq: st.seq.length, spinT: st.spinT, mx: st.mx, my: st.my }),
    destroy: () => { if (!alive) return; alive = false; ALL.delete(api); ro.disconnect(); gl.dispose(); gl.domElement.remove(); },
  });
  ALL.add(api);
  kick();
  if (still) setTimeout(() => frame(performance.now()), 50);
  return api;
}

window.PIX3D = { mount, lookAt, lookAtEl, moods: Object.keys(MOODS), all: ALL };
window.dispatchEvent(new Event("pix3d-ready"));
