// Portfolio de viajes: portada con vídeos, fondo de fotos vivo, visor y detalles de cada sección.
// La esfera 3D vive en un módulo aparte (index.html) y usa window.P2.
const F = 'assets/fotos/';
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad = n => String(n).padStart(3, '0');
const barajar = l => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

window.P2 = { listo: null };
P2.listo = fetch(F + 'fotos.json').then(r => r.json()).then(fotos => {
  P2.fotos = fotos;
  P2.orden = barajar(fotos.map(f => f.n));
  return fotos;
});

/* ---------- Portada: el vídeo 2 a pantalla completa ---------- */
// Arranca en cuanto tiene datos; si el navegador lo para mientras carga, se vuelve a lanzar.
const videos = [$('v2')];
const enPortada = () => !document.body.classList.contains('dentro');
videos.forEach(v => {
  ['canplay', 'pause'].forEach(ev => v.addEventListener(ev, () => { if (enPortada() && v.paused && v.readyState >= 3) v.play().catch(() => {}); }));
  v.play().catch(() => {});
});
$('sonido').onclick = () => {
  const v = $('v2'); v.muted = !v.muted;
  $('sonido').setAttribute('aria-pressed', String(!v.muted));
  $('sonido').querySelector('span').textContent = v.muted ? 'Activar sonido' : 'Silenciar';
};
let ocultar = null;
function entrar() {
  $('portada').classList.add('fuera');
  document.body.classList.remove('cerrado');
  document.body.classList.add('dentro');
  // Al acabar la animación se quita de verdad: si no, algunos navegadores dejan los vídeos pintados encima
  ocultar = setTimeout(() => { videos.forEach(v => v.pause()); $('portada').style.visibility = 'hidden'; }, 1300);
  window.dispatchEvent(new Event('entrar'));
}
function volverPortada() {
  clearTimeout(ocultar);
  scrollTo({ top: 0, behavior: 'instant' });
  $('portada').style.visibility = '';
  requestAnimationFrame(() => $('portada').classList.remove('fuera'));
  document.body.classList.add('cerrado');
  document.body.classList.remove('dentro');
  videos.forEach(v => v.play().catch(() => {}));
}
$('entrar').onclick = entrar;
$('a-portada').onclick = e => { e.preventDefault(); volverPortada(); };
addEventListener('keydown', e => { if (e.key === 'Enter' && document.body.classList.contains('cerrado')) entrar(); });

/* ---------- Fondo de fotos que se va llenando (como en el primer portfolio) ---------- */
function crearMuro({ fotos, umbral, tope = Infinity, min = 14, max = 24 }) {
  const wall = document.createElement('div'); wall.id = 'wall';
  const veil = document.createElement('div'); veil.id = 'veil';
  document.body.prepend(veil); document.body.prepend(wall);
  const COLS = 8, ROWS = 6, els = [];
  let celdas = [], umbrales = [];
  const calcular = () => { umbrales = fotos.map((_, k) => umbral(k)); };
  function crear(k) {
    if (!celdas.length) celdas = barajar([...Array(COLS * ROWS).keys()]);
    const c = celdas.pop();
    const cx = (c % COLS + .35 + Math.random() * .3) / COLS, cy = (Math.floor(c / COLS) + .35 + Math.random() * .3) / ROWS;
    const w = min + Math.random() * (max - min), ratio = [.75, 1, 1.33, .66][Math.floor(Math.random() * 4)];
    const el = document.createElement('div');
    el.className = 'ph';
    el.style.cssText = `left:calc(${(cx * 100).toFixed(1)}% - ${w / 2}vw); top:calc(${(cy * 100).toFixed(1)}% - ${(w * ratio / 2).toFixed(1)}vw); width:${w.toFixed(1)}vw; height:${(w * ratio).toFixed(1)}vw; --r:${((Math.random() - .5) * 10).toFixed(1)}deg; z-index:${k}`;
    el.innerHTML = `<div><img src="${F}pm_${pad(fotos[k])}.jpg" alt=""></div>`;
    el.vel = .03 + Math.random() * .07;
    wall.appendChild(el);
    void el.offsetWidth; // fija el estado inicial para que la entrada se anime
    return el;
  }
  function update() {
    const y = scrollY;
    let n = 0;
    while (n < umbrales.length && umbrales[n] <= y) n++;
    for (let k = 0; k < Math.min(umbrales.length, n + 2); k++) {
      if (k < n - tope - 8) { if (els[k]) { els[k].remove(); els[k] = null; } continue; }
      const el = els[k] || (els[k] = crear(k));
      el.classList.toggle('in', k < n && k >= n - tope);
      el.classList.toggle('old', k < n - tope);
      if (k < n && k >= n - tope) el.style.transform = `translateY(${(-(y - umbrales[k]) * el.vel).toFixed(1)}px)`;
    }
    for (let k = n + 2; k < els.length; k++) {
      if (!els[k]) continue;
      if (k > n + 30) { els[k].remove(); els[k] = null; } else els[k].classList.remove('in', 'old');
    }
    return n;
  }
  calcular();
  addEventListener('resize', () => { calcular(); update(); });
  return { update, recalcular: calcular, veil };
}

