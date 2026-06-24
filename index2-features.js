/* V2Ray Config Maker — extended features (loaded after index2.html inline script) */
'use strict';

// ── Theme & Language ─────────────────────────────
function toggleTheme() {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.getElementById('themeToggle').textContent = dark ? '☀️' : '🌙';
  saveSettings();
}
function toggleLang() {
  const en = document.documentElement.lang !== 'en';
  document.documentElement.lang = en ? 'en' : 'fa';
  document.documentElement.dir = en ? 'ltr' : 'rtl';
  document.getElementById('langToggle').textContent = en ? 'FA' : 'EN';
  saveSettings();
}

// ── Subscription import ────────────────────────────
function openImportSubModal() {
  document.getElementById('importSubModal').classList.remove('hidden');
}
function closeImportSubModal() {
  document.getElementById('importSubModal').classList.add('hidden');
}
function decodeSubscriptionContent(raw) {
  let text = raw.trim();
  if (text.startsWith('http')) {
    throw new Error('لینک subscription را در مرورگر باز کنید و محتوا را paste کنید');
  }
  try {
    const decoded = decodeURIComponent(escape(atob(text.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/'))));
    if (decoded.includes('://')) return decoded;
  } catch { /* not base64 */ }
  return text;
}
function extractLinksFromText(text) {
  const re = /(vmess|vless|trojan|ss|hysteria2|hy2|tuic):\/\/[^\s'"<>]+/gi;
  return [...text.matchAll(re)].map(m => m[0]);
}
function doImportSubscription() {
  const raw = document.getElementById('importSubInput').value.trim();
  if (!raw) { toast('محتوا خالی است', 'err'); return; }
  try {
    const text = decodeSubscriptionContent(raw);
    const links = extractLinksFromText(text);
    if (!links.length) { toast('لینکی یافت نشد', 'err'); return; }
    document.getElementById('configInput').value = links.join('\n');
    closeImportSubModal();
    toast(`${links.length} لینک استخراج شد ✓`, 'ok');
    if (links.length === 1) parseConfig();
  } catch (e) { toast(e.message, 'err'); }
}

// ── Extra protocol parsers ─────────────────────────
function parseHostPort(body) {
  const hashIdx = body.lastIndexOf('#');
  const name = hashIdx >= 0 ? decodeURIComponent(body.slice(hashIdx + 1)) : '';
  const main = hashIdx >= 0 ? body.slice(0, hashIdx) : body;
  const qIdx = main.indexOf('?');
  const hostPort = qIdx >= 0 ? main.slice(0, qIdx) : main;
  const qs = qIdx >= 0 ? main.slice(qIdx + 1) : '';
  let address, port;
  if (hostPort.startsWith('[')) {
    const c = hostPort.indexOf(']');
    address = hostPort.slice(1, c);
    port = hostPort.slice(c + 2);
  } else {
    const lc = hostPort.lastIndexOf(':');
    address = hostPort.slice(0, lc);
    port = hostPort.slice(lc + 1);
  }
  return { name, address, port, qs, p: new URLSearchParams(qs) };
}

function parseTrojan(uri) {
  const body = uri.slice('trojan://'.length);
  const at = body.indexOf('@');
  if (at < 0) throw new Error('trojan: @ یافت نشد');
  const password = decodeURIComponent(body.slice(0, at));
  const { name, address, port, qs, p } = parseHostPort(body.slice(at + 1));
  return {
    proto: 'trojan', name, address, port, password, uuid: password,
    network: 'tcp', security: p.get('security') || 'tls',
    host: p.get('host') || '', path: p.get('path') || '', sni: p.get('sni') || p.get('peer') || '',
    allowInsecure: p.get('allowInsecure') === '1', rawQS: qs,
  };
}

function parseShadowsocks(uri) {
  let rest = uri.slice('ss://'.length);
  let name = '';
  if (rest.includes('#')) {
    const hi = rest.indexOf('#');
    name = decodeURIComponent(rest.slice(hi + 1));
    rest = rest.slice(0, hi);
  }
  let method, password, address, port;
  if (rest.includes('@')) {
    const decoded = atob(rest.replace(/-/g, '+').replace(/_/g, '/'));
    const at = decoded.lastIndexOf('@');
    const user = decoded.slice(0, at);
    const hp = decoded.slice(at + 1);
    const colon = user.indexOf(':');
    method = user.slice(0, colon);
    password = user.slice(colon + 1);
    const lc = hp.lastIndexOf(':');
    address = hp.slice(0, lc);
    port = hp.slice(lc + 1);
  } else {
    const decoded = atob(rest.replace(/-/g, '+').replace(/_/g, '/'));
    const at = decoded.lastIndexOf('@');
    const user = decoded.slice(0, at);
    const hp = decoded.slice(at + 1);
    const colon = user.indexOf(':');
    method = user.slice(0, colon);
    password = user.slice(colon + 1);
    const lc = hp.lastIndexOf(':');
    address = hp.slice(0, lc);
    port = hp.slice(lc + 1);
  }
  return {
    proto: 'ss', name, address, port, method, password, uuid: password,
    network: 'tcp', security: 'none', host: '', path: '', sni: '',
  };
}

function parseHysteria2(uri) {
  const u = uri.replace(/^hy2:\/\//, 'hysteria2://');
  const body = u.slice('hysteria2://'.length);
  const at = body.indexOf('@');
  const auth = at >= 0 ? decodeURIComponent(body.slice(0, at)) : '';
  const { name, address, port, qs, p } = parseHostPort(at >= 0 ? body.slice(at + 1) : body);
  return {
    proto: 'hysteria2', name, address, port, password: auth, uuid: auth,
    network: 'udp', security: 'tls', host: p.get('host') || '', path: '', sni: p.get('sni') || '',
    rawQS: qs,
  };
}

function parseTuic(uri) {
  const body = uri.slice('tuic://'.length);
  const at = body.indexOf('@');
  if (at < 0) throw new Error('tuic: @ یافت نشد');
  const creds = body.slice(0, at).split(':');
  const uuid = creds[0];
  const password = creds[1] || '';
  const { name, address, port, qs, p } = parseHostPort(body.slice(at + 1));
  return {
    proto: 'tuic', name, address, port, uuid, password,
    network: 'udp', security: 'tls', host: '', path: '', sni: p.get('sni') || '',
    rawQS: qs,
  };
}

function parseAnyConfig(line) {
  const s = line.trim();
  if (s.startsWith('vmess://')) return parseVMess(s);
  if (s.startsWith('vless://')) return parseVLess(s);
  if (s.startsWith('trojan://')) return parseTrojan(s);
  if (s.startsWith('ss://')) return parseShadowsocks(s);
  if (s.startsWith('hysteria2://') || s.startsWith('hy2://')) return parseHysteria2(s);
  if (s.startsWith('tuic://')) return parseTuic(s);
  return null;
}

function isValidUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s || '');
}

function showConfigWarnings(cfg) {
  const el = document.getElementById('configWarnings');
  if (!el) return;
  const warns = [];
  if ((cfg.proto === 'vmess' || cfg.proto === 'vless') && cfg.uuid && !isValidUUID(cfg.uuid))
    warns.push('UUID نامعتبر است');
  if (cfg.allowInsecure) warns.push('allowInsecure فعال — ناامن');
  if (cfg.proto === 'vmess' && cfg.tls === 'none' && cfg.network === 'tcp')
    warns.push('VMess بدون TLS');
  if (!warns.length) { el.classList.add('hidden'); return; }
  el.className = 'warn-box';
  el.innerHTML = warns.map(w => `⚠️ ${escH(w)}`).join('<br>');
  el.classList.remove('hidden');
}

// ── Config makers for extra protocols ──────────────
function makeTrojan(cfg, ip, index) {
  const host = ip.includes(':') ? `[${ip}]` : ip;
  const name = formatConfigName(document.getElementById('nameTemplate')?.value, ip, index);
  const frag = name ? `#${encodeURIComponent(name)}` : '';
  const qs = cfg.rawQS ? `?${cfg.rawQS}` : '';
  return `trojan://${encodeURIComponent(cfg.password)}@${host}:${cfg.port}${qs}${frag}`;
}

function makeShadowsocks(cfg, ip, index) {
  const name = formatConfigName(document.getElementById('nameTemplate')?.value, ip, index);
  const user = `${cfg.method}:${cfg.password}`;
  const hp = `${ip.includes(':') ? `[${ip}]` : ip}:${cfg.port}`;
  const b64 = btoa(unescape(encodeURIComponent(`${user}@${hp}`)));
  const frag = name ? `#${encodeURIComponent(name)}` : '';
  return `ss://${b64}${frag}`;
}

function makeHysteria2(cfg, ip, index) {
  const host = ip.includes(':') ? `[${ip}]` : ip;
  const name = formatConfigName(document.getElementById('nameTemplate')?.value, ip, index);
  const frag = name ? `#${encodeURIComponent(name)}` : '';
  const qs = cfg.rawQS ? `?${cfg.rawQS}` : '';
  return `hysteria2://${encodeURIComponent(cfg.password)}@${host}:${cfg.port}${qs}${frag}`;
}

function makeTuic(cfg, ip, index) {
  const host = ip.includes(':') ? `[${ip}]` : ip;
  const name = formatConfigName(document.getElementById('nameTemplate')?.value, ip, index);
  const frag = name ? `#${encodeURIComponent(name)}` : '';
  const qs = cfg.rawQS ? `?${cfg.rawQS}` : '';
  return `tuic://${cfg.uuid}:${cfg.password}@${host}:${cfg.port}${qs}${frag}`;
}

// ── Presets & History ──────────────────────────────
function loadPresets() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); }
  catch { return []; }
}
function savePresets(list) { localStorage.setItem(PRESETS_KEY, JSON.stringify(list)); }

