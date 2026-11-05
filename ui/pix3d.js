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
const EYES = {
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
  listen:   { eyes: "neutral",  L: ["relax", -0.9, -.32, .2, 0], R: ["relax", 0.9, -.32, .2, 0], anim: "float" },
  hover:    { eyes: "happy",    L: ["relax", -0.9, -.34, .2, 0], R: ["open", 0.9, .2, .25, -.3], anim: "wave" },
  talk:     { eyes: "happy",    L: ["relax", -0.9, -.34, .2, 0], R: ["open", 0.9, -.08, .3, -1.2], anim: "present" },
  point:    { eyes: "happy",    L: ["fist", -0.9, -.3, .25, .2], R: ["point", 0.9, .14, .3, -.9], anim: "float" },
  think:    { eyes: "thinking", L: ["relax", -0.9, -.36, .2, 0], R: ["fist", .7, -.5, .6, .3], anim: "tilt" },
  work:     { eyes: "focused",  L: ["relax", -0.42, -.66, .5, 1.3], R: ["relax", 0.42, -.66, .5, 1.3], anim: "type" },
  done:     { eyes: "happy",    L: ["relax", -.9, -.34, .2, 0], R: ["thumb", .98, -.1, .3, 1.35], anim: "nod" },
  party:    { eyes: "excited",  L: ["fist", -0.9, .5, .2, 0], R: ["fist", 0.9, .5, .2, 0], anim: "bounce" },
  fail:     { eyes: "error",    L: ["open", -0.9, -.24, .25, 1.4], R: ["open", 0.9, -.24, .25, -1.4], anim: "shrug" },
  away:     { eyes: "sleepy",   L: ["relax", -0.9, -.5, .15, .2], R: ["relax", 0.9, -.5, .15, -.2], anim: "sleep" },
  happy:    { eyes: "happy",    L: ["relax", -0.9, -.32, .2, 0], R: ["relax", 0.9, -.32, .2, 0], anim: "float" },
  wow:      { eyes: "surprised", L: ["open", -0.9, .28, .25, .2], R: ["open", 0.9, .28, .25, -.2], anim: "pop" },
  drop:     { eyes: "surprised", L: ["open", -0.9, .28, .25, .2], R: ["open", 0.9, .28, .25, -.2], anim: "pop" },
  upload:   { eyes: "focused",  L: ["relax", -0.42, -.66, .5, 1.3], R: ["relax", 0.42, -.66, .5, 1.3], anim: "type" },
  uploaded: { eyes: "excited",  L: ["open", -0.36, -.25, .4, 1.4], R: ["open", 0.36, -.25, .4, -1.4], anim: "clap" },
  focus:    { eyes: "focused",  L: ["relax", -0.9, -.32, .2, 0], R: ["relax", 0.9, -.32, .2, 0], anim: "float" },
  idea:     { eyes: "happy",    L: ["relax", -0.9, -.34, .2, 0], R: ["point", 0.9, .36, .25, -.2], anim: "nod" },
  victory:  { eyes: "excited",  L: ["peace", -0.9, .3, .22, .2], R: ["peace", 0.9, .3, .22, -.2], anim: "bounce" },
  sad:      { eyes: "sad",      L: ["relax", -0.9, -.5, .15, .2], R: ["relax", 0.9, -.5, .15, -.2], anim: "sleep" },
  mischief: { eyes: "mischievous", L: ["relax", -0.9, -.32, .2, 0], R: ["point", 0.9, .14, .3, -.9], anim: "tilt" },
};