/* ---------- Visor de fotos y vídeo ---------- */
const lb = $('lb');
let lbLista = [], lbPos = 0;
function abrirFoto(n, lista) {
  lbLista = lista || P2.orden || [n];
  lbPos = Math.max(0, lbLista.indexOf(n));
  pintarVisor();
  lb.classList.add('on');
}
function pintarVisor() {
  const n = lbLista[(lbPos + lbLista.length) % lbLista.length];
  $('lbmedia').innerHTML = `<img src="${F}pf_${pad(n)}.jpg" alt="">`;
  $('lbc').textContent = `${((lbPos % lbLista.length) + lbLista.length) % lbLista.length + 1} / ${lbLista.length}`;
  $('lbp').style.display = $('lbn').style.display = '';
}
function abrirVideo(src) {
  $('lbmedia').innerHTML = `<video src="${src}" controls autoplay playsinline></video>`;
  $('lbc').textContent = '';
  $('lbp').style.display = $('lbn').style.display = 'none';
  lb.classList.add('on');
}
function cerrarVisor() { lb.classList.remove('on'); $('lbmedia').innerHTML = ''; }
P2.abrirFoto = abrirFoto;
$('lbx').onclick = cerrarVisor;
$('lbp').onclick = () => { lbPos--; pintarVisor(); };
$('lbn').onclick = () => { lbPos++; pintarVisor(); };
lb.onclick = e => { if (e.target === lb) cerrarVisor(); };
addEventListener('keydown', e => {
  if (!lb.classList.contains('on')) return;
  if (e.key === 'Escape') cerrarVisor();
  if (e.key === 'ArrowLeft' && lbLista.length) { lbPos--; pintarVisor(); }
  if (e.key === 'ArrowRight' && lbLista.length) { lbPos++; pintarVisor(); }
});

/* ---------- Apariciones, destinos, tráiler y carrete ---------- */
const vistos = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); vistos.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('[data-rev]').forEach(el => vistos.observe(el));