function renderPresetSelect() {
  const sel = document.getElementById('presetSelect');
  if (!sel) return;
  const presets = loadPresets();
  sel.innerHTML = '<option value="">— بارگذاری Preset —</option>' +
    presets.map(p => `<option value="${escAttr(p.id)}">${escH(p.name)}</option>`).join('');
}

function openPresetModal() {
  if (!PARSED) { toast('ابتدا کانفیگ را تحلیل کنید', 'err'); return; }
  document.getElementById('presetModal').classList.remove('hidden');
}
function closePresetModal() { document.getElementById('presetModal').classList.add('hidden'); }

function saveCurrentPreset() {
  const name = document.getElementById('presetName').value.trim();
  if (!name) { toast('نام preset را وارد کنید', 'err'); return; }
  const presets = loadPresets();
  presets.push({
    id: crypto.randomUUID(), name,
    config: document.getElementById('configInput').value,
    settings: loadSettings(),
    testUrl: document.getElementById('testUrl')?.value || '',
    created: Date.now(),
  });
  savePresets(presets);
  renderPresetSelect();
  closePresetModal();
  toast('Preset ذخیره شد ✓', 'ok');
}

function loadSelectedPreset(id) {
  if (!id) return;
  const p = loadPresets().find(x => x.id === id);
  if (!p) return;
  document.getElementById('configInput').value = p.config;
  if (p.testUrl) document.getElementById('testUrl').value = p.testUrl;
  Object.assign(loadSettings(), p.settings || {});
  applySettingsToUI();
  parseConfig();
  toast(`Preset «${p.name}» بارگذاری شد`, 'ok');
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistoryEntry(entry) {
  const h = loadHistory();
  h.unshift(entry);
  if (h.length > 30) h.length = 30;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  renderHistory();
}

function renderHistory() {
  const el = document.getElementById('historyList');
  if (!el) return;
  const h = loadHistory();
  if (!h.length) { el.innerHTML = '<div class="help">خالی</div>'; return; }
  el.innerHTML = h.map((item, i) => `
    <div class="mini-item">
      <span>${escH(item.label)} — ${item.count} cfg</span>
      <button class="btn btn-ghost btn-sm" onclick="restoreHistory(${i})">↩</button>
    </div>`).join('');
}

function restoreHistory(idx) {
  const item = loadHistory()[idx];
  if (!item) return;
  GENERATED = item.generated;
  if (item.config) document.getElementById('configInput').value = item.config;
  parseConfig();
  renderGenerated();
  toast('بازگردانی از history', 'ok');
}

// ── Reality keys ───────────────────────────────────
async function generateRealityKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const pbk = btoa(String.fromCharCode(...pubRaw));
  const sid = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
  const out = document.getElementById('realityKeysOut');
  if (out) {
    out.classList.remove('hidden');
    out.innerHTML = `pbk: <b>${pbk}</b> &nbsp;|&nbsp; sid: <b>${sid}</b> &nbsp; <button class="btn btn-ghost btn-sm" onclick="copyText('${pbk}')">کپی pbk</button>`;
  }
  if (PARSED && PARSED.proto === 'vless') {
    const p = new URLSearchParams(PARSED.rawQS || '');
    p.set('security', 'reality');
    p.set('pbk', pbk);
    p.set('sid', sid);
    PARSED.rawQS = p.toString();
    PARSED.security = 'reality';
    PARSED.pbk = pbk;
    PARSED.sid = sid;
    renderParsed(PARSED);
  }
  toast('Reality keys تولید شد ✓', 'ok');
}