function mount(host) {
  let gl;
  try { gl = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); } catch (e) { return null; }
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  gl.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  gl.outputColorSpace = THREE.SRGBColorSpace;
  host.append(gl.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, 1, .1, 50); cam.position.set(0, .05, 7.4);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x30343a, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbff7ff, 1.1); rim.position.set(3, 1, -2); scene.add(rim);

  const pix = new THREE.Group(); scene.add(pix);
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(BW - .06, BH - .06, BR), { depth: BD - .06, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 5, curveSegments: 12 });
  bodyGeo.translate(0, 0, -(BD - .06) / 2);
  const body = outline(new THREE.Mesh(bodyGeo, new THREE.MeshPhongMaterial({ color: INK, specular: 0x555a60, shininess: 70 })), 1.025);
  pix.add(body);
  // front: the screen
  const faceC = document.createElement("canvas"); faceC.width = FACE_W; faceC.height = FACE_H;
  const faceT = new THREE.CanvasTexture(faceC); faceT.colorSpace = THREE.SRGBColorSpace; faceT.anisotropy = 4;
  const scr = new THREE.ShapeGeometry(roundedRect(BW - .04, BH - .04, BR - .01), 12);
  const uv = scr.attributes.uv, pos = scr.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (BW - .04) + .5, pos.getY(i) / (BH - .04) + .5);
  const front = new THREE.Mesh(scr, new THREE.MeshBasicMaterial({ map: faceT })); front.position.z = BD / 2 + .004; pix.add(front);
  // back: screws, slash, 200BPS.AI
  const backC = document.createElement("canvas"); backC.width = FACE_W; backC.height = FACE_H;
  const backT = new THREE.CanvasTexture(backC); backT.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(scr.clone(), new THREE.MeshLambertMaterial({ map: backT })); back.position.z = -BD / 2 - .004; back.rotation.y = Math.PI; pix.add(back);
  const paintBack = () => { drawBack(backC); backT.needsUpdate = true; };
  paintBack(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(paintBack);
  // gloves
  const ramp = toonRamp();
  const glove = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: ramp });
  const cuff = new THREE.MeshToonMaterial({ color: 0x15171a, gradientMap: ramp });
  const L = makeHand(glove, cuff), R = makeHand(glove, cuff); L.scale.setScalar(1.18); R.scale.set(-1.18, 1.18, 1.18);
  scene.add(L, R);

  const st = { mood: "listen", t: 0, mx: 0, my: 0, lx: 0, ly: 0, blink: 1, nextBlink: 2, poke: 0, face: "" };
  function mood(m) { st.mood = MOODS[m] ? m : "listen"; const M = MOODS[st.mood]; setCurl(L, M.L[0]); setCurl(R, M.R[0]); }
  mood("listen");
  function size() { const w = host.clientWidth || 120, h = host.clientHeight || 100; gl.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); const ro = new ResizeObserver(size); ro.observe(host);
  const onMove = (e) => { const r = host.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    st.mx = Math.max(-1, Math.min(1, (e.clientX - cx) / (innerWidth * .45))); st.my = Math.max(-1, Math.min(1, (e.clientY - cy) / (innerHeight * .45))); };
  addEventListener("pointermove", onMove, { passive: true });

  let DT = 1 / 60;
  const lerp = (a, b, k) => a + (b - a) * (1 - Math.pow(1 - k, DT * 60));     // smooth at any frame rate
  const place = (H, spec, t, side) => {
    const [, x, y, z, rz] = spec; let ox = 0, oy = Math.sin(t * 2.1 + side) * .03, orz = 0;
    const a = MOODS[st.mood].anim;
    if (a === "wave" && side > 0) orz = Math.sin(t * 9) * .45;
    if (a === "type") { oy = Math.abs(Math.sin(t * 14 + side * 1.7)) * .06; }
    if (a === "clap") ox = -side * (Math.sin(t * 11) * .5 + .5) * .16;
    if (a === "bounce") oy = Math.abs(Math.sin(t * 7)) * .12;
    if (a === "shrug") oy = Math.sin(t * 3) * .05 + .03;
    H.position.x = lerp(H.position.x, x + ox, .16); H.position.y = lerp(H.position.y, y + oy + pix.position.y * .8, .16); H.position.z = lerp(H.position.z, z, .16);
    H.rotation.z = lerp(H.rotation.z, rz + orz, .16); H.rotation.y = lerp(H.rotation.y, pix.rotation.y * .6, .1);
  };
  let raf = 0, last = performance.now(), alive = true;
  function frame(now) {
    raf = 0; if (!alive) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now; st.t += dt; DT = dt;
    const M = MOODS[st.mood], a = M.anim, t = st.t;
    // body: float, follow the mouse, mood motion
    let by = Math.sin(t * 1.6) * .06, brz = 0, brx = 0;
    if (a === "bounce" || a === "pop") by = Math.abs(Math.sin(t * 7)) * .14;
    if (a === "nod") brx = Math.sin(t * 5) * .12;
    if (a === "tilt") brz = .12;
    if (a === "sleep") { by = Math.sin(t * .9) * .04 - .05; brz = .08; }
    if (a === "present") brz = -.06;
    if (st.poke > 0) { st.poke -= dt; by += Math.sin(st.poke * 18) * .08 * st.poke; }
    pix.position.y = lerp(pix.position.y, by, .2);
    pix.rotation.y = lerp(pix.rotation.y, st.spin != null ? st.spin : st.mx * .55, st.spin != null ? .5 : .08);
    pix.rotation.x = lerp(pix.rotation.x, st.my * .28 + brx, .08);
    pix.rotation.z = lerp(pix.rotation.z, brz, .08);
    place(L, M.L, t, -1); place(R, M.R, t, 1); stepHand(L, 1 - Math.pow(.82, dt * 60)); stepHand(R, 1 - Math.pow(.82, dt * 60));
    // eyes: look, blink
    st.lx = lerp(st.lx, st.mx, .12); st.ly = lerp(st.ly, st.my, .12);
    if (t > st.nextBlink) { st.blink = 0; st.nextBlink = t + 2.4 + Math.random() * 3; }
    st.blink = Math.min(1, st.blink + dt * 9);
    const blink = a === "sleep" ? 1 : Math.max(.08, Math.min(1, Math.abs(st.blink * 2 - 1) * 1.4));
    const sig = M.eyes + (st.lx * 40 | 0) + "," + (st.ly * 40 | 0) + "," + (blink * 10 | 0);
    if (sig !== st.face) { st.face = sig; drawFace(faceC, { eyes: M.eyes, lookX: st.lx, lookY: st.ly, blink }); faceT.needsUpdate = true; }
    gl.render(scene, cam);
    if (!still && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && alive) raf = requestAnimationFrame(frame); };
  document.addEventListener("visibilitychange", kick);
  kick();
  if (still) setTimeout(() => frame(performance.now()), 50);
  return {
    mood: (m) => { mood(m); kick(); },
    poke: () => { st.poke = .9; kick(); },
    turn: (ry) => { st.spin = ry; kick(); },      // turn to an angle (null = follow the mouse again)
    destroy: () => { alive = false; ro.disconnect(); removeEventListener("pointermove", onMove); gl.dispose(); gl.domElement.remove(); },
  };
}

window.PIX3D = { mount, moods: Object.keys(MOODS) };
window.dispatchEvent(new Event("pix3d-ready"));
