(function(){
'use strict';

/* Sayfanın el değmemiş hali: "Paylaşım kopyası" bu metinden üretilir. */
const SRC_HTML = '<!doctype html>\n' + document.documentElement.outerHTML;

/* ================= Durum ================= */
const KEY = 'osb-satis-bolgeleri-v1';
const PALETTE = ['#E4572E','#2E86DE','#17A589','#8E44AD','#F39C12','#D81B60','#3949AB','#7CB342','#00838F','#6D4C41','#C0392B','#5D6D7E'];
const UNASSIGNED = '#AEB5C2';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = p => p + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 7);
const $ = s => document.querySelector(s);
const trCmp = (a, b) => String(a).localeCompare(String(b), 'tr');
const today = () => new Date().toISOString().slice(0, 10);
const upTR = s => String(s).toLocaleUpperCase('tr');

const ICON = {
  user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  brush: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17c2-6 5-9 8-9 3.5 0 2 6 5 6 1.5 0 2.5-1 3-2"/></svg>',
  hand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l5 17 2.5-7 7-2.5z"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  back: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  map: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c3c9d4" stroke-width="1.6" stroke-linejoin="round"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>'
};

function normalize(s){
  s.version = 3; s.updatedAt = s.updatedAt || 0;
  s.extraOsbs = Array.isArray(s.extraOsbs) ? s.extraOsbs : [];
  s.pdf = s.pdf && typeof s.pdf === 'object' ? s.pdf : {};
  s.regions.forEach(r => { r.osbIds = r.osbIds || []; r.ilceler = r.ilceler || []; r.iller = r.iller || []; r.areas = r.areas || []; r.color = r.color || PALETTE[0]; });
  return s;
}
const valid = s => !!(s && Array.isArray(s.regions));

/* Dosyaya gömülü veri (paylaşım kopyasında dolu, asıl dosyada boş) */
let seed = null;
try { seed = JSON.parse(document.getElementById('seed').textContent); } catch(e){}
if (!seed || !valid(seed.state)) seed = null;
const RO = !!(seed && seed.readonly);
document.body.classList.toggle('ro', RO);

let storageOk = true;
try { localStorage.setItem(KEY + '-t', '1'); localStorage.removeItem(KEY + '-t'); } catch(e){ storageOk = false; }
function loadLocal(){
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (valid(s)) return normalize(s); } catch(e){}
  return null;
}
function writeLocal(){
  if (RO) return true;
  if (!storageOk) return false;
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch(e){ storageOk = false; return false; }
}

let state, seededNow = false;
(function(){
  const local = RO ? null : loadLocal();
  const seeded = seed ? normalize(seed.state) : null;
  if (seeded && (RO || !local || seeded.updatedAt > local.updatedAt)) { state = seeded; seededNow = !RO; }
  else state = local || normalize({ regions:[] });
})();

function save(){
  if (RO) return;
  state.updatedAt = Date.now();
  if (writeLocal()) $('#saveState').textContent = 'Kaydedildi · ' + new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
  else markUnsaved();
}
function markUnsaved(){
  $('#saveState').innerHTML = '<span class="warnbar">⚠ Bu bilgisayarda otomatik kayıt kapalı. Kapatmadan önce <b>“Paylaşım kopyası”</b> ya da <b>“Yedek indir”</b> ile çalışmanızı dosyaya kaydedin.</span>';
  window.onbeforeunload = state.regions.length ? (e => { e.preventDefault(); e.returnValue = ''; }) : null;
}

