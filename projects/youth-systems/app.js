(function () {
  'use strict';
  var D = window.YS, FL = window.YS_FLAGS, NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, attrs, text) { var e = document.createElement(tag); for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }
  function sv(tag, attrs, text) { var e = document.createElementNS(NS, tag); for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }
  var dark = !window.matchMedia || !window.matchMedia('(prefers-color-scheme: light)').matches;
  var PAL = dark ? ['#f2b632', '#62a8e5', '#e5707e', '#59b88c', '#a98be0', '#e39a4f', '#4fc1c9', '#c9d3e0'] : ['#9a6500', '#1f6fb5', '#c0384a', '#2e8b64', '#7a55c2', '#b8651a', '#18909b', '#4f5d70'];
  var N = {}; D.nations.forEach(function (n) { N[n.name] = n; });
  var COLOR = {}; D.nations.slice().sort(function (a, b) { return b.first - a.first; }).forEach(function (n, i) { COLOR[n.name] = PAL[i % PAL.length]; });
  var state = { measure: 'trained', hl: '', pins: true };

  /* ---------- flags ---------- */
  function flag(name, h) {
    var n = N[name], k = n && n.a2, s = k && FL[k];
    var w = Math.round((h || 15) * 4 / 3);
    if (!s) { var c = el('span', { class: 'flagfb' }, (n ? n.code : String(name).slice(0, 3).toUpperCase()).slice(0, 2)); c.style.width = w + 'px'; c.style.height = (h || 15) + 'px'; return c; }
    var i = el('img', { alt: '', width: w, height: h || 15, class: 'flag', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(s) });
    return i;
  }
  function tag(name) { var s = el('span', { class: 'nat' }); s.appendChild(flag(name)); s.appendChild(el('b', null, N[name] ? N[name].code : String(name).slice(0, 3).toUpperCase())); return s; }

  /* ---------- measures ---------- */
  var MEAS = { trained: ['Trained in', 'Players placed by the country of the club they were at by age 15'], first: ['First youth team', 'Players by the first national youth team they played for'], final: ['Final nation', 'Players by the nation they play for today'], hit: ['Hit rate', 'Share of youth-Euro squad players who became elite (%)'] };
  function val(n, m) { return m === 'hit' ? n.hit : n[m]; }
  function fmt(v, m) { return v == null ? 'n/a' : (m === 'hit' ? v.toFixed(1) + '%' : String(v)); }

  /* ---------- tooltip ---------- */
  var tip = el('div', { class: 'tip' }); document.body.appendChild(tip);
  function showTip(ev, nodes) {
    tip.textContent = ''; nodes.forEach(function (n) { tip.appendChild(n); });
    tip.style.opacity = 1; var w = tip.offsetWidth, x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + w > window.innerWidth - 8) x = ev.clientX - w - 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.style.opacity = 0; }
  function line(text, bold) { var d = el('div', { class: bold ? 'tl b' : 'tl' }); d.textContent = text; return d; }

  /* ---------- measure switch (shared) ---------- */
  function switchBar(box, onChange) {
    box.textContent = '';
    Object.keys(MEAS).forEach(function (k) {
      var b = el('button', { type: 'button', class: 'seg' + (state.measure === k ? ' on' : ''), 'aria-pressed': state.measure === k }, MEAS[k][0]);
      b.onclick = function () { state.measure = k; renderAll(); };
      box.appendChild(b);
    });
  }

  /* ---------- map ---------- */
  var ATLAS = { 'United Kingdom': 'England', 'Czechia': 'Czech Republic', 'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Macedonia': 'North Macedonia' };
  function renderMap() {
    var box = $('#map'); box.textContent = '';
    var m = state.measure, vals = D.nations.map(function (n) { return val(n, m); }).filter(function (v) { return v != null; });
    var max = Math.max.apply(null, vals) || 1;
    var svg = sv('svg', { viewBox: '0 0 ' + D.map.w + ' ' + D.map.h, role: 'img', 'aria-label': 'Map of Europe shaded by ' + MEAS[m][0] });
    var sea = sv('rect', { width: D.map.w, height: D.map.h, class: 'sea' }); svg.appendChild(sea);
    Object.keys(D.map.paths).forEach(function (cn) {
      var nn = ATLAS[cn] || cn, n = N[nn], v = n ? val(n, m) : null;
      var p = sv('path', { d: D.map.paths[cn], class: 'ctry' + (n && n.name === state.hl ? ' hl' : '') });
      if (v != null) { p.style.fill = 'color-mix(in srgb, var(--accent) ' + Math.round(14 + 78 * Math.sqrt(v / max)) + '%, var(--land))'; }
      p.addEventListener('mousemove', function (ev) {
        var nodes = [line(cn === 'United Kingdom' ? 'United Kingdom (shaded with England)' : cn, true)];
        if (n) { var r = el('div', { class: 'tl' }); r.appendChild(tag(n.name)); nodes[0] = r; nodes.push(line(MEAS[m][0] + ': ' + fmt(v, m))); if (m !== 'hit') nodes.push(line('Net: ' + (n.net > 0 ? '+' : '') + n.net)); }
        else nodes.push(line('Not in the sample'));
        showTip(ev, nodes);
      });
      p.addEventListener('mouseleave', hideTip);
      svg.appendChild(p);
    });
    if (state.pins) D.pins.forEach(function (c) {
      var r = 2.6 + 2.1 * Math.sqrt(c.n), k = el('span'); void k;
      var ci = sv('circle', { cx: c.x, cy: c.y, r: r, class: 'pin' });
      ci.addEventListener('mousemove', function (ev) { showTip(ev, [line(c.club, true), line(c.country + ' | ' + c.n + (c.n === 1 ? ' player' : ' players') + ' at the club by age 15'), line(c.names.join(', '))]); });
      ci.addEventListener('mouseleave', hideTip);
      svg.appendChild(ci);
    });
    box.appendChild(svg);
    var lg = $('#maplegend'); lg.textContent = '';
    lg.appendChild(el('span', null, '0'));
    var bar = el('i', { class: 'lgbar' }); lg.appendChild(bar);
    lg.appendChild(el('span', null, fmt(max, m)));
    lg.appendChild(el('span', { class: 'lgnote' }, MEAS[m][1] + '. Grey: no data. Dots: clubs, sized by players at the club by age 15.'));
  }

  /* ---------- ranking bars ---------- */
  function renderRank() {
    var m = state.measure, box = $('#rank'); box.textContent = '';
    var rows = D.nations.filter(function (n) { return val(n, m) != null; }).sort(function (a, b) { return val(b, m) - val(a, m); }).slice(0, 15);
    var max = Math.max.apply(null, rows.map(function (n) { return val(n, m); })) || 1;
    rows.forEach(function (n) {
      var r = el('button', { type: 'button', class: 'bar' + (n.name === state.hl ? ' hl' : '') });
      r.appendChild(tag(n.name));
      var t = el('div', { class: 'bt' }); var f = el('div', { class: 'bf' }); f.style.width = Math.max(1.5, 100 * val(n, m) / max) + '%'; f.style.background = COLOR[n.name] || 'var(--bar)'; t.appendChild(f); r.appendChild(t);
      r.appendChild(el('b', null, fmt(val(n, m), m)));
      r.onclick = function () { state.hl = state.hl === n.name ? '' : n.name; $('#hl').value = state.hl; renderAll(); };
      box.appendChild(r);
    });
    $('#rankhead').textContent = MEAS[m][0] + ': top ' + rows.length;
    $('#ranknote').textContent = MEAS[m][1] + (m === 'hit' ? '. Only nations with at least 60 youth-Euro squad players.' : '.');
  }

  /* ---------- net (diverging) ---------- */
  function renderNet() {
    var box = $('#net'); box.textContent = '';
    var rows = D.nations.filter(function (n) { return n.trained + n.final >= 6; }).sort(function (a, b) { return b.net - a.net; });
    var mx = Math.max.apply(null, rows.map(function (n) { return Math.abs(n.net); })) || 1;
    rows.forEach(function (n) {
      var r = el('div', { class: 'nrow' + (n.name === state.hl ? ' hl' : '') }); r.appendChild(tag(n.name));
      var t = el('div', { class: 'nt' }), f = el('div', { class: 'nf ' + (n.net >= 0 ? 'pos' : 'neg') }); f.style.width = (50 * Math.abs(n.net) / mx) + '%';
      if (n.net >= 0) f.style.left = '50%'; else f.style.right = '50%'; t.appendChild(f); t.appendChild(el('i', { class: 'axis' })); r.appendChild(t);
      r.appendChild(el('b', null, (n.net > 0 ? '+' : '') + n.net)); box.appendChild(r);
    });
  }

  /* ---------- line charts ---------- */
  function lines(box, labels, series, o) {
    box.textContent = '';
    var W = Math.max(300, box.clientWidth || 720), H = Math.round(Math.min(360, Math.max(250, W * 0.46))), m = { t: 14, r: 52, b: 30, l: 44 };
    var all = []; series.forEach(function (s) { s.vals.forEach(function (v) { if (v != null) all.push(v); }); });
    var rawlo = o.min != null ? o.min : Math.min.apply(null, all), rawhi = Math.max.apply(null, all) + (o.pad || 0);
    var span = (rawhi - rawlo) || 1, mag = Math.pow(10, Math.floor(Math.log(span / 4) / Math.LN10)), stp = [1, 2, 2.5, 5, 10].map(function (k) { return k * mag; }).filter(function (v) { return v >= span / 5.5; })[0] || 10 * mag;
    var lo = Math.floor(rawlo / stp) * stp, hi = Math.ceil(rawhi / stp) * stp;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': o.label });
    var x = function (i) { return m.l + i * (W - m.l - m.r) / (labels.length - 1); }, y = function (v) { return H - m.b - (v - lo) / (hi - lo || 1) * (H - m.t - m.b); };
    for (var gv = lo; gv <= hi + 1e-9; gv += stp) { svg.appendChild(sv('line', { x1: m.l, x2: W - m.r, y1: y(gv), y2: y(gv), class: 'grid' })); svg.appendChild(sv('text', { x: m.l - 8, y: y(gv) + 4, 'text-anchor': 'end', class: 'ax' }, (stp < 1 ? gv.toFixed(1) : Math.round(gv * 10) / 10) + (o.unit || ''))); }
    labels.forEach(function (l, i) { if (W < 480 && labels.length > 4 && i % 2) return; svg.appendChild(sv('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'ax' }, l)); });
    var ends = [];
    series.forEach(function (s) {
      var dim = state.hl && s.name !== state.hl && !s.ref, pts = [];
      s.vals.forEach(function (v, i) { if (v != null) pts.push([x(i), y(v), v, i]); });
      if (!pts.length) return;
      var path = sv('path', { d: 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L'), fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      path.style.stroke = s.color; path.style.strokeWidth = s.name === state.hl ? 4 : (s.ref ? 2 : 2.4); path.style.opacity = dim ? 0.22 : 1; if (s.ref) path.setAttribute('stroke-dasharray', '5 5'); svg.appendChild(path);
      if (!s.ref) pts.forEach(function (p) { var c = sv('circle', { cx: p[0], cy: p[1], r: s.name === state.hl ? 4.5 : 3 }); c.style.fill = s.color; c.style.opacity = dim ? 0.22 : 1; svg.appendChild(c); });
      var last = pts[pts.length - 1]; ends.push({ y: last[1], s: s, dim: dim });
    });
    ends.sort(function (a, b) { return a.y - b.y; }); for (var i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    ends.forEach(function (e) { var t = sv('text', { x: W - m.r + 8, y: e.y + 4, class: 'ax end' + (e.s.name === state.hl ? ' strong' : '') }, e.s.ref ? 'Field' : (N[e.s.name] ? N[e.s.name].code : e.s.name)); t.style.opacity = e.dim ? 0.3 : 1; svg.appendChild(t); });
    var rule = sv('line', { y1: m.t, y2: H - m.b, class: 'rule' }); rule.style.opacity = 0; svg.appendChild(rule);
    var hit = sv('rect', { x: m.l - 10, y: 0, width: W - m.l - m.r + 20, height: H, fill: 'transparent' });
    hit.addEventListener('mousemove', function (ev) {
      var rc = svg.getBoundingClientRect(), px = (ev.clientX - rc.left) / rc.width * W, best = 0;
      labels.forEach(function (l, i) { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
      rule.setAttribute('x1', x(best)); rule.setAttribute('x2', x(best)); rule.style.opacity = 1;
      var rows = series.filter(function (s) { return s.vals[best] != null; }).sort(function (a, b) { return b.vals[best] - a.vals[best]; });
      showTip(ev, [line(labels[best], true)].concat(rows.map(function (s) { var d = el('div', { class: 'tl' }); var dot = el('i', { class: 'dot' }); dot.style.background = s.color; d.appendChild(dot); d.appendChild(document.createTextNode((s.ref ? 'Field average' : (N[s.name] ? N[s.name].code : s.name)) + ': ' + (o.dec ? s.vals[best].toFixed(1) : s.vals[best]) + (o.unit || ''))); return d; })));
    });
    hit.addEventListener('mouseleave', function () { rule.style.opacity = 0; hideTip(); });
    svg.appendChild(hit); box.appendChild(svg);
  }
  function renderLines() {
    lines($('#coh'), D.cohorts.labels, D.cohorts.series.map(function (s) { return { name: s.name, vals: s.vals, color: COLOR[s.name] }; }), { unit: '%', dec: true, min: 0, pad: 2, label: 'Share of each birth cohort by first youth team' });
    ['By age 23', 'By age 21'].forEach(function (k, i) {
      var e = D.early[k]; if (!e) return;
      lines($(i ? '#e21' : '#e23'), e.cohorts, e.series.map(function (s) { return { name: s.name, vals: s.vals, color: COLOR[s.name] }; }), { min: 0, pad: 2, label: 'Players reaching the top-100 rating tier ' + k.toLowerCase() });
    });
    var S = D.squads, show = D.nations.slice().sort(function (a, b) { return b.first - a.first; }).map(function (n) { return S.teams.find(function (t) { return t.name === n.name && t.age.filter(function (v) { return v != null; }).length >= 5; }); }).filter(Boolean).slice(0, 8);
    if (state.hl) { var h = S.teams.find(function (t) { return t.name === state.hl; }); if (h && show.indexOf(h) < 0) show.push(h); }
    lines($('#age'), S.tours, show.map(function (t) { return { name: t.name, vals: t.age, color: COLOR[t.name] || PAL[7] }; }).concat([{ name: 'Field', ref: true, vals: S.field.age, color: 'var(--muted)' }]), { dec: true, pad: 0.4, min: 24, label: 'Mean squad age at each tournament' });
    lines($('#u23'), S.tours, show.map(function (t) { return { name: t.name, vals: t.u23, color: COLOR[t.name] || PAL[7] }; }).concat([{ name: 'Field', ref: true, vals: S.field.u23, color: 'var(--muted)' }]), { unit: '%', dec: true, min: 0, pad: 3, label: 'Share of squad aged under 23' });
  }

  /* ---------- hit table ---------- */
  function renderHit() {
    var tb = $('#hit tbody'); tb.textContent = '';
    D.nations.filter(function (n) { return n.hit != null; }).sort(function (a, b) { return b.hit - a.hit; }).forEach(function (n) {
      var tr = el('tr', n.name === state.hl ? { class: 'hl' } : {}); var td = el('td'); td.appendChild(tag(n.name)); tr.appendChild(td);
      [n.entrants, n.elite, n.hit.toFixed(1) + '%', n.hit_early == null ? '-' : n.hit_early + '%', n.hit_late == null ? '-' : n.hit_late + '%'].forEach(function (v) { tr.appendChild(el('td', null, v)); });
      tb.appendChild(tr);
    });
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var box = $('#kpis'); box.textContent = '';
    function top(m) { return D.nations.filter(function (n) { return val(n, m) != null; }).sort(function (a, b) { return val(b, m) - val(a, m); }); }
    [['Most elite players trained', top('trained')[0], 'trained'], ['Highest hit rate from youth-Euro squads', top('hit')[0], 'hit'], ['Largest net exporter of trained talent', D.nations.slice().sort(function (a, b) { return b.net - a.net; })[0], 'net']].forEach(function (k) {
      var c = el('div', { class: 'card kpi' }); c.appendChild(el('span', { class: 'lbl' }, k[0]));
      var big = el('span', { class: 'big' }); big.appendChild(flag(k[1].name, 26)); big.appendChild(document.createTextNode(' ' + k[1].code)); c.appendChild(big);
      c.appendChild(el('span', { class: 'sub' }, k[2] === 'net' ? ('+' + k[1].net + ' more trained there than play for the nation') : k[2] === 'hit' ? (k[1].hit.toFixed(1) + '% of ' + k[1].entrants + ' squad players') : (k[1].trained + ' of ' + D.meta.sample + ' players')));
      box.appendChild(c);
    });
  }

  /* ---------- player cards ---------- */
  var dlg = $('#card');
  function mono(name) { return name.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
  function photoBox(p, size) {
    var box = el('div', { class: 'ph' + (size ? ' ' + size : '') }); box.appendChild(el('span', { class: 'mono' }, mono(p.n)));
    if (p.photo) { var im = el('img', { alt: p.n, loading: 'lazy', src: 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(p.photo[0]) + '?width=' + (size === 'sm' ? 160 : 420) }); im.onerror = function () { im.remove(); }; box.appendChild(im); }
    return box;
  }
  function mvChart(mv) {
    var W = 360, H = 110, svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Market value over time' });
    var ys = mv.map(function (d) { return d[0]; }), vs = mv.map(function (d) { return d[1]; }), mxv = Math.max.apply(null, vs);
    var x = function (y) { return 8 + (y - ys[0]) / ((ys[ys.length - 1] - ys[0]) || 1) * (W - 70); }, yy = function (v) { return H - 18 - v / mxv * (H - 34); };
    var pth = sv('path', { d: 'M' + mv.map(function (d) { return x(d[0]).toFixed(1) + ',' + yy(d[1]).toFixed(1); }).join('L'), fill: 'none', class: 'mvl' }); svg.appendChild(pth);
    svg.appendChild(sv('text', { x: 8, y: H - 3, class: 'ax' }, String(ys[0]))); svg.appendChild(sv('text', { x: W - 62, y: H - 3, class: 'ax', 'text-anchor': 'end' }, String(ys[ys.length - 1])));
    var pk = mv.reduce(function (a, b) { return b[1] > a[1] ? b : a; }); svg.appendChild(sv('circle', { cx: x(pk[0]), cy: yy(pk[1]), r: 3.5, class: 'mvd' }));
    svg.appendChild(sv('text', { x: W - 4, y: yy(vs[vs.length - 1]) + 4, class: 'ax strong', 'text-anchor': 'end' }, '€' + vs[vs.length - 1] + 'm'));
    return { svg: svg, peak: pk };
  }
  function openCard(p) {
    var c = $('#cardbody'); c.textContent = '';
    var head = el('div', { class: 'chead' }); head.appendChild(photoBox(p));
    var id = el('div', { class: 'cid' });
    var t = el('div', { class: 'ctag' }); t.appendChild(tag(p.nat)); t.appendChild(el('span', { class: 'sep' }, ({ G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Forward' })[p.pos] || 'Player')); if (p.by) t.appendChild(el('span', { class: 'sep' }, 'Born ' + p.by)); id.appendChild(t);
    id.appendChild(el('h3', { id: 'cardname' }, p.n));
    var tiles = el('div', { class: 'tiles' });
    [['Rating rank', p.rk != null ? '#' + p.rk : '-'], ['Score', p.sc != null ? p.sc.toFixed(1) : '-'], ['Seasons in top 100', p.sd], ['Best season rating', p.br ? p.br.toFixed(2) : '-'], ['Caps / goals', p.caps + ' / ' + p.goals], ["Ballon d'Or top 30", p.bd ? p.bd[1] + (p.bd[1] === 1 ? ' time' : ' times') : '-']].forEach(function (x) { var d = el('div', { class: 'tile' }); d.appendChild(el('b', null, x[1])); d.appendChild(el('span', null, x[0])); tiles.appendChild(d); });
    id.appendChild(tiles); head.appendChild(id); c.appendChild(head);
    var cols = el('div', { class: 'ccols' });
    var yc = el('div', { class: 'cbox' }); yc.appendChild(el('h4', null, 'Youth path'));
    var sum = el('p', { class: 'note' }); sum.appendChild(document.createTextNode('First youth team: ')); sum.appendChild(p.first ? tag(p.first) : document.createTextNode('-')); sum.appendChild(document.createTextNode('   Trained in: ')); sum.appendChild(p.tc ? tag(p.tc) : document.createTextNode('unknown')); yc.appendChild(sum);
    if (p.path.length) { var ol = el('ol', { class: 'path' }); p.path.forEach(function (r) { var li = el('li'); if (r[2]) li.appendChild(flag(r[2], 12)); li.appendChild(el('span', null, ' ' + r[0])); li.appendChild(el('em', null, r[1])); ol.appendChild(li); }); yc.appendChild(ol); } else yc.appendChild(el('p', { class: 'note' }, 'No youth clubs listed on Wikipedia.'));
    cols.appendChild(yc);
    var mc = el('div', { class: 'cbox' }); mc.appendChild(el('h4', null, 'Market value'));
    if (p.mv && p.mv.length > 1) { var ch = mvChart(p.mv); mc.appendChild(ch.svg); mc.appendChild(el('p', { class: 'note' }, 'Peak €' + ch.peak[1] + 'm in ' + ch.peak[0] + '. Estimates from FotMob.')); } else mc.appendChild(el('p', { class: 'note' }, 'No market-value history matched.'));
    cols.appendChild(mc); c.appendChild(cols);
    var cr = el('p', { class: 'credit' });
    if (p.photo) { cr.appendChild(document.createTextNode('Photo: ' + (p.photo[2] || 'unknown author') + ', ' + (p.photo[1] || 'see licence') + ', via ')); var a = el('a', { href: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(p.photo[0].replace(/ /g, '_')), target: '_blank', rel: 'noopener' }, 'Wikimedia Commons'); cr.appendChild(a); cr.appendChild(document.createTextNode('. Loaded live; some photos may not show if Commons is unreachable.')); }
    else cr.appendChild(document.createTextNode('No free-licence photo on Wikimedia Commons for this player.'));
    c.appendChild(cr);
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  }
  function renderPlayers() {
    var q = $('#psearch').value.trim().toLowerCase(), nat = state.hl;
    var list = D.players.filter(function (p) { return (!q || p.n.toLowerCase().indexOf(q) >= 0) && (!nat || p.nat === nat); }).sort(function (a, b) { return (a.rk || 9999) - (b.rk || 9999); });
    var box = $('#pgrid'); box.textContent = '';
    list.slice(0, 12).forEach(function (p) {
      var b = el('button', { type: 'button', class: 'pc' }); b.appendChild(photoBox(p, 'sm'));
      var t = el('div', { class: 'pt' }); t.appendChild(el('b', null, p.n)); var s = el('span'); s.appendChild(tag(p.nat)); s.appendChild(document.createTextNode(' #' + p.rk)); t.appendChild(s); b.appendChild(t);
      b.onclick = function () { openCard(p); }; box.appendChild(b);
    });
    $('#pcount').textContent = list.length > 12 ? 'Showing the top 12 of ' + list.length + ' players. Search to narrow down.' : list.length + (list.length === 1 ? ' player' : ' players');
  }

  /* ---------- global ---------- */
  function renderAll() {
    switchBar($('#sw1')); switchBar($('#sw2'));
    renderMap(); renderRank(); renderNet(); renderLines(); renderHit(); renderPlayers();
  }
  var sel = $('#hl'); sel.appendChild(el('option', { value: '' }, 'No highlight'));
  D.nations.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).forEach(function (n) { sel.appendChild(el('option', { value: n.name }, n.name + ' (' + n.code + ')')); });
  sel.onchange = function () { state.hl = sel.value; renderAll(); };
  $('#pins').onchange = function (e) { state.pins = e.target.checked; renderMap(); };
  $('#psearch').oninput = renderPlayers;
  $('#cclose').onclick = function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); };
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(renderLines, 150); });
  $('#updated').textContent = D.meta.updated;
  renderKpis(); renderAll();
})();