// Destinos: sacados del GPS de las fotos (y Berlín, París, Londres y Lisboa reconocidos por el monumento).
// f = números de foto de ese sitio; al pulsarlo se abre la galería solo con ellas.
const DESTINOS = [
  { pais: 'España', sitios: [{ n: 'Gandía', f: [86, 87, 89, 91, 96, 97, 102, 209] }, { n: 'Valencia', f: [88] }] },
  { pais: 'Portugal', sitios: [{ n: 'Lisboa', f: [196] }] },
  { pais: 'Francia', sitios: [{ n: 'París', f: [48] }, { n: 'Versalles', f: [45] }] },
  { pais: 'Bélgica', sitios: [{ n: 'Bruselas', f: [208, 212, 213, 215, 216, 219, 221, 222, 223, 224, 227] }, { n: 'Brujas', f: [210, 226, 228] }, { n: 'Amberes', f: [218, 229] }, { n: 'Gante', f: [220] }] },
  { pais: 'Países Bajos', sitios: [{ n: 'Ámsterdam', f: [3, 4, 12] }, { n: 'Zwolle', f: [5] }] },
  { pais: 'Alemania', sitios: [{ n: 'Berlín', f: [1, 245, 248] }] },
  { pais: 'Reino Unido', sitios: [{ n: 'Londres', f: [119] }, { n: 'Paignton', f: [77] }] },
  { pais: 'Estados Unidos', sitios: [{ n: 'Chicago', f: [51, 52, 53, 54, 55, 56, 57, 59, 60, 61, 63, 75] }, { n: 'Whiting (Indiana)', f: [65] }] },
  { pais: 'Míchigan', sitios: [{ n: 'Grand Haven', f: [20, 26, 28, 33, 34, 41, 42, 44, 66, 68, 69, 71, 74, 76, 78, 79, 83] }, { n: 'Spring Lake', f: [40, 67, 73, 80, 85] },
    { n: 'Fruitport', f: [19, 23, 70, 81] }, { n: 'Rockford', f: [24, 27, 43] }, { n: 'Beechwood', f: [18] }, { n: 'Norton Shores', f: [35] }, { n: 'Hart', f: [84] }] },
];
const fotoD = $('foto-d');
// Un desplegable por país: al abrirlo salen sus sitios; al abrir uno se cierran los demás
const fotosTxt = n => `${n} ${n === 1 ? 'foto' : 'fotos'}`;
$('paises').innerHTML = DESTINOS.map(p => {
  const total = p.sitios.reduce((a, s) => a + s.f.length, 0);
  return `<details><summary><b>${p.pais}</b><small class="sc">${p.sitios.length} ${p.sitios.length === 1 ? 'sitio' : 'sitios'} · ${fotosTxt(total)}</small><i>⌄</i></summary>
    <div class="sitios">${p.sitios.map(s => `<button class="sitio" data-f="${s.f.join(',')}">${s.n}<small>${fotosTxt(s.f.length)}</small></button>`).join('')}</div></details>`;
}).join('');
$('paises').querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => {
  if (d.open) $('paises').querySelectorAll('details[open]').forEach(o => { if (o !== d) o.open = false; });
}));
$('paises').querySelectorAll('.sitio').forEach(b => {
  const f = b.dataset.f.split(',').map(Number);
  b.addEventListener('mouseenter', () => { fotoD.querySelector('img').src = `${F}pm_${pad(f[0])}.jpg`; fotoD.classList.add('on'); });
  b.addEventListener('mouseleave', () => fotoD.classList.remove('on'));
  b.addEventListener('click', () => abrirFoto(f[0], f));
});
$('galeria-todo').onclick = () => abrirFoto(P2.orden[0]);

// Vídeos de las tarjetas y del tráiler: solo se reproducen cuando se ven
const enVista = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }), { threshold: .2 });
document.querySelectorAll('video[data-vista]').forEach(v => enVista.observe(v));
$('ver-trailer').onclick = () => abrirVideo('assets/video/viaje2.mp4');

P2.listo.then(() => {
  const muestra = P2.orden.slice(0, 6);
  $('mosaico').innerHTML = muestra.map(n => `<img loading="lazy" src="${F}pm_${pad(n)}.jpg" data-n="${n}" alt="">`).join('');
  $('mosaico').onclick = e => { if (e.target.dataset.n) abrirFoto(+e.target.dataset.n); };
  $('ver-carrete').onclick = () => abrirFoto(P2.orden[0]);

  // Fondo: empieza a llenarse mientras la esfera se abre y sigue hasta el final
  const hero = $('hero');
  const muro = crearMuro({
    fotos: P2.orden, tope: 150,
    umbral: k => {
      const H = innerHeight, largo = hero.offsetHeight - H;
      if (k < 120) return (.22 + k / 120 * .74) * largo;
      return largo + (k - 119) * .14 * H;
    },
  });
  P2.muro = muro;
  const onScroll = () => {
    muro.update();
    const r = hero.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    muro.veil.style.opacity = r.bottom > innerHeight * .5 ? .2 + p * .4 : .6;
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('load', () => { muro.recalcular(); onScroll(); });
  onScroll();
});