const ilceNames = ILCE.features.map(f => f.properties.ad).sort(trCmp);
const ilNames = ILLER.features.map(f => f.properties.ad).sort(trCmp);
const baseOsbs = OSB.features.map(f => ({ id:f.properties.id, ad:f.properties.ad, tamAd:f.properties.tamAd, ilce:f.properties.ilce, lp:f.properties.lp, geo:f.geometry, custom:false }));
const allOsbs = () => baseOsbs.concat(state.extraOsbs.map(o => Object.assign({}, o, {custom:true})));
const osbById = id => allOsbs().find(o => o.id === id);
const regionById = id => state.regions.find(r => r.id === id);
const regionOfIl = ad => state.regions.find(r => r.iller.includes(ad));
const regionOfIlce = ad => state.regions.find(r => r.ilceler.includes(ad));
const explicitRegionOfOsb = id => state.regions.find(r => r.osbIds.includes(id));
/* Bir OSB ya doğrudan bir bölgeye eklenmiştir ya da ilçesinin bölgesine dahildir. */
function regionOfOsb(id){
  const e = explicitRegionOfOsb(id); if (e) return e;
  const o = osbById(id); return o ? regionOfIlce(o.ilce) : undefined;
}
function regionOsbs(r){
  return allOsbs().filter(o => { const x = regionOfOsb(o.id); return x && x.id === r.id; })
    .map(o => ({ o, viaIlce: !r.osbIds.includes(o.id) })).sort((a, b) => trCmp(a.o.ad, b.o.ad));
}
function findArea(aid){ for (const r of state.regions) { const a = r.areas.find(x => x.id === aid); if (a) return {r, a}; } return null; }
function regionOfTarget(t){
  if (t.osb) return regionOfOsb(t.osb);
  if (t.ilce) return regionOfIlce(t.ilce);
  if (t.il) return regionOfIl(t.il);
  return (findArea(t.area) || {}).r;
}
function nextColor(){ const used = state.regions.map(r => r.color); return PALETTE.find(c => !used.includes(c)) || PALETTE[state.regions.length % PALETTE.length]; }
function shade(hex, p){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const t = p < 0 ? 0 : 255, k = Math.abs(p) / 100;
  r = Math.round((t - r) * k) + r; g = Math.round((t - g) * k) + g; b = Math.round((t - b) * k) + b;
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
const initials = s => String(s || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toLocaleUpperCase('tr');

/* ================= Harita ================= */
const map = L.map('map', { zoomControl:false, minZoom:5, maxZoom:16, zoomSnap:0.25, zoomDelta:0.5, wheelPxPerZoomLevel:100 });
L.control.zoom({ position:'topright', zoomInTitle:'Yakınlaştır', zoomOutTitle:'Uzaklaştır' }).addTo(map);
map.attributionControl.setPrefix(false).addAttribution('Sınır verisi © OpenStreetMap katkıcıları · geoBoundaries');
[['outline',404],['illbl',405],['ilcelbl',406],['osb',420],['areas',425],['dots',430],['osblbl',440],['draw',460]].forEach(([n, z]) => { map.createPane(n).style.zIndex = z; });
['outline','illbl','ilcelbl','osblbl','draw'].forEach(n => { map.getPane(n).style.pointerEvents = 'none'; });

const ilBounds = L.geoJSON(IL).getBounds();
const trBounds = L.geoJSON(ILLER).getBounds().extend(ilBounds);
map.setMaxBounds(trBounds.pad(0.2));

const TIP = { sticky:true, className:'card-tip', direction:'top', offset:[0,-14], opacity:1 };
let hl = null;                       // üzerine gelinen şey: {region, il, ilce, osb, area}
let mode = 'view', assignId = null, draw = null, selId = null, tab = 'regions', query = '';

function zoneStyle(r, h, base){
  if (!r) return { color:base.stroke, weight:h ? 1.8 : base.weight, fillColor:h ? '#f1e9da' : base.fill, fillOpacity:1 };
  return { color:shade(r.color, -5), weight:h ? 2.4 : 1.3, fillColor:shade(r.color, h ? 56 : 74), fillOpacity:1 };
}
const IL_BASE = { stroke:'#d6cdbd', weight:.9, fill:'#f6f3ec' }, ILCE_BASE = { stroke:'#cfc5b4', weight:1.1, fill:'#fbf8f3' };
function ilStyle(ad){ const r = regionOfIl(ad); return zoneStyle(r, hl && (hl.il === ad || (r && hl.region === r.id)), IL_BASE); }
function ilceStyle(ad){ const r = regionOfIlce(ad); return zoneStyle(r, hl && (hl.ilce === ad || (r && hl.region === r.id)), ILCE_BASE); }
function osbStyle(id){
  const r = regionOfOsb(id), h = hl && (hl.osb === id || (r && hl.region === r.id)), dim = hl && hl.region && !h;
  if (!r) return { color:'#7c8595', weight:h ? 2.6 : 1.4, dashArray:'4 3', fillColor:UNASSIGNED, fillOpacity:h ? .85 : (dim ? .35 : .55) };
  return { color:shade(r.color, -32), weight:h ? 3 : 1.7, dashArray:null, fillColor:r.color, fillOpacity:h ? .95 : (dim ? .4 : .78) };
}
function dotStyle(id){
  const r = regionOfOsb(id), h = hl && (hl.osb === id || (r && hl.region === r.id));
  return { radius:h ? 9 : 7, color:'#fff', weight:2.2, fillColor:r ? r.color : UNASSIGNED, fillOpacity:1 };
}
function areaStyle(r, aid){
  const h = hl && (hl.region === r.id || hl.area === aid), dim = hl && hl.region && !h;
  return { color:shade(r.color, -20), weight:h ? 3 : 2, dashArray:'7 5', fillColor:r.color, fillOpacity:h ? .4 : (dim ? .12 : .24) };
}

/* Kart haritanın üst kenarına yakınsa imlecin altında açılsın, kesilmesin. */
function adjustTip(layer, e){
  const t = layer.getTooltip && layer.getTooltip(); if (!t || !e || !e.containerPoint) return;
  const down = e.containerPoint.y < 125, want = down ? 'bottom' : 'top';
  if (t.options.direction === want) return;
  t.options.direction = want; t.options.offset = down ? [0, 18] : [0, -14];
  if (t.isOpen()) t.update();
}
function bindFeature(layer, t, noTip){
  if (!noTip) layer.bindTooltip(() => cardHtml(t, false), TIP);
  layer.on('mouseover', e => { adjustTip(layer, e); if (mode === 'draw') return; const r = regionOfTarget(t); hl = Object.assign({ region:r && r.id }, t); restyle(); });
  layer.on('mousemove', e => adjustTip(layer, e));
  layer.on('mouseout', () => { if (hl) { hl = null; restyle(); } });
  layer.on('click', e => onFeatureClick(t, e, layer));
}
function lblMarker(lp, pane, cls, text){
  return L.marker(lp, { pane, interactive:false, keyboard:false, icon:L.divIcon({ className:cls, html:'<span>' + esc(text) + '</span>', iconSize:[0,0] }) });
}

/* Türkiye: Ankara dışındaki 80 il, tek tek seçilebilir */
const ilLayers = {}, ilTip = {};
ILLER.features.forEach(f => {
  const ad = f.properties.ad;
  const layer = L.geoJSON(f, { style:ilStyle(ad) }).addTo(map);
  bindFeature(layer, { il:ad }, true);
  ilLayers[ad] = layer;
  lblMarker(f.properties.lp, 'illbl', 'lbl-il', ad).addTo(map);
});
/* Ankara: ilçeler, tek tek seçilebilir */
const ilceLayers = {}, ilceTip = {};
ILCE.features.forEach(f => {
  const ad = f.properties.ad;
  const layer = L.geoJSON(f, { style:ilceStyle(ad) }).addTo(map);
  bindFeature(layer, { ilce:ad }, true);
  ilceLayers[ad] = layer;
  lblMarker(f.properties.lp, 'ilcelbl', 'lbl-ilce', ad).addTo(map);
});
L.geoJSON(IL, { pane:'outline', interactive:false, style:{ color:'#7f8996', weight:2.4, fill:false, opacity:.9 } }).addTo(map);
/* Bölgesi olmayan il/ilçede fareyi kart takip etmesin; yalnızca atanmış olanlarda kart çıkar. */
function syncTips(){
  [[ilLayers, ilTip, regionOfIl, 'il'], [ilceLayers, ilceTip, regionOfIlce, 'ilce']].forEach(([layers, tips, of, key]) => {
    for (const ad in layers) {
      const has = !!of(ad);
      if (has === !!tips[ad]) continue;
      if (has) layers[ad].bindTooltip(() => cardHtml({ [key]:ad }, false), TIP); else layers[ad].unbindTooltip();
      tips[ad] = has;
    }
  });
}

const osbGroup = L.layerGroup().addTo(map), dotGroup = L.layerGroup().addTo(map), lblGroup = L.layerGroup().addTo(map);
const areaGroup = L.layerGroup().addTo(map), areaLblGroup = L.layerGroup().addTo(map);
let osbLayers = {}, areaLayers = {};

function osbLabelIcon(o){
  const r = regionOfOsb(o.id);
  return L.divIcon({ className:'lbl-osb', iconSize:[0,0], html:'<span style="--c:' + (r ? r.color : UNASSIGNED) + '">' + esc(o.ad) + '</span>' });
}
function buildOsbs(){
  osbGroup.clearLayers(); dotGroup.clearLayers(); lblGroup.clearLayers(); osbLayers = {};
  allOsbs().forEach(o => {
    const poly = L.geoJSON(o.geo, { pane:'osb', style:osbStyle(o.id) });
    const dot = L.circleMarker(o.lp, Object.assign({ pane:'dots' }, dotStyle(o.id)));
    bindFeature(poly, { osb:o.id }); bindFeature(dot, { osb:o.id });
    const lbl = L.marker(o.lp, { pane:'osblbl', interactive:false, keyboard:false, icon:osbLabelIcon(o) });
    osbGroup.addLayer(poly); dotGroup.addLayer(dot); lblGroup.addLayer(lbl);
    osbLayers[o.id] = { poly, dot, lbl, o };
  });
}
function buildAreas(){
  areaGroup.clearLayers(); areaLblGroup.clearLayers(); areaLayers = {};
  state.regions.forEach(r => r.areas.forEach(a => {
    const l = L.polygon(a.latlngs, Object.assign({ pane:'areas', smoothFactor:.5 }, areaStyle(r, a.id)));
    bindFeature(l, { area:a.id });
    areaGroup.addLayer(l);
    areaLblGroup.addLayer(L.marker(l.getBounds().getCenter(), { pane:'osblbl', interactive:false, keyboard:false,
      icon:L.divIcon({ className:'lbl-area', iconSize:[0,0], html:'<span style="--c:' + shade(r.color, -30) + '">' + esc(a.name) + '</span>' }) }));
    areaLayers[a.id] = { l, r, a };
  }));
}
function restyle(){
  for (const ad in ilLayers) ilLayers[ad].setStyle(ilStyle(ad));
  for (const ad in ilceLayers) ilceLayers[ad].setStyle(ilceStyle(ad));
  for (const id in osbLayers) { const x = osbLayers[id]; x.poly.setStyle(osbStyle(id)); x.dot.setStyle(dotStyle(id)); }
  for (const id in areaLayers) { const x = areaLayers[id]; x.l.setStyle(areaStyle(x.r, id)); }
}
function rebuild(){ buildOsbs(); buildAreas(); syncTips(); restyle(); applyZoom(); }
/* Atama değişince: şekiller aynı, yalnızca renkler ve etiketler yenilenir */
function refresh(){
  for (const id in osbLayers) osbLayers[id].lbl.setIcon(osbLabelIcon(osbLayers[id].o));
  syncTips(); restyle(); renderSide();
}

function applyZoom(){
  const z = map.getZoom(), show = (n, on) => { map.getPane(n).style.display = on ? '' : 'none'; };
  show('illbl', z < 8.75);
  show('ilcelbl', z >= 8 && z < 13);
  show('dots', z < 11.5);
  show('osblbl', z >= 10.5);
}
map.on('zoomend', applyZoom);
map.on('popupopen', () => map.getContainer().classList.add('pop-open'));
map.on('popupclose', () => map.getContainer().classList.remove('pop-open'));

function coreBounds(){
  const pts = baseOsbs.filter(o => ['Sincan','Yenimahalle','Kahramankazan','Etimesgut'].includes(o.ilce)).map(o => o.lp);
  return pts.length ? L.latLngBounds(pts).pad(0.25) : ilBounds;
}
function regionBounds(r){
  const b = L.latLngBounds([]);
  r.iller.forEach(ad => { if (ilLayers[ad]) b.extend(ilLayers[ad].getBounds()); });
  r.ilceler.forEach(ad => { if (ilceLayers[ad]) b.extend(ilceLayers[ad].getBounds()); });
  regionOsbs(r).forEach(x => { const l = osbLayers[x.o.id]; if (l) b.extend(l.poly.getBounds()); });
  r.areas.forEach(a => { const x = areaLayers[a.id]; if (x) b.extend(x.l.getBounds()); });
  return b.isValid() ? b : null;
}
function flyTo(b, maxZoom){ if (b) map.flyToBounds(b, { padding:[60,60], maxZoom:maxZoom || 14, duration:.7 }); }
function flash(h){ hl = h; restyle(); setTimeout(() => { hl = null; restyle(); }, 1600); }

/* ================= Kart (pop-up): yalnızca ad, bölge ve satışçı ================= */
function cardHtml(t, withActions){
  let kind = '', title = '';
  if (t.osb) { const o = osbById(t.osb); if (!o) return ''; kind = 'OSB · ' + (o.ilce || ''); title = o.ad; }
  else if (t.ilce) { kind = 'İlçe · Ankara'; title = t.ilce; }
  else if (t.il) { kind = 'İl'; title = t.il; }
  else { const f = findArea(t.area); if (!f) return ''; kind = 'Müşteri alanı'; title = f.a.name; }
  const r = regionOfTarget(t);
  let h = '<div class="tip" style="--c:' + (r ? r.color : UNASSIGNED) + '"><div class="tip-k">' + esc(kind) + '</div><div class="tip-t">' + esc(title) + '</div>';
  if (!r) {
    h += '<div class="tip-empty">Bölgeye atanmadı</div>';
    if (withActions && !RO && state.regions.length) {
      const kindKey = t.il ? 'il' : t.ilce ? 'ilce' : 'osb';
      h += '<div class="tip-acts"><div class="lbl">Bölgeye ekle:</div>' + state.regions.map(x =>
        '<button class="btn sm" data-act="assign-to" data-kind="' + kindKey + '" data-id="' + esc(t.il || t.ilce || t.osb) + '" data-rid="' + esc(x.id) + '"><span style="width:9px;height:9px;border-radius:3px;background:' + x.color + '"></span>' + esc(x.name) + '</button>').join('') + '</div>';
    }
    return h + '</div>';
  }
  h += '<div class="tip-region"><span class="sw"></span><b>' + esc(r.name) + '</b></div>';
  h += '<div class="tip-rep">' + ICON.user + '<span>' + esc(r.rep || 'Satışçı belirtilmedi') + '</span></div>';
  if (withActions) h += '<div class="tip-acts"><button class="btn sm dark" data-act="open-region" data-id="' + esc(r.id) + '">Bölge ayrıntıları</button></div>';
  return h + '</div>';
}

function onFeatureClick(t, e, layer){
  if (mode === 'draw') return;
  if (mode === 'assign') {
    if (t.osb) toggleOsb(t.osb); else if (t.ilce) toggleZone('ilce', t.ilce); else if (t.il) toggleZone('il', t.il); else toast('Müşteri alanları bölgeye çizilerek eklenir');
    return;
  }
  layer.closeTooltip();
  L.popup({ className:'card-pop', maxWidth:280, minWidth:190, autoPanPadding:[40,40] })
    .setLatLng(e.latlng).setContent(cardHtml(t, true)).openOn(map);
}

/* ================= Modlar: haritadan seçme / serbest çizim ================= */
function setMapClass(){
  const c = $('#mapwrap').classList;
  c.toggle('m-draw', mode === 'draw'); c.toggle('m-assign', mode === 'assign');
}
function showBanner(html, buttons){
  const b = $('#banner');
  b.innerHTML = '<span class="pulse"></span><div class="txt">' + html + '</div><div class="btns">' +
    buttons.map(([t, a, cls]) => '<button class="btn sm ' + (cls || '') + '" data-act="' + a + '">' + t + '</button>').join('') + '</div>';
  b.classList.add('show');
}
function hideBanner(){ $('#banner').classList.remove('show'); }

function stopModes(silent){
  if (draw) {
    map.removeLayer(draw.line); map.removeLayer(draw.fill); draw = null;
    map.dragging.enable(); map.doubleClickZoom.enable(); map.boxZoom.enable();
  }
  mode = 'view'; assignId = null; hideBanner(); setMapClass();
  if (!silent) renderSide();
}
function startAssign(id){
  const r = regionById(id); if (!r) return;
  stopModes(true); map.closePopup();
  mode = 'assign'; assignId = id; selId = id; tab = 'regions'; setMapClass();
  showBanner('<b>' + esc(r.name) + '</b> bölgesini düzenliyorsunuz. <b>İllere</b>, <b>ilçelere</b> ve <b>OSB\'lere</b> tıklayarak ekleyin ya da çıkarın.', [['Bitti', 'done', 'primary']]);
  renderSide(); restyle();
  if (!regionBounds(r)) flyTo(ilBounds, 10);
}
/* kind: 'il' ya da 'ilce' */
function toggleZone(kind, ad){
  const r = regionById(assignId); if (!r) return;
  const key = kind === 'il' ? 'iller' : 'ilceler', word = kind === 'il' ? ' ili' : ' ilçesi';
  const cur = kind === 'il' ? regionOfIl(ad) : regionOfIlce(ad);
  if (cur && cur.id === r.id) { r[key] = r[key].filter(x => x !== ad); toast(ad + word + ' bölgeden çıkarıldı'); }
  else {
    if (cur) { cur[key] = cur[key].filter(x => x !== ad); toast(ad + word + ' “' + cur.name + '” bölgesinden alındı'); }
    else toast(ad + word + ' eklendi');
    r[key].push(ad);
  }
  save(); refresh();
}
function toggleOsb(id){
  const r = regionById(assignId), o = osbById(id); if (!r || !o) return;
  const ex = explicitRegionOfOsb(id), eff = regionOfOsb(id);
  if (ex && ex.id === r.id) {
    r.osbIds = r.osbIds.filter(x => x !== id);
    const now = regionOfOsb(id);
    toast(o.ad + ' bölgeden çıkarıldı' + (now ? ' (' + o.ilce + ' ilçesiyle “' + now.name + '” bölgesinde)' : ''));
  } else if (!ex && eff && eff.id === r.id) {
    toast(o.ad + ' zaten ' + o.ilce + ' ilçesiyle birlikte bu bölgede'); return;
  } else {
    if (ex) ex.osbIds = ex.osbIds.filter(x => x !== id);
    r.osbIds.push(id);
    toast(eff ? o.ad + ' “' + eff.name + '” bölgesinden alındı' : o.ad + ' eklendi');
  }
  save(); refresh();
}

/* Serbest çizim: sol tuş basılıyken çiz, bırakınca alan kapanır */
function startDraw(text, onDone){
  stopModes(true); map.closePopup();
  mode = 'draw'; setMapClass();
  map.dragging.disable(); map.doubleClickZoom.disable(); map.boxZoom.disable();
  const st = { pane:'draw', interactive:false, smoothFactor:0 };
  draw = { onDone, pts:[], active:false, last:null,
    fill: L.polygon([], Object.assign({ stroke:false, fillColor:'#F5B400', fillOpacity:.25 }, st)).addTo(map),
    line: L.polyline([], Object.assign({ color:'#1f2430', weight:3, lineCap:'round', lineJoin:'round' }, st)).addTo(map) };
  showBanner(text + ' Farenin <b>sol tuşunu basılı tutarak</b> alanın çevresini çizin; bıraktığınızda alan kapanır.', [['İptal', 'cancel']]);
  renderSide();
}
function refreshDraw(){ draw.line.setLatLngs(draw.pts); draw.fill.setLatLngs(draw.pts.length > 2 ? draw.pts : []); }
function finishStroke(){
  const cps = draw.pts.map(p => map.latLngToContainerPoint(p));
  let area = 0;
  for (let i = 0, j = cps.length - 1; i < cps.length; j = i++) area += (cps[j].x + cps[i].x) * (cps[j].y - cps[i].y);
  if (cps.length < 3 || Math.abs(area / 2) < 150) { draw.pts = []; refreshDraw(); toast('Alan çok küçük oldu, tekrar çizin', 'warn'); return; }
  const pts = L.LineUtil.simplify(cps, 1.2).map(p => { const ll = map.containerPointToLatLng(p); return [+ll.lat.toFixed(6), +ll.lng.toFixed(6)]; });
  const cb = draw.onDone;
  stopModes(true);
  const preview = L.polygon(pts, { pane:'draw', interactive:false, color:'#1f2430', weight:2.5, dashArray:'6 5', fillColor:'#F5B400', fillOpacity:.28 }).addTo(map);
  cb(pts, () => map.removeLayer(preview));
}
const mapEl = map.getContainer();
mapEl.addEventListener('pointerdown', e => {
  if (mode !== 'draw' || !draw || (e.pointerType === 'mouse' && e.button !== 0)) return;
  if (e.target.closest && e.target.closest('.leaflet-control')) return;
  draw.active = true; draw.pts = [map.mouseEventToLatLng(e)]; draw.last = [e.clientX, e.clientY];
  try { mapEl.setPointerCapture(e.pointerId); } catch(_){}
  refreshDraw(); e.preventDefault();
});
mapEl.addEventListener('pointermove', e => {
  if (!draw || !draw.active) return;
  const dx = e.clientX - draw.last[0], dy = e.clientY - draw.last[1];
  if (dx * dx + dy * dy < 9) return;
  draw.last = [e.clientX, e.clientY]; draw.pts.push(map.mouseEventToLatLng(e)); refreshDraw();
});
function endStroke(e){
  if (!draw || !draw.active) return;
  draw.active = false;
  try { mapEl.releasePointerCapture(e.pointerId); } catch(_){}
  finishStroke();
}
mapEl.addEventListener('pointerup', endStroke);
mapEl.addEventListener('pointercancel', endStroke);

/* ================= Yan panel ================= */
function renderSide(){
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const body = $('#sideBody');
  if (tab === 'osbs') { body.innerHTML = listTabHtml(); const q = $('#q'); q.value = query; q.oninput = () => { query = q.value; $('#osbList').innerHTML = placeListHtml(); }; }
  else if (selId && regionById(selId)) body.innerHTML = detailHtml(regionById(selId));
  else { selId = null; body.innerHTML = regionsHtml(); }
  renderLegend();
}

function regionsHtml(){
  const osbs = allOsbs(), total = osbs.length, assigned = osbs.filter(o => regionOfOsb(o.id)).length;
  const ilceAssigned = ilceNames.filter(regionOfIlce).length, ilAssigned = ilNames.filter(regionOfIl).length;
  let h = '<div class="sec-head"><h2>Satış bölgeleri <span class="count">' + state.regions.length + '</span></h2>' +
    '<button class="btn primary sm edit-only" data-act="new-region">' + ICON.plus + 'Yeni bölge</button></div>';
  if (!state.regions.length) {
    return h + '<div class="empty">' + ICON.map + '<h3>Henüz bölge yok</h3>' + (RO ? '<p>Bu kopyada tanımlı satış bölgesi bulunmuyor.</p>' :
      '<p>Önce bir satış bölgesi oluşturun ve satışçısını yazın. Sonra haritada illere, ilçelere ve OSB\'lere tıklayarak bölgeye ekleyin.</p>' +
      '<button class="btn primary" data-act="new-region">' + ICON.plus + 'İlk bölgeyi oluştur</button>') + '</div>';
  }
  h += '<div class="progress"><div class="lbl"><span>Bölgesi olan OSB</span><span><b>' + assigned + '</b> / ' + total + '</span></div><div class="bar">' +
    state.regions.map(r => '<span style="width:' + (100 * regionOsbs(r).length / Math.max(total, 1)) + '%;background:' + r.color + '"></span>').join('') + '</div>' +
    '<div class="lbl" style="margin:8px 0 0"><span>Bölgesi olan Ankara ilçesi</span><span><b>' + ilceAssigned + '</b> / ' + ilceNames.length + '</span></div>' +
    (ilAssigned ? '<div class="lbl" style="margin:4px 0 0"><span>Bölgesi olan diğer il</span><span><b>' + ilAssigned + '</b> / ' + ilNames.length + '</span></div>' : '') + '</div>';
  h += state.regions.map(r => '<button class="rcard" data-act="open-region" data-id="' + esc(r.id) + '">' +
    '<span class="chip" style="background:' + r.color + '">' + esc(initials(r.rep || r.name)) + '</span>' +
    '<div class="main"><div class="rname">' + esc(r.name) + '</div><div class="rrep">' + ICON.user + esc(r.rep || 'Satışçı belirtilmedi') + '</div></div>' +
    '<div class="stats">' + (r.iller.length ? '<b>' + r.iller.length + '</b> il<br>' : '') + '<b>' + r.ilceler.length + '</b> ilçe<br><b>' + regionOsbs(r).length + '</b> OSB<br><b>' + r.areas.length + '</b> alan</div></button>').join('');
  return h;
}

function zoneBlock(r, kind, assigning){
  const key = kind === 'il' ? 'iller' : 'ilceler', list = r[key].slice().sort(trCmp);
  if (kind === 'il' && !list.length && !assigning) return '';
  let h = '<div class="block"><div class="bhead"><h3>' + (kind === 'il' ? 'İller' : 'Ankara ilçeleri') + ' <span class="count">' + list.length + '</span></h3></div>';
  h += list.length ? list.map(ad => '<div class="item" data-act="fly-' + kind + '" data-id="' + esc(ad) + '"><span class="dot il" style="background:' + shade(r.color, 45) + ';border:2px solid ' + r.color + '"></span>' +
      '<div class="t"><b>' + esc(ad) + '</b></div>' +
      '<button class="icon-btn edit-only" title="Bölgeden çıkar" data-act="unassign-zone" data-kind="' + kind + '" data-id="' + esc(ad) + '">' + ICON.x + '</button></div>').join('')
    : '<div class="hint">' + (assigning ? 'Haritada eklemek istediğiniz ' + (kind === 'il' ? 'ile (Türkiye görünümünde)' : 'ilçeye') + ' tıklayın.' : 'Bu bölgede ilçe yok.') + '</div>';
  return h + '</div>';
}
function detailHtml(r){
  const assigning = mode === 'assign' && assignId === r.id;
  const osbs = regionOsbs(r);
  let h = '<button class="back" data-act="back">' + ICON.back + 'Tüm bölgeler</button>';
  h += '<div class="dhead" style="--c:' + r.color + '"><h2>' + esc(r.name) + '</h2><div class="rep">' + ICON.user + esc(r.rep || 'Satışçı belirtilmedi') + (r.phone ? ' · ' + esc(r.phone) : '') + '</div>' +
    '<div class="acts"><button class="btn sm edit-only" data-act="edit-region">' + ICON.pen + 'Düzenle</button><button class="btn sm" data-act="zoom-region">Haritada göster</button><button class="btn sm edit-only" data-act="del-region">Sil</button></div></div>';
  h += '<button class="btn pick edit-only ' + (assigning ? 'primary' : 'dark') + '" data-act="' + (assigning ? 'done' : 'assign') + '">' +
    (assigning ? 'Seçimi bitir' : ICON.hand + 'Haritadan il / ilçe / OSB seç') + '</button>';
  h += zoneBlock(r, 'il', assigning) + zoneBlock(r, 'ilce', assigning);

  h += '<div class="block"><div class="bhead"><h3>OSB\'ler <span class="count">' + osbs.length + '</span></h3></div>';
  h += osbs.length ? osbs.map(x => '<div class="item" data-act="fly-osb" data-id="' + esc(x.o.id) + '"><span class="dot" style="background:' + r.color + '"></span>' +
      '<div class="t"><b>' + esc(x.o.ad) + (x.o.custom ? '<span class="badge">ELLE</span>' : '') + '</b><small>' + esc(x.o.ilce || '') + (x.viaIlce ? ' · ilçeyle birlikte' : '') + '</small></div>' +
      (x.viaIlce ? '' : '<button class="icon-btn edit-only" title="Bölgeden çıkar" data-act="unassign" data-id="' + esc(x.o.id) + '">' + ICON.x + '</button>') + '</div>').join('')
    : '<div class="hint">' + (assigning ? 'Haritada eklemek istediğiniz OSB\'ye tıklayın.' : 'Bu bölgede OSB yok.') + '</div>';
  h += '</div>';

  h += '<div class="block"><div class="bhead"><h3>OSB dışı müşteri alanları <span class="count">' + r.areas.length + '</span></h3>' +
    '<button class="btn sm edit-only" data-act="draw-area">' + ICON.brush + 'Serbest çiz</button></div>';
  h += r.areas.length ? r.areas.map(a => '<div class="item" data-act="fly-area" data-id="' + esc(a.id) + '"><span class="dot" style="border:2px dashed ' + r.color + ';background:transparent"></span>' +
      '<div class="t"><b>' + esc(a.name) + '</b>' + (a.note ? '<small>' + esc(a.note) + '</small>' : '') + '</div>' +
      '<button class="icon-btn edit-only" title="Yeniden adlandır" data-act="edit-area" data-id="' + esc(a.id) + '" style="color:var(--ink2)">' + ICON.pen + '</button>' +
      '<button class="icon-btn edit-only" title="Sil" data-act="del-area" data-id="' + esc(a.id) + '">' + ICON.x + '</button></div>').join('')
    : '<div class="hint">' + (RO ? 'Bu bölgede müşteri alanı yok.' : 'İl, ilçe ya da OSB sınırına uymayan müşteriler için haritaya kalemle çizer gibi serbest bir alan çizebilirsiniz.') + '</div>';
  return h + '</div>';
}

function listTabHtml(){
  return '<div class="sec-head"><h2>İller, ilçeler ve OSB\'ler</h2>' +
    '<button class="btn sm edit-only" data-act="new-osb">' + ICON.plus + 'OSB ekle</button></div>' +
    '<div class="search">' + ICON.search + '<input id="q" placeholder="İl, ilçe, OSB ya da satışçı ara…" autocomplete="off"></div>' +
    '<div id="osbList">' + placeListHtml() + '</div>' +
    '<div class="note">OSB sınırları OpenStreetMap verisinden alınmıştır. ' + (RO ? '' : 'Haritada olmayan bir OSB için <b>“OSB ekle”</b> ile sınırını kendiniz çizebilirsiniz.') + '</div>';
}
function pill(r){
  return r ? '<span class="pill" style="background:' + r.color + '1f;color:' + shade(r.color, -35) + '">' + esc(r.name) + '</span>' : '<span class="pill none">Atanmadı</span>';
}
function placeListHtml(){
  const q = query.trim().toLocaleLowerCase('tr');
  const has = (...v) => v.some(x => x && String(x).toLocaleLowerCase('tr').includes(q));
  const osbs = allOsbs();
  const ank = ilceNames.map(ad => {
    const ri = regionOfIlce(ad), mine = osbs.filter(o => o.ilce === ad).sort((a, b) => trCmp(a.ad, b.ad));
    const ilceHit = !q || has(ad, 'Ankara', ri && ri.name, ri && ri.rep);
    const shown = mine.filter(o => { if (ilceHit) return true; const r = regionOfOsb(o.id); return has(o.ad, o.tamAd, r && r.name, r && r.rep); });
    if (!ilceHit && !shown.length) return '';
    return '<div class="block" style="margin-bottom:8px"><div class="item" data-act="fly-ilce" data-id="' + esc(ad) + '">' +
      '<span class="dot il" style="background:' + (ri ? shade(ri.color, 45) : '#f3efe6') + ';border:2px solid ' + (ri ? ri.color : '#cfc5b4') + '"></span>' +
      '<div class="t"><b>' + esc(ad) + '</b><small>İlçe' + (ri ? ' · ' + esc(ri.rep || ri.name) : '') + '</small></div>' + pill(ri) + '</div>' +
      shown.map(o => { const r = regionOfOsb(o.id);
        return '<div class="item sub" data-act="fly-osb" data-id="' + esc(o.id) + '"><span class="dot" style="background:' + (r ? r.color : UNASSIGNED) + '"></span>' +
          '<div class="t"><b>' + esc(o.ad) + (o.custom ? '<span class="badge">ELLE</span>' : '') + '</b><small>OSB' + (r ? ' · ' + esc(r.rep || r.name) : '') + '</small></div>' + pill(r) +
          (o.custom ? '<button class="icon-btn edit-only" title="Bu OSB\'yi sil" data-act="del-osb" data-id="' + esc(o.id) + '">' + ICON.x + '</button>' : '') + '</div>'; }).join('') + '</div>';
  }).join('');
  const iller = ilNames.filter(ad => { const r = regionOfIl(ad); return !q || has(ad, r && r.name, r && r.rep); });
  const ilRows = iller.map(ad => { const r = regionOfIl(ad);
    return '<div class="item" data-act="fly-il" data-id="' + esc(ad) + '"><span class="dot il" style="background:' + (r ? shade(r.color, 45) : '#f3efe6') + ';border:2px solid ' + (r ? r.color : '#d6cdbd') + '"></span>' +
      '<div class="t"><b>' + esc(ad) + '</b>' + (r ? '<small>' + esc(r.rep || r.name) + '</small>' : '') + '</div>' + pill(r) + '</div>'; }).join('');
  const ilAssigned = ilNames.filter(regionOfIl).length;
  const ilSection = !iller.length ? '' : q
    ? '<div class="grp">Diğer iller</div><div class="block">' + ilRows + '</div>'
    : '<details class="more"><summary>Diğer iller <span class="count">' + ilNames.length + '</span>' + (ilAssigned ? '<small>' + ilAssigned + ' tanesi bölgede</small>' : '') + '</summary><div class="block">' + ilRows + '</div></details>';
  const out = (ank ? '<div class="grp">Ankara ilçeleri ve OSB\'ler</div>' + ank : '') + ilSection;
  return out || '<div class="hint">Sonuç bulunamadı.</div>';
}

function renderLegend(){
  const un = allOsbs().filter(o => !regionOfOsb(o.id)).length;
  $('#legend').innerHTML = '<h4>Bölgeler</h4>' + state.regions.map(r => '<div class="lg" data-act="open-region" data-id="' + esc(r.id) + '"><span class="sw" style="background:' + r.color + '"></span><b>' + esc(r.name) + '</b><span>' + esc(r.rep || '') + '</span></div>').join('') +
    '<div class="lg" data-act="tab-osbs"><span class="sw un"></span>Atanmamış OSB<span>' + un + '</span></div>';
}

function selectRegion(id){
  if (mode !== 'view' && assignId !== id) stopModes(true);
  selId = id; tab = 'regions'; renderSide(); restyle();
}

/* ================= Form penceresi ================= */
function openForm(o){
  const m = $('#modal');
  let f = '';
  (o.fields || []).forEach(fl => {
    f += '<div class="fld"><label>' + esc(fl.label) + '</label>';
    if (fl.type === 'color') {
      f += '<div class="swatches">' + PALETTE.map(c => '<label><input type="radio" name="' + fl.key + '" value="' + c + '"' + (c === fl.value ? ' checked' : '') + '><span style="background:' + c + '"></span></label>').join('') + '</div>';
    } else if (fl.type === 'select') {
      f += '<select name="' + fl.key + '">' + fl.options.map(op => '<option' + (op === fl.value ? ' selected' : '') + '>' + esc(op) + '</option>').join('') + '</select>';
    } else if (fl.type === 'textarea') {
      f += '<textarea name="' + fl.key + '" placeholder="' + esc(fl.placeholder || '') + '">' + esc(fl.value || '') + '</textarea>';
    } else {
      f += '<input type="' + (fl.type || 'text') + '" name="' + fl.key + '" value="' + esc(fl.value || '') + '" placeholder="' + esc(fl.placeholder || '') + '" autocomplete="off"' + (fl.required ? ' required' : '') + '>';
    }
    f += '</div>';
  });
  m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true"><h3>' + esc(o.title) + '</h3>' + (o.desc ? '<div class="desc">' + o.desc + '</div>' : '') +
    '<form>' + f + '</form><div class="foot"><button class="btn ghost" data-m="cancel">Vazgeç</button><button class="btn ' + (o.danger ? 'del' : 'primary') + '" data-m="ok">' + esc(o.ok || 'Kaydet') + '</button></div></div>';
  m.classList.add('show');
  const form = m.querySelector('form');
  const close = () => { m.classList.remove('show'); m.innerHTML = ''; };
  const cancel = () => { close(); o.onCancel && o.onCancel(); };
  const submit = () => {
    const v = {}; new FormData(form).forEach((val, k) => v[k] = String(val).trim());
    const req = (o.fields || []).find(fl => fl.required && !v[fl.key]);
    if (req) { form.querySelector('[name="' + req.key + '"]').focus(); return; }
    close(); o.onOk && o.onOk(v);
  };
  m.querySelector('[data-m=ok]').onclick = submit;
  m.querySelector('[data-m=cancel]').onclick = cancel;
  m.onclick = e => { if (e.target === m) cancel(); };
  form.onsubmit = e => { e.preventDefault(); submit(); };
  form.onkeydown = e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); submit(); } };
  const first = form.querySelector('input[type=text],input[type=tel],textarea,select'); if (first) setTimeout(() => first.focus(), 30);
}
function confirmBox(title, desc, ok, onOk){ openForm({ title, desc, ok, danger:true, onOk }); }