// ── JSON / Export ──────────────────────────────────
function buildXrayOutbound(cfg, ip, name) {
  const addr = ip || cfg.address;
  if (cfg.proto === 'vmess') {
    return {
      protocol: 'vmess', tag: name,
      settings: { vnext: [{ address: addr, port: +cfg.port, users: [{ id: cfg.uuid, alterId: +cfg.alterId, security: cfg.encryption }] }] },
      streamSettings: { network: cfg.network, security: cfg.tls || 'none', wsSettings: cfg.network === 'ws' ? { path: cfg.path, headers: { Host: cfg.host } } : undefined },
    };
  }
  if (cfg.proto === 'vless') {
    return {
      protocol: 'vless', tag: name,
      settings: { vnext: [{ address: addr, port: +cfg.port, users: [{ id: cfg.uuid, flow: cfg.flow || '', encryption: 'none' }] }] },
      streamSettings: { network: cfg.network, security: cfg.security, realitySettings: cfg.security === 'reality' ? { publicKey: cfg.pbk, shortId: cfg.sid, serverName: cfg.sni } : undefined },
    };
  }
  return { protocol: cfg.proto, remark: name, address: addr, port: +cfg.port };
}

function showXrayJsonPreview() {
  if (!PARSED) { toast('کانفیگ تحلیل نشده', 'err'); return; }
  const outbounds = GENERATED.length
    ? GENERATED.slice(0, 3).map(g => buildXrayOutbound(PARSED, g.ip, `out-${g.i}`))
    : [buildXrayOutbound(PARSED, PARSED.address, 'preview')];
  jsonPreviewContent = JSON.stringify({ log: { loglevel: 'warning' }, outbounds }, null, 2);
  document.getElementById('jsonPreviewTitle').textContent = 'Xray JSON Preview';
  document.getElementById('jsonPreviewText').textContent = jsonPreviewContent;
  document.getElementById('jsonPreviewModal').classList.remove('hidden');
}
function closeJsonPreview() { document.getElementById('jsonPreviewModal').classList.add('hidden'); }
function copyJsonPreview() { copyText(jsonPreviewContent); }