let toastT;
function toast(msg, kind){
  const t = $('#toast'); t.textContent = msg; t.className = 'show ' + (kind || '');
  clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 2800);
}

/* ================= Paylaşım kopyası ================= */
/* Verinin içine gömüldüğü, kendi başına açılan tek bir HTML dosyası üretir. */
function buildShare(readonly){
  const open = '<script id="seed" type="application/json"' + '>';
  const i = SRC_HTML.indexOf(open), j = i < 0 ? -1 : SRC_HTML.indexOf('<' + '/script>', i);
  if (j < 0) return null;
  const json = JSON.stringify({ readonly:!!readonly, exportedAt:Date.now(), state }).replace(/</g, '\\u003c');
  return SRC_HTML.slice(0, i + open.length) + json + SRC_HTML.slice(j);
}
function download(blob, name){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ================= PDF: önizleme ve indirme ================= */
/* Sayfa A4 yatay, 96 dpi birimleriyle çizilir. Önizleme ve PDF aynı çizim fonksiyonunu kullanır. */
const PAGE = { w:1123, h:794 }, PM = 30;
const PFONT = '"Segoe UI", "Segoe UI Variable Text", system-ui, -apple-system, Roboto, sans-serif';
const BOX = {
  title: { x:PM - 4, y:32, w:680, h:34, fs:22 },
  left:  { x:PM, y:106, w:250, h:518 },
  map:   { x:PM + 250 + 16, y:106, w:PAGE.w - 2 * PM - 250 - 210 - 32, h:518 },
  right: { x:PAGE.w - PM - 210, y:106, w:210, h:518 },
  notes: { x:PM, y:638, w:PAGE.w - 2 * PM, h:112 },
  notesIn: { x:PM + 8, y:662, w:PAGE.w - 2 * PM - 16, h:84, fs:11 }
};
const INK = '#1f2430', INK2 = '#4a5263', MUT = '#8a92a3', LINE = '#e3e6ec';
const pdfOpt = { region:'', extent:'auto' };
const EXTENTS = [['auto','Otomatik'],['ankara','Tüm Ankara'],['tr','Türkiye'],['view','Şu anki harita görünümü']];
const pdfTitle = () => (state.pdf.title || '').trim() || 'Satış Bölgeleri Haritası';

const F = (w, s) => w + ' ' + s + 'px ' + PFONT;
function rr(ctx, x, y, w, h, r){
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function spaced(ctx, px){ if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
function wrapLines(ctx, text, maxW){
  const out = [];
  String(text || '').split(/\r?\n/).forEach(par => {
    const words = par.split(/\s+/).filter(Boolean); let cur = '';
    if (!words.length) { out.push(''); return; }
    words.forEach(w => {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW) { cur = t; return; }
      if (cur) out.push(cur);
      cur = '';
      for (const ch of w) { if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; }
    });
    out.push(cur);
  });
  return out;
}
function ellipsize(ctx, text, maxW){
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text; while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}
function pdfRegions(){ const r = pdfOpt.region && regionById(pdfOpt.region); return r ? [r] : state.regions; }

/* Sütun içerikleri: önce ölç, sığmazsa yazıyı küçült, yine sığmazsa kes. */
function columnOps(ctx, build, box){
  for (const fs of [11, 10, 9, 8.2, 7.5]) {
    const res = build(fs);
    if (res.y <= box.y + box.h) return res.ops;
    if (fs === 7.5) {
      const lim = box.y + box.h - 14, ops = res.ops.filter(o => (o.y || 0) <= lim);
      ops.push({ t:'text', text:'… devamı sayfaya sığmadı', font:F('italic 400', 8.5), color:MUT, x:box.x, y:box.y + box.h - 2 });
      return ops;
    }
  }
}
function drawOps(ctx, ops){
  ops.forEach(o => {
    if (o.t === 'text') { ctx.font = o.font; ctx.fillStyle = o.color; spaced(ctx, o.ls || 0); ctx.fillText(o.text, o.x, o.y); spaced(ctx, 0); }
    else if (o.t === 'chip') { rr(ctx, o.x, o.y, o.s, o.s, o.s * .28); ctx.fillStyle = o.color; ctx.fill(); }
    else if (o.t === 'line') { ctx.fillStyle = LINE; ctx.fillRect(o.x, o.y, o.w, 1); }
    else if (o.t === 'tile') {
      rr(ctx, o.x, o.y, o.w, o.h, 8); ctx.fillStyle = '#f4f5f8'; ctx.fill();
      ctx.font = F('700', o.big); ctx.fillStyle = INK; ctx.fillText(o.value, o.x + 10, o.y + o.h * .52);
      ctx.font = F('600', 8.6); ctx.fillStyle = MUT; ctx.fillText(o.label, o.x + 10, o.y + o.h - 9);
    }
  });
}
function leftColumn(ctx){
  const box = BOX.left, regs = pdfRegions();
  return columnOps(ctx, fs => {
    const ops = [], lh = fs * 1.38, x = box.x, w = box.w; let y = box.y + 12;
    ops.push({ t:'text', text:'BÖLGELER VE İÇERİKLERİ', font:F('700', 8.6), color:MUT, x, y, ls:1 }); y += 8;
    if (!regs.length) { y += lh * 1.4; ops.push({ t:'text', text:'Henüz bölge tanımlanmadı.', font:F('400', fs), color:INK2, x, y }); return { ops, y }; }
    regs.forEach((r, i) => {
      y += i ? lh * .7 : lh * .5;
      if (i) { ops.push({ t:'line', x, y, w }); y += lh * .5; }
      y += fs * 1.35;
      ops.push({ t:'chip', x, y:y - fs * 1.02, s:fs * 1.05, color:r.color });
      ctx.font = F('700', fs * 1.22);
      ops.push({ t:'text', text:ellipsize(ctx, r.name, w - fs * 1.6), font:ctx.font, color:INK, x:x + fs * 1.55, y });
      y += lh;
      ctx.font = F('400', fs);
      ops.push({ t:'text', text:ellipsize(ctx, 'Satışçı: ' + (r.rep || '—') + (r.phone ? ' · ' + r.phone : ''), w), font:ctx.font, color:INK2, x, y });
      const osbs = regionOsbs(r).map(x => x.o.ad);
      [['İller', r.iller.slice().sort(trCmp)], ['Ankara ilçeleri', r.ilceler.slice().sort(trCmp)], ['OSB\'ler', osbs],
       ['Müşteri alanları', r.areas.map(a => a.name + (a.note ? ' (' + a.note + ')' : ''))]].forEach(([label, items]) => {
        if (!items.length) return;
        y += lh * 1.05;
        ops.push({ t:'text', text:upTR(label) + ' (' + items.length + ')', font:F('700', fs * .78), color:MUT, x, y, ls:.6 });
        ctx.font = F('400', fs);
        wrapLines(ctx, items.join(', '), w).forEach(line => { y += lh; ops.push({ t:'text', text:line, font:ctx.font, color:INK, x, y }); });
      });
    });
    return { ops, y };
  }, box);
}
function rightColumn(ctx){
  const box = BOX.right, regs = pdfRegions(), single = !!(pdfOpt.region && regs.length === 1);
  const osbsAll = allOsbs(), sum = f => regs.reduce((n, r) => n + f(r), 0);
  return columnOps(ctx, fs => {
    const ops = [], lh = fs * 1.38, x = box.x, w = box.w; let y = box.y + 12;
    ops.push({ t:'text', text:'ÖZET', font:F('700', 8.6), color:MUT, x, y, ls:1 }); y += 10;
    const tiles = [];
    if (!single) {
      tiles.push([String(regs.length), 'Satış bölgesi']);
      tiles.push([String(new Set(regs.map(r => (r.rep || '').trim()).filter(Boolean)).size), 'Satışçı']);
    }
    tiles.push([String(sum(r => r.iller.length)), 'Diğer il']);
    tiles.push([sum(r => r.ilceler.length) + (single ? '' : ' / ' + ilceNames.length), 'Ankara ilçesi']);
    tiles.push([sum(r => regionOsbs(r).length) + (single ? '' : ' / ' + osbsAll.length), 'OSB']);
    tiles.push([String(sum(r => r.areas.length)), 'Müşteri alanı']);
    const tw = (w - 8) / 2, th = fs * 4.6;
    tiles.forEach((t, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      ops.push({ t:'tile', x:x + col * (tw + 8), y:y + row * (th + 8), w:tw, h:th, value:t[0], label:t[1], big:fs * 1.75 });
    });
    y += Math.ceil(tiles.length / 2) * (th + 8);
    const listSec = (label, items) => {
      y += lh * 1.3;
      ops.push({ t:'text', text:upTR(label) + ' (' + items.length + ')', font:F('700', fs * .78), color:MUT, x, y, ls:.6 });
      ctx.font = F('400', fs * .95);
      wrapLines(ctx, items.length ? items.join(', ') : '—', w).forEach(line => { y += lh * .95; ops.push({ t:'text', text:line, font:ctx.font, color:INK, x, y }); });
    };
    if (single) {
      const r = regs[0];
      y += lh * 1.3;
      ops.push({ t:'text', text:'SATIŞÇI', font:F('700', fs * .78), color:MUT, x, y, ls:.6 });
      y += lh * 1.1; ctx.font = F('700', fs * 1.15);
      ops.push({ t:'text', text:ellipsize(ctx, r.rep || '—', w), font:ctx.font, color:INK, x, y });
      if (r.phone) { y += lh; ops.push({ t:'text', text:r.phone, font:F('400', fs), color:INK2, x, y }); }
      y += lh * 1.3;
      ops.push({ t:'text', text:'GENEL DURUM', font:F('700', fs * .78), color:MUT, x, y, ls:.6 });
      ctx.font = F('400', fs * .95);
      wrapLines(ctx, 'Tüm bölgelerde ' + osbsAll.filter(o => regionOfOsb(o.id)).length + ' / ' + osbsAll.length + ' OSB ve ' +
        ilceNames.filter(regionOfIlce).length + ' / ' + ilceNames.length + ' Ankara ilçesi bir satış bölgesine atanmış.', w)
        .forEach(line => { y += lh * .95; ops.push({ t:'text', text:line, font:ctx.font, color:INK, x, y }); });
    } else {
      listSec('Atanmamış OSB\'ler', osbsAll.filter(o => !regionOfOsb(o.id)).map(o => o.ad).sort(trCmp));
      listSec('Atanmamış Ankara ilçeleri', ilceNames.filter(ad => !regionOfIlce(ad)));
    }
    return { ops, y };
  }, box);
}

function extentBounds(){
  const regs = pdfRegions();
  if (pdfOpt.extent === 'ankara') return ilBounds;
  if (pdfOpt.extent === 'tr') return trBounds;
  if (pdfOpt.extent === 'view') return map.getBounds();
  if (pdfOpt.region && regs.length === 1) { const b = regionBounds(regs[0]); return b ? b.pad(0.12) : ilBounds; }
  const b = L.latLngBounds(ilBounds.getSouthWest(), ilBounds.getNorthEast());
  regs.forEach(r => r.iller.forEach(ad => { if (ilLayers[ad]) b.extend(ilLayers[ad].getBounds()); }));
  return b;
}
function geoRings(g){ return g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; }
function drawMapBox(ctx){
  const B = BOX.map, filt = pdfOpt.region || null, b = extentBounds();
  ctx.save(); rr(ctx, B.x, B.y, B.w, B.h, 10); ctx.fillStyle = '#e6ecf2'; ctx.fill(); ctx.clip();
  const nw = map.project(b.getNorthWest(), 0), se = map.project(b.getSouthEast(), 0);
  const bw = Math.max(se.x - nw.x, 1e-6), bh = Math.max(se.y - nw.y, 1e-6), pad = 16;
  const s = Math.min((B.w - 2 * pad) / bw, (B.h - 2 * pad) / bh);
  const ox = B.x + (B.w - bw * s) / 2 - nw.x * s, oy = B.y + (B.h - bh * s) / 2 - nw.y * s;
  const P = (lat, lng) => { const p = map.project([lat, lng], 0); return [p.x * s + ox, p.y * s + oy]; };
  const pathGeo = g => { ctx.beginPath(); geoRings(g).forEach(poly => poly.forEach(ring => { ring.forEach((c, i) => { const [px, py] = P(c[1], c[0]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); })); };
  const box = g => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; geoRings(g).forEach(poly => poly[0].forEach(c => { const [px, py] = P(c[1], c[0]); x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); })); return { w:x1 - x0, h:y1 - y0 }; };
  const faded = r => r && filt && r.id !== filt;
  const zone = (g, r, base) => {
    pathGeo(g);
    ctx.fillStyle = !r ? base.fill : faded(r) ? shade(r.color, 86) : shade(r.color, 66); ctx.fill('evenodd');
    ctx.strokeStyle = !r || faded(r) ? base.stroke : shade(r.color, -5); ctx.lineWidth = r && !faded(r) ? 1 : .6; ctx.stroke();
  };
  ctx.lineJoin = 'round';
  ILLER.features.forEach(f => zone(f.geometry, regionOfIl(f.properties.ad), IL_BASE));
  ILCE.features.forEach(f => zone(f.geometry, regionOfIlce(f.properties.ad), ILCE_BASE));
  IL.features.forEach(f => { pathGeo(f.geometry); ctx.strokeStyle = '#7f8996'; ctx.lineWidth = 1.4; ctx.stroke(); });
  state.regions.forEach(r => r.areas.forEach(a => {
    ctx.beginPath(); a.latlngs.forEach((ll, i) => { const [px, py] = P(ll[0], ll[1]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath();
    ctx.globalAlpha = faded(r) ? .25 : 1; ctx.fillStyle = r.color + '40'; ctx.fill();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = shade(r.color, -20); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }));
  const osbLabels = [];
  allOsbs().forEach(o => {
    const r = regionOfOsb(o.id), col = r ? r.color : UNASSIGNED, bx = box(o.geo);
    ctx.globalAlpha = faded(r) ? .3 : 1;
    if (Math.max(bx.w, bx.h) < 7) {
      const [px, py] = P(o.lp[0], o.lp[1]);
      ctx.beginPath(); ctx.arc(px, py, 3.4, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
    } else {
      pathGeo(o.geo); ctx.fillStyle = col; ctx.globalAlpha *= .85; ctx.fill('evenodd'); ctx.globalAlpha = faded(r) ? .3 : 1;
      ctx.strokeStyle = r ? shade(col, -32) : '#7c8595'; ctx.lineWidth = .9; ctx.stroke();
      if (bx.w > 26 && !faded(r)) osbLabels.push(o);
    }
    ctx.globalAlpha = 1;
  });
  const label = (text, lat, lng, font, color, halo) => {
    const [px, py] = P(lat, lng); ctx.font = font; ctx.textAlign = 'center';
    if (halo) { ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 2.6; ctx.strokeText(text, px, py); }
    ctx.fillStyle = color; ctx.fillText(text, px, py); ctx.textAlign = 'left';
  };
  const wide = b.getEast() - b.getWest() > 4.5;
  if (wide) {
    ILLER.features.forEach(f => { if (b.contains(f.properties.lp)) label(upTR(f.properties.ad), f.properties.lp[0], f.properties.lp[1], F('600', 6.2), '#9c9282', false); });
    const c = ilBounds.getCenter(); label('ANKARA', c.lat, c.lng, F('700', 7.5), INK2, true);
  } else {
    spaced(ctx, .6);
    ILCE.features.forEach(f => { if (b.contains(f.properties.lp)) label(upTR(f.properties.ad), f.properties.lp[0], f.properties.lp[1], F('600', 7.6), '#a1978a', true); });
    ILLER.features.forEach(f => { if (b.contains(f.properties.lp)) label(upTR(f.properties.ad), f.properties.lp[0], f.properties.lp[1], F('600', 7), '#b3aa9c', true); });
    spaced(ctx, 0);
  }
  osbLabels.forEach(o => label(o.ad, o.lp[0], o.lp[1], F('700', 7.4), INK, true));
  ctx.font = F('400', 6.8); ctx.fillStyle = MUT; ctx.textAlign = 'right';
  ctx.fillText('Sınır verisi © OpenStreetMap katkıcıları · geoBoundaries', B.x + B.w - 8, B.y + B.h - 7); ctx.textAlign = 'left';
  ctx.restore();
  rr(ctx, B.x + .5, B.y + .5, B.w - 1, B.h - 1, 10); ctx.strokeStyle = '#d9dee6'; ctx.lineWidth = 1; ctx.stroke();
}

function renderPage(ctx, k, final){
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PAGE.w, PAGE.h);
  const regs = pdfRegions(), d = new Date();
  /* üst bilgi */
  ctx.fillStyle = '#F5B400'; ctx.fillRect(PM, 24, 46, 4);
  if (final) {
    let fs = BOX.title.fs; ctx.fillStyle = INK;
    do { ctx.font = F('700', fs); fs -= 1; } while (ctx.measureText(pdfTitle()).width > BOX.title.w - 10 && fs > 12);
    ctx.fillText(pdfTitle(), BOX.title.x + 5.5, 58);
  }
  ctx.font = F('400', 11); ctx.fillStyle = MUT;
  ctx.fillText(d.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }) + '  ·  ' +
    (pdfOpt.region && regs.length === 1 ? 'Bölge: ' + regs[0].name + (regs[0].rep ? ' — ' + regs[0].rep : '') : 'Tüm satış bölgeleri'), PM + 1.5, 84);
  ctx.textAlign = 'right';
  ctx.font = F('700', 9); ctx.fillStyle = MUT; spaced(ctx, 1.2); ctx.fillText('OSB SATIŞ BÖLGELERİ', PAGE.w - PM, 50); spaced(ctx, 0);
  ctx.font = F('400', 10); ctx.fillText('Ankara · organize sanayi haritası', PAGE.w - PM, 66);
  ctx.textAlign = 'left';
  ctx.fillStyle = LINE; ctx.fillRect(PM, 95, PAGE.w - 2 * PM, 1);
  /* sol, orta, sağ */
  drawOps(ctx, leftColumn(ctx));
  drawMapBox(ctx);
  drawOps(ctx, rightColumn(ctx));
  /* notlar */
  const N = BOX.notes;
  rr(ctx, N.x, N.y, N.w, N.h, 10); ctx.fillStyle = '#fbfbfc'; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.stroke();
  ctx.font = F('700', 8.6); ctx.fillStyle = MUT; spaced(ctx, 1); ctx.fillText('NOTLAR', N.x + 13, N.y + 17); spaced(ctx, 0);
  if (final) {
    const I = BOX.notesIn, notes = (state.pdf.notes || '').trim();
    ctx.font = F('400', I.fs); ctx.fillStyle = INK;
    const lines = wrapLines(ctx, notes, I.w - 12), max = Math.floor((I.h - 4) / (I.fs * 1.4));
    lines.slice(0, max).forEach((ln, i) => {
      const txt = i === max - 1 && lines.length > max ? ellipsize(ctx, ln + ' …', I.w - 12) : ln;
      ctx.fillText(txt, I.x + 5.5, I.y + 3.5 + I.fs + i * I.fs * 1.4);
    });
  }
  /* alt bilgi */
  ctx.font = F('400', 8); ctx.fillStyle = MUT;
  ctx.fillText('Oluşturulma: ' + d.toLocaleString('tr-TR', { dateStyle:'short', timeStyle:'short' }), PM, PAGE.h - 22);
}

/* Tek sayfalık, JPEG görüntülü PDF dosyasını elle yazar (dış kütüphane gerekmez). */
function makePdf(jpg, pw, ph){
  const W = 841.89, H = 595.28, enc = s => new TextEncoder().encode(s);
  const parts = [], offs = []; let len = 0;
  const push = b => { parts.push(b); len += b.length; };
  const obj = (n, fn) => { offs[n] = len; push(enc(n + ' 0 obj\n')); fn(); push(enc('\nendobj\n')); };
  push(enc('%PDF-1.4\n')); push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
  obj(1, () => push(enc('<< /Type /Catalog /Pages 2 0 R >>')));
  obj(2, () => push(enc('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')));
  obj(3, () => push(enc('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>')));
  obj(4, () => { push(enc('<< /Type /XObject /Subtype /Image /Width ' + pw + ' /Height ' + ph + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n')); push(jpg); push(enc('\nendstream')); });
  const cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q';
  obj(5, () => push(enc('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream')));
  const p2 = n => String(n).padStart(2, '0'), d = new Date();
  obj(6, () => push(enc('<< /Producer (OSB Satis Bolgeleri) /CreationDate (D:' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + ') >>')));
  const xref = len;
  let x = 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  push(enc(x + 'trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'));
  return new Blob(parts, { type:'application/pdf' });
}

function place(el, b, s){
  el.style.left = b.x * s + 'px'; el.style.top = b.y * s + 'px'; el.style.width = b.w * s + 'px'; el.style.height = b.h * s + 'px';
  if (b.fs) el.style.fontSize = b.fs * s + 'px';
}
function layoutPreview(){
  const pv = $('#pdfview'); if (pv.hidden) return;
  const st = pv.querySelector('.pv-stage'), aw = st.clientWidth - 40, ah = st.clientHeight - 40;
  const s = Math.max(.3, Math.min(aw / PAGE.w, ah / PAGE.h)), pw = Math.floor(PAGE.w * s), ph = Math.floor(PAGE.h * s);
  const pg = $('#pvPage'); pg.style.width = pw + 'px'; pg.style.height = ph + 'px';
  const cv = $('#pvCanvas'), dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(pw * dpr); cv.height = Math.round(ph * dpr);
  place($('#pvTitle'), BOX.title, s); place($('#pvNotes'), BOX.notesIn, s);
  renderPage(cv.getContext('2d'), cv.width / PAGE.w, false);
}
function openPreview(){
  stopModes(true); map.closePopup(); hl = null; restyle();
  const sel = $('#pvRegion');
  if (pdfOpt.region && !regionById(pdfOpt.region)) pdfOpt.region = '';
  if (!pdfOpt.region && selId && regionById(selId)) pdfOpt.region = selId;
  sel.innerHTML = '<option value="">Tüm bölgeler</option>' + state.regions.map(r => '<option value="' + esc(r.id) + '">' + esc(r.name) + (r.rep ? ' — ' + esc(r.rep) : '') + '</option>').join('');
  sel.value = pdfOpt.region;
  $('#pvExtent').innerHTML = EXTENTS.map(([v, t]) => '<option value="' + v + '">' + t + '</option>').join('');
  $('#pvExtent').value = pdfOpt.extent;
  $('#pvTitle').value = state.pdf.title || ''; $('#pvTitle').placeholder = 'Satış Bölgeleri Haritası';
  $('#pvNotes').value = state.pdf.notes || '';
  $('#pdfview').hidden = false;
  layoutPreview();
}
function closePreview(){ $('#pdfview').hidden = true; }
async function downloadPdf(){
  const btn = $('#pdfview [data-act="pdf-download"]'); btn.disabled = true; btn.textContent = 'Hazırlanıyor…';
  try {
    const K = 3, cv = document.createElement('canvas');
    cv.width = PAGE.w * K; cv.height = PAGE.h * K;
    renderPage(cv.getContext('2d'), K, true);
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', .92));
    const jpg = new Uint8Array(await blob.arrayBuffer());
    const regs = pdfRegions(), slug = s => s.toLocaleLowerCase('tr').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    download(makePdf(jpg, cv.width, cv.height), 'satis-bolgeleri-' + (pdfOpt.region && regs.length === 1 ? slug(regs[0].name) + '-' : '') + today() + '.pdf');
    toast('PDF indirildi');
  } catch(e) { toast('PDF oluşturulamadı', 'warn'); }
  btn.disabled = false; btn.textContent = 'PDF indir';
}
let pdfSaveT;
$('#pvTitle').addEventListener('input', e => { state.pdf.title = e.target.value; clearTimeout(pdfSaveT); pdfSaveT = setTimeout(save, 500); });
$('#pvNotes').addEventListener('input', e => { state.pdf.notes = e.target.value; clearTimeout(pdfSaveT); pdfSaveT = setTimeout(save, 500); });
$('#pvRegion').addEventListener('change', e => { pdfOpt.region = e.target.value; layoutPreview(); });
$('#pvExtent').addEventListener('change', e => { pdfOpt.extent = e.target.value; layoutPreview(); });
window.addEventListener('resize', layoutPreview);

/* ================= Eylemler ================= */
function regionFields(r){
  return [
    { key:'name', label:'Bölge adı', value:r ? r.name : '', placeholder:'ör. Batı Ankara', required:true },
    { key:'rep', label:'Satışçı', value:r ? r.rep : '', placeholder:'ör. Ahmet Yılmaz' },
    { key:'phone', label:'Telefon (isteğe bağlı)', type:'tel', value:r ? r.phone : '', placeholder:'05xx xxx xx xx' },
    { key:'color', label:'Renk', type:'color', value:r ? r.color : nextColor() }
  ];
}
function pointInLayer(p, layer){
  const ll = layer.getLatLngs(), rings = [].concat(...(Array.isArray(ll[0][0]) ? ll : [ll]));
  let inside = false;
  rings.forEach(ring => { for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (((a.lat > p.lat) !== (b.lat > p.lat)) && (p.lng < (b.lng - a.lng) * (p.lat - a.lat) / (b.lat - a.lat) + a.lng)) inside = !inside;
  }});
  return inside;
}
function guessIlce(latlngs){
  const c = L.polygon(latlngs).getBounds().getCenter(); let best = null;
  for (const ad in ilceLayers) ilceLayers[ad].eachLayer(l => { if (!best && pointInLayer(c, l)) best = ad; });
  return best || ilceNames[0];
}
const SHARE_RO = 'Sadece görüntüleme (satışçılar için)', SHARE_RW = 'Düzenlenebilir (başka bir yönetici için)';

const ACTIONS = {
  'new-region': () => openForm({ title:'Yeni satış bölgesi', desc:'Bölgeyi oluşturduktan sonra haritada illere, ilçelere ve OSB\'lere tıklayarak ekleyebilirsiniz.', fields:regionFields(), ok:'Oluştur ve haritadan seç',
    onOk: v => { const r = { id:uid('r'), name:v.name, rep:v.rep, phone:v.phone, color:v.color || nextColor(), iller:[], ilceler:[], osbIds:[], areas:[] };
      state.regions.push(r); save(); rebuild(); startAssign(r.id); } }),
  'open-region': (id) => { map.closePopup(); selectRegion(id); const r = regionById(id); if (r) flyTo(regionBounds(r), 13); },
  'back': () => { if (mode === 'assign') stopModes(true); selId = null; renderSide(); restyle(); },
  'edit-region': () => { const r = regionById(selId); if (!r) return;
    openForm({ title:'Bölgeyi düzenle', fields:regionFields(r), onOk: v => { Object.assign(r, { name:v.name, rep:v.rep, phone:v.phone, color:v.color || r.color }); save(); rebuild(); renderSide(); toast('Bölge güncellendi'); } }); },
  'del-region': () => { const r = regionById(selId); if (!r) return;
    confirmBox('Bölge silinsin mi?', '<b>' + esc(r.name) + '</b> silinecek. İçindeki iller, ilçeler ve OSB\'ler “atanmamış” olur, ' + r.areas.length + ' müşteri alanı da silinir.', 'Sil',
      () => { stopModes(true); state.regions = state.regions.filter(x => x.id !== r.id); selId = null; save(); rebuild(); renderSide(); toast('Bölge silindi'); }); },
  'zoom-region': () => { const r = regionById(selId); const b = r && regionBounds(r); b ? flyTo(b, 13) : toast('Bu bölgede henüz il, ilçe, OSB ya da alan yok'); },
  'assign': () => startAssign(selId),
  'done': () => { stopModes(); restyle(); },
  'unassign': (id) => { const r = explicitRegionOfOsb(id), o = osbById(id); if (!r) return; r.osbIds = r.osbIds.filter(x => x !== id); save(); refresh(); toast(o.ad + ' bölgeden çıkarıldı'); },
  'unassign-zone': (ad, el) => { const il = el.dataset.kind === 'il', r = il ? regionOfIl(ad) : regionOfIlce(ad); if (!r) return;
    const key = il ? 'iller' : 'ilceler'; r[key] = r[key].filter(x => x !== ad); save(); refresh(); toast(ad + (il ? ' ili' : ' ilçesi') + ' bölgeden çıkarıldı'); },
  'assign-to': (id, el) => { const r = regionById(el.dataset.rid); if (!r) return;
    const kind = el.dataset.kind;
    if (kind === 'ilce' || kind === 'il') { const key = kind === 'il' ? 'iller' : 'ilceler', cur = kind === 'il' ? regionOfIl(id) : regionOfIlce(id);
      if (cur) cur[key] = cur[key].filter(x => x !== id); r[key].push(id); toast(id + ' → ' + r.name); }
    else { const o = osbById(id); if (!o) return; const cur = explicitRegionOfOsb(id); if (cur) cur.osbIds = cur.osbIds.filter(x => x !== id); r.osbIds.push(id); toast(o.ad + ' → ' + r.name); }
    save(); map.closePopup(); refresh(); selectRegion(r.id); },
  'fly-osb': (id) => { const x = osbLayers[id]; if (!x) return; flyTo(x.poly.getBounds(), 14); flash({ osb:id }); },
  'fly-ilce': (ad) => { const l = ilceLayers[ad]; if (!l) return; flyTo(l.getBounds(), 11); flash({ ilce:ad }); },
  'fly-il': (ad) => { const l = ilLayers[ad]; if (!l) return; flyTo(l.getBounds(), 9); flash({ il:ad }); },
  'fly-area': (id) => { const x = areaLayers[id]; if (x) { flyTo(x.l.getBounds(), 15); flash({ area:id }); } },
  'draw-area': () => { const r = regionById(selId); if (!r) return;
    startDraw('<b>' + esc(r.name) + '</b> için müşteri alanı çizin.', (pts, clear) => {
      openForm({ title:'Müşteri alanını adlandır', fields:[{ key:'name', label:'Alan adı', placeholder:'ör. Şaşmaz Sanayi Sitesi', required:true }, { key:'note', label:'Not (isteğe bağlı)', type:'textarea', placeholder:'ör. müşteri adları, adres…' }],
        onOk: v => { clear(); r.areas.push({ id:uid('a'), name:v.name, note:v.note, latlngs:pts }); save(); rebuild(); renderSide(); toast('Müşteri alanı eklendi'); },
        onCancel: () => { clear(); renderSide(); toast('Çizim iptal edildi'); } });
    }); },
  'edit-area': (id) => { const f = findArea(id); if (!f) return;
    openForm({ title:'Müşteri alanını düzenle', fields:[{ key:'name', label:'Alan adı', value:f.a.name, required:true }, { key:'note', label:'Not', type:'textarea', value:f.a.note }],
      onOk: v => { f.a.name = v.name; f.a.note = v.note; save(); rebuild(); renderSide(); } }); },
  'del-area': (id) => { const f = findArea(id); if (!f) return;
    confirmBox('Alan silinsin mi?', '<b>' + esc(f.a.name) + '</b> müşteri alanı silinecek.', 'Sil', () => { f.r.areas = f.r.areas.filter(a => a.id !== id); save(); rebuild(); renderSide(); }); },
  'new-osb': () => startDraw('Listede olmayan OSB\'nin sınırını çizin.', (pts, clear) => {
      openForm({ title:'Yeni OSB', fields:[{ key:'ad', label:'OSB adı', placeholder:'ör. Polatlı OSB', required:true }, { key:'ilce', label:'İlçe', type:'select', options:ilceNames, value:guessIlce(pts) }],
        onOk: v => { clear(); const c = L.polygon(pts).getBounds().getCenter();
          state.extraOsbs.push({ id:uid('u'), ad:v.ad, tamAd:v.ad, ilce:v.ilce, lp:[c.lat, c.lng], geo:L.polygon(pts).toGeoJSON().geometry });
          save(); rebuild(); tab = 'osbs'; renderSide(); toast('OSB eklendi'); },
        onCancel: () => { clear(); renderSide(); toast('Çizim iptal edildi'); } });
    }),
  'del-osb': (id) => { const o = osbById(id); if (!o || !o.custom) return;
    confirmBox('OSB silinsin mi?', '<b>' + esc(o.ad) + '</b> haritadan kaldırılacak.', 'Sil', () => {
      state.extraOsbs = state.extraOsbs.filter(x => x.id !== id); state.regions.forEach(r => r.osbIds = r.osbIds.filter(x => x !== id)); save(); rebuild(); renderSide(); }); },
  'tab-osbs': () => { tab = 'osbs'; renderSide(); },
  'cancel': () => { stopModes(); toast('Çizim iptal edildi'); },
  'fit-all': () => map.flyToBounds(ilBounds, { padding:[20,20], duration:.7 }),
  'fit-core': () => flyTo(coreBounds(), 12),
  'fit-tr': () => map.flyToBounds(trBounds, { padding:[16,16], duration:.8 }),
  'pdf-open': () => openPreview(),
  'pdf-close': () => closePreview(),
  'pdf-download': () => downloadPdf(),
  'share': () => openForm({ title:'Paylaşım kopyası', ok:'Kopyayı indir',
    desc:'Bölgeleriniz dosyanın içine gömülür ve <b>tek bir dosya</b> iner. O dosyayı başka bir bilgisayara kopyalayın ya da gönderin; çift tıklanınca harita sizin bıraktığınız haliyle açılır. İnternet, kurulum ya da sunucu gerekmez.',
    fields:[{ key:'kind', label:'Kopya türü', type:'select', options:[SHARE_RO, SHARE_RW], value:SHARE_RO }],
    onOk: v => { const ro = v.kind !== SHARE_RW, html = buildShare(ro);
      if (!html) { toast('Kopya oluşturulamadı; “Yedek indir” kullanın', 'warn'); return; }
      download(new Blob([html], { type:'text/html;charset=utf-8' }), 'OSB-Satis-Bolgeleri-' + (ro ? 'goruntuleme-' : '') + today() + '.html');
      toast('Paylaşım kopyası indirildi'); } }),
  'export-json': () => { download(new Blob([JSON.stringify(state, null, 2)], { type:'application/json' }), 'satis-bolgeleri-' + today() + '.json'); toast('Yedek indirildi'); },
  'import-json': () => $('#importFile').click(),
  'export-csv': () => {
    const rows = [['Bölge', 'Satışçı', 'Telefon', 'Tür', 'Ad', 'İlçe / Not']];
    state.regions.forEach(r => {
      r.iller.slice().sort(trCmp).forEach(ad => rows.push([r.name, r.rep, r.phone, 'İl', ad, '']));
      r.ilceler.slice().sort(trCmp).forEach(ad => rows.push([r.name, r.rep, r.phone, 'İlçe (Ankara)', ad, '']));
      regionOsbs(r).forEach(x => rows.push([r.name, r.rep, r.phone, 'OSB', x.o.ad, (x.o.ilce || '') + (x.viaIlce ? ' (ilçeyle birlikte)' : '')]));
      r.areas.forEach(a => rows.push([r.name, r.rep, r.phone, 'Müşteri alanı', a.name, a.note]));
    });
    ilceNames.filter(ad => !regionOfIlce(ad)).forEach(ad => rows.push(['(atanmamış)', '', '', 'İlçe (Ankara)', ad, '']));
    allOsbs().filter(o => !regionOfOsb(o.id)).forEach(o => rows.push(['(atanmamış)', '', '', 'OSB', o.ad, o.ilce]));
    const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    download(new Blob([csv], { type:'text/csv;charset=utf-8' }), 'satis-bolgeleri-' + today() + '.csv'); toast('Excel listesi indirildi');
  }
};
const EDIT_ACTS = ['new-region','edit-region','del-region','assign','unassign','unassign-zone','assign-to','draw-area','edit-area','del-area','new-osb','del-osb','import-json','share'];

$('#importFile').onchange = async e => {
  const file = e.target.files[0]; e.target.value = ''; if (!file || RO) return;
  try {
    const data = JSON.parse(await file.text());
    if (!valid(data)) throw new Error();
    confirmBox('Yedek yüklensin mi?', 'Mevcut bölgelerin yerine dosyadaki <b>' + data.regions.length + ' bölge</b> yüklenecek.', 'Yükle', () => {
      stopModes(true); state = normalize(data); selId = null; save(); rebuild(); renderSide(); toast('Yedek yüklendi'); });
  } catch(_) { toast('Dosya okunamadı. Bu uygulamanın yedek dosyası olduğundan emin olun.', 'warn'); }
};

document.addEventListener('click', e => {
  const tb = e.target.closest('.tabs button');
  if (tb) { tab = tb.dataset.tab; renderSide(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const fn = ACTIONS[b.dataset.act]; if (!fn || (RO && EDIT_ACTS.includes(b.dataset.act))) return;
  e.preventDefault(); e.stopPropagation(); fn(b.dataset.id, b);
});
document.addEventListener('keydown', e => {
  if ($('#modal').classList.contains('show')) { if (e.key === 'Escape') $('#modal [data-m=cancel]').click(); return; }
  if (!$('#pdfview').hidden) { if (e.key === 'Escape') closePreview(); return; }
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'Escape' && mode !== 'view') { stopModes(); restyle(); }
});

/* ================= Başlat ================= */
map.fitBounds(ilBounds, { padding:[20,20] });
rebuild();
renderSide();
if (RO) $('#saveState').textContent = 'Salt okunur kopya · ' + new Date(seed.exportedAt || Date.now()).toLocaleDateString('tr-TR') + ' tarihli';
else if (seededNow) { if (writeLocal()) $('#saveState').textContent = 'Paylaşım kopyasındaki bölgeler yüklendi'; else markUnsaved(); }
else if (!storageOk) markUnsaved();
window.__app = { get state(){ return state; }, map, ACTIONS, buildShare, RO, renderPage, makePdf, pdfOpt };
})();