function exportClash() {
  if (!GENERATED.length || !PARSED) { toast('ابتدا کانفیگ تولید کنید', 'err'); return; }
  const proxies = GENERATED.map(g => {
    const n = formatConfigName(document.getElementById('nameTemplate')?.value, g.ip, g.i);
    if (PARSED.proto === 'vmess') {
      return `  - name: "${n}"\n    type: vmess\n    server: ${g.ip}\n    port: ${PARSED.port}\n    uuid: ${PARSED.uuid}\n    alterId: ${PARSED.alterId}\n    cipher: ${PARSED.encryption}\n    network: ${PARSED.network}\n    tls: ${PARSED.tls === 'tls'}\n    servername: ${PARSED.sni || ''}\n    ws-opts:\n      path: ${PARSED.path || '/'}\n      headers:\n        Host: ${PARSED.host || ''}`;
    }
    if (PARSED.proto === 'vless') {
      return `  - name: "${n}"\n    type: vless\n    server: ${g.ip}\n    port: ${PARSED.port}\n    uuid: ${PARSED.uuid}\n    network: ${PARSED.network}\n    tls: ${PARSED.security !== 'none'}\n    servername: ${PARSED.sni || ''}\n    ws-opts:\n      path: ${PARSED.path || '/'}\n      headers:\n        Host: ${PARSED.host || ''}`;
    }
    return `  - name: "${n}"\n    type: ${PARSED.proto}\n    server: ${g.ip}\n    port: ${PARSED.port}`;
  });
  downloadBlob('proxies:\n' + proxies.join('\n'), 'clash.yaml', 'text/yaml');
  toast('Clash YAML دانلود شد', 'ok');
}

function exportSingbox() {
  if (!GENERATED.length || !PARSED) { toast('ابتدا کانفیگ تولید کنید', 'err'); return; }
  const outbounds = GENERATED.map(g => {
    const tag = formatConfigName(document.getElementById('nameTemplate')?.value, g.ip, g.i);
    if (PARSED.proto === 'vless') {
      return { type: 'vless', tag, server: g.ip, server_port: +PARSED.port, uuid: PARSED.uuid, flow: PARSED.flow || '', tls: { enabled: PARSED.security !== 'none', server_name: PARSED.sni } };
    }
    if (PARSED.proto === 'vmess') {
      return { type: 'vmess', tag, server: g.ip, server_port: +PARSED.port, uuid: PARSED.uuid, security: PARSED.encryption, alter_id: +PARSED.alterId };
    }
    return { type: PARSED.proto, tag, server: g.ip, server_port: +PARSED.port };
  });
  downloadBlob(JSON.stringify({ outbounds }, null, 2), 'sing-box.json', 'application/json');
  toast('Sing-box JSON دانلود شد', 'ok');
}

// ── Generated list helpers ─────────────────────────
function filterGeneratedList() {
  const q = (document.getElementById('genSearch')?.value || '').toLowerCase();
  document.querySelectorAll('#genList .gen-item').forEach(el => {
    el.classList.toggle('hidden', q && !el.textContent.toLowerCase().includes(q));
  });
}
function copyAllGeneratedIPs() {
  if (!GENERATED.length) { toast('خالی', 'err'); return; }
  copyText(GENERATED.map(g => g.ip).join('\n'));
}

// ── Latency chart ──────────────────────────────────
function renderLatencyChart() {
  const wrap = document.getElementById('latChartWrap');
  const canvas = document.getElementById('latChart');
  if (!wrap || !canvas) return;
  const ok = testResults.filter(r => r.ok && r.ms).map(r => r.ms);
  if (!ok.length) { wrap.classList.add('hidden'); return; }
  wrap.classList.remove('hidden');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 400;
  const h = canvas.height = 80;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(...ok, 1);
  const barW = Math.max(2, w / ok.length - 1);
  ok.forEach((ms, i) => {
    const bh = (ms / max) * (h - 10);
    ctx.fillStyle = ms < 100 ? '#009B76' : ms < 250 ? '#E98300' : '#E04F39';
    ctx.fillRect(i * (barW + 1), h - bh, barW, bh);
  });
}

function addFailedToBlacklist() {
  const failed = testResults.filter(r => !r.ok).map(r => r.ip);
  if (!failed.length) { toast('IP ناموفقی نیست', 'wrn'); return; }
  const bl = new Set([...loadBlacklist(), ...failed]);
  localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...bl]));
  const el = document.getElementById('blacklistInput');
  if (el) el.value = [...bl].join('\n');
  toast(`${failed.length} IP به blacklist اضافه شد`, 'ok');
}

// ── List modal bulk ────────────────────────────────
function bulkDedupListIPs() {
  const ta = document.getElementById('listIPs');
  const lines = [...new Set(ta.value.split('\n').map(s => s.trim()).filter(Boolean))];
  ta.value = lines.join('\n');
  toast(`${lines.length} خط یکتا`, 'ok');
}
function bulkSortListIPs() {
  const ta = document.getElementById('listIPs');
  ta.value = ta.value.split('\n').map(s => s.trim()).filter(Boolean).sort().join('\n');
}
function importFileToListInput(input) {
  const f = input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const ta = document.getElementById('listIPs');
    ta.value = (ta.value ? ta.value + '\n' : '') + r.result;
    bulkDedupListIPs();
  };
  r.readAsText(f);
  input.value = '';
}

function setupDropzones() {
  const dz = document.getElementById('listDropzone');
  if (!dz) return;
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('dragover'); }));
  dz.addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { document.getElementById('listIPs').value = r.result; bulkDedupListIPs(); };
    r.readAsText(f);
  });
}

// ── Extractor extended ─────────────────────────────
function setExtractorMode(mode) {
  extractorMode = mode;
  document.getElementById('extModeAddr')?.classList.toggle('active', mode === 'address');
  document.getElementById('extModeFull')?.classList.toggle('active', mode === 'full');
}

function dedupExtractorByUuid() {
  const raw = document.getElementById('extractorInput').value.trim();
  const lines = extractLinksFromText(decodeSubscriptionContent(raw).replace(/\n/g, ' '));
  const seen = new Set();
  const out = [];
  for (const line of lines.length ? lines : raw.split('\n').filter(Boolean)) {
    try {
      const c = parseAnyConfig(line);
      if (!c) continue;
      const key = c.uuid || c.password || line;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(line.trim());
    } catch { /* skip */ }
  }
  document.getElementById('extractorInput').value = out.join('\n');
  toast(`${out.length} کانفیگ یکتا`, 'ok');
}

function showExtractorDiff() {
  const lines = document.getElementById('extractorInput').value.split('\n').filter(Boolean).slice(0, 5);
  const parsed = lines.map(l => { try { return parseAnyConfig(l); } catch { return null; } }).filter(Boolean);
  if (parsed.length < 2) { toast('حداقل ۲ کانفیگ لازم است', 'err'); return; }
  const keys = ['address', 'port', 'uuid', 'network', 'host', 'path', 'sni'];
  const diff = keys.map(k => {
    const vals = [...new Set(parsed.map(p => p[k] || ''))];
    return vals.length > 1 ? `${k}: ${vals.join(' | ')}` : null;
  }).filter(Boolean);
  jsonPreviewContent = diff.length ? diff.join('\n') : 'تفاوتی در فیلدهای اصلی نیست';
  document.getElementById('jsonPreviewTitle').textContent = 'Config Diff';
  document.getElementById('jsonPreviewText').textContent = jsonPreviewContent;
  document.getElementById('jsonPreviewModal').classList.remove('hidden');
}

function convertVmessToVless() {
  const line = document.getElementById('extractorInput').value.split('\n').find(l => l.trim().startsWith('vmess://'));
  if (!line) { toast('VMess یافت نشد', 'err'); return; }
  const v = parseVMess(line.trim());
  const qs = new URLSearchParams({ type: v.network, security: v.tls || 'none', host: v.host, path: v.path, sni: v.sni });
  const out = `vless://${v.uuid}@${v.address}:${v.port}?${qs}#${encodeURIComponent(v.name)}`;
  document.getElementById('extractorInput').value = out;
  toast('تبدیل شد — ممکن است نیاز به تنظیم دستی باشد', 'wrn');
}

// ── Override / patch core functions ────────────────
const _parseConfig = typeof parseConfig === 'function' ? parseConfig : null;
parseConfig = function () {
  const raw = document.getElementById('configInput').value.trim();
  if (!raw) { toast('لطفاً یک کانفیگ وارد کنید', 'err'); return; }
  const firstLine = raw.split('\n').map(s => s.trim()).find(s => s.includes('://')) || raw;
  try {
    const config = parseAnyConfig(firstLine);
    if (!config) { toast('فرمت ناشناخته', 'err'); return; }
    PARSED = config;
    renderParsed(config);
    fillEditorFromParsed(config);
    showConfigWarnings(config);
    setStep(2);
    toast('کانفیگ با موفقیت تحلیل شد ✓', 'ok');
    document.getElementById('parsedCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) { toast('خطا: ' + e.message, 'err'); }
};

const _fillEditor = fillEditorFromParsed;
fillEditorFromParsed = function (cfg) {
  _fillEditor(cfg);
  const flowEl = document.getElementById('editFlow');
  if (flowEl) flowEl.value = cfg.flow || '';
};

const _applyEditor = applyEditorToParsed;
applyEditorToParsed = function () {
  _applyEditor();
  if (!PARSED) return;
  const flow = document.getElementById('editFlow')?.value.trim();
  if (flow && PARSED.proto === 'vless') {
    PARSED.flow = flow;
    const p = new URLSearchParams(PARSED.rawQS || '');
    p.set('flow', flow);
    PARSED.rawQS = p.toString();
  }
};

const _formatName = formatConfigName;
formatConfigName = function (template, ip, index) {
  const lat = IP_LATENCY_MAP[ip];
  return _formatName(template, ip, index)
    .replace(/\{latency\}/g, lat != null ? String(lat) : '');
};

const _makeConfig = makeConfig;
makeConfig = function (cfg, ip, index) {
  const keep = loadSettings().keepOriginalIP;
  const targets = [ip];
  if (keep && cfg.address && cfg.address !== ip && index === 1) targets.unshift(cfg.address);
  const targetIp = ip;
  switch (cfg.proto) {
    case 'vmess': return makeVMess(cfg, targetIp, index);
    case 'vless': return makeVLess(cfg, targetIp, index);
    case 'trojan': return makeTrojan(cfg, targetIp, index);
    case 'ss': return makeShadowsocks(cfg, targetIp, index);
    case 'hysteria2': return makeHysteria2(cfg, targetIp, index);
    case 'tuic': return makeTuic(cfg, targetIp, index);
    default: return _makeConfig(cfg, targetIp, index);
  }
};

const _generate = generateConfigs;
generateConfigs = function () {
  _generate();
  if (GENERATED.length) {
    saveHistoryEntry({
      label: `${PARSED?.proto || ''} ${new Date().toLocaleString('fa')}`,
      count: GENERATED.length,
      generated: GENERATED,
      config: document.getElementById('configInput').value,
      at: Date.now(),
    });
  }
};

const _downloadCsv = downloadCsv;
downloadCsv = function () {
  if (!GENERATED.length) { toast('خالی', 'err'); return; }
  const lines = ['index,ip,latency_ms,config', ...GENERATED.map(g =>
    `${g.i},"${g.ip}",${IP_LATENCY_MAP[g.ip] ?? ''},"${g.cfg.replace(/"/g, '""')}"`
  )];
  downloadBlob(lines.join('\n'), 'v2ray-configs.csv', 'text/csv');
  toast('CSV دانلود شد', 'ok');
};

const _expandIPs = expandIPs;
expandIPs = function (text, maxPerRange) {
  return filterBlacklist(_expandIPs(text, maxPerRange));
};

const _buildFields = typeof buildFields === 'function' ? buildFields : null;
buildFields = function (cfg) {
  if (cfg.proto === 'trojan') {
    return [
      { l: 'آدرس', v: cfg.address, hi: 'fhi' }, { l: 'پورت', v: cfg.port, hi: 'fhi2' },
      { l: 'رمز', v: cfg.password }, { l: 'SNI', v: cfg.sni }, { l: 'نام', v: cfg.name },
    ];
  }
  if (cfg.proto === 'ss') {
    return [
      { l: 'آدرس', v: cfg.address, hi: 'fhi' }, { l: 'پورت', v: cfg.port, hi: 'fhi2' },
      { l: 'Method', v: cfg.method }, { l: 'Password', v: cfg.password }, { l: 'نام', v: cfg.name },
    ];
  }
  if (cfg.proto === 'hysteria2' || cfg.proto === 'tuic') {
    return [
      { l: 'آدرس', v: cfg.address, hi: 'fhi' }, { l: 'پورت', v: cfg.port, hi: 'fhi2' },
      { l: 'Auth', v: cfg.password || cfg.uuid }, { l: 'SNI', v: cfg.sni }, { l: 'نام', v: cfg.name },
    ];
  }
  return _buildFields(cfg);
};

const _renderParsed = renderParsed;
renderParsed = function (cfg) {
  _renderParsed(cfg);
  const body = document.getElementById('parsedBody');
  if (cfg.proto !== 'vmess' && cfg.proto !== 'vless' && body) {
    const netLabel = NET_LABELS[cfg.network] || cfg.network || cfg.proto;
    const badges = `<div class="badge-row"><span class="badge bc">${cfg.proto.toUpperCase()}</span></div>`;
    const fields = buildFields(cfg);
    const boxes = fields.filter(f => f.v).map(f =>
      `<div class="field-box" onclick="copyText('${escAttr(f.v)}')"><div class="field-lbl">${f.l}</div><div class="field-val">${escH(f.v)}</div></div>`
    ).join('');
    body.innerHTML = badges + `<div class="fields-grid">${boxes}</div>`;
  }
};

const _extractAddresses = extractAddresses;
extractAddresses = function () {
  let raw = document.getElementById('extractorInput').value.trim();
  if (!raw) { toast('ورودی خالی', 'err'); return; }
  try {
    if (!raw.includes('://') && raw.length > 40) raw = decodeSubscriptionContent(raw);
  } catch { /* plain */ }
  const links = extractLinksFromText(raw);
  const lines = links.length ? links : raw.split('\n').map(s => s.trim()).filter(Boolean);

  if (extractorMode === 'full') {
    EXTRACTED_FULL = [];
    const rows = [];
    for (const line of lines) {
      try {
        const c = parseAnyConfig(line);
        if (!c) { continue; }
        EXTRACTED_FULL.push(c);
        rows.push(`${c.proto} | ${c.address}:${c.port} | ${c.uuid || c.password || ''} | ${c.sni || ''} | ${c.path || ''}`);
      } catch { /* skip */ }
    }
    EXTRACTED_ADDRESSES = EXTRACTED_FULL.map(c => c.address);
    document.getElementById('extractorCount').textContent = `${rows.length} کانفیگ`;
    document.getElementById('extractorCountPill').textContent = `${rows.length} مورد`;
    document.getElementById('extractorList').innerHTML = rows.map((r, i) =>
      `<div class="gen-item"><div class="gen-num">${i + 1}</div><div class="gen-cfg" style="white-space:normal">${escH(r)}</div></div>`
    ).join('');
    document.getElementById('extractorResultCard').classList.remove('hidden');
    toast(`${rows.length} کانفیگ استخراج شد`, 'ok');
    return;
  }

  const addresses = [];
  let failCount = 0;
  for (const line of lines) {
    try {
      const c = parseAnyConfig(line);
      if (c && c.address) { addresses.push(c.address.trim()); }
      else failCount++;
    } catch { failCount++; }
  }
  EXTRACTED_ADDRESSES = [...new Set(addresses)];
  if (!EXTRACTED_ADDRESSES.length) { toast('آدرسی یافت نشد', 'err'); return; }
  renderExtractedAddresses();
  toast(`${EXTRACTED_ADDRESSES.length} آدرس استخراج شد ✓${failCount ? ` (${failCount} نامعتبر)` : ''}`, 'ok');
  document.getElementById('extractorResultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── Keyboard & listeners ───────────────────────────
function initExtendedFeatures() {
  setupDropzones();
  renderPresetSelect();
  renderHistory();

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') {
      const tab = document.querySelector('.tab-pane:not(.hidden)');
      if (tab?.id === 'tab-maker') generateConfigs();
      else if (tab?.id === 'tab-extractor') extractAddresses();
      else if (tab?.id === 'tab-ips') startTest();
    }
    if (e.ctrlKey && e.key === 'z' && deletedListUndo) { e.preventDefault(); undoDeleteList(); }
  });

  ['testMaxPerRange', 'testConcurrency', 'testTimeout'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateTestTimeEstimate);
  });
  document.querySelectorAll('.cf-chk,.mylist-chk,.group-chk').forEach(() => {});
  const origUpdate = updateSelCount;
  updateSelCount = function () { origUpdate(); updateTestTimeEstimate(); };

  const origStart = startTest;
  startTest = async function () {
    testResults = [];
    return origStart.apply(this, arguments);
  };

  const origRun = runQueue;
  runQueue = async function (ips, opts) {
    const wrapped = { ...opts, onResult: (row) => {
      if (row.ok && row.ms) IP_LATENCY_MAP[row.ip] = row.ms;
      opts.onResult(row);
    }};
    return origRun(ips, wrapped);
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

initExtendedFeatures();
